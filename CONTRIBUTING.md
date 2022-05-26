# Contribution

[日本語](./CONTRIBUTING.ja.md)

Thank you for your interest in contributing to the data for AviUtl Package Manager!

Here is a guide on how to contribute.

## Language Used

This data has been created using XML.

The languages used are:

- XML
- XML Scheme

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

Try installing and uninstalling the added package by specifying the XML file you edited as the destination to get the additional data from the `Setting` tab of [AviUtl Package Manager](https://github.com/team-apm/apm).

## Directory Structure

Place data XML under `data` and XML Schema under `schema`.

```text
├── data
│   ├── core.xml
│   ├── mod.xml
│   └── packages_list.xml
└── schema
    ├── au.xsd
    ├── core.xsd
    ├── mod.xsd
    └── packages_list.xsd
```

## Commit Message Convention

Currently, we don't have a clear specification because we don't output the update history, but you can follow Angular's Commit Message Format.

- [conventional-changelog/packages/conventional-changelog-angular/README.md](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/README.md)

## Code Writing Style/Rules

### Formatting

We are using [Prettier](https://prettier.io/) as the formatter, which is automatically executed at commit time.

The settings to be applied are those written in [.editorconfig](./.editorconfig).
