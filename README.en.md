# apm-data

[![Node CI](https://github.com/team-apm/apm-data/actions/workflows/nodejs.yml/badge.svg)](https://github.com/team-apm/apm-data/actions/workflows/nodejs.yml)
[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/team-apm/apm-data/badge?style=rounded)](https://www.jsdelivr.com/package/gh/team-apm/apm-data)

Data repository for [AviUtl Package Manager](https://github.com/team-apm/apm)

## Data Structure

XPath is used in this description.

- **Bold element**: The required element
- _Italic element_: The optional element

### [mod.xml](./data/mod.xml)

This file contains modified date and time.

- **/mod/core**: Modified date and time of core.xml
- **/mod/packages_list**: Modified date and time of packages_list.xml

### [core.xml](./data/core.xml)

This file contains data of AviUtl and Exedit.

- **/core/${program}/files/file**: The name of the file used in the program
  - _/core/${program}/files/file/@optional_: Whether it is optional during installation (Default: false)
- **/core/${program}/latestVersion**: The latest version of the program
- **/core/${program}/releases**: Releases of the program
  - _/core/${program}/releases/@prefix_: The prefix of `fileURL`
  - **/core/${program}/releases/fileURL**: The URL of the released archive
    - **/core/${program}/releases/fileURL/@version**: The version of the release

### [packages_list.xml](./data/packages_list.xml)

This file contains data of plugins and scripts.

- **/packages/package/id**: The ID of the package (Non-duplicated alphanumeric characters. Use a file name that represents the package. If there is no representative name, use the archive file name. If there is a possibility of duplication, such as only one word, prefix it with the developer's name.)
- **/packages/package/name**: The name of the package (Up to 25 characters)
- **/packages/package/overview**: The overview of the package (Up to 35 characters)
- **/packages/package/description**: The description of the package
- **/packages/package/developer**: The name of the developer of the package
- _/packages/package/originalDeveloper_: The name of the developer of the package from which it was derived
- _/packages/package/dependencies/dependency_: ID of the package on which it depends
- **/packages/package/pageURL**: The URL of the package introduction page
- **/packages/package/downloadURL**: The URL of the package download page
- _/packages/package/downloadMirrorURL_: The URL of the mirror of the package download page
- _/packages/package/directURL_: URL to be used for the batch install feature
- **/packages/package/latestVersion**: The latest version of the package
  - _/packages/package/latestVersion/@continuous_: Whether to track the latest version (Default: false)
- _/packages/package/installer_: The name of the installer file
- _/packages/package/installerArg_: The arguments passed to the installer (`$instpath` will be replaced with the installation path.)
- **/packages/package/files/file**: The name of the file used in the package
  - _/packages/package/files/file/@optional_: Whether it is optional during installation (Default: false)
  - _/packages/package/files/file/@installOnly_: Whether the file is a non-uninstallable file (Default: false)
  - _/packages/package/files/file/@directory_: Whether it is a directory (Default: false)
  - _/packages/package/files/file/@archivePath_: The relative path of the file in the archive (Default: null)
  - _/packages/package/files/file/@obsolete_: Whether it is not included in the latest version (Default: false)

## Contribution

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[CC BY-NC-SA 4.0](./LICENSE)

[![Creative Commons License](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)
](https://creativecommons.org/licenses/by-nc-sa/4.0/)

This work is licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## Contributor

[@hal-shu-sato](https://github.com/hal-shu-sato)
[@mitosagi](https://github.com/mitosagi)
[@yumetodo](https://github.com/yumetodo)
[@karoterra](https://github.com/karoterra)
