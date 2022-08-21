# Contribution

[English](./CONTRIBUTING.md)

AviUtl Package Managerデータへのコントリビュートに興味を持っていただきありがとうございます！！

コントリビュートの仕方についてガイドします。

## 使用言語

このデータは、XML形式で提供されています。

使用言語:

- XML
- XML Scheme

## Issues

以下のIssueは、テンプレートを用意しています。日本語でも英語でも構いません。

- プラグインリクエスト (Plugin request) [日本語](https://github.com/team-apm/apm-data/issues/new?labels=plugin&template=plugin_request_ja.md) [English](https://github.com/team-apm/apm-data/issues/new?labels=plugin&template=plugin_request.md)
- スクリプトリクエスト (Script request) [日本語](https://github.com/team-apm/apm-data/issues/new?labels=script&template=script_request_ja.md) [English](https://github.com/team-apm/apm-data/issues/new?labels=script&template=script_request.md)

その他のIssueも大歓迎です。

## Pull Requests

Pull Requestも大歓迎です。

以下のようなPull Requestを受け付けています。基本的なPull Requestは、Issueを立てなくても問題ありません。

新機能や改善、修正について、疑問がある場合や、大きな新機能や変更の影響が大きい場合は、一度Issueを立てて相談してください。

- パッケージデータの追加
- データ形式の変更

Pull Requestがマージされた時点で、あなたの貢献が[Contributorsリスト](https://github.com/team-apm/apm-data/graphs/contributors)に追加され、コードの内容には[CC BY-NC-SA 4.0](./LICENSE)が適用されます。

<!--[CODE OF CONDUCT](./CODE_OF_CONDUCT.md)に反する内容を含むものは受け付けません。-->

## 修正の確認

[AviUtl Package Manager](https://github.com/team-apm/apm)の`Setting`タブから追加データ取得先に編集したXMLファイルを指定して、追加したパッケージのインストールとアンインストールを試してください。

## ディレクトリ構造

`data`下にデータXML、`schema`下にXML Schemaを配置します。

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

## コミットメッセージ規約

現状、更新履歴を出力することが無いので明確に規定していませんが、AngularのCommit Message Formatに従うとよいでしょう。

- [conventional-changelog/packages/conventional-changelog-angular/README.md](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/README.md)

## コードの書き方・ルール

### フォーマット

フォーマッターとして、[Prettier](https://prettier.io/)を使用しており、コミット時に自動実行されます。

適用される設定は、[.editorconfig](./.editorconfig)に書かれた内容です。
