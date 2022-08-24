# Contribution

[日本語](./CONTRIBUTING.md)

Thank you for your interest in contributing to the data for AviUtl Package Manager!

Here is a guide on how to contribute.

## Language Used

This data has been created using JSON.

The languages used are:

- JSON

## Issues

A template is provided for the following issues. You can use either English or Japanese.

- Plugin request [English](https://github.com/team-apm/apm-data/issues/new?labels=plugin&template=plugin_request.md) [日本語](https://github.com/team-apm/apm-data/issues/new?labels=plugin&template=plugin_request_ja.md)
- Script Request [English](https://github.com/team-apm/apm-data/issues/new?labels=script&template=script_request.md) [日本語](https://github.com/team-apm/apm-data/issues/new?labels=script&template=script_request_ja.md)

Other Issues are also welcome.

## Pull Requests

Pull Requests are also welcome.

We accept the following types of pull requests. You don't need to make an Issue for basic Pull Requests.

If you have a question about a new feature, improvement, or fix, or if the impact of a major new feature or change is significant, please make an Issue to discuss it.

- Adding a new plugin/script
- Changing the data format

When the pull request is merged, your contribution will be added to the [Contributors list](https://github.com/team-apm/apm/graphs/contributors) and the code content will be [CC BY-NC -SA 4.0](./LICENSE).

## Confirmation of Modifications

Try installing and uninstalling the added package by specifying the `v3` directory as the destination to get the data or the JSON file you edited as the destination to get the additional data from the `設定` tab of [AviUtl Package Manager](https://github.com/team-apm/apm).

## Directory Structure

Place data JSON under `v3`.

```text
└── v3
    ├── packages
    │   ├── xxxx.json
    │   └── yyyy.json
    ├── convert.json
    ├── core.json
    ├── list.json
    ├── package-sets.json
    ├── packages.json
    └── scripts.json
```

## Commit Message Convention

Currently, we don't have a clear specification because we don't output the update history, but you can follow Angular's Commit Message Format.

- [conventional-changelog/packages/conventional-changelog-angular/README.md](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/README.md)

## Data Writing Style/Rules

First, check the [SPECIFICATION](./v3/SPECIFICATION.md).

Other things that are conventionally done are noted.

- Packages are sorted alphabetically by ID.
- For placement in the AviUtl folder, for plugins, we follow the developer's specifications in the README, etc. For scripts, place them in a separate folder for each author in the `script` folder.
- If you specify GitHub Releases as `downloadURLs`, specify that the latest version (`releases/latest`) should be displayed.
- For packages from developers with a large number of packages, separate the list.
- The file to be the `target` of `integrity` is a file that is not to be edited. Files that are supposed to be edited, such as configuration files, are not specified.

### Linting

We are using [ESLint](https://eslint.org/) for linting, and the settings are based on the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html). The contents are as follows.

- ECMAScript 2020 can be used.
- Basically, use `const` / `let` to declare variables.
- Use `import` / `export` regarding modules.

### Formatting

We are using [Prettier](https://prettier.io/) as the formatter, which is automatically executed at commit time.

The settings to be applied are those written in [.editorconfig](./.editorconfig).

### For Users of Visual Studio Code

To use the above features on the editor, we recommend installing the following extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
