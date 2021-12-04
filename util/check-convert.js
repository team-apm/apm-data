// > yarn check-convert convertJson/dir/ old/packages.xml new/packages.xml

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { XMLParser, XMLValidator } = require('fast-xml-parser');

function check(args) {
  const convertJson = fs.readJsonSync(path.join(args[0], 'convert.json'));

  const oldXmlData = fs.readFileSync(args[1], 'utf-8');
  const newXmlData = fs.readFileSync(args[2], 'utf-8');
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
        chalk.cyan(oldId),
        chalk.cyanBright(newId),
        existsInOld
          ? existsInNew
            ? chalk.green('OK!')
            : chalk.redBright('New ID Error')
          : chalk.red('Old ID Error')
      );
      if (existsInOld && existsInNew) correctNumber++;
    }

    if (checkNumber === correctNumber) {
      console.log(chalk.green('It looks correct!'));
    } else {
      console.error(
        chalk.red(`Error! Problems: ${checkNumber - correctNumber}`)
      );
    }
  }
}

const args = process.argv.slice(2);

if (args.length >= 3) {
  check(args);
} else {
  console.error(chalk.red('Arguments are missing!'));
}
