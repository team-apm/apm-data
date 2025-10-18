// > yarn run mod-core
// > yarn run mod-packages
// > yarn run mod-convert

import { List } from 'apm-schema';
import chalk from 'chalk';
import { readJson, writeFile } from 'fs-extra';
import { basename } from 'path';
import { format } from 'prettier';
const { green, red } = chalk;

// options
const listJsonPath = 'v3/list.json';

async function update(args: string[]) {
  const newDate = new Date();
  newDate.setSeconds(0, 0);

  const listObj = (await readJson(listJsonPath, 'utf-8')) as List;

  let targetObj: { modified: string };
  if (args[0] === '--core') {
    targetObj = listObj.core;
  } else if (args[0] === '--packages') {
    targetObj = listObj.packages[0];
  } else if (args[0] === '--convert') {
    targetObj = listObj.convert;
  } else if (args[0] === '--scripts') {
    targetObj = listObj.scripts[0];
  } else {
    console.error(red('Invalid argument: ' + args[0]));
    return;
  }

  const oldDate = new Date(targetObj.modified);
  if (newDate.getTime() > oldDate.getTime()) {
    const padNumber = (number: number) => number.toString().padStart(2, '0');
    const toISODate = (date: Date) =>
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
    targetObj.modified = toISODate(newDate);

    await writeFile(
      listJsonPath,
      await format(JSON.stringify(listObj), { parser: 'json', printWidth: 60 }),
      'utf-8',
    );

    console.log(green('Updated ' + basename(listJsonPath)));
  }

  console.log('Update complete.');
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  void update(args);
} else {
  console.error(red('Arguments are missing!'));
}
