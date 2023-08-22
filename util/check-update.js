// > yarn run check-update

import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import { basename, dirname, extname, join, resolve } from 'path';
import { format } from 'prettier';
import download from './lib/download.js';
import generateHash from './lib/generateHash.js';
import unzip from './lib/unzip.js';
const { readJson, readJsonSync, remove, writeFile } = fs;
const { whiteBright, green, yellow, cyanBright, red } = chalk;

// Options
const exclude = ['oov/PSDToolKit']; // IDs that won't be checked
const listJsonPath = 'v3/list.json';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const archiveNamePattern = readJsonSync('util/archive-name-pattern.json');

async function checkPackageUpdate(packageItem) {
  const result = {
    updateAvailable: false,
    message: [],
  };

  const id = packageItem.id;
  const downloadURL = new URL(packageItem.downloadURLs[0]);
  const currentVersion = packageItem.latestVersion;

  const dirs = downloadURL.pathname.split('/');
  dirs.shift();

  if (
    exclude.includes(id) ||
    downloadURL.hostname !== 'github.com' ||
    dirs[2] !== 'releases'
  )
    return result;

  try {
    const res = await octokit.rest.repos.getLatestRelease({
      owner: dirs[0],
      repo: dirs[1],
    });

    let latestTag = res.data.tag_name;

    // only for hebiiro's packages
    if (dirs[0] === 'hebiiro') {
      const versionArray = latestTag
        .split('.')
        .filter((value) => /[0-9]+/.test(value));
      if (versionArray.length >= 1) {
        latestTag = versionArray.join('.');
      } else {
        throw new Error('A version-like string is not found.');
      }
    }

    if (id === 'MrOjii/LSMASHWorks' && packageItem.directURL) {
      const newDownloadUrl = res.data.assets.find((asset) =>
        asset.name.includes('Mr-Ojii_Mr-Ojii'),
      ).browser_download_url;
      if (newDownloadUrl && packageItem.directURL !== newDownloadUrl) {
        packageItem.directURL = newDownloadUrl;
        result.updateAvailable = true;
        result.message.push(
          whiteBright(id) + ' ' + cyanBright('The directURL has been updated.'),
        );
        return result;
      } else return result;
    }

    if (currentVersion === '最新') {
      return result;
    }

    if (latestTag === currentVersion) {
      result.message.push(whiteBright(id) + ' ' + green(currentVersion));
      return result;
    }

    packageItem.latestVersion = latestTag;

    result.updateAvailable = true;
    result.message.push(
      whiteBright(id) +
        ' ' +
        yellow(currentVersion) +
        ' ' +
        cyanBright(latestTag),
    );

    // Create integrity
    const oldReleaseObj = packageItem?.releases?.[0];
    if (oldReleaseObj) {
      if (oldReleaseObj.version === latestTag)
        throw new Error('The release data of the same version exist.');

      const assets = res.data.assets.filter(
        (asset) => extname(asset.name) === '.zip',
      );
      let archiveData = {
        name: dirs[0] + '-' + dirs[1] + '-' + latestTag + '.zip',
        browser_download_url: `https://github.com/${dirs[0]}/${dirs[1]}/archive/refs/tags/${res.data.tag_name}.zip`,
      };
      if (assets.length === 1) {
        archiveData = assets[0];
      } else if (assets.length >= 2) {
        const temp = assets.find((value) => {
          const matchPattern = new RegExp(
            '^' + archiveNamePattern[id] + '\\.zip$',
          );
          return matchPattern.test(value.name);
        });
        if (temp) {
          archiveData = temp;
        } else {
          result.message.push(
            red(
              'No assets are found.\n  ID: ' +
                id +
                '\n  Pattern: ' +
                archiveNamePattern[id],
            ),
          );
          return result;
        }
      } else {
        result.message.push(
          yellow(
            'There seem to be no assets. So use an archive file of the source code.',
          ),
        );
      }

      const url = archiveData.browser_download_url;

      const archivePath = resolve('util/temp/archive', archiveData.name);
      await download(url, archivePath);
      const unzippedPath = resolve(
        'util/temp',
        basename(archivePath, extname(archivePath)),
      );
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
            basename(targetFilename),
          );

          const fileHash = await generateHash(targetPath);
          newIntegrityFileArray.push({
            target: targetFilename,
            hash: fileHash,
          });
        }
      }

      packageItem.releases.unshift({
        version: latestTag,
        integrity: { archive: archiveHash, file: newIntegrityFileArray },
      });
    }
  } catch (e) {
    if (e.status === 404) {
      result.message.push(
        whiteBright(id) + ' ' + currentVersion + ' ' + red('Not Found'),
      );
    } else {
      result.message.push(red(e.message));
    }
  }

  return result;
}

async function check() {
  const listObj = await readJson(listJsonPath);

  for (const jsonInfo of listObj.packages) {
    const packagesJsonPath = join(dirname(listJsonPath), jsonInfo.path);
    const packagesObj = await readJson(packagesJsonPath, 'utf-8');

    const promisesInWaiting = [];
    for (const p of packagesObj.packages) {
      promisesInWaiting.push(checkPackageUpdate(p));
    }

    const result = await Promise.all(promisesInWaiting);
    result
      .filter((updateResult) => updateResult.message.length >= 1)
      .forEach((updateResult) => console.log(updateResult.message.join('\n')));

    const updateAvailableNum = result.filter(
      (updateResult) => updateResult.updateAvailable,
    ).length;

    if (updateAvailableNum >= 1) {
      await writeFile(
        packagesJsonPath,
        format(JSON.stringify(packagesObj), { parser: 'json' }),
        'utf-8',
      );

      console.log(green('Updated ' + basename(jsonInfo.path) + '.'));
      try {
        remove('util/temp');
      } catch (e) {
        console.error(e);
      }
    }

    try {
      // Throws an error if changes in the file
      execSync('git diff --exit-code -- ' + packagesJsonPath);
      console.log('No updates available in ' + basename(jsonInfo.path) + '.');
    } catch {
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
      jsonInfo.modified = toISODate(now);
    }
  }

  await writeFile(
    listJsonPath,
    format(JSON.stringify(listObj), { parser: 'json', printWidth: 60 }),
    'utf-8',
  );
  console.log(green('Updated list.json.'));

  console.log('Check complete.');
}

check();
