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
import { execSync } from 'child_process';
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
  void fs.outputJson(V3_CORE_JSON, coreObj, { spaces: 2 });
  void fs.outputJson(V3_CORE_MIN_JSON, coreObj);
}

function convert(): void {
  const convertObj = yaml.load(
    fs.readFileSync(CONVERT_YAML_PATH, 'utf-8'),
  ) as Convert;
  void fs.outputJson(V3_CONVERT_JSON, convertObj, { spaces: 2 });
  void fs.outputJson(V3_CONVERT_MIN_JSON, convertObj);
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
    void fs.outputJson(`${V3_PACKAGES_DIR}/${devDir}.json`, packagesObj, {
      spaces: 2,
    });
    void fs.outputJson(`${V3_PACKAGES_DIR}/${devDir}.min.json`, packagesObj);
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
  void fs.outputJson(V3_SCRIPTS_JSON, scriptsJson, { spaces: 2 });
  void fs.outputJson(V3_SCRIPTS_MIN_JSON, scriptsJson);
}

/**
 * Compare a workspace file against the file content in `main` branch.
 * Returns true if the file is new, deleted, or different from main.
 */
function isDifferentFromMain(workspacePath: string, mainPath: string): boolean {
  try {
    // Get blob hash of the file on main (if present)
    let mainHash: string | null = null;
    try {
      const ls = execSync(`git ls-tree -r main -- ${mainPath}`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString();
      const line = ls.split('\n').find((l) => l.trim().length > 0) || '';
      // line format: '<mode> <type> <hash>\t<path>' or with spaces
      const m = line.match(/\b([0-9a-f]{40})\b/);
      mainHash = m ? m[1] : null;
    } catch {
      mainHash = null;
    }

    const workspaceExists = fs.existsSync(workspacePath);

    // Both missing -> not different
    if (!workspaceExists && !mainHash) return false;
    // Deleted on workspace (exists on main) -> different
    if (!workspaceExists && mainHash) return true;
    // New file on workspace (not on main) -> different
    if (workspaceExists && !mainHash) return true;

    // Both exist: compare blob hashes
    const workHash = execSync(`git hash-object ${workspacePath}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return workHash !== mainHash;
  } catch (error) {
    console.error(
      'Error comparing file with main (hash):',
      workspacePath,
      error,
    );
    // On any unexpected error, be conservative and treat as different
    return true;
  }
}

function getListJsonFromMain(): List | null {
  try {
    const mainContent = execSync(`git show main:${V3_LIST_JSON}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return JSON.parse(mainContent) as List;
  } catch {
    return null;
  }
}

function list(): void {
  const listJson =
    getListJsonFromMain() ||
    ({
      core: { path: 'core.json', modified: new Date().toISOString() },
      convert: { path: 'convert.json', modified: new Date().toISOString() },
      packages: [],
      scripts: [{ path: 'scripts.json', modified: new Date().toISOString() }],
    } as List);

  // We'll determine differences by comparing generated v3 files to `main` content.

  // Existing packages map (path -> modified)
  const existingPackages = listJson.packages || [];
  const existingMap = new Map<string, string>();
  for (const p of existingPackages) existingMap.set(p.path, p.modified);

  const packages: List['packages'] = [];
  for (const devDir of Object.keys(packagesList)) {
    const relPath = `packages/${devDir}.json`;
    const v3Path = `v3/${relPath}`;
    const prev = existingMap.get(relPath);
    const isDifferent = isDifferentFromMain(v3Path, v3Path);
    const modified = !prev || isDifferent ? new Date().toISOString() : prev;
    packages.push({ path: relPath, modified });
  }

  // core
  const coreIsDifferent = isDifferentFromMain(V3_CORE_JSON, V3_CORE_JSON);
  const coreModified = coreIsDifferent
    ? new Date().toISOString()
    : listJson.core?.modified || new Date().toISOString();

  // convert
  const convertIsDifferent = isDifferentFromMain(
    V3_CONVERT_JSON,
    V3_CONVERT_JSON,
  );
  const convertModified = convertIsDifferent
    ? new Date().toISOString()
    : listJson.convert?.modified || new Date().toISOString();

  // scripts
  const scriptsPrev = (listJson.scripts && listJson.scripts[0])?.modified;
  const scriptsIsDifferent = isDifferentFromMain(
    V3_SCRIPTS_JSON,
    V3_SCRIPTS_JSON,
  );
  const scriptsModified =
    scriptsIsDifferent || !scriptsPrev ? new Date().toISOString() : scriptsPrev;

  const list = {
    core: {
      path: 'core.json',
      modified: coreModified,
    },
    convert: {
      path: 'convert.json',
      modified: convertModified,
    },
    packages,
    scripts: [
      {
        path: 'scripts.json',
        modified: scriptsModified,
      },
    ],
  } as List;
  void fs.outputJson(V3_LIST_JSON, list, { spaces: 2 });
  void fs.outputJson(V3_LIST_MIN_JSON, list);
}

function main(): void {
  core();
  convert();
  packages();
  scripts();
  list();
}

main();
