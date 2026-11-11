# コントリビュート

Dice!Next に関心を持っていただきありがとうございます。このページでは参加の方法と、貢献するときに **特に注意が必要なこと** を説明します。

## 行動規範

- すべての貢献者を尊重し、建設的に議論・レビューする
- 技術に集中し、人ではなく事柄について話す

## 貢献の方法

### バグの報告

GitHub Issues で報告し、できるだけ次の情報を含めてください：バージョン番号（`.bot` で確認できます）、OS、再現手順、期待した動作と実際の動作、関連するログ。

### 機能の提案

機能の説明、使う場面、既存の機能との互換性を書いてください。コマンドに関わるものは、まず **元祖 Dice! の動作** を参考にしてください（下の注意事項を参照）。

### コードの提出

```bash
git checkout -b feature/my-feature
# コードを書く…
git commit -m "feat: 新機能の説明"
git push origin feature/my-feature
# GitHub で Pull Request を作成
```

## 開発環境

プロジェクトは複数のリポジトリに分かれているので、貢献する内容に応じて clone するリポジトリを選んでください。

| リポジトリ | 内容 |
| --- | --- |
| `Dice-Next` | バックエンドのメインリポジトリ（C++、CMake のプロジェクトは `server/`） |
| `Dice-Next-WebUI` | Web 管理パネル（Vite + React + TS） |
| `Dice-Next-Doc` | このドキュメントサイト（VitePress） |
| `Dice-Next-Docker` | コンテナでのデプロイ |
| `onedice-cpp-lib` | OneDice の式のエンジン（バックエンドのビルドに必須。メインリポジトリと同じ階層に置く） |
| `dicescript-c-lib` | DiceScript の C99 互換のエンジン（バックエンドのビルドに必須。メインリポジトリと同じ階層に置く） |

完全な手順とフォルダーの配置は[ソースからビルド](/ja/develop/build)を参照してください。簡単には次のとおりです。

```bash
# バックエンド（Dice-Next リポジトリ。2 つの式のエンジンのライブラリを同じ階層のフォルダーに置く必要があります）
cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=<vcpkg>/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release
# フロントエンド（Dice-Next-WebUI リポジトリ）
npm install && npm run build
```

## 注意事項（重要）

これらはこのプロジェクト特有の決まりごとです。**作業を始める前に必ず確認してください**。

### 1. 忠実な再現を優先し、まず元祖を確認する

Dice!Next の主な目標は、旧 Dice! のユーザーが **苦労なく移行できる** ことです。**コマンド、ルール、文面、キー** を追加・変更する前に、元祖 Dice! の実際の動作（`DiceEvent.cpp` / `GlobalVar.cpp` など）を確認し、構文や言い回しを **自分で作り出さないでください**。参考プロジェクト（SealDice / OlivaDice）とも照らし合わせられます。

### 2. 文面はすべて i18n を通し、ハードコードしない

ユーザー向けの文章はすべて i18n の仕組みで出力し、**コードに中国語を直接書かないでください**。文面のキーを追加するときは、**4 つの言語（zh-Hans / zh-Hant / en / ja）すべてに追加** してください。そうしないと言語を切り替えたときに文字が欠けます。また、`.help` のヘルプの文章の 1 行目は「説明 + コマンド」の形にそろえ、既定の返信文は **コマンドの接頭辞で始めてはいけません**（`tools/audit_i18n_texts.py` で退行を確認します）。

### 3. データベースのテーブルの構造の変更は 2 か所で行う

データベースのスキーマは 2 か所でそれぞれ宣言されており、**必ず同時に変更** してください。
- `server/src/storage/database.h` の `Storage` `decltype(make_storage(...))`
- `server/src/storage/database.cpp` の `make_storage(...)`

1 か所だけ変更すると、テンプレートのエラーが大量に出ます。新しい列は `sync_schema` が自動で ALTER し、データは失われません。

### 4. キーやトークンは絶対にコミットしない

OneBot の Access Token、API キーなどは **コミットしてはいけません**。`config/` は実行時に自動で生成されるローカルのフォルダーなので、本物のトークンを含むローカルの設定をコミットしないよう注意してください。

### 5. Windows の落とし穴

- `windows.h` の `max`/`min` のマクロは `std::max`/`std::min` と衝突します（C2589）。`(a < b ? b : a)` を使うか、`NOMINMAX` を定義してください。
- プロセスをまたぐ外部の呼び出しには `curl` を使います（drogon の非同期の DNS は Windows で問題があるため）。既存のログのアップロード / `{api:}` の実装を参考にしてください。

### 6. ドキュメントの変更はビルドを通す

ドキュメントサイトではリンク切れの確認を有効にしています。リンクを追加・変更したら、ローカルで `npm run docs:build` を実行し、通ってからコミットしてください。

### 7. フロントエンドでは必ず Web のスタイル付きコンポーネントを使い、ブラウザ標準のコントロールは使わない

プルダウン、ダイアログ、確認ダイアログなどに **ブラウザ標準のコントロールを使わず**、プロジェクトのスタイル付きコンポーネントに統一して、3 つの環境での見た目をそろえ、テーマに対応できるようにしてください。

- **プルダウン**：`@/components/ui/select` の `Select`（`SelectTrigger` / `SelectContent` / `SelectItem` / `SelectValue`）を使い、**標準の `<select>` は書かないでください**。
- **確認 / 入力のダイアログ**：`@/hooks/use-dialogs` の `useDialogs()` を使います。`await dlg.confirm({ title, description, destructive })`、`await dlg.prompt({ title, defaultValue })` として、`dlg.node` をコンポーネントのツリーに描画します。**`window.confirm` / `alert` / `prompt` は使わないでください**。
- **ダイアログ / ドロワー**：`@/components/ui/dialog` を使い、標準の `<dialog>` や裸の `position:fixed` のオーバーレイを自作しないでください。

既存の使い方を参考にしてください：プルダウンは `components/adapter/adapter-form.tsx`、ダイアログは `pages/groups-page.tsx` です。

## コミットの規約

[Conventional Commits](https://www.conventionalcommits.org/) を採用しています。

| 種類 | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグの修正 |
| `docs` | ドキュメント |
| `refactor` | リファクタリング |
| `perf` | 性能 |
| `chore` | ビルド / ツールチェーン |

## コードのスタイル

- **C++20**。インデントは空白 4 つ。型 / 関数はキャメルケース（`DiceEngine` / `rollDice`）、変数はスネークケース（`max_count`）。変更しない参照には `const` を付ける。できるだけ周りの既存のコードのスタイルに合わせてください。
- **TypeScript / React**：プロジェクトの ESLint に従い、関数コンポーネントを使い、Props には `interface` を使います。プルダウンやダイアログなどの操作には、ブラウザ標準のコントロールではなく必ず Web のスタイル付きコンポーネントを使ってください（上の注意事項の 7 を参照）。

## ライセンス

Dice!Next は **AGPLv3**（元祖 Dice! のライセンスを引き継いでいます）を採用しています。貢献を提出すると、そのライセンスで公開することに同意したものとみなします。
