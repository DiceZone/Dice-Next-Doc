# API リファレンス

Dice!Next のバックエンドは REST API を提供しており、管理パネルはこれをもとに作られています。このページでは現在使えるエンドポイントを機能ごとにまとめて示します。ルートが多いため、パスと用途だけを挙げます。リクエスト / レスポンスの具体的な項目は実際のバージョンに従ってください（管理パネルのネットワークのリクエストと照らし合わせられます）。

## 基本情報

| 項目 | 説明 |
|------|------|
| ベースアドレス | `http://localhost:18088`（ポートは `server.port`。Web の設定でオンラインで変更できる） |
| データ形式 | JSON、UTF-8 |
| 認証 | 管理パネルのアクセスキー（`server.api_key`）。WebUI のログインパスワードも有効にできる（Cookie のセッション。「認証」の節を参照） |

## 統一のレスポンス形式

特に記載がない限り、エンドポイントは統一の封筒を返します。

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code`：`0` は成功、`0` 以外は失敗
- `message`：メッセージ
- `data`：レスポンスのデータ（失敗時は `null` または省略）

封筒を使わないエンドポイントもわずかにあります。`/api/test/message` は結果のオブジェクトを直接返し、`/api/logs/{id}/export`、`/api/assets/{name}`、画像系のエンドポイントはファイルの内容を直接返します。

## 認証と動作の制御

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/auth/status` | ログインパスワードが有効か / 現在のセッションの状態 |
| POST | `/api/auth/login` · `/api/auth/logout` | ログイン / ログアウト（Cookie のセッション） |
| GET / PUT | `/api/system/webui-auth` | ログインパスワードの設定 |
| GET / PUT | `/api/system/server-config` | 動作する IP / ポート（変更後は再起動で有効） |
| POST | `/api/system/restart` | バックエンドを再起動 |
| GET / PUT | `/api/system/autostart` | 起動時の自動起動（Windows） |
| GET / PUT | `/api/system/update` | 自動確認の間隔、見つけたときの動作、ダウンロード元を読み取り / 保存 |
| POST | `/api/system/update/check` | 最新の GitHub Release をすぐにバックグラウンドで確認 |
| POST | `/api/system/update/download` | 現在のプラットフォームのインストーラーをダウンロードして検証 |
| POST | `/api/system/update/install` | 待機中の更新をインストールして再起動（Windows または新しい Linux/macOS のマネージャーモード） |

WebUI のセッションの Cookie は、ホストやポートで共有するのではなく、インストールごとに安定した名前を付けます。同じホストの別のインストール先に同時にログインでき、同じインスタンスはポートの変更や再起動の後も 30 日間の信頼済みのセッションを回復できます。`GET /api/auth/status` は古い `dice_session` を受け入れて移行し、`POST /api/auth/logout` は現在のインスタンスのセッションだけを取り消します。

## システムの状態と設定

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/system/status` | 動作の状態 |
| GET | `/api/system/settings` | 基本の設定（host / port / ログレベルなど） |
| GET | `/api/dashboard/stats` | ダッシュボードの統計 |
| GET / PUT | `/api/system/global` | スコープ別の設定（応答のスイッチ / 外部のリクエスト / BotMsg など） |
| GET / PUT | `/api/system/events` | イベントの方針（承認 / グループの退出 / 自動の整理など） |
| GET / PUT | `/api/system/prefixes` | コマンドの接頭辞 |
| GET / PUT | `/api/system/random-source` | ダイスの全体の乱数源。PUT のリクエストは `{ "source": "system" \| "openssl" \| "hardware" }`（CPU が RDSEED に対応しない場合は `hardware` を拒否）、既定は system、保存するとすぐに有効、変更には完全な管理権限が必要。レスポンスの data には `active`（直近のロールで実際に使った乱数源。`pseudo` のこともある）、`fallbacks`（代替の回数）、`hardware_available` も含む |
| GET / PUT / POST | `/api/system/censor` | 禁止語のルールを読み取り / まとめて保存。POST は同じサーバー側の照合器で文章を試す |
| GET / PUT | `/api/system/log-mode` | 生のイベントログのスイッチ |
| GET / PUT | `/api/system/respond-self` | 自己制御のスイッチ（ボットのアカウント自身のメッセージに応答する） |
| GET / PUT | `/api/system/logsite` | ログサイトのアップロード先（logsite_url） |
| GET / PUT | `/api/system/save-log-images` | ログの画像をディスクに保存するスイッチ |
| GET / PUT | `/api/system/nick-wrap` | ユーザー名を囲む記号 |
| GET / PUT | `/api/system/reply-segment` | 分割送信 |
| GET / PUT | `/api/system/quote-reply` | 引用の吹き出しでの返信 |
| GET / PUT | `/api/system/forward-long` | 長いメッセージのまとめての転送 |
| GET / PUT | `/api/system/auto-card` | 自動のシート表示（COC の HP/SAN/MP の自動計算） |
| GET / PUT | `/api/system/image-host` · `/api/system/image-send` | 画像のホスティング / 画像の送り方 |
| GET / PUT | `/api/system/user-group` | ユーザーグループの強制 |
| GET / PUT | `/api/system/friend-clean` | 友だち、グループ、ローカルの記録の整理。`days` / `groupDays` / `userRecordDays` / `groupRecordDays`（0–3650 日）、`groupLimit`（0–10000）、`maxGroupSize`（0–1000000）。すべての引数が検証を通った後にまとめて保存 |
| GET / PUT | `/api/system/chat-config` | チャットの永続化（保存期間など） |
| GET | `/api/roadmap` | 開発計画のデータ（`docs/roadmap.md` を読む） |
| POST | `/api/system/update/cancel` | 接続中、ダウンロード中、検証中、準備中の更新の取り消しを求める。非同期で止め、正式なインストールは取り消さない |

### BotMsg の補足

`/api/system/global` の `values.bot_msg` で、`.bot` の固定の情報の後の文章を編集します。`values.bot_header` は旧版のヘッダーとして残していますが、同じく固定の情報の後に表示されます。どちらも文字列だけを受け付け、それぞれ 65536 UTF-8 バイト以内です。空の文字列は表示しないことを表します。

GET は `scope=global|adapter|account`、`target`、`platform` で照会し、PUT は同じ名前のスコープの項目と `values` を使います。全体以外のスコープは `clear: ["bot_msg", "bot_header"]` で継承に戻せます。レスポンスの最上位の `default_locale` はバックエンドが保存している全体の既定の返信の言語で、読み取り専用です。このエンドポイントでは固定のバージョン、ビルドの情報、互換のエンジンの項目は編集できません。

### 更新のエンドポイント

更新の操作は非同期で行います。POST のエンドポイントはキューに入れてすぐに状態を 1 回返すだけなので、フロントエンドは `GET /api/system/update` を引き続きポーリングしてください。主な項目：

- `current` / `latest`：現在のバージョンと Release の一覧。`latest.asset` は現在の OS / アーキテクチャに正確に一致するインストーラーです。`current.prerelease` は今回のビルドが Beta かどうかを表します。`GET /api/system/status` も `prerelease` を返し、セマンティックバージョンだけではチャンネルを判断できません。
- `phase`：`idle`、`checking`、`available`、`connecting`、`downloading`、`verifying`、`preparing`、`cancelling`、`cancelled`、`staged`、`scheduled`（予定時刻のインストール待ち）、`downloaded`、`installing`、`error`、`up_to_date` のいずれか。
- `source`、`downloadedBytes`、`totalBytes`、`checkedAt`、`error`：今回の取得元、進み具合、時刻、エラー。
- `downloadSupported` / `installSupported` / `pending`：プログラムがダウンロードできるか、ワンクリックでインストールできるか、検証済みの待機中のパッケージがあるか。
- `cancelSupported` / `canCancel`：サーバーが取り消しに対応しているか、いま取り消しの要求を受け付けられるか。要求が成功すると通常はまず `cancelling` になり、`cancelled` をポーリングで確認したときに初めてバックグラウンドの転送が止まったことを表します。インストールを強制的に中断する機能はありません。
- `runtime.container`、`runtime.containerType`、`runtime.containerDetection`：コンテナーの判定結果、ランタイムの種類、一致したシグナル。`selfUpdateBlockedReason=container` は、コンテナー内では確認だけができ、ダウンロードやインストールはできないことを表します。
- `settings`：`autoCheck`、`intervalHours`（1–168）、`autoAction`（`notify` / `download` / `install`）、`source`（`auto` / `direct` / `mirror` / `custom`）、`customMirror`。
- `settings.scheduledInstall`：任意の真偽値で既定は `false`。`autoAction=install` のときだけインストールを予定します。`settings.installTime` の既定は `04:00` で、厳密に `HH:MM`（`00:00`–`23:59`）を使います。予定時刻のインストールを有効にするには完全なパッケージマネージャーの対応が必要です。Windows は `dice-next.exe`、新しい Linux/macOS は `start.sh` / `dice-next` です。コンテナーと直接のコアのモードでは有効にできません。
- `scheduledInstallSupported`、`scheduledInstallAt`、`pendingTag`、`timezoneMinutes`：機能の対応、有効な予定の UTC epoch 秒（予定がなければ `0`）、待機中のパッケージのバージョン、サーバーの実際のタイムゾーンのずれ。フロントエンドは対応の項目に従って設定を開放し、ずれを使って時刻を表示し、クライアントのタイムゾーンは使わないでください。

予定時刻のインストールは、ダウンロードの完了後の次の指定時刻に予定され、予定は待機中のパッケージと一緒に保存されます。予定はプログラムが自分から起こす再起動だけを制限します。`autoAction=install` でパッケージの準備ができている場合、マネージャーは **次のあらゆる起動** で更新を適用します（手動の再起動、終了後の起動、システムの再起動、デーモンによる起動を含む）。`POST /api/system/restart` もインストールと再起動を調整します。ダウンロード / 通知だけのモードでは待機中のパッケージを残し、インストールしません。

Linux/macOS のインストールの機能には、POSIX のマネージャーを含む新しいパッケージが必要で、beta.928 にはありません。バックエンドはマネージャーの親プロセス、実行ファイル、フォルダーの書き込み権限も確認します。フロントエンドは実際の `installSupported` / `scheduledInstallSupported` で判断し、OS の名前だけで開放しないでください。直接のコアのモードの通常の再起動は、元の PID、作業フォルダー、引数で再実行するもので、インストールの対応とは異なります。

時刻やタイムゾーンを変えると予定し直します。予定をオフにすると自分から起こす再起動の予定だけを取り消し、`download` / `notify` に切り替えると起動時の自動インストールの許可も取り消します。手動の `POST /api/system/update/install` ではすぐにインストールできます。`autoCheck=false` にしても既存の予定は取り消されません。バックグラウンドは毎分、自分から起こす再起動の予定を確認します。同じ待機中の Release を再確認しても、ダウンロードし直したり予定をリセットしたりしません。準備を取り消した、または中断したパッケージは、自動で予定されず、起動時のインストールの許可も得ません。許可はコアがダウンロード / 検証 / 準備を終えた後に作るもので、インストーラーに含まれる許可のファイルは信用しません。

カスタムのミラーは HTTPS のアドレスの接頭辞でなければなりません。サーバーは、`DiceZone/Dice-Next`、安全なバージョンの項目、既知のプラットフォームとアーキテクチャ、制限されたファイル名、正確なサイズ、64 桁の 16 進数の SHA-256 を持つ schema 1 の一覧だけを受け付けます。SHA-256 はダウンロードした内容が一覧と一致することだけを検証し、独立したコード署名ではありません。

ダウンロード元から 60 秒続けて新しいファイルのデータが来ないか、1 つの取得元での試行が 20 分に達すると、実際の転送を協調して取り消し、終わるのを待ってから、設定に従って取得元を切り替えます。HTTP のリクエストのタイムアウトはバックグラウンドの更新のタスクの取り消しとは異なります。重複したキューへの追加や古い状態による新しいタスクの上書きを防ぐため、クライアントは状態を照会し直してください。

コンテナーの制限はサーバーが適用し、フロントエンドのボタンには依存しません。`POST /download`、`POST /install`、`PUT` の中の自動ダウンロード / 自動インストールの方針はすべて拒否されます。既存の古い設定は、コンテナーで動作している間は `notify` として扱われます。バージョンの一覧は引き続きコンテナーの一時フォルダーに書き込まれ、通常どおり確認されます。

## 通知と監査

| メソッド | パス | 説明 |
|------|------|------|
| GET / PUT | `/api/system/notice` | 通知の設定（イベントごとのチェック、通知の窓口、SMTP / Webhook） |
| POST | `/api/system/notice/test` | テストの通知を送る |
| GET | `/api/system/audit` | 監査ログ（`data/audit/*.jsonl`） |

## アダプター

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/adapters` | 一覧 / 新規作成 |
| PUT / DELETE / PATCH | `/api/adapters/{id}` | 更新 / 削除 / 部分的な変更 |
| POST | `/api/adapters/{id}/test` | 接続のテスト |
| POST | `/api/adapters/{id}/reconnect` | 手動の再接続（待ち時間をリセット） |
| GET / POST | `/api/adapters/{id}/qq-official-actions` | QQ 公式の機能の一覧 / 制限付きの動作の呼び出し。[QQ 公式 API v2](./qq-official-api.md) を参照 |

新規作成の例：

```json
POST /api/adapters
{
  "name": "MyQQBot",
  "type": "onebot_v11",
  "connection_mode": "forward_ws",
  "endpoint": "ws://127.0.0.1:3001/",
  "access_token": "",
  "enabled": true
}
```

## ダイスのルールとロール

| メソッド | パス | 説明 |
|------|------|------|
| GET / PUT | `/api/dice/rules` | 旧版の仮のルールのスイッチで、互換のためだけに残している。ダイスのエンジンはこれらの値を読まず、WebUI にも入口はない |
| POST | `/api/dice/roll` | サーバー側のロール（デバッグ用） |

## コマンド、文章、i18n

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/commands` | コマンドの目録（分類 / 例 / 返信のキー） |
| GET | `/api/i18n/locales` | 使える言語の一覧（カスタムの言語パックを含む） |
| GET | `/api/i18n/all` | すべての文章のキー（上書きの値と原版のキーを含む） |
| PUT | `/api/templates` | 文章の上書きを設定 |
| POST | `/api/templates/preview` | 読み取り専用の文章/カードのシリアライズのプレビューで、メッセージは送らない |
| POST | `/api/templates/markdown-source` | プレーンテキストの文章を、同じ表示になる Markdown の原稿（`{value}` または `{variants}`）に変換する。結果を返すだけで保存しない |
| POST | `/api/templates/convert-markdown` | 全体またはあるペルソナ（`personaId`）のプレーンテキストの上書きをまとめて Markdown に変換。`locale` で限定できる。`dryRun: true` では `total` とエスケープが必要な `escaped` の数だけを返す |
| DELETE | `/api/templates/{locale}/{key}` | 文章をリセット |
| GET | `/api/templates/export` · POST `/api/templates/import` | 文章の上書きを書き出し / 取り込み |

コマンドの目録の返信の項目とすべての文章の項目には `presets: {traditional, standard, visual}` があり、それぞれ元の `value` と `format` を含みます。`presetStyle` は全体の表示の方式で、`default` / `defaultFormat` はその方式と一致します。プリセットには既存の上書きの値は含まれません。保存したカスタムの文章は引き続き元の全体 / ペルソナの継承のルールで有効になり、プリセットを読み込んでも表示の方式の設定は変わりません。

テンプレートには `[[action:タイトル|コマンド]]`、`[[bar:名前|現在値|上限]]` を保存できます。コマンドとペルソナのテンプレートは `[[math:TeX|プレーンテキストの代替の文字]]` にも対応し、数式の変数には `{{変数名}}`、代替の文字には通常の `{変数名}` を使います。QQ のグループ / C2C の Markdown では数式を使い、ほかのプラットフォーム、従来の方式、プレーンテキストの強制では代替の文字を使います。

プレビューのリクエスト：`{ text, format: "plain"|"markdown", platform: "qq_group"|"qq_private"|"qq_channel"|"kook"|"discord"|"plain", style: "traditional"|"standard"|"visual", forcePlain: false }`。文章は最大 64 KiB です。`data.preview` の `text`、`plain`、`markdown`、`actions`、`payload` を返します。プレーンテキストのアダプターでは payload は null で、CQ/メディアの最終的なセグメントを偽造しません。旧版の `markdown` / `onebot` の項目も残しています。

テンプレートに `{FormFeed}` の明示的な改ページがある場合は、さらに `data.preview.messages` の配列を返します。各項目は上の 5 つの項目を持ち、独立した 1 通のメッセージのプレビューを表します。先に改ページし、それぞれを Markdown / プレーンテキストに変換して payload を作ります。まとめの層の payload は null で、まとめの文章を 1 回の送信のリクエストとして扱うことはできません。連続した改ページから生まれた空のメッセージは配列に入りません。改ページだけの場合は配列は空です。明示的な改ページがなければ、元の 1 通のメッセージの構造を使います。

QQ/KOOK/Discord の文章とカードの構造は実際の送信のシリアライザーを共有しますが、これはクライアントのスクリーンショットではなく、ネットワークでのメッセージの送信、メディアのアップロード、ID の対応付け、プラットフォームの権限の判断は行いません。実際のアカウントでの送信やプラットフォームに拒否されたときの代替は別に確認する必要があります。

ネイティブの確率付きの文章（build 926 から）：テンプレートとペルソナの項目の PUT では、1 つの value の代わりに variants の配列を使い、locale、key、format もあわせて指定できます。配列の要素は {text, weight} です。重みは 0～999999 の整数で、正の重みが少なくとも 1 つ、1～256 件、本文の合計は最大 64 KiB です。書き出しは variants ですべての候補を残し、古い value の項目も 1 つの使える文章を提供します。通常の文字列と旧版の sample も残しています。

プレビューも variants に対応し、args のオブジェクト（{nick: "测试玩家", res: "1D100=42"} など）を受け付けます。候補と入れ子の sample を先に抽選してから args を置き換えるため、変数の値の中の sample は実行されません。返された data.templateVersion が 1 ならネイティブの確率付きの文章に対応していることを表し、各プレビューの項目は 1 回の抽選を共有します。

## カスタム返信と因果のルール

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/replies` | キーワードの返信の一覧 / 新規作成 |
| PUT / DELETE / PATCH | `/api/replies/{id}` | 更新 / 削除 / 有効化と無効化 |
| GET / POST | `/api/causal/rules` | 因果のルール（条件 + 動作 + カウンター）の一覧 / 新規作成 |
| PUT / DELETE | `/api/causal/rules/{id}` · POST `/api/causal/rules/{id}/toggle` | 更新 / 削除 / 有効化と無効化 |
| POST | `/api/causal/rules/test` | 因果のルールの試し実行 |
| GET | `/api/counters` · PUT / DELETE `/api/counters/{key}` | カウンターの照会、変更、削除 |
| POST | `/api/causal/cooldowns/clear` | 因果のクールダウンを消去 |

`GET /api/replies` は絞り込みなしではすべてのルールを返す古い契約を保ちます。WebUI の編集の集合は `?scope=global`、`?scope=adapter&target=onebot_v11`、`?scope=account&target=<アダプター ID>` を使います。全体には target を付けられず、局所の範囲には target が必要です。絞り込みはその範囲自身のルールを返し、継承をまとめた表示ではありません。

ルールの追加 / 変更には `channelScope`（`global` / `adapter` / `account`）と `channelTarget` を使い、古いルールは既定で全体です。実行時はメッセージのプラットフォームとアダプター ID で絞り込み、不正な範囲を全体に広げることはできません。同じ優先度ではアカウントのルールがプラットフォームと全体より優先されます。つつくの設定とキーワードのルールでは継承 / 候補の意味が異なります。[高度な返信](/ja/manage/replies#グローバル、プラットフォーム、アカウントの範囲)を参照してください。

## ボットのペルソナ

全体のランダムなペルソナのプール（build 926 から）：GET /api/personas/pool で照会し、同じパスへの PUT の本文は {pool: [{id, weight}]} です。id 0 は基本の返信を表し、ほかの ID は存在していて重複してはならず、最大 256 項目です。空でないプールには正の重みが少なくとも 1 つ必要で、重みの範囲は文章と同じです。空のプール [] で全体の単一のペルソナに戻ります。/api/personas/active の pool は全体のプールを返し、照会でランダムに抽選することはありません。グループ、個人チャット、アカウントの固定の選択が引き続き優先されます。全体で単一のペルソナを有効にするとプールは消えますが、グループで有効にしても消えません。

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/personas` | ペルソナの一覧 / 新規作成 |
| GET / PUT / DELETE | `/api/personas/{id}` | 詳細 / 更新 / 削除 |
| POST | `/api/personas/{id}/copy` · `/api/personas/{id}/activate` | コピー / 有効化 |
| GET / PUT / DELETE | `/api/personas/{id}/entries` | ペルソナの返信の文章の項目 |
| GET | `/api/personas/{id}/export` · POST `/api/personas/import` | 書き出し / 取り込み |
| GET | `/api/personas/active` | 現在有効なペルソナ |

## デッキ

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/decks` | デッキの一覧 / 操作 |
| PUT / DELETE | `/api/decks/{id}` | 記録の更新 / 削除 |
| GET / PUT | `/api/decks/file` | デッキのファイルの読み取り / 書き込み |
| DELETE | `/api/decks/file/{name}` | デッキのファイルを削除 |
| POST | `/api/decks/upload` | デッキのアップロード（.json） |
| POST | `/api/decks/reload` | デッキのフォルダーを再読み込み |
| POST | `/api/decks/copy` | 内蔵の公開された空でない単一のデッキを新しいユーザーのファイルとしてコピー |

`/api/decks/file?name=<ファイル名>&source=builtin` または `source=user` で出所を明示して読み取ります。同じ名前のユーザーのファイルがあっても、内蔵の項目の読み取りがずれないようにするためです。内蔵のファイルは読み取り専用で、サーバーも上書きと削除を拒否します。コピーのリクエストは `{"filename":"内置合集.json","entry":"項目名","targetFilename":"我的牌堆.json"}` です。コピー先はまだ存在していてはならず、元の集合と同じ名前にもできません。その項目の元の配列だけをコピーし、参照しているすべての依存や集合のメタデータは自動でコピーしません。

## ルールとルールパック

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/rules` | 読み込まれたルールシステムの一覧 |
| GET | `/api/rules/file` | ルールのファイルを読み取る |
| POST | `/api/rules/upload` · `/api/rules/delete` · `/api/rules/toggle` | ルールのファイルのアップロード / 削除 / 有効化と無効化 |
| PUT | `/api/rules/save` | ルールのファイルを保存（ルールエディター） |
| POST | `/api/rules/test` | ルールのカスタムのコマンドの試し実行 |
| GET | `/api/rulepacks` | ルールパック（bundle）の一覧 |
| POST | `/api/rulepacks/upload` · `/api/rulepacks/toggle` · `/api/rulepacks/delete` | ルールパックの zip のアップロード / 有効化と無効化 / 削除 |

## ヘルプの文書

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/help` | 統一のヘルプの照会。検索、出所の種類、具体的な出所、ページ分けに対応 |
| GET | `/api/help/groups` | 同じ条件での具体的な出所ごとの項目の数 |
| GET | `/api/help/files` | カスタムの Markdown のファイルの一覧（`data/help/*.md`） |
| GET / POST | `/api/help/file` | カスタムの Markdown のファイルを読み取り / 保存 |
| DELETE | `/api/help/file/{name}` | カスタムの Markdown のファイルを削除 |

`/api/help` の引数：`lang`、`q`、`kind`、`source`、`page`、`size`（最大 200）、`management=1`。`kind` は `custom`、`builtin`、`plugin`（JS / Lua）、`rule`、`helpdoc`、`other` から選べ、空なら制限しません。検索と出所の絞り込みはページ分けより先に行います。`/api/help/groups` は `lang`、`q`、`kind`、`management` を受け付けます。

項目には `source`、`kind`、`editable`、`customized`、`format` があります。管理のモードでは描画前の元の内容を返し、空の項目と `shadowed` の付いた同じ名前の項目も残します。内蔵と過去のカスタムの項目には `i18nKey`、`locale`、`contentLocale` もあり、編集 / 削除にはその実際の言語の `/api/templates` を使ってください。ブラウザーの言語に従って別の翻訳を上書きしないでください。出所はそれぞれ `builtin`、`custom`、`plugin:<名前>`、`lua:<名前>`、`rule:<パック>`、`file:<名前>`、`helpdoc:<パック>` です。

ルールパックに付属する文書の `source` は互換のために `helpdoc:<ルールパック>/<文書パック>` を残していますが、`kind` は `rule` です。クライアントは出所の文字列だけで推測せず、レスポンスの `kind` を優先して使ってください。

## グループ

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/groups` | グループの一覧 / 操作 |
| PUT / DELETE | `/api/groups/{platform}/{group}` | グループの記録の更新 / 削除 |
| POST | `/api/groups/{platform}/{group}/action` | グループの操作（退出 / メッセージの送信 / ログのアップロードなど） |
| GET | `/api/groups/{platform}/{group}/members` | メンバーの一覧 |
| POST | `/api/groups/{platform}/{group}/member-action` | メンバーの操作（ミュート / キック / グループ内の名前の変更など） |
| GET / POST | `/api/groups/{platform}/{group}/messages` | チャットの模擬の画面（記録の読み取り / メッセージの送信） |
| POST | `/api/groups/{platform}/{group}/poke` | つつく |
| POST | `/api/groups/{platform}/{group}/fetch-history` | 過去のメッセージの取得（NapCat） |
| GET | `/api/groups/{platform}/{group}/files` | グループのファイルの一覧 |
| GET | `/api/groups/{platform}/{group}/file-url` · `/file-download` | グループのファイルの直接リンク / 中継のダウンロード |
| POST | `/api/groups/{platform}/{group}/file-upload` | グループのファイルをアップロード |
| GET | `/api/groups/plugins` · POST `/api/groups/plugins/toggle` | グループごとのプラグインのオン・オフ |

## プレイヤーと友だち

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/players` | プレイヤーの記録の一覧 |
| PUT / DELETE | `/api/players/{platform}/{user}` | 記録の更新 / 削除 |
| GET | `/api/players/{platform}/{user}/detail` | プレイヤーの詳細（キャラクターシート / 設定 / プラグインの変数のすべて） |
| POST | `…/card-attr` · `…/card-del` | キャラクターシートの能力値の変更 / 削除 |
| POST | `…/setting` | プレイヤーの設定項目 |
| POST | `…/luavar` · `…/luacard` | Lua プラグインの変数 / カードのデータの変更と削除 |
| POST | `…/delete-friend` | 友だちを削除 |
| GET | `/api/friends` | 友だちの一覧（各アダプターをまとめる） |

## ブラックリスト・ホワイトリストとダイスマスター

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/banlist` | ブラックリスト・ホワイトリストの一覧 / 追加 |
| DELETE | `/api/banlist/{rowId}` | 外す |
| GET / PUT | `/api/banlist/whitelist-only` | ホワイトリストのモードのスイッチ |
| GET / POST | `/api/masters` · DELETE `/api/masters/{platform}/{id}` | ダイスマスターの管理 |

## 定期タスクと一斉送信

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/schedules` | 定期タスクの一覧 / 新規作成（condition / action を含む） |
| PUT / DELETE | `/api/schedules/{id}` | 更新 / 削除 |
| GET / POST / DELETE | `/api/broadcast` | 条件付きの一斉送信 |

## セッションのログ

| メソッド | パス | 説明 |
|------|------|------|
| GET / POST | `/api/logs` | 記録の一覧 / 操作 |
| DELETE | `/api/logs/{id}` | 記録を削除（キャッシュの画像も同時に整理） |
| GET | `/api/logs/{id}/export?format=txt\|csv\|html` | 書き出し（txt はログサイトにアップロードする内容と同じ、html は画像付きで単体で完結） |
| POST | `/api/logs/{id}/upload` | ログサイトにアップロード（SealDice V1 のプロトコル） |
| GET | `/api/logs/images/{file}` · `/api/chat/images/{file}` | ログ / チャットのキャッシュの画像 |

## 拡張：Lua モジュール

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/mod/lua` | モジュールの一覧（コマンドのトリガーの語を含む） |
| POST | `/api/mod/lua/upload` | アップロード（zip のフォルダー型の mod または単一の `.lua` ファイル） |
| POST | `/api/mod/lua/toggle` · `/api/mod/lua/delete` · `/api/mod/lua/reload` | 有効化と無効化 / 削除 / 再読み込み |
| POST | `/api/mods/upload` | Lua mod のアップロード（別の入口で、動作は上と同じ） |

## 拡張：JS プラグイン

| メソッド | パス | 説明 |
|------|------|------|
| GET | `/api/plugins/js` | プラグインの一覧（メタデータ / 有効の状態 / 同じ名前の重複の除去の情報） |
| POST | `/api/plugins/js/upload` · `/toggle` · `/delete` · `/reload` | アップロード / 有効化と無効化 / 削除 / 再読み込み |
| POST | `/api/plugins/js/config` | プラグインの設定項目のフォームの読み書き |
| POST | `/api/plugins/js/check-update` · `/update` | `@updateUrl` で更新を確認 / 実行 |
| GET | `/api/plugins/js/storage` · POST `/storage/clear` | プラグインの永続的な保存領域の確認 / 消去 |

## AI

| メソッド | パス | 説明 |
|------|------|------|
| GET / PUT | `/api/system/ai` | AI の設定一式（プロバイダー `providers` / モデル `models` / 用途の割り当て `usages` / 文章調整 / 翻訳 / 会話 / 記憶 / ツール / NPC / 画像の認識 / 音声 `speech`） |
| GET / POST / DELETE | `/api/system/ai/memory` | AI の記憶（要約 / 長期の事実）の確認と管理 |
| POST | `/api/system/ai/test` | モデルの接続のテスト。`{model, provider?}` で保存前の設定もテストできる。埋め込みのモデルはベクトルの次元を返す |
| GET / PUT | `/api/knowledge/settings` | ナレッジベースの設定（`dice/ai.knowledge` だけを読み書き） |
| GET | `/api/knowledge/status` | 出所ごとの項目の数、埋め込みのモデルが割り当てられているか |
| POST | `/api/knowledge/search` | 検索のテスト。`{query, settings?}`、一致した項目、関連度、FAQ の直接の回答、注入される文章を返す |
| GET / POST / DELETE | `/api/knowledge/entries` | カスタムの項目の一覧 / 追加または更新 `{entry}` / 削除 `?id=` |
| POST | `/api/knowledge/import` | まとめての取り込み `{entries: [...]}` |

## リソースとデータの移行

| メソッド | パス | 説明 |
|------|------|------|
| POST | `/api/assets/upload` · GET `/api/assets/{name}` | 画像のリソース |
| POST | `/api/legacy/import` | 原版 V2 のデータの移行（リクエストの本文は `{ "dir": "パス" }`。取り込みの前にデータベースを自動でバックアップ） |

## テストのエンドポイント

```
POST /api/test/message
{ "text": ".r 3d6", "platform": "onebot_v11", "messageType": "group",
  "nickname": "希亚", "userId": "123", "groupId": "456", "locale": "ja" }
```

このエンドポイントは「テスト台」のページのバックエンドで、`{ "reply": "...", "matched": true, "segments": [...] }` を **直接返します**（統一の封筒を使いません）。実際のメッセージと同じ完全な流れ（内蔵のコマンド → JS プラグイン → Lua モジュール → 因果のルール → カスタム返信 → AI）を通るため、プラットフォームに接続しなくても直接テストできます。任意の項目：`rawContent`（CQ コード付きで画像の認識をテスト）、`selfId` / `atList`（複数のボットのうち対象を指定）、`role` / `card`（グループ内の名前の注入）。

::: tip
以上はエンドポイントの概要です。項目の詳細は実際のバージョンに従ってください。すべての `/api/*` のリクエストにはアクセスキー（またはログイン済みの Cookie のセッション）が必要です。
:::
