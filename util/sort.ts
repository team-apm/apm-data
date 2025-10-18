import { Core, Packages } from 'apm-schema';

// Order definition
const fileOrder = [
  'filename',
  'archivePath',
  'isDirectory',
  'isInstallOnly',
  'isUninstallOnly',
  'isObsolete',
];
const releaseOrder = ['version', 'integrity'];
const integrityOrder = ['archive', 'file'];
const integrityFileOrder = ['target', 'hash'];

const coreOrder = ['version', 'aviutl', 'exedit'];
const programOrder = ['files', 'latestVersion', 'releases'];

const packagesOrder = ['version', 'packages'];
const packageOrder = [
  'id',
  'name',
  'overview',
  'description',
  'developer',
  'originalDeveloper',
  'dependencies',
  'conflicts',
  'provides',
  'pageURL',
  'downloadURLs',
  'directURL',
  'latestVersion',
  'isContinuous',
  'installer',
  'installArg',
  'nicommons',
  'isHidden',
  'files',
  'releases',
];

// Sort function
function sort<T extends object>(object: T, order: string[]): T {
  const result: Partial<T> = {};
  for (const key of order) {
    if (key in object) result[key as keyof T] = object[key as keyof T];
  }
  return result as T;
}
function sortArray<T extends object>(array: T[], order: string[]) {
  const result: T[] = [];
  for (const object of array) {
    result.push(sort(object, order));
  }
  return result;
}

export function sortCore(object: Core) {
  for (const program of ['aviutl', 'exedit'] as const) {
    for (const release of object[program].releases) {
      release.integrity.file = sortArray(
        release.integrity.file,
        integrityFileOrder,
      );
      release.integrity = sort(release.integrity, integrityOrder);
    }

    object[program].files = sortArray(object[program].files, fileOrder);
    object[program].releases = sortArray(object[program].releases, [
      'url',
      ...releaseOrder,
    ]);

    object[program] = sort(object[program], programOrder);
  }
  return sort(object, coreOrder);
}

export function sortPackages(object: Packages) {
  for (const packageItem of object.packages) {
    if (packageItem.releases) {
      for (const release of packageItem.releases) {
        release.integrity.file = sortArray(
          release.integrity.file,
          integrityFileOrder,
        );
        release.integrity = sort(release.integrity, integrityOrder);
      }

      packageItem.releases = sortArray(packageItem.releases, releaseOrder);
    }

    packageItem.files = sortArray(packageItem.files, fileOrder);
  }

  object.packages = sortArray(object.packages, packageOrder);

  return sort(object, packagesOrder);
}
