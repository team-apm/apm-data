# apm-data

[![Node CI](https://github.com/team-apm/apm-data/actions/workflows/nodejs.yml/badge.svg)](https://github.com/team-apm/apm-data/actions/workflows/nodejs.yml)
[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/team-apm/apm-data/badge?style=rounded)](https://www.jsdelivr.com/package/gh/team-apm/apm-data)

[AviUtl Package Manager](https://github.com/team-apm/apm)のデータリポジトリ

## データ構造

説明にはXPathを使用しています。

- **太字の要素**: 必須要素
- _斜体の要素_: 任意要素

### [mod.xml](./data/mod.xml)

リストの更新日時ファイル

- **/mod/core**: core.xmlの更新日時
- **/mod/packages_list**: packages_list.xmlの更新日時

### [core.xml](./data/core.xml)

AviUtlと拡張編集Pluginのデータファイル

- **/core/${program}/files/file**: プログラムで使用されるファイルのファイル名
  - _/core/${program}/files/file/@optional_: インストール時に必要ないかどうか (デフォルト: false)
- **/core/${program}/latestVersion**: プログラムの最新バージョン
- **/core/${program}/releases**: プログラムのリリース
  - _/core/${program}/releases/@prefix_: `fileURL`のプレフィックス
  - **/core/${program}/releases/fileURL**: リリースされたアーカイブのURL
    - **/core/${program}/releases/fileURL/@version**: そのリリースのバージョン

### [packages_list.xml](./data/packages_list.xml)

プラグインとスクリプトのデータファイル

- **/packages/package/id**: パッケージのID（重複しない半角英数字。パッケージを表すファイル名を使用し、それが無ければ、アーカイブのファイル名を使用します。一語しかないなど、重複の可能性があれば、開発者名を前に付けます。）
- **/packages/package/name**: パッケージの名前（25字以内）
- **/packages/package/overview**: パッケージの概要（35字以内）
- **/packages/package/description**: パッケージの説明
- **/packages/package/developer**: パッケージの開発者
- _/packages/package/originalDeveloper_: 派生元パッケージの開発者
- _/packages/package/dependencies/dependency_: 依存パッケージのID
- **/packages/package/pageURL**: パッケージの紹介ページURL
- **/packages/package/downloadURL**: パッケージのダウンロードページURL
- _/packages/package/downloadMirrorURL_: パッケージのミラーダウンロードページURL
- _/packages/package/directURL_: 一括インストール機能に使用されるURL
- **/packages/package/latestVersion**: パッケージの最新バージョン
  - _/packages/package/latestVersion/@continuous_: 最新バージョンに追従するかどうか (デフォルト:false)
- _/packages/package/installer_: インストーラーファイル名
- _/packages/package/installerArg_: インストーラーに渡される引数（`$instpath`は、インストール先フォルダに置き換えられます。）
- **/packages/package/files/file**: パッケージで使用されるファイルのファイル名
  - _/packages/package/files/file/@optional_: インストール時に必要ないかどうか (デフォルト: false)
  - _/packages/package/files/file/@installOnly_: アンインストール不可のファイルかどうか (デフォルト: false)
  - _/packages/package/files/file/@directory_: ディレクトリかどうか (デフォルト: false)
  - _/packages/package/files/file/@archivePath_: ファイルのアーカイブ内相対パス (デフォルト: null)
  - _/packages/package/files/file/@obsolete_: 最新バージョンに存在しないかどうか (デフォルト: false)

## コントリビューション

[CONTRIBUTING.ja.md](./CONTRIBUTING.ja.md)をご覧ください。

## ライセンス

[CC BY-NC-SA 4.0](./LICENSE)

[![Creative Commons License](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)
](https://creativecommons.org/licenses/by-nc-sa/4.0/)

この作品は、[クリエイティブ・コモンズ 表示 - 非営利 - 継承 4.0 国際 ライセンス](https://creativecommons.org/licenses/by-nc-sa/4.0/)の下に提供されています。

## コントリビューター

[@hal-shu-sato](https://github.com/hal-shu-sato)
[@mitosagi](https://github.com/mitosagi)
[@yumetodo](https://github.com/yumetodo)
[@karoterra](https://github.com/karoterra)
