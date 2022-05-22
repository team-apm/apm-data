// > yarn run check-update

import fs from 'fs-extra';
const { readFileSync, writeFileSync } = fs;
import chalk from 'chalk';
const { whiteBright, green, yellow, cyanBright, red } = chalk;
import { XMLParser, XMLValidator, XMLBuilder } from 'fast-xml-parser';
import { format as _format } from 'prettier';
import { Octokit } from '@octokit/rest';

// Options
const exclude = ['oov/PSDToolKit']; // IDs that won't be checked
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

async function check() {
  const packagesXmlData = readFileSync(packagesXmlPath, 'utf-8');
  if (XMLValidator.validate(packagesXmlData)) {
    const packagesObj = parser.parse(packagesXmlData);

    let updateAvailable = 0;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    for (const p of packagesObj[2].packages) {
      if ('package' in p) {
        const packageItem = p.package;

        const getValue = (key) => {
          return packageItem.find((value) => key in value)[key][0]._;
        };

        const id = getValue('id');
        const downloadURL = new URL(getValue('downloadURL'));
        const currentVersion = getValue('latestVersion');

        const dirs = downloadURL.pathname.split('/');
        dirs.shift();

        if (
          !exclude.includes(id) &&
          downloadURL.hostname === 'github.com' &&
          dirs[2] === 'releases' &&
          currentVersion !== '最新'
        ) {
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

            if (latestTag === currentVersion) {
              console.log(whiteBright(id), green(currentVersion));
            } else {
              updateAvailable++;
              const currentVersionIndex = packageItem.findIndex(
                (value) => 'latestVersion' in value
              );
              packageItem[currentVersionIndex].latestVersion[0]._ = latestTag;
              console.log(
                whiteBright(id),
                yellow(currentVersion),
                cyanBright(latestTag)
              );
            }
          } catch (e) {
            if (e.status === 404) {
              console.error(whiteBright(id), currentVersion, red('Not Found'));
            } else {
              console.error(red(e.message));
            }
          }
        }
      }
    }

    if (updateAvailable >= 1) {
      const newPackagesXml = builder.build(packagesObj);
      writeFileSync(packagesXmlPath, format(newPackagesXml), 'utf-8');

      console.log(green('Updated packages.xml'));

      const modXmlData = readFileSync(modXmlPath, 'utf-8');
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
        writeFileSync(modXmlPath, format(newModXml), 'utf-8');

        console.log(green('Updated mod.xml'));
      }
    }
  }

  console.log('Check complete.');
}

check();
