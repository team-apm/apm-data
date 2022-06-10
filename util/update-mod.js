// > yarn run mod-core
// > yarn run mod-packages
// > yarn run mod-convert

import chalk from 'chalk';
import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import fs from 'fs-extra';
import { format as _format } from 'prettier';
const { readFile, writeFile } = fs;
const { green, red } = chalk;

// options
const modXmlPath = 'v2/data/mod.xml';

function format(string) {
  const xml = string
    .trim()
    .replace(/<\?xml-model +/, '<?xml-model ') // Fix `<?xml-model   `
    .replaceAll(
      /<(.+?)>\r?\n?\t+([^<>\t]+?)\r?\n?\t+<\/(.+?)>/g,
      '<$1>$2</$3>'
    ); // Adjust line-breaking
  return _format(xml, { parser: 'xml', useTabs: true });
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

async function update(args) {
  const newDate = new Date();
  newDate.setSeconds(0, 0);

  const modXmlData = await readFile(modXmlPath, 'utf-8');
  if (XMLValidator.validate(modXmlData)) {
    const modObj = parser.parse(modXmlData);

    let targetObj;
    if (args[0] === '--core') {
      targetObj = modObj[2].mod[0].core[0];
    } else if (args[0] === '--packages') {
      targetObj = modObj[2].mod[1].packages[0];
    } else if (args[0] === '--convert') {
      targetObj = modObj[2].mod[2].convert[0];
    } else if (args[0] === '--scripts') {
      targetObj = modObj[2].mod[3].scripts[0];
    }
    const oldDate = new Date(targetObj._);
    const update = newDate.getTime() > oldDate.getTime();

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

    if (update) {
      targetObj._ = toISODate(newDate);
      const newModXml = builder.build(modObj);
      await writeFile(modXmlPath, format(newModXml), 'utf-8');

      console.log(green('Updated mod.xml'));
    }
  }

  console.log('Update complete.');
}

const args = process.argv.slice(2);

if (args.length >= 1) {
  update(args);
} else {
  console.error(red('Arguments are missing!'));
}
