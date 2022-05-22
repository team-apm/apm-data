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
  'files',
  'releases',
];

// Sort function
function sort(object, order) {
  const result = {};
  for (const key of order) {
    if (key in object) result[key] = object[key];
  }
  return result;
}
function sortArray(array, order) {
  const result = [];
  for (const object of array) {
    result.push(sort(object, order));
  }
  return result;
}

function sortCore(object) {
  for (const program of ['aviutl', 'exedit']) {
    for (const release of object[program].releases) {
      release.integrity.file = sortArray(
        release.integrity.file,
        integrityFileOrder
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

function sortPackages(object) {
  for (const package of object.packages) {
    if ('releases' in package) {
      for (const release of package.releases) {
        release.integrity.file = sortArray(
          release.integrity.file,
          integrityFileOrder
        );
        release.integrity = sort(release.integrity, integrityOrder);
      }

      package.releases = sortArray(package.releases, releaseOrder);
    }

    package.files = sortArray(package.files, fileOrder);
  }

  object.packages = sortArray(object.packages, packageOrder);

  return sort(object, packagesOrder);
}

module.exports = { sortCore, sortPackages };
