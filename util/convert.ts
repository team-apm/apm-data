import { Core, List, Packages } from 'apm-schema';
import fs from 'fs-extra';
import yaml from 'js-yaml';

function core(): void {
  const coreJson = fs.readJsonSync('v3/core.json', 'utf-8') as Core;
  const aviutlYaml = yaml.dump(coreJson.aviutl);
  fs.outputFileSync('src/core/aviutl.yaml', aviutlYaml, 'utf-8');
  const exeditYaml = yaml.dump(coreJson.exedit);
  fs.outputFileSync('src/core/exedit.yaml', exeditYaml, 'utf-8');
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
    const { releases, ...rests } = pkg;
    const pkgYaml = yaml.dump(rests);
    fs.outputFileSync(`src/packages/${id}/package.yaml`, pkgYaml, {
      encoding: 'utf-8',
    });
    if (!releases) {
      continue;
    }
    for (const release of releases) {
      const version = release.version;
      const releaseYaml = yaml.dump(release);
      fs.outputFileSync(
        `src/packages/${id}/releases/${version}.yaml`,
        releaseYaml,
        { encoding: 'utf-8' },
      );
    }
  }
}

function main(): void {
  core();
  packages();
}

main();
