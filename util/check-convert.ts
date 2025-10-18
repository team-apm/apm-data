// > yarn check-convert convertJson/dir/ old/packages.json new/packages.json

import { Convert, Packages } from 'apm-schema';
import chalk from 'chalk';
import { readJson } from 'fs-extra';
import { join } from 'path';
const { cyan, cyanBright, green, redBright, red } = chalk;

async function check(args: string[]) {
  const [convertJson, oldJsonObj, newJsonObj] = (await Promise.all([
    readJson(join(args[0], 'convert.json'), 'utf-8'),
    readJson(args[1], 'utf-8'),
    readJson(args[2], 'utf-8'),
  ])) as [Convert, Packages, Packages];

  let checkNumber = 0;
  let correctNumber = 0;
  for (const [oldId, newId] of Object.entries(convertJson)) {
    checkNumber++;
    const existsInOld = oldJsonObj.packages.some((value) => value.id === oldId);
    const existsInNew = newJsonObj.packages.some((value) => value.id === newId);
    console.log(
      cyan(oldId),
      cyanBright(newId),
      existsInOld ? green('Old ID OK!') : red('Old ID Error'),
      existsInNew ? green('New ID OK!') : redBright('New ID Error'),
    );
    if (existsInOld && existsInNew) correctNumber++;
  }

  if (checkNumber === correctNumber) {
    console.log(green('It looks correct!'));
  } else {
    console.error(red(`Error! Problems: ${checkNumber - correctNumber}`));
  }
}

const args = process.argv.slice(2);

if (args.length >= 3) {
  void check(args);
} else {
  console.error(red('Arguments are missing!'));
}
