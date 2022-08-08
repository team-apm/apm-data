// > yarn run generate-releases <package_id>

import { path7za } from '7zip-bin';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import compareVersions from 'compare-versions';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import fs from 'fs-extra';
import https from 'https';
import Seven from 'node-7z';
import { basename, dirname, extname, resolve } from 'path';
import { format as _format } from 'prettier';
import { fromStream } from 'ssri';
const {
  createReadStream,
  createWriteStream,
  ensureDir,
  readFile,
  readJsonSync,
  remove,
  writeFile,
} = fs;
const { whiteBright, green, red, cyanBright } = chalk;
const { extractFull } = Seven;

// Options
const exclude = ['suzune/bakusoku', 'suzune/WideDialog'];
const packagesXmlPath = 'v2/data/packages.xml';
const modXmlPath = 'v2/data/mod.xml';

function format(string) {
  const xml = string
    .trim()
    .replace(/<\?xml-model +/, '<?xml-model ') // Fix `<?xml-model   `
    .replaceAll('&quot;', '"') // Convert `&quot` to `"`
    .replaceAll(/<(.+?)>\r?\n?\t+([^<>\t]+?)\r?\n?\t+<\/(.+?)>/g, '<$1>$2</$3>') // Adjust line-breaking
    .replaceAll(/-->\r?\n?\t?<package>/g, '-->\r\n\r\n\t<package>') // Add line break between a comment and `<package>`
    .replaceAll(/<\/package>\r?\n?\t?</g, '</package>\r\n\r\n\t<') // Add line break between `<package>`
    .replaceAll(/\r?\n?\t?<\/packages>/g, '</packages>'); // Remove line break before `</package>`
  return _format(xml, { parser: 'xml', useTabs: true });
}

function compareVersion(firstVersion, secondVersion) {
  if (firstVersion === secondVersion) return 0;
  const isDate1 = firstVersion.match(/^\d{4}\/\d{2}\/\d{2}$/);
  const isDate2 = secondVersion.match(/^\d{4}\/\d{2}\/\d{2}$/);
  if (isDate1 !== isDate2) return 0;
  if (isDate1 && isDate2) {
    return compareVersions(
      firstVersion.replaceAll('/', '.'),
      secondVersion.replaceAll('/', '.')
    ); // 2022/02/02 -> 2022.02.02
  }

  const toSemver = (v) =>
    v
      .toLowerCase()
      .replaceAll(' ', '')
      .replaceAll('/', '.') // 2022/02/02 -> 2022.02.02
      .replaceAll(/[^\x20-\x7F]/g, 'z') // v2仮修正-> v2zzz
      .replaceAll('ver.', '')
      .replaceAll('ver', '')
      .replaceAll(/^[vr+]/g, '') // v3 -> 3 and r11 -> 11 and +60 -> 60
      .replaceAll(/[_+,][vr]?/g, '.') // 1_2.0 -> 1.2.0 and 1.0+3 -> 1.0.3 and 1,v3 -> 1.3
      .replaceAll('(', '-')
      .replaceAll(')', '') // 1.0(test) -> 1.0-test
      .replaceAll(/\d[a-z]/g, (m) => m[0] + '-' + m[1]) // 1.0beta -> 1.0-beta
      .replaceAll(/[a-z]\d/g, (m) => m[0] + '.' + m[1]) // rc2 -> rc.2
      .replaceAll(/^\d+\.\d+-/g, (m) => m.slice(0, -1) + '.0-') // 1.0-beta -> 1.0.0-beta
      .replaceAll(/^\d+-/g, (m) => m.slice(0, -1) + '.0.0-'); // 1-beta -> 1.0.0-beta

  try {
    return compareVersions(toSemver(firstVersion), toSemver(secondVersion));
  } catch {
    return 0;
  }
}

async function unzip(zipPath, folderName = null) {
  const outputPath = resolve(dirname(zipPath), '../');

  const zipStream = extractFull(zipPath, outputPath, {
    $bin: path7za,
    overwrite: 'a',
  });
  return new Promise((resolve) => {
    zipStream.once('end', () => {
      resolve(outputPath);
    });
  });
}

async function generateHash(path) {
  const readStream = createReadStream(path);
  const str = await fromStream(readStream, {
    algorithms: ['sha384'],
  });
  readStream.destroy();
  return str.toString();
}

const parser = new XMLParser({
  attributeNamePrefix: '$',
  commentPropName: '#comment',
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  preserveOrder: true,
  textNodeName: '_',
  trimValues: true,
});

const builder = new XMLBuilder({
  attributeNamePrefix: '$',
  commentPropName: '#comment',
  format: true,
  ignoreAttributes: false,
  indentBy: '\t',
  preserveOrder: true,
  suppressEmptyNode: true,
  textNodeName: '_',
});

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const archiveNamePattern = readJsonSync('util/archive-name-pattern.json');

async function generateReleases(args) {
  const id = args[0];
  if (!(id in archiveNamePattern)) {
    console.error(red('The archive-name pattern does not exist.'));
    return;
  }

  const packagesXmlData = await readFile(packagesXmlPath, 'utf-8');
  if (!XMLValidator.validate(packagesXmlData)) {
    console.error(red('The xml file is invalid.'));
    return;
  }

  const packagesObj = parser.parse(packagesXmlData);
  const packageItem = packagesObj[2].packages.find(
    (p) =>
      'package' in p && p.package.find((value) => 'id' in value).id[0]._ === id
  ).package;

  const getValue = (key) => {
    return packageItem.find((value) => key in value)[key][0]._;
  };

  const downloadURL = new URL(getValue('downloadURL'));
  const currentVersion = getValue('latestVersion');

  const dirs = downloadURL.pathname.split('/');
  dirs.shift();

  if (
    downloadURL.hostname !== 'github.com' ||
    dirs[2] !== 'releases' ||
    currentVersion === '最新'
  ) {
    console.error(red('The package is not on GitHub.'));
    return;
  }

  let releasesAvailable = false;
  try {
    const res = await octokit.rest.repos.listReleases({
      owner: dirs[0],
      repo: dirs[1],
      per_page: 100,
    });

    const generateRelease = async (release) => {
      const result = {
        newReleaseObj: undefined,
        message: [],
      };
      try {
        let tag = release.tag_name;

        // only for hebiiro's packages
        if (dirs[0] === 'hebiiro') {
          const versionArray = tag
            .split('.')
            .filter((value) => /[0-9]+/.test(value));
          if (versionArray.length >= 1) {
            tag = versionArray.join('.');
          } else {
            throw new Error('A version-like string is not found.');
          }
        }

        result.message.push(whiteBright(`[${tag}]`));

        // Create integrity
        const oldReleaseObj = packageItem
          .find((value) => 'releases' in value)
          ?.releases?.at(-1);
        if (!oldReleaseObj?.release) {
          throw new Error('The old release data does not exist.');
        }
        if (
          packageItem
            .find((value) => 'releases' in value)
            ?.releases.some((p) => p[':@'].$version === tag)
        )
          throw new Error('The release data of the same version exist.');

        const assets = release.assets.filter(
          (asset) => extname(asset.name) === '.zip'
        );
        let archiveData = {};
        if (assets.length === 1) {
          archiveData = assets[0];
        } else if (assets.length >= 2) {
          const temp = assets.find((value) => {
            const matchPattern = new RegExp(
              '^' + archiveNamePattern[id] + '\\.zip$'
            );
            return matchPattern.test(value.name);
          });
          if (temp) {
            archiveData = temp;
          } else {
            throw new Error(
              'No assets are found.\n  ID: ' +
                id +
                '\n  Pattern: ' +
                archiveNamePattern[id]
            );
          }
        } else {
          throw new Error(
            'There seem to be no assets. An archive file of the source code is not supported.'
          );
        }

        const url = archiveData.browser_download_url;

        const archivePath = resolve(
          'util/temp',
          id,
          tag,
          '.archive',
          archiveData.name
        );
        await ensureDir(dirname(archivePath));
        const outArchive = createWriteStream(archivePath, 'binary');

        const download = (url, destination) =>
          new Promise((resolve, reject) => {
            https.get(url, async (res) => {
              if (res.statusCode === 200) {
                res
                  .pipe(destination)
                  .on('close', () => {
                    destination.close(resolve);
                  })
                  .on('error', reject);
              } else if (res.statusCode === 302) {
                await download(res.headers.location, destination);
                resolve();
              }
            });
          });
        await download(url, outArchive);
        const unzippedPath = await unzip(archivePath);

        const archiveHash = await generateHash(archivePath);

        const oldIntegritesArray = oldReleaseObj.release.find(
          (value) => 'integrities' in value
        )?.integrities;
        const newIntegritiesArray = [];
        if (oldIntegritesArray) {
          const filesArray = packageItem.find(
            (value) => 'files' in value
          ).files;
          for (const integrity of oldIntegritesArray) {
            const targetFilename = integrity?.[':@']?.$target;
            const targetFileArchivePath =
              filesArray.find((value) => value.file[0]._ === targetFilename)?.[
                ':@'
              ]?.$archivePath ?? '';
            const targetPath = resolve(
              unzippedPath,
              targetFileArchivePath,
              basename(targetFilename)
            );

            const fileHash = await generateHash(targetPath);
            newIntegritiesArray.push({
              integrity: [{ _: fileHash }],
              ':@': { $target: targetFilename },
            });
          }
        }

        const newReleaseObj = {
          release: [
            {
              archiveIntegrity: [{ _: archiveHash }],
            },
          ],
          ':@': { $version: tag },
        };
        if (newIntegritiesArray.length >= 1)
          newReleaseObj.release.push({
            integrities: newIntegritiesArray,
          });

        result.newReleaseObj = newReleaseObj;
        result.message.push(green('Successful.'));
      } catch (e) {
        result.message.push(red(e.message));
      }

      return result;
    };

    const promisesInWaiting = res.data
      .reverse()
      .map((release) => generateRelease(release));
    const result = await Promise.all(promisesInWaiting);

    const releases = packageItem.find((value) => 'releases' in value);
    result.forEach(({ message, newReleaseObj }) => {
      console.log(message.join('\n'));
      if (newReleaseObj) {
        packageItem
          .find((value) => 'releases' in value)
          .releases.push(newReleaseObj);
        releasesAvailable = true;
      }
    });
    releases.releases = releases.releases.sort((r1, r2) =>
      compareVersion(r1[':@'].$version, r2[':@'].$version)
    );
  } catch (e) {
    if (e.status === 404) {
      console.log(whiteBright(id) + ' ' + red('Not Found'));
    } else {
      console.error(red(e.message));
    }
  }

  if (releasesAvailable) {
    const newPackagesXml = builder.build(packagesObj);
    await writeFile(packagesXmlPath, format(newPackagesXml), 'utf-8');

    console.log(green('Updated packages.xml'));

    const modXmlData = await readFile(modXmlPath, 'utf-8');
    if (XMLValidator.validate(modXmlData)) {
      const modObj = parser.parse(modXmlData);

      const padNumber = (number) => number.toString().padStart(2, '0');
      const toISODate = (date) =>
        date.getFullYear() +
        '-' +
        padNumber(date.getMonth() + 1) +
        '-' +
        padNumber(date.getDate()) +
        'T' +
        padNumber(date.getHours()) +
        ':' +
        padNumber(date.getMinutes()) +
        ':00+09:00';

      const now = new Date();
      const newModDate = toISODate(now);
      modObj[2].mod[1].packages[0]._ = newModDate;

      const newModXml = builder.build(modObj);
      await writeFile(modXmlPath, format(newModXml), 'utf-8');

      console.log(green('Updated mod.xml'));
    }

    try {
      await remove('util/temp');
    } catch (e) {
      console.error(e);
    }
  }

  console.log('Generate complete.');
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  if (args[0] === '--all') {
    const generateAll = async () => {
      for (const id of Object.keys(archiveNamePattern)) {
        if (!id.startsWith('#') && !exclude.includes(id)) {
          console.log(cyanBright(id));
          await generateReleases([id]).catch((e) => console.error(e));
        }
      }
    };
    generateAll();
  } else {
    generateReleases(args);
  }
} else {
  console.error('A ID is required.');
}
