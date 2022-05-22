// > yarn run convert-2-3

const path = require('path');
const fs = require('fs-extra');
const { XMLParser, XMLValidator } = require('fast-xml-parser');
const compareVersions = require('compare-versions');
const chalk = require('chalk');
const prettier = require('prettier');
const sort = require('./sort');

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

function replacer(key, value) {
  if (
    [
      'archivePath',
      'isUninstallOnly',
      'isInstallOnly',
      'isDirectory',
      'isObsolete',
    ].includes(key) &&
    !value
  ) {
    return undefined;
  }

  return value;
}

const parser = new XMLParser({
  attributeNamePrefix: '$',
  textNodeName: '_',
  ignoreAttributes: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: () => true,
});

const defaultKeys = [
  'id',
  'name',
  'overview',
  'description',
  'developer',
  'originalDeveloper',
  'dependencies',
  'pageURL',
  'downloadURL',
  'downloadMirrorURL',
  'directURL',
  'latestVersion',
  'detailURL',
  'files',
  'installer',
  'installArg',
  'releases',
];

const typeForExtention = {
  '.auf': 'filter',
  '.aui': 'input',
  '.auo': 'output',
  '.auc': 'color',
  '.aul': 'language',
  '.anm': 'animation',
  '.obj': 'object',
  '.cam': 'camera',
  '.tra': 'track',
  '.scn': 'scene',
};

/**
 * @param {object} parsedData - A object parsed from XML.
 * @return {Array} An array of files.
 */
function parseFiles(parsedData) {
  const files = [];
  for (const file of parsedData.files[0].file) {
    const tmpFile = {
      filename: null,
      isOptional: false,
      isInstallOnly: false,
      isDirectory: false,
      isObsolete: false,
      archivePath: null,
    };
    if (typeof file === 'string') {
      tmpFile.filename = file;
    } else if (typeof file === 'object') {
      tmpFile.filename = file._;
      if (file.$optional) tmpFile.isOptional = Boolean(file.$optional[0]);
      if (file.$installOnly)
        tmpFile.isInstallOnly = Boolean(file.$installOnly[0]);
      if (file.$directory) tmpFile.isDirectory = Boolean(file.$directory[0]);
      if (file.$obsolete) tmpFile.isObsolete = Boolean(file.$obsolete[0]);
      if (file.$archivePath) tmpFile.archivePath = file.$archivePath[0];
    } else {
      continue;
    }
    files.push(tmpFile);
  }
  return files;
}

class CoreInfo {
  /**
   * Returns the core program's information.
   *
   * @param {object} parsedCore - An object parsed from XML.
   */
  constructor(parsedCore) {
    if (parsedCore.files) {
      this.files = parseFiles(parsedCore);
    }
    if (parsedCore.latestVersion) {
      if (typeof parsedCore.latestVersion[0] === 'string')
        this.latestVersion = parsedCore.latestVersion[0];
    }
    if (parsedCore.releases) {
      this.releases = {};
      for (const release of parsedCore.releases[0].release) {
        this.releases[release.$version[0]] = {
          url: release.url[0],
          archiveIntegrity: release?.archiveIntegrity?.[0],
          integrities: release?.integrities
            ? release.integrities[0].integrity.map((integrity) => {
                return {
                  target: integrity.$target[0],
                  targetIntegrity: integrity._,
                };
              })
            : [],
        };
      }
    }
  }
}

/**
 *
 */
class PackageInfo {
  /**
   * Returns the package's information.
   *
   * @param {object} parsedPackage - An object parsed from XML.
   */
  constructor(parsedPackage) {
    for (const key of defaultKeys) {
      if (parsedPackage[key]) {
        if (key === 'files') {
          this.files = parseFiles(parsedPackage);
        } else if (key === 'latestVersion') {
          const tmpObj = parsedPackage[key][0];
          if (typeof tmpObj === 'string') {
            this[key] = tmpObj;
          } else if (typeof tmpObj === 'object') {
            this[key] = tmpObj._;
            if (tmpObj.$continuous)
              this.isContinuous = Boolean(tmpObj.$continuous[0]);
          }
        } else if (key === 'releases') {
          this.releases = {};
          for (const release of parsedPackage[key][0].release) {
            this.releases[release.$version[0]] = {
              archiveIntegrity: release?.archiveIntegrity?.[0],
              integrities: release?.integrities
                ? release.integrities[0].integrity.map((integrity) => {
                    return {
                      target: integrity.$target[0],
                      targetIntegrity: integrity._,
                    };
                  })
                : [],
            };
          }
        } else {
          this[key] = parsedPackage[key][0];
        }
      }
    }
    const types = this.files.flatMap((f) => {
      const extention = path.extname(f.filename);
      if (extention in typeForExtention) {
        return [typeForExtention[extention]];
      } else {
        return [];
      }
    });
    this.type = [...new Set(types)];
  }
}

async function convertCore(v2ListPath, v3ListPath) {
  if (fs.existsSync(v2ListPath)) {
    const xmlData = await fs.readFile(v2ListPath, 'utf-8');
    const valid = XMLValidator.validate(xmlData);
    if (valid === true) {
      const coreInfo = parser.parse(xmlData);
      if (coreInfo.core) {
        const v2Data = {};
        for (const program of ['aviutl', 'exedit']) {
          v2Data[program] = new CoreInfo(coreInfo.core[0][program][0]);
        }

        try {
          let newV3Data = {
            version: 3,
            ...JSON.parse(
              JSON.stringify(v2Data).replaceAll('isOptional', 'isUninstallOnly')
            ),
          };
          for (const program of [newV3Data.aviutl, newV3Data.exedit]) {
            if (program.releases) {
              program.releases = Object.entries(program.releases).map(
                ([k, v]) => {
                  return { ...v, version: k };
                }
              );
              program.releases = program.releases
                .sort((r1, r2) => compareVersion(r1.version, r2.version))
                .reverse();
              for (const release of program.releases) {
                if (release.integrities) {
                  release.integrity = { file: release.integrities };
                  delete release.integrities;
                  for (const file of release.integrity.file) {
                    file.hash = file.targetIntegrity;
                    delete file.targetIntegrity;
                  }
                }
                if (release.archiveIntegrity) {
                  release.integrity.archive = release.archiveIntegrity;
                  delete release.archiveIntegrity;
                }
              }
            }
          }

          newV3Data = JSON.parse(JSON.stringify(newV3Data, replacer));
          newV3Data = sort.sortCore(newV3Data);

          await fs.writeFile(
            v3ListPath,
            prettier.format(JSON.stringify(newV3Data), {
              parser: 'json',
              singleQuote: false,
            })
          );

          console.log(chalk.greenBright('Converted core.xml to core.json.'));
        } catch (e) {
          console.error(chalk.red(e));
        }
      } else {
        throw new Error('The list is invalid.');
      }
    } else {
      throw valid;
    }
  } else {
    throw new Error('The version file does not exist.');
  }
}

async function convertPackages(v2ListPath, v3ListPath) {
  if (fs.existsSync(v2ListPath)) {
    const xmlData = await fs.readFile(v2ListPath, 'utf-8');
    const valid = XMLValidator.validate(xmlData);
    if (valid === true) {
      const packagesInfo = parser.parse(xmlData);
      if (packagesInfo.packages) {
        const v2Data = {};
        for (const packageItem of packagesInfo.packages[0].package) {
          v2Data[packageItem.id[0]] = new PackageInfo(packageItem);
        }

        try {
          let newV3Packages = JSON.parse(
            JSON.stringify(Object.values(v2Data)).replaceAll(
              'isOptional',
              'isUninstallOnly'
            )
          );

          newV3Packages = newV3Packages.map((p) => {
            if (p?.dependencies?.dependency)
              p.dependencies = p.dependencies.dependency;
            if (p?.releases)
              p.releases = Object.entries(p.releases).map(([k, v]) => {
                return { ...v, version: k };
              });
            delete p.type;
            return p;
          });

          newV3Packages = newV3Packages.map((p) => {
            if (p.releases) {
              p.releases = p.releases
                .sort((r1, r2) => compareVersion(r1.version, r2.version))
                .reverse();
              for (const release of p.releases) {
                if (release.integrities) {
                  release.integrity = { file: release.integrities };
                  delete release.integrities;
                  for (const file of release.integrity.file) {
                    file.hash = file.targetIntegrity;
                    delete file.targetIntegrity;
                  }
                }
                if (release.archiveIntegrity) {
                  release.integrity.archive = release.archiveIntegrity;
                  delete release.archiveIntegrity;
                }
              }
            }

            p.downloadURLs = [p.downloadURL];
            delete p.downloadURL;
            if (p.downloadMirrorURL) {
              p.downloadURLs.push(p.downloadMirrorURL);
              delete p.downloadMirrorURL;
            }

            return p;
          });

          let newV3Data = { version: 3, packages: newV3Packages };

          newV3Data = JSON.parse(JSON.stringify(newV3Data, replacer));

          // For work in progress
          if (fs.existsSync(v3ListPath)) {
            const oldV3data = await fs.readJSON(v3ListPath);
            for (const newPackageItem of newV3Data.packages) {
              const oldPackageItem = oldV3data.packages.find(
                (p) => p.id === newPackageItem.id
              );

              if (oldPackageItem && 'nicommons' in oldPackageItem)
                newPackageItem.nicommons = oldPackageItem.nicommons;
            }
          }

          newV3Data = sort.sortPackages(newV3Data);

          await fs.writeFile(
            v3ListPath,
            prettier.format(JSON.stringify(newV3Data), {
              parser: 'json',
              singleQuote: false,
            })
          );

          console.log(
            chalk.greenBright('Converted packages.xml to packages.json.')
          );
        } catch (e) {
          console.error(chalk.red(e));
        }
      } else {
        throw new Error('The list is invalid.');
      }
    } else {
      throw valid;
    }
  } else {
    throw new Error('The version file does not exist.');
  }
}

const args = process.argv.slice(2);

if (args[0] === '--core') {
  const input = path.resolve(__dirname, '../v2/data/core.xml');
  const output = path.resolve(__dirname, '../v3/core.json');
  convertCore(input, output);
} else if (args[0] === '--packages') {
  const input = path.resolve(__dirname, '../v2/data/packages.xml');
  const output = path.resolve(__dirname, '../v3/packages.json');
  convertPackages(input, output);
} else {
  console.error(chalk.red('There is no args.'));
}
