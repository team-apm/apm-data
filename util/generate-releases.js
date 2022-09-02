// > yarn run generate-releases <package_id>

import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { compareVersions } from 'compare-versions';
import fs from 'fs-extra';
import { basename, dirname, extname, resolve } from 'path';
import { format } from 'prettier';
import download from './lib/download.js';
import generateHash from './lib/generateHash.js';
import unzip from './lib/unzip.js';
const { readJson, readJsonSync, remove, writeFile } = fs;
const { whiteBright, green, red, cyanBright } = chalk;

// Options
const exclude = ['suzune/bakusoku', 'suzune/WideDialog'];
const packagesJsonPath = 'v3/packages.json';
const listJsonPath = 'v3/list.json';

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

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const archiveNamePattern = readJsonSync('util/archive-name-pattern.json');

async function generateReleases(args) {
  const id = args[0];
  if (!(id in archiveNamePattern)) {
    console.error(red('The archive-name pattern does not exist.'));
    return;
  }

  const packagesObj = await readJson(packagesJsonPath, 'utf-8');
  const packageItem = packagesObj.packages.find((p) => p.id === id);

  const downloadURL = new URL(packageItem.downloadURLs[0]);
  const currentVersion = packageItem.latestVersion;

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
        const oldReleaseObj = packageItem?.releases?.[0];
        if (!oldReleaseObj) {
          throw new Error('The old release data does not exist.');
        }
        if (packageItem?.releases.some((p) => p.version === tag))
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
        await download(url, archivePath);
        const unzippedPath = resolve(dirname(archivePath), '../');
        await unzip(archivePath, unzippedPath);

        const archiveHash = await generateHash(archivePath);

        const oldIntegrityFileArray = oldReleaseObj?.integrity?.file;
        const newIntegrityFileArray = [];
        if (oldIntegrityFileArray) {
          const filesArray = packageItem.files;
          for (const integrityFileData of oldIntegrityFileArray) {
            const targetFilename = integrityFileData.target;
            const targetFileArchivePath =
              filesArray.find((value) => value.filename === targetFilename)
                ?.archivePath ?? '';
            const targetPath = resolve(
              unzippedPath,
              targetFileArchivePath,
              basename(targetFilename)
            );

            const fileHash = await generateHash(targetPath);
            newIntegrityFileArray.push({
              target: targetFilename,
              hash: fileHash,
            });
          }
        }

        result.newReleaseObj = {
          version: tag,
          integrity: { archive: archiveHash, file: newIntegrityFileArray },
        };
        result.message.push(green('Successful.'));
      } catch (e) {
        result.message.push(red(e.message));
      }

      return result;
    };

    const promisesInWaiting = res.data.map((release) =>
      generateRelease(release)
    );
    const result = await Promise.all(promisesInWaiting);

    result.forEach(({ message, newReleaseObj }) => {
      console.log(message.join('\n'));
      if (newReleaseObj) {
        packageItem.releases.unshift(newReleaseObj);
        releasesAvailable = true;
      }
    });
    if (packageItem.releases)
      packageItem.releases = packageItem.releases.sort((r1, r2) =>
        compareVersion(r1.version, r2.version)
      );
  } catch (e) {
    if (e.status === 404) {
      console.log(whiteBright(id) + ' ' + red('Not Found'));
    } else {
      console.error(red(e.message));
    }
  }

  if (releasesAvailable) {
    await writeFile(
      packagesJsonPath,
      format(JSON.stringify(packagesObj), { parser: 'json' }),
      'utf-8'
    );

    console.log(green('Updated ' + basename(packagesJsonPath)));

    const listObj = await readJson(listJsonPath, 'utf-8');

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
    listObj.packages.find(
      (value) => value.path === basename(packagesJsonPath)
    ).modified = toISODate(now);

    await writeFile(
      listJsonPath,
      format(JSON.stringify(listObj), { parser: 'json', printWidth: 60 }),
      'utf-8'
    );

    console.log(green('Updated ' + basename(listJsonPath)));
  }

  try {
    await remove('util/temp');
  } catch (e) {
    console.error(e);
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
