# Contribution

[English](./CONTRIBUTING.en.md)

AviUtl Package Managerデータへのコントリビュートに興味を持っていただきありがとうございます！！

コントリビュートの仕方についてガイドします。

## 使用言語

このデータは、JSON形式で提供されています。

使用言語:

- JSON

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

[AviUtl Package Manager](https://github.com/team-apm/apm)の`設定`タブから、データ取得先に`v3`フォルダを指定するか、追加データ取得先に編集したJSONファイルを指定して、追加したパッケージのインストールとアンインストールを試してください。

## ディレクトリ構造

`v3`下にデータJSONを配置します。

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

## コミットメッセージ規約

現状、更新履歴を出力することが無いので明確に規定していませんが、AngularのCommit Message Formatに従うとよいでしょう。

- [conventional-changelog/packages/conventional-changelog-angular/README.md](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/README.md)

## データの書き方・ルール

まずは、[仕様書](./v3/SPECIFICATION.md)を確認します。

その他、慣例的に行っていることを記します。

- パッケージは、IDでアルファベット順にソートします。
- AviUtlフォルダ内の配置は、プラグインの場合、README等に記載の開発者の指定に従います。スクリプトの場合、`script`フォルダ内で作者ごとにフォルダを分けて配置します。
- `downloadURLs`として、GitHubのReleasesを指定する場合、`releases/latest`の最新バージョンを表示するように指定します。
- パッケージ数が多い開発者のパッケージは、リストを切り分けます。
- `integrity`の`target`とするファイルは、編集しないファイルを指定します。設定ファイルなどの編集を前提としたファイルは指定しません。

### リント

リントに[ESLint](https://eslint.org/)を使用しており、[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)をベースに設定しています。内容は以下の通りです。

- ECMAScript 2020を使用できます。
- 変数の宣言には、基本的に`const` / `let`を使用します。
- モジュールに関してには、`import` / `export`を使用します。

### フォーマット

フォーマッターとして、[Prettier](https://prettier.io/)を使用しており、コミット時に自動実行されます。

適用される設定は、[.editorconfig](./.editorconfig)に書かれた内容です。

### Visual Studio Codeを利用している方へ

以上の機能をエディタ上で使うために、以下の拡張機能をインストールすることをおすすめします。

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
