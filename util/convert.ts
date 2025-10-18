import { Convert, Core, List, Packages, Scripts } from 'apm-schema';
import fs from 'fs-extra';
import yaml from 'js-yaml';

function core(): void {
  const coreJson = fs.readJsonSync('v3/core.json', 'utf-8') as Core;
  const aviutlYaml = yaml.dump(coreJson.aviutl);
  void fs.outputFile('src/core/aviutl.yaml', aviutlYaml, 'utf-8');
  const exeditYaml = yaml.dump(coreJson.exedit);
  void fs.outputFile('src/core/exedit.yaml', exeditYaml, 'utf-8');
}

function convert(): void {
  const convertJson = fs.readJsonSync('v3/convert.json', 'utf-8') as Convert;
  const convertYaml = yaml.dump(convertJson);
  void fs.outputFile('src/convert.yaml', convertYaml, 'utf-8');
}

function packages(): void {
  const listJson = fs.readJsonSync('v3/list.json', 'utf-8') as List;
  const packagePaths = listJson.packages.map((pkg) => pkg.path);
  const packages: Packages['packages'] = [];
  for (const packagePath of packagePaths) {
    const packageJson = fs.readJsonSync(
      `v3/${packagePath}`,
      'utf-8',
    ) as Packages;
    packages.push(...packageJson.packages);
  }
  for (const pkg of packages) {
    const id = pkg.id;
    const pkgYaml = yaml.dump(pkg);
    void fs.outputFile(`src/packages/${id}/package.yaml`, pkgYaml, 'utf-8');
  }
}

function scripts(): void {
  const scriptsJson = fs.readJsonSync('v3/scripts.json', 'utf-8') as Scripts;
  const webpageYaml = yaml.dump(scriptsJson.webpage);
  void fs.outputFile('src/scripts/webpage.yaml', webpageYaml, 'utf-8');
  const scriptsYaml = yaml.dump(scriptsJson.scripts);
  void fs.outputFile('src/scripts/scripts.yaml', scriptsYaml, 'utf-8');
}

function main(): void {
  core();
  convert();
  packages();
  scripts();
}

main();
