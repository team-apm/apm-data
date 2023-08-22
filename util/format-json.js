import fs from 'fs-extra';
import { dirname, join, relative } from 'path';
import { format as prettierFormat } from 'prettier';
import { sortCore, sortPackages } from './sort.js';
const { existsSync, readJson, writeFile } = fs;

function findListJson(path) {
  const dirpath = dirname(path);
  const listJsonPath = join(dirpath, 'list.json');
  if (existsSync(listJsonPath)) {
    return listJsonPath;
  } else {
    return findListJson(dirpath);
  }
}

async function format(args) {
  const targetPath = args[0];
  const listJsonPath = findListJson(targetPath);
  if (!existsSync(targetPath) || !existsSync(listJsonPath)) {
    console.error('Some files are not found.');
    return;
  }
  const [object, listJsonObject] = await Promise.all([
    readJson(targetPath),
    readJson(listJsonPath),
  ]);
  const relPath = relative(dirname(listJsonPath), targetPath).replaceAll(
    '\\',
    '/',
  );

  const options = {
    parser: 'json',
    singleQuote: false,
  };
  if (listJsonObject.core.path === relPath) {
    await writeFile(
      targetPath,
      prettierFormat(JSON.stringify(sortCore(object)), options),
    );
  } else if (listJsonObject.packages.some((value) => value.path === relPath)) {
    const packagesObject = sortPackages(object);
    packagesObject.packages.sort((a, b) => {
      const idA = a.id.toUpperCase();
      const idB = b.id.toUpperCase();
      if (idA < idB) {
        return -1;
      }
      if (idA > idB) {
        return 1;
      }
      return 0;
    });
    await writeFile(
      targetPath,
      prettierFormat(JSON.stringify(packagesObject), options),
    );
  } else {
    console.log('Nothing done.');
  }
}

const args = process.argv.slice(2);

format(args);
