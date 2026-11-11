# ソースからビルド

開発者向けに、ソースから Dice!Next のバックエンドをコンパイルし、WebUI をビルドし、ローカルのテスト用パッケージを作る方法を説明します。バックエンドは C++20（CMake + vcpkg）です。日常のローカル開発には Windows + MSVC をおすすめし、Release のワークフローは Windows、Linux、macOS のパッケージをビルドします。

## 依存関係

vcpkg の依存関係の一覧は `server/vcpkg.json` です（マニフェストモード。構成時に自動でインストール）。

```
drogon · brotli · nlohmann-json · sqlite-orm · spdlog · yaml-cpp
quickjs-ng · lua (5.4.x) · zstd
```

Brotli には CVE-2026-111497 の上流の修正を含める必要があります。プロジェクトは `server/vcpkg-configuration.json` で `server/vcpkg-overlays/brotli` を読み込み、ほかの依存関係は固定のバージョンを保ちます。クラシックモードでインストールする場合も `--overlay-ports=server/vcpkg-overlays` を渡す必要があります。CMake のセキュリティパッチの確認を回避しないでください。

::: warning 複数のリポジトリの配置：同じ親フォルダーに並べて置く
Dice!Next は複数のリポジトリに分かれており、ビルド / パッケージ作成のスクリプトは **同じ階層のフォルダー** で互いを探します。次のように配置してください。

```
作業フォルダー/
├── Dice-Next/          ← バックエンドのメインリポジトリ（server/ の CMake のプロジェクト、package.ps1）
├── Dice-Next-WebUI/    ← Web 管理パネル（Vite + React）
├── Dice-Next-Doc/      ← このドキュメントサイト（VitePress）
├── Dice-Next-Docker/   ← コンテナでのデプロイ（任意）
├── onedice-cpp-lib/    ← OneDice V1 の式のエンジン（CMake に必須）
└── dicescript-c-lib/   ← DiceScript の C99 互換のエンジン（CMake に必須）
```

`server/CMakeLists.txt` は `add_subdirectory` で同じ階層の `onedice-cpp-lib` と `dicescript-c-lib` を取り込むため、どちらかのリポジトリがないと CMake の構成がすぐに失敗します。パッケージ作成のスクリプトは、既定で同じ階層の `Dice-Next-WebUI/dist` と `Dice-Next-Doc` を探します（環境変数 `DICENEXT_WEB_ROOT` / `DICENEXT_DOC_ROOT` で別の場所も指定できます）。
:::

## Windows（推奨 / 確認済み）

### 環境の準備

```powershell
# 1. Visual Studio 2022 Build Tools で「C++ によるデスクトップ開発」にチェック
# 2. CMake >= 3.20
winget install Kitware.CMake
# 3. vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:/dev/vcpkg
cd C:/dev/vcpkg
.\bootstrap-vcpkg.bat
```

### ビルド

CMake のプロジェクトはメインリポジトリの `server/` フォルダーにあります。

```powershell
cd Dice-Next

cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release -j
```

最初の構成では vcpkg がすべての依存関係を取得してコンパイルするため、時間がかかるのは正常です。`server/build.bat` はワンクリックのスクリプトの参考です（パスはマシンに合わせて調整してください）。

### 実行

```powershell
# config/ と i18n/ を見つけられるよう、作業フォルダーは server/（またはパッケージのルート）にする
cd server
.\build\Release\dice-next-server.exe
```

起動したら `http://localhost:18088` にアクセスします。初回の実行で `config/` と `data/` フォルダーが作られます。管理用のポートは `config/server.json` の `port` で変更します。

## Linux

::: info ビルドの成功はそのプラットフォームでの実機の確認ではありません
Release の CI は Linux x64 / ARM64、macOS ARM64、Windows x64 / ARM64 をビルドし、独立した Linux / Windows のバックエンドのテストをリリースの関門にしています。ここでのビルドの成功は、すべてのアダプターを本物のアカウントで確認済みという意味ではありません。リポジトリのルートには参考用の `cross-compile*` スクリプトもあります。
:::

```bash
git clone https://github.com/Microsoft/vcpkg.git ~/vcpkg && ~/vcpkg/bootstrap-vcpkg.sh
# Dice-Next、onedice-cpp-lib、dicescript-c-lib は同じ親フォルダーに置く必要があります
cd Dice-Next
cmake -B server/build -S server \
  -DCMAKE_TOOLCHAIN_FILE=$HOME/vcpkg/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Release
cmake --build server/build -j$(nproc)
```

## フロントエンドとドキュメント

フロントエンドの管理パネルとドキュメントサイトは **独立したリポジトリ** で、それぞれ npm でビルドします。

Node.js は **26.12.1 以降の安全な 26.x** を使ってください。CI は `26.x` に従って `check-latest: true` を有効にし、ビルドの前に最低限の安全なバージョンを確認し、実際のバージョンを記録します。自動で 27 に上がることはありません。

```bash
# 管理パネル（Dice-Next-WebUI リポジトリ。ビルドの成果物 dist/ はバックエンドが配信し、パッケージ作成のスクリプトが集める）
cd Dice-Next-WebUI && npm install && npm run build   # ローカル開発なら npm run dev

# ドキュメントサイト（Dice-Next-Doc リポジトリ。リンク切れの確認を有効にしているため、変更後はローカルでビルドを通すことをおすすめします）
cd Dice-Next-Doc && npm install
npm run docs:dev      # ローカルでのプレビュー
npm run docs:build    # ビルド（リンク切れの確認を含む）
```

フロントエンドの変更では `npm test` と `npm run lint` も実行し、開発サーバーが開けたことだけで成功と判断しないでください。アプリとしてのインストールには、相対アドレスを使うマニフェストとアイコン、そしてページの遷移だけを扱い何もキャッシュしない `public/sw.js`（HTTPS / localhost の本番ビルドでのみ登録）を使います。ここに API やリソースのキャッシュを加えないでください。

## Release のキャッシュとテストの関門

- リリースの対象では `BUILD_TESTING=OFF` を明示的に設定し、テストプログラムを各プラットフォームのパッケージに含めません。Windows x64 / Linux x64 には別に `BUILD_TESTING=ON` のジョブがあり、CTest を実行してすべて通ったときだけリリースします。
- 依存関係は固定の vcpkg のベースラインに従ってインストールし、完全な Git の履歴を使ってロックされたバージョンのポートを取得します。キャッシュは ABI のバイナリパッケージだけを保存し、プラットフォーム、triplet、ランナーの環境、依存関係の系統ごとに区別して、パッケージを追加したらスナップショットを更新します。互換性の確認を無効にすることはありません。
- Windows のテストのビルドでは、制御された `/MP2` のファイル単位の並列を使い、プロジェクト単位の並列が重なってメモリが急増するのを防ぎます。ローカルでは `DICENEXT_MSVC_COMPILE_PROCESSES` で調整できます。
- 冷えたキャッシュは引き続き温める必要があるため、1 回あたりの所要時間を固定で約束することはできません。最近の beta.925 の Release のワークフローは成功しています。詳しい実装と確認は[メインリポジトリのビルドの記録](https://github.com/DiceZone/Dice-Next/blob/main/docs/ci-release-build.md)を参照してください。

### ベータ版と正式版の表示

既定のビルドはベータ版の表示を使い、画面には `beta-3.0.0(123)` と表示されます。正式版のメンテナーは CMake の構成時に `-DDICENEXT_PRERELEASE=OFF` を付けると、画面に `v3.0.0(123)` と表示されます。このオプションはセマンティックバージョンとビルド番号の数え方を変えず、GitHub Release も自動では作成しません。現在のリリースのワークフローは引き続きベータ版です。

## Windows のローカルのテスト用パッケージの作成

メインリポジトリ `Dice-Next` のルートにある `package.ps1` で、Windows のリリース用の zip をワンクリックで作成します（`release/` に出力し、ファイル名にはバージョン番号 / ビルド番号 / タイムスタンプを含みます。フロントエンドの dist とドキュメントのデータは、既定で同じ階層のリポジトリから集めます）。

```powershell
$env:DICENEXT_WEB_ROOT = "..\Dice-Next-WebUI"
$env:DICENEXT_DOC_ROOT = "..\Dice-Next-Doc"
powershell -ExecutionPolicy Bypass -File package.ps1
```

既定ではメインリポジトリの `release/` に出力します。`DICENEXT_RELEASE_ROOT` で出力先のフォルダーを指定できます。スクリプトはバックエンドのビルドの成果物と WebUI の `dist/` を確認し、どちらかが欠けていれば停止して、不完全なテスト用パッケージを作らないようにしています。

パッケージの内容：

- 起動マネージャーの `dice-next.exe`、サービスのコアの `app/dice-next-core.exe`、`lib/` にまとめた依存関係と MSVC のランタイム
- `i18n/` の言語パック
- `data/`：`decks/`、`rules/`、`helpdoc/`、`card-templates/`、`rulepacks/`、付属のサンプルの JS プラグイン
- `docs/roadmap.md`、`docs/commands.json`（ロードマップのページ / コマンド表のページのデータ）
- `web/dist` のフロントエンドの成果物

パッケージを作る前に、バックエンドのコンパイルとフロントエンドのビルドを済ませておく必要があります（どちらかが欠けているとスクリプトはエラーで終了します）。設定ファイルは **パッケージに含めません**。初回の実行時に自動で生成するため、アップグレードでユーザーの設定が上書きされることはありません。
