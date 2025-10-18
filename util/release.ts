/**
 * util/release.ts
 *
 * Convert YAML files under src/ (core, convert, packages, scripts)
 * into v3 JSON files used by the rest of the tooling.
 *
 * Usage:
 *   npx tsx util/release.ts
 *
 * Produces:
 *   - v3/core.json
 *   - v3/core.min.json
 *   - v3/convert.json
 *   - v3/convert.min.json
 *   - v3/packages/<developer>.json
 *   - v3/packages/<developer>.min.json
 *   - v3/list.json
 *   - v3/list.min.json
 *   - v3/scripts.json
 *   - v3/scripts.min.json
 */
import { Convert, Core, List, Packages, Scripts } from 'apm-schema';
import fs from 'fs-extra';
import yaml from 'js-yaml';

const VERSION = 3;

const AVIUTL_YAML_PATH = 'src/core/aviutl.yaml';
const EXEDIT_YAML_PATH = 'src/core/exedit.yaml';
const CONVERT_YAML_PATH = 'src/convert.yaml';
const PACKAGES_DIR_PATH = 'src/packages/';
const SCRIPTS_WEBPAGE_YAML_PATH = 'src/scripts/webpage.yaml';
const SCRIPTS_SCRIPTS_YAML_PATH = 'src/scripts/scripts.yaml';

const V3_DIR = 'v3/';
const V3_CORE_JSON = `${V3_DIR}core.json`;
const V3_CORE_MIN_JSON = `${V3_DIR}core.min.json`;
const V3_CONVERT_JSON = `${V3_DIR}convert.json`;
const V3_CONVERT_MIN_JSON = `${V3_DIR}convert.min.json`;
const V3_LIST_JSON = `${V3_DIR}list.json`;
const V3_LIST_MIN_JSON = `${V3_DIR}list.min.json`;
const V3_PACKAGES_DIR = `${V3_DIR}packages/`;
const V3_SCRIPTS_JSON = `${V3_DIR}scripts.json`;
const V3_SCRIPTS_MIN_JSON = `${V3_DIR}scripts.min.json`;

function core(): void {
  const aviutl = yaml.load(
    fs.readFileSync(AVIUTL_YAML_PATH, 'utf-8'),
  ) as Core['aviutl'];
  const exedit = yaml.load(
    fs.readFileSync(EXEDIT_YAML_PATH, 'utf-8'),
  ) as Core['exedit'];
  const coreObj = { version: VERSION, aviutl, exedit } as Core;
  fs.outputJson(V3_CORE_JSON, coreObj, { spaces: 2 });
  fs.outputJson(V3_CORE_MIN_JSON, coreObj);
}

function convert(): void {
  const convertObj = yaml.load(
    fs.readFileSync(CONVERT_YAML_PATH, 'utf-8'),
  ) as Convert;
  fs.outputJson(V3_CONVERT_JSON, convertObj, { spaces: 2 });
  fs.outputJson(V3_CONVERT_MIN_JSON, convertObj);
}

// Walk through src/packages/* and read package.yaml files
const packagesList: Record<string, Packages['packages']> = {};

function packages(): void {
  if (!fs.existsSync(PACKAGES_DIR_PATH)) {
    fs.ensureDirSync(PACKAGES_DIR_PATH);
  }
  const developerDirs = fs.readdirSync(PACKAGES_DIR_PATH, {
    withFileTypes: true,
  });
  for (const developerDir of developerDirs) {
    if (!developerDir.isDirectory()) continue;
    const developerName = developerDir.name; // use directory name (ASCII)
    const developerPath = `${PACKAGES_DIR_PATH}${developerName}`;
    const packageDirs = fs.readdirSync(developerPath, { withFileTypes: true });
    for (const pkg of packageDirs) {
      if (!pkg.isDirectory()) continue;
      const pkgYamlPath = `${developerPath}/${pkg.name}/package.yaml`;
      if (!fs.existsSync(pkgYamlPath)) continue;
      const pkgObj = yaml.load(
        fs.readFileSync(pkgYamlPath, 'utf-8'),
      ) as Packages['packages'][number];
      if (!packagesList[developerName]) packagesList[developerName] = [];
      packagesList[developerName].push(pkgObj);
    }
  }

  // Write per-developer YAML files under v3/packages/<developerDir>.yaml
  fs.ensureDirSync(V3_PACKAGES_DIR);
  for (const [devDir, pkgs] of Object.entries(packagesList)) {
    // devDir is the src/packages/<devDir> directory name (ASCII)
    const packagesObj = { version: VERSION, packages: pkgs } as Packages;
    fs.outputJson(`${V3_PACKAGES_DIR}/${devDir}.json`, packagesObj, {
      spaces: 2,
    });
    fs.outputJson(`${V3_PACKAGES_DIR}/${devDir}.min.json`, packagesObj);
  }
}

function scripts(): void {
  const webpage = yaml.load(
    fs.readFileSync(SCRIPTS_WEBPAGE_YAML_PATH, 'utf-8'),
  ) as Scripts['webpage'];
  const scriptsObj = yaml.load(
    fs.readFileSync(SCRIPTS_SCRIPTS_YAML_PATH, 'utf-8'),
  ) as Scripts['scripts'];
  const scriptsJson = { webpage, scripts: scriptsObj } as Scripts;
  fs.outputJson(V3_SCRIPTS_JSON, scriptsJson, { spaces: 2 });
  fs.outputJson(V3_SCRIPTS_MIN_JSON, scriptsJson);
}

function list(): void {
  // Also write v3/list.json which maps package path entries for convert utility
  const list = {
    core: {
      path: 'core.json',
      modified: new Date().toISOString(),
    },
    convert: {
      path: 'convert.json',
      modified: new Date().toISOString(),
    },
    packages: [],
    scripts: [
      {
        path: 'scripts.json',
        modified: new Date().toISOString(),
      },
    ],
  } as List;
  for (const devDir of Object.keys(packagesList)) {
    list.packages.push({
      path: `packages/${devDir}.json`,
      modified: new Date().toISOString(),
    });
  }
  fs.outputJson(V3_LIST_JSON, list, { spaces: 2 });
  fs.outputJson(V3_LIST_MIN_JSON, list);
}

function main(): void {
  core();
  convert();
  packages();
  scripts();
  list();
}

main();
