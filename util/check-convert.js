// > yarn check-convert convertJson/dir/ old/packages.xml new/packages.xml

import chalk from 'chalk';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import fs from 'fs-extra';
import { join } from 'path';
const { readJson, readFile } = fs;
const { cyan, cyanBright, green, redBright, red } = chalk;

async function check(args) {
  const [convertJson, oldXmlData, newXmlData] = await Promise.all([
    readJson(join(args[0], 'convert.json')),
    readFile(args[1], 'utf-8'),
    readFile(args[2], 'utf-8'),
  ]);

  if (XMLValidator.validate(oldXmlData) && XMLValidator.validate(newXmlData)) {
    const parser = new XMLParser({ parseAttributeValue: false });
    const oldJsonObj = parser.parse(oldXmlData);
    const newJsonObj = parser.parse(newXmlData);

    let checkNumber = 0;
    let correctNumber = 0;
    for (const [oldId, newId] of Object.entries(convertJson)) {
      checkNumber++;
      const existsInOld = oldJsonObj.packages.package.some(
        (value) => value.id === oldId
      );
      const existsInNew = newJsonObj.packages.package.some(
        (value) => value.id === newId
      );
      console.log(
        cyan(oldId),
        cyanBright(newId),
        existsInOld
          ? existsInNew
            ? green('OK!')
            : redBright('New ID Error')
          : red('Old ID Error')
      );
      if (existsInOld && existsInNew) correctNumber++;
    }

    if (checkNumber === correctNumber) {
      console.log(green('It looks correct!'));
    } else {
      console.error(red(`Error! Problems: ${checkNumber - correctNumber}`));
    }
  }
}

const args = process.argv.slice(2);

if (args.length >= 3) {
  check(args);
} else {
  console.error(red('Arguments are missing!'));
}
