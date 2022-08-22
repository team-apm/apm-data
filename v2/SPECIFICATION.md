# apm-data v2 仕様書

説明にはXPathを使用しています。

- **太字の要素**: 必須要素
- _斜体の要素_: 任意要素

## [mod.xml](./data/mod.xml)

リストの更新日時ファイル

- **/mod/@version**: データバージョン（固定値: 2）
- **/mod/core**: core.xmlの更新日時
- **/mod/packages_list**: packages_list.xmlの更新日時
- **/mod/convert**: convert.jsonの更新日時
- **/mod/packages_list**: scripts.jsonの更新日時

## [core.xml](./data/core.xml)

AviUtlと拡張編集Pluginのデータファイル

- **/core/@version**: データバージョン（固定値: 2）
- **/core/{program}/latestVersion**: プログラムの最新バージョン
- **/core/{program}/files/file**: プログラムで使用されるファイルのファイル名
  - _/core/{program}/files/file/@optional_: インストール時に必要ないかどうか（デフォルト: false）
  - _/core/{program}/files/file/@installOnly_: アンインストール不可のファイルかどうか（デフォルト: false）
  - _/core/{program}/files/file/@directory_: ディレクトリかどうか（デフォルト: false）
  - _/core/{program}/files/file/@archivePath_: ファイルのアーカイブ内相対パス（デフォルト: null）
  - _/core/{program}/files/file/@obsolete_: 最新バージョンに存在しないかどうか（デフォルト: false）
- **/core/{program}/releases/release**: プログラムのリリース
  - **/core/{program}/releases/release/@version**: そのリリースのバージョン
  - **/core/{program}/releases/release/url**: リリースされたアーカイブのURL
  - _/core/{program}/releases/release/files/file_: そのバージョンにのみ含まれるファイル（**/core/{program}/files/file**を参照）
  - _/core/{program}/releases/release/archiveIntegrity_: アーカイブのハッシュ
    - _/core/{program}/releases/release/integrities/integrity_: ファイルのハッシュ
      - _/core/{program}/releases/release/integrities/integrity/@target_: 対象のファイル名

## [packages.xml](./data/packages.xml)

プラグインとスクリプトのデータファイル

- **/packages/@version**: データバージョン（固定値: 2）
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
  - _/packages/package/latestVersion/@continuous_: 最新バージョンに追従するかどうか（デフォルト:false）
- _/packages/package/installer_: インストーラーファイル名
- _/packages/package/installerArg_: インストーラーに渡される引数（`$instpath`は、インストール先フォルダに置き換えられます。）
- **/packages/package/files/file**: パッケージで使用されるファイルのファイル名
  - _/packages/package/files/file/@optional_: インストール時に必要ないかどうか（デフォルト: false）
  - _/packages/package/files/file/@installOnly_: アンインストール不可のファイルかどうか（デフォルト: false）
  - _/packages/package/files/file/@directory_: ディレクトリかどうか（デフォルト: false）
  - _/packages/package/files/file/@archivePath_: ファイルのアーカイブ内相対パス（デフォルト: null）
  - _/packages/package/files/file/@obsolete_: 最新バージョンに存在しないかどうか（デフォルト: false）
- _/packages/package/releases/release_: パッケージのリリース
  - **/packages/package/releases/release/@version**: そのリリースのバージョン
  - _/packages/package/releases/release/archiveIntegrity_: アーカイブのハッシュ
    - _/packages/package/releases/release/integrities/integrity_: ファイルのハッシュ
      - _/packages/package/releases/release/integrities/integrity/@target_: 対象のファイル名

## [scripts.json](./data/scripts.json)

スクリプト配布サイトのデータファイル

- **webpage**: スクリプト配布サイトの一覧（Object[]）
  - **webpage\[number\].url**: スクリプト配布サイトのURL（String）
  - **webpage\[number\].developer**: スクリプト配布サイトのURL（String）
  - **webpage\[number\].description**: スクリプト配布サイトの説明（String）
- **scripts**: スクリプトの判別に関する配列（後ろの情報が優先されます）（Object[]）
  - **scripts\[number\].match**: ダウンロードファイルのURLとの一致パターン（String）
  - `packages.xml`に未登録の場合
    - **scripts\[number\].folder**: ファイルを配置するフォルダ名（`script`フォルダ下）（String）
    - **scripts\[number\].developer**: スクリプトの開発者（String）
    - **scripts\[number\].dependencies**: 依存パッケージのIDの配列（String[]）
  - `packages.xml`に登録済みの場合
    - **scripts\[number\].redirect**: リダイレクトするパッケージのID（String）

## [convert.json](./data/convert.json)

ID変換の対応のファイル

- 変換前のIDをkey、変換後のIDをvalueとする。

IDの誤字や仕様変更への対応を想定しています。

変換を削除することは、基本的に禁止です。
レビュー時・マージ時には十分注意してください。
