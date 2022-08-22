# apm-data v3 仕様書

- **太字の要素**: 必須要素
- _斜体の要素_: 任意要素

## [list.json](./list.json)

リストの一覧と更新日時ファイル

- **core**: AviUtlと拡張編集Pluginのデータファイル（DataFileInfo）
- **convert**: ID変換の対応のファイル（DataFileInfo）
- **packages**: プラグインとスクリプトのデータファイル（DataFileInfo[]）
- **scripts**: スクリプト配布サイトのデータファイル（DataFileInfo[]）

### DataFileInfo

- **DataFileInfo.path**: データファイルの場所（`list.json`があるディレクトリからの相対パス; 該当ディレクトリ以下の階層のみ）
- **DataFileInfo.modified**: データファイルの更新日時

以下のファイル名は、apm-dataの例です。

## [core.json](./core.json)

AviUtlと拡張編集Pluginのデータファイル

- **version**: データバージョン（固定値: 3）
- **\[program\].files**: プログラムで使用されるファイルの一覧（FileInfo[]）
  - **FileInfo.filename**: プログラムで使用されるファイルのファイル名（インストール先フォルダからの相対パス）（String）
  - _FileInfo.isUninstallOnly_: インストール時に必要ないかどうか（デフォルト: false）
  - _FileInfo.isInstallOnly_: アンインストール不可のファイルかどうか（デフォルト: false）
  - _FileInfo.isDirectory_: ディレクトリかどうか（デフォルト: false）
  - _FileInfo.archivePath_: ファイルのアーカイブ内相対パス（String）
- **\[program\].latestVersion**: プログラムの最新バージョン（String）
- **\[program\].releases**: プログラムのリリース一覧（ReleaseData[]）
  - **ReleaseData.version**: そのリリースのバージョン（String）
  - **ReleaseData.url**: リリースされたアーカイブのURL（String）
  - **ReleaseData.integrity**: ハッシュの一覧（Array）
    - **ReleaseData.integrity.archive**: アーカイブファイルのハッシュ（String）
    - **ReleaseData.integrity.file**: パッケージファイルのハッシュ一覧（FileIntegrityData[]）
      - **FileIntegrityData.target**: ハッシュの該当ファイル（String）
      - **FileIntegrityData.hash**: ハッシュ（`sha384-`などから始まるString）

## [packages.json](./packages.json)

プラグインとスクリプトのデータファイル

- **version**: データバージョン（固定値: 3）
- **packages\[number\].id**: パッケージのID（重複しない半角英数字。`<開発者ID>/`に続けて、パッケージを表すファイル名を使用し、それが無ければ、アーカイブのファイル名を使用します。）（String）
- **packages\[number\].name**: パッケージの名前（25字以内）（String）
- **packages\[number\].overview**: パッケージの概要（35字以内）（String）
- **packages\[number\].description**: パッケージの説明（String）
- **packages\[number\].developer**: パッケージの開発者（String）
- _packages\[number\].originalDeveloper_: 派生元パッケージの開発者（String）
- _packages\[number\].dependencies_: 依存パッケージのID一覧（String[]）
- _packages\[number\].conflicts_: 競合するパッケージのID一覧（未実装）（String[]）
- _packages\[number\].provides_: 互換性のあるパッケージのID一覧（未実装）（String[]）
- **packages\[number\].pageURL**: パッケージの紹介ページURL（String）
- **packages\[number\].downloadURLs**: パッケージのダウンロードページURL一覧（String[]）
- _packages\[number\].directURL_: 一括インストール機能に使用されるURL（String）
- **packages\[number\].latestVersion**: パッケージの最新バージョン（String）
- _packages\[number\].@continuous_: 最新バージョンに追従するかどうか（デフォルト:false）
- _packages\[number\].installer_: インストーラーファイル名（String）
- _packages\[number\].installerArg_: インストーラーに渡される引数（`$instpath`は、インストール先フォルダに置き換えられます。）（String）
- _packages\[number\].nicommons_: ニコニ・コモンズID（String）
- _packages\[number\].isHidden_: インストールされるまで表示されないようにするかどうか（デフォルト: false）
- **packages\[number\].files**: プログラムで使用されるファイルの一覧（FileInfo[]）
  - **FileInfo.filename**: プログラムで使用されるファイルのファイル名（インストール先フォルダからの相対パス）（String）
  - _FileInfo.isUninstallOnly_: インストール時に必要ないかどうか（デフォルト: false）
  - _FileInfo.isInstallOnly_: アンインストール不可のファイルかどうか（デフォルト: false）
  - _FileInfo.isDirectory_: ディレクトリかどうか（デフォルト: false）
  - _FileInfo.archivePath_: ファイルのアーカイブ内相対パス（String）
  - _FileInfo.isObsolete_: 最新バージョンに存在しないかどうか（デフォルト: false）
- _packages\[number\].releases_: パッケージのリリース一覧（ReleaseData[]）
  - **ReleaseData.version**: そのリリースのバージョン（String）
  - **ReleaseData.integrity**: ハッシュの一覧（Array）
    - **ReleaseData.integrity.archive**: アーカイブファイルのハッシュ（String）
    - **ReleaseData.integrity.file**: パッケージファイルのハッシュ一覧（FileIntegrityData[]）
      - **FileIntegrityData.target**: ハッシュの該当ファイル（String）
      - **FileIntegrityData.hash**: ハッシュ（`sha384-`などから始まるString）

## [scripts.json](./scripts.json)

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

## [convert.json](./convert.json)

ID変換の対応のファイル

- 変換前のIDをkey、変換後のIDをvalueとする。

IDの誤字や仕様変更への対応を想定しています。

変換を削除することは、基本的に禁止です。
レビュー時・マージ時には十分注意してください。
