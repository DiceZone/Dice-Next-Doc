# JS プラグイン API

このページは Dice!Next の JS プラグインの完全な API リファレンスです。入門の例は[プラグイン開発入門](/ja/develop/plugin-quickstart)を参照してください。

Dice!Next は quickjs-ng のエンジン（モダンな ES の構文と `async/await` に対応）を組み込み、SealDice の `seal.ext` のプラグインのモデルとの互換を目標にしているため、多くの SealDice のプラグインはそのまま動きます。このページでは、SealDice との違いと、まだ実装していない仮の項目もあわせて示します。

## 実行環境と読み込みのルール

- **フォルダー**：メインのフォルダーは `data/plugins/js/` です。ルール系のプラグイン（`seal.gameSystem` を呼び出したもの）は自動で `data/mod/` に移されます。ルールパック内の `js/` フォルダーはパックと一緒に読み込まれます（グループごとの有効化の制御も受けます）。
- **包み方**：各プラグインは独立した IIFE で評価されるため、最上位の `let/const` は互いに衝突しません。バンドルされた成果物との互換のために偽の `module`/`exports` を用意していますが、`require`/`import` は **ありません**。プラグインは単一ファイルで完結している必要があります。
- **重複の除去**：メタデータの `@name`（ファイル名ではない）で重複を除きます。同じ名前のファイルが複数ある場合は `@version` が最も高いものを残し、ほかは「置き換え済み」として読み込みません。
- **無効化**：ファイル名を `*.js.disabled` に変えます（管理パネルのスイッチはこの操作です）。
- **実行のモデル**：すべてのプラグインが 1 つの JS ランタイムを共有し、**単一のスレッドで順に** 実行します。無限ループや遅い同期の処理はメッセージの処理の流れ全体を止めてしまうので、時間のかかる処理はできるだけタイマーのコールバックに入れてください。
- **読み込みのライフサイクル**：拡張を登録したときは `ext.isLoaded=false` です。すべてのスクリプトの登録が終わると、ホストがまとめて `true` にして各拡張の `ext.onLoad()` を呼ぶため、`onLoad` の中では `seal.ext.find` でほかのプラグインを安全に探せます。

### メタデータ（UserScript のヘッダー）

ファイルの最初の 40 行にある `// @key value` のコメントを解析します。

| キー | 説明 |
| --- | --- |
| `@name` | プラグイン名（重複の除去と表示の基準。ない場合はファイル名） |
| `@author` / `@version` / `@description` / `@license` | 表示用のメタデータ |
| `@homepageURL`（または `@homepage`） | ホームページのリンク |
| `@updateUrl`（または `@updateURL`） | プラグインのソースへの直接リンク。管理パネルの「更新を確認」がこのアドレスを取得して `@version` を比べ、ワンクリックで更新 |

## 拡張とコマンドの登録（seal.ext）

| API | 説明 |
| --- | --- |
| `seal.ext.new(name, author, version)` | 拡張のオブジェクト `ext`（`cmdMap`、`storageSet/storageGet` を含む）を作る |
| `seal.ext.register(ext)` | 拡張を登録する。登録後に `cmdMap` にコマンドを加えても同様に有効 |
| `seal.ext.find(name)` | 名前で登録済みの拡張を探す（プラグイン間の連携） |
| `seal.ext.newCmdItemInfo()` | コマンドのオブジェクト `cmd` を作る |
| `seal.ext.newCmdExecuteResult(solved)` | `solve` の戻り値 `{solved, showHelp:false}` を作る。`showHelp=true` のときはホストが `cmd.help` を返信に自動で付ける |

`cmd` の項目：

| 項目 | 既定 | 説明 |
| --- | --- | --- |
| `name` | `""` | コマンド名 |
| `help` | `""` | ヘルプの文章（`.help` の仕組みと管理パネルに集約される） |
| `solve(ctx, msg, cmdArgs)` | — | コマンドの処理関数。`newCmdExecuteResult(true)` を返すと処理済みを表す |
| `allowDelegate` | `false` | 互換用の項目（代理のロールには `seal.getCtxProxyFirst` を直接使う） |
| `disabledInPrivate` | `false` | 個人チャットで無効にする |
| `enableExecuteTimesParse` | `false` | `3#コマンド` の連続実行の接頭辞を解析できるようにする（回数は `cmdArgs.specialExecuteTimes`） |
| `raw` / `checkCurrentBotOn` / `checkMentionOthers` | — | 互換用の項目 |

コマンドの一致は **最初の語の完全一致** です（`.hello world` は `cmdMap['hello']` に一致）。振り分けの前に「グループごとのオン・オフ」のスイッチ（管理パネルのグループの詳細 → プラグイン）を確認し、オフにしたグループでは反応しません。

## イベントフック

正式なメッセージの主な順序は `sealdice-core` に合わせています。

```text
onMessageReceived → 内蔵のコマンドまたは cmd.solve → 非同期の処理を片付ける → onCommandReceived → 実際の送信 → onMessageSend
```

| フック | 呼ばれるとき |
| --- | --- |
| `ext.onLoad()` | すべてのスクリプトの登録が終わり、`ext.isLoaded` が `true` になった後に 1 回呼ばれる |
| `ext.onMessageReceived(ctx, msg)` | 受け取った各メッセージがコマンドの処理に入る前に呼ばれる。観察用のフックで、その後の内蔵 / プラグインのコマンドを止めない |
| `ext.onCommandReceived(ctx, msg, cmdArgs)` | コマンドの処理とその中の Promise の処理が終わった後に呼ばれる。内蔵のコマンド、JS のコマンド、解析はできたが不明なコマンドのいずれでも呼ばれる |
| `ext.onNotCommandReceived(ctx, msg)` | メッセージからコマンド、Lua / 因果 / カスタム返信が生まれなかったときに、コマンド以外の最後の受け皿として呼ばれる |
| `ext.onMessageSend(ctx, msg, flag)` | Dice!Next の最終的な返信が実際に届けられた後に呼ばれる。`msg` は送信済みのメッセージ |
| `ext.onGroupJoined(ctx, msg)` | ボット自身が通常のグループに参加した |
| `ext.onGroupMemberJoined(ctx, msg)` | 通常のメンバーがグループに参加した |
| `ext.onGuildJoined(ctx, msg)` | ボット自身が guild の識別子を持つチャンネル / サーバーに参加した |
| `ext.onBecomeFriend(ctx, msg)` | 友だちの追加が完了した |
| `ext.onMessageDeleted(ctx, msg)` | メッセージの取り消しのイベントを受け取った。`msg.rawId` は取り消されたメッセージの ID（アダプターが提供する場合） |
| `ext.onPoke(ctx, event)` | つつく。`event={groupId,senderId,targetId,isPrivate}` |
| `ext.onGroupLeave(ctx, event)` | グループのメンバーが退出した / 外された。`event={groupId,userId,operatorId}` |

登録したコマンドのオブジェクトに `solve` がない場合や、コマンドの語がどの `cmdMap` にも一致しない場合でも、解析済みのコマンドのメッセージは `onCommandReceived` に入ります。イベント系のフックが呼ばれるかどうかは、アダプターが対応する `BotEvent` を送るかどうかによります。

QQ 公式アダプターには、インタラクション、購読の認可、そのほかの公式のイベントのためのネイティブのフックもあります。シグネチャ、設定、範囲は [QQ 公式 API v2](./qq-official-api.md) を参照してください。これらは Dice!Next の拡張で、上の SealDice 形式のフックのシグネチャは変わりません。

::: warning SealDice との境界
`onMessageEdit` はまだ使えません。Dice!Next の現在の `BotEvent` の伝送層にメッセージの編集のイベントがないためです。`onCommandOverride` は `sealdice-core` 自体に JS のバインディングがないため、JS プラグインの互換の対象ではありません。
:::

## ctx / msg / cmdArgs

### ctx

| 項目 | 説明 |
| --- | --- |
| `ctx.player.userId` | 送信者の ID |
| `ctx.player.name` | 表示名（グループ内の名前を優先し、なければプラットフォームのニックネーム） |
| `ctx.player.card` | グループ内の名前 |
| `ctx.group.groupId` | グループ番号（個人チャットでは空） |
| `ctx.group.logOn` / `ctx.group.logCurName` | 現在のグループのセッションログの状態 / ログ名 |
| `ctx.isPrivate` | 個人チャットかどうか |
| `ctx.privilegeLevel` | 権限のレベル（数値が大きいほど権限が強い。ダイスマスターはグループ管理者よりはるかに上） |
| `ctx.endPoint` | ボット自身の接続先 `{platform,id,userId,nickname,state,enable}` |
| `ctx.isCurGroupBotOn` | 仮の項目で常に `true`（solve に入れたならグループはオン） |

### msg

| 項目 | 説明 |
| --- | --- |
| `msg.message` | 元のメッセージ全文（`rawContent` を優先） |
| `msg.platform` | アダプターのプラットフォームの識別子 |
| `msg.messageType` | `"group"` または `"private"` |
| `msg.groupId` | グループ番号。個人チャットでは厳密に空文字列 |
| `msg.time` | アダプターのメッセージの時刻（Unix 秒。ない場合は現在時刻） |
| `msg.sender` | `{userId, nickname, card}` |
| `msg.segment` | アダプターが提供するリッチメディアのセグメント。`segments`、OneBot の `raw.message`、`msg_elements` を優先して読み、ない場合は空の配列 |
| `msg.rawId` / `msg.guildId` / `msg.channelId` | 元のメッセージ ID、サーバー ID、チャンネル ID。アダプターが提供しない項目は空文字列 |

### cmdArgs

項目：

| 項目 | 説明 |
| --- | --- |
| `command` | コマンドの語（最初の語） |
| `args` | 引数の配列（空白で区切る） |
| `cleanArgs` / `rawArgs` | コマンドの語を除いた残りの文章 |
| `rawText` | コマンド全体の原文 |
| `at` | `[{userId}, ...]` メッセージで実際に @ された人 |
| `kwargs` | `[{name, value, valueExists}, ...]`（`--key` / `--key=value` を解析） |
| `specialExecuteTimes` | `N#コマンド` の N（1–99、既定は 1。`cmd.enableExecuteTimesParse` が必要） |
| `amIBeMentioned` / `amIBeMentionedFirst` | 現在のボットが @ されたか / 最初に @ されたのが現在のボットか。実際の `atList` から計算 |

メソッド：

| メソッド | 説明 |
| --- | --- |
| `getArgN(n)` | n 番目の引数（1 から）。範囲外なら `""` |
| `getRestArgsFrom(n)` | n 番目の引数以降の残りの文章（空白でつなぐ） |
| `isArgEqual(n, ...vals)` | n 番目の引数がいずれかの候補と等しいか |
| `chopPrefixToArgsWith(...prefixes)` | 最初の引数が接頭辞で始まれば取り除いて `true` を返す |
| `eatPrefixWith(...prefixes)` | 同上だが、取り除いた接頭辞を返す |
| `getKwarg(name)` / `getKwargs(name)` | `--key` の引数を取得。なければ `null` |

## 返信

| API | 動作 |
| --- | --- |
| `seal.replyToSender(ctx, msg, text)` | メッセージの来た場所に返信する。コマンドの処理中に何度も呼ぶと行ごとにまとめて 1 通にし、タイマーなどの非同期のコールバックで呼ぶとすぐに直接送る |
| `seal.replyGroup(ctx, msg, text)` | `replyToSender` と同じ |
| `seal.replyPerson(ctx, msg, text)` | 常に送信者へ個人チャットで直接送る（シークレットダイスの結果など） |

文章には画像のコード `[CQ:image,file=URL]`（QQ のプラットフォーム）を埋め込めます。現在、独立した「画像/音声を送る」API はありません。

`onMessageSend` が見るのは、テンプレート、文章調整 / 翻訳を経て実際に届けられた最終的な返信です。フック、タイマー、イベントのコールバックで返信の API を呼んで直接送ったメッセージが、再帰的に `onMessageSend` を再び呼ぶことはなく、プラグインが際限のないメッセージのループを作らないようにしています。

## 変数とキャラクターシート（seal.vars）

| API | 説明 |
| --- | --- |
| `seal.vars.intGet(ctx, name)` → `[value, ok]` | 整数の変数を読む |
| `seal.vars.intSet(ctx, name, value)` | 整数の変数を書く |
| `seal.vars.strGet(ctx, name)` → `[value, ok]` | 文字列の変数を読む |
| `seal.vars.strSet(ctx, name, value)` | 文字列の変数を書く |

変数名の接頭辞で所属が決まります。

| 接頭辞 | スコープ | 保存先 |
| --- | --- | --- |
| `$m名前` | 現在のユーザー個人 | プラグインの KV のデータベース（プラグイン間で共有） |
| `$g名前` | 現在のグループ | 同上 |
| `$名前` | 全体 | 同上 |
| **接頭辞なし** | **キャラクターシートの能力値** | `.st` と同じシート |

接頭辞のない名前はキャラクターシートに直接つながります。これが SealDice の `gameSystem` のルールプラグインで `.st` のシートを読み書きできる理由です。`strGet` では「式の能力値」の原文（`.st 物防='dex+1'` で保存した式など）も読めます。特例として、`$t玩家` は `ctx.player.name` を返します。

`seal.format(ctx, s)` / `seal.formatTmpl`：文字列をテンプレートとして評価します。`{$変数}` は変数を調べ、`{ダイスの式}` はダイスのエンジンで処理します（`{1d100}` など）。

## 好感度の仕組み（seal.favor）

これらの API は、内蔵の `.favor` / `好感` のコマンドと同じ `player_profiles.favor` を直接読み書きし、プラグイン専用のコピーは作りません。プラットフォームは `ctx.endPoint.platform` から自動で取り、`userId` を省略すると `ctx.player.userId` を対象にします。

| API | 戻り値 | 説明 |
| --- | --- | --- |
| `seal.favor.get(ctx, userId?)` | `number` または `null` | 現在の好感度を読む。記録がまだない場合は `0`。 |
| `seal.favor.set(ctx, value, userId?)` | `number` または `null` | 好感度を上書きし、書き込んだ後の値を返す。 |
| `seal.favor.add(ctx, delta, userId?)` | `number` または `null` | 好感度を増減し、変更後の値を返す。 |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` または `null` | `.favor grow` と同じ確率による成長を行う。成長しなかったときは `success=false`、`delta=0`。 |

```javascript
const before = seal.favor.get(ctx);
const after = seal.favor.add(ctx, 5);
const growth = seal.favor.grow(ctx);
seal.replyToSender(ctx, msg,
  `好感度：${before} → ${after}\n成長：${growth.success ? `+${growth.delta}` : '成長なし'}`);
```

サードパーティのプラットフォームのユーザー ID を渡すときは、そのプラットフォームの元の文字列の ID を使う必要があり、すべてのアカウントが数字の QQ だとは考えないでください。対象の `userId` やコンテキストのプラットフォームがない場合は `null` を返し、何も書き込みません。

## プラグインの保存領域（ext.storage）

```javascript
ext.storageSet('key', '値は文字列である必要がある');   // オブジェクトは JSON.stringify する
const v = ext.storageGet('key');          // 値がなければ undefined を返す
```

データは `data/plugins.db` に永続的に保存され、プラグイン名ごとに分かれています。管理パネルの「プラグイン管理」で各プラグインの保存領域を確認、出力、消去できます。プレイヤー管理のページでも `$m` の変数を確認できます。

## 設定項目（WebUI での視覚的な編集）

登録すると、ユーザーは管理パネルのプラグインの詳細で直接編集でき、コードを変える必要はありません。

| API | フォームの形 |
| --- | --- |
| `seal.ext.registerStringConfig(ext, key, default, desc?)` | テキストボックス |
| `seal.ext.registerIntConfig / registerFloatConfig(ext, key, default, desc?)` | 数値のボックス |
| `seal.ext.registerBoolConfig(ext, key, default, desc?)` | スイッチ |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | 複数行のテンプレート（配列） |
| `seal.ext.registerOptionConfig(ext, key, default, options, desc?)` | プルダウン |

読み取り：`getStringConfig` / `getIntConfig` / `getFloatConfig` / `getBoolConfig` / `getTemplateConfig`（配列を返す）/ `getOptionConfig`。まとめて扱う `newConfigItem` + `registerConfig`（SealDice の書き方と互換）もあります。

## タイマー

| API | 説明 |
| --- | --- |
| `setTimeout(fn, ms)` / `clearTimeout(id)` | 本物のタイマー（メッセージで起動する偽のタイマーではない） |
| `setInterval(fn, ms)` / `clearInterval(id)` | 間隔の下限は 200ms、有効なタイマーは最大 256 個 |
| `seal.ext.registerTask(ext, 'daily', 'HH:MM', fn, key?, desc?)` | 毎日決まった時刻のタスク。`taskType='cron'` は毎日に相当する `M H * * *` の式だけに対応 |

タイマーのコールバックの中の `replyToSender` はすぐに直接送ります。毎週 / 任意の cron にはまだ対応していません。

## ネットワーク（fetch）

```javascript
const resp = await fetch(url, { method: 'POST', headers: {...}, body: {...} });
// resp.ok / resp.status / await resp.text() / await resp.json()
```

安全のための関門があります。管理パネルの「システム設定」で **外部 API のスイッチ** を有効にし、対象のドメインを許可リストに加える必要があり、そうしないとリクエストは拒否されます（Promise が reject されます）。`body` にオブジェクトを渡すと自動で JSON にシリアライズします。グローバル関数の `btoa`/`atob` もあります。

::: warning 同期の実装
`fetch` の内部は同期でブロックするため、遅い API はメッセージの処理を止めてしまいます。時間に敏感でないリクエストはタイマーのコールバックに入れる方が安全です。
:::

## グループ管理とリスト

| API | 説明 |
| --- | --- |
| `seal.memberBan(ctx, groupId, userId, duration)` | ミュート（秒） |
| `seal.memberKick(ctx, groupId, userId)` | キック |
| `seal.setPlayerGroupCard(ctx, template)` | 送信者のグループ内の名前を設定 |
| `seal.ban.addBan(ctx, id, place, reason)` | ブラックリストに追加（ボットのブラックリスト・ホワイトリストの仕組みにつながる） |
| `seal.ban.addTrust(ctx, id, place, reason)` | ホワイトリストに追加 |
| `seal.ban.remove(ctx, id)` | リストから外す |
| `seal.ban.getList()` / `seal.ban.getUser(id)` | リストを照会 |

## 代理のロール

```javascript
const mctx = seal.getCtxProxyFirst(ctx, cmdArgs) || ctx;  // @ した相手がいればその人として扱う
```

`getCtxProxyFirst` / `getCtxProxyAtPos(ctx, cmdArgs, pos)` は、メッセージで pos 番目に @ された人から代理の ctx を作ります。その後の `seal.vars` でのキャラクターシートの読み書きは、@ された人のシートを指します。

## デッキとダイス

| API | 説明 |
| --- | --- |
| `seal.deck.draw(ctx, name, isShuffle)` | デッキから引き、`{exists, err, result}` を返す |
| `seal.format(ctx, '{1d100}')` | テンプレートの評価を借りて本物のダイスのエンジンで振る |

## ルールのテンプレート（gameSystem）

`seal.gameSystem.newTemplate(jsonStr)` / `newTemplateByYaml(yamlStr)`：ルールのテンプレート一式（能力値の別名、派生する能力値など）を登録し、内蔵の `.st`/`.ra` に接続します。これを呼んだプラグインは「ルール系」とみなされ、自動で `data/mod/` に移されてルール管理のページに表示されます。実践のチュートリアル：[SealDice のルールプラグインの変換](/ja/develop/rulepack-example-fu)。

`seal.coc.registerRule` は現在プラグインをルール系として印を付けるだけで、**独自の判定が `.ra` のコアを実際に置き換えることはありません**。

## そのほかのグローバル

| API | 説明 |
| --- | --- |
| `console.log/info/warn/error/debug/trace(...)` | `[插件]`（プラグイン）のログに実際のスクリプトの出所付きで書き込む。log/info=INFO、warn=WARN、error=ERROR、debug=DEBUG、trace=TRACE |
| `seal.getVersion()` | `{version, versionSimple, versionCode, ...}` |
| `seal.getEndPoints()` | 仮の項目で常に空の配列 |

## JS API の完全な一覧とシグネチャ

以下は現在のランタイムが公開している API の完全な一覧です。「互換用の仮の項目」と書いたものは安全に呼び出せますが、SealDice 本来の完全な動作はありません。実装済みの機能とは考えないでください。

### `seal.ext`、拡張と設定

| API | 引数 / 戻り値 | 状態と説明 |
| --- | --- | --- |
| `seal.ext.new(name, author, version)` | `ext` | 拡張のオブジェクトを作る。`name`、`author`、`version`、`cmdMap`、`storageGet/Set` を含む。 |
| `seal.ext.register(ext)` | — | 拡張を登録する。 |
| `seal.ext.find(name)` | `ext` または `null` | 登録済みの拡張を探す。 |
| `seal.ext.newCmdItemInfo()` | `cmd` | コマンドのオブジェクトを作る。 |
| `seal.ext.newCmdExecuteResult(solved?)` | `{solved, showHelp}` | solve の標準の戻り値。 |
| `seal.ext.registerTask(ext, type, value, fn, key?, desc?, group?)` | — | `daily` + `HH:MM`、または毎日に相当する `cron`：`M H * * *`。key/desc/group は現在互換用の引数のみ。 |
| `seal.ext.newConfigItem(key?, defaultValue?, desc?)` | ConfigItem | まとめて設定する入口。オブジェクトの項目は `key`、`defaultValue`、`type`、`description`。 |
| `seal.ext.registerConfig(ext, ...items)` | — | ConfigItem をまとめて登録する。 |
| `seal.ext.getConfig(ext, key)` | `{key, value}` | 設定のオブジェクトを返す。値は `.value` で読む。 |
| `seal.ext.registerStringConfig / registerIntConfig / registerFloatConfig / registerBoolConfig(ext, key, defaultValue, desc?)` | — | 対応する型の設定を登録する。 |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | — | 文字列の配列のテンプレートの設定を登録する。 |
| `seal.ext.registerOptionConfig(ext, key, defaultValue, options, desc?)` | — | プルダウンの設定を登録する。options は配列。 |
| `seal.ext.getStringConfig / getIntConfig / getFloatConfig / getBoolConfig / getTemplateConfig / getOptionConfig(ext, key)` | 値 | それぞれ string / number / number / boolean / string[] / string を返す。 |
| `seal.ext.unregisterConfig(ext)` | `0` | **互換用の仮の項目**。現在は登録済みの設定を削除しない。 |

### メッセージ、コンテキスト、返信

| API | 引数 / 戻り値 | 説明 |
| --- | --- | --- |
| `seal.replyToSender(ctx, msg, text)` | — | 元のメッセージのチャットに返す。 |
| `seal.replyGroup(ctx, msg, text)` | — | 現在は `replyToSender` と同じ動作。 |
| `seal.replyPerson(ctx, msg, text)` | — | 常に送信者へ個人チャットで送る。一時的な msg に sender がない場合は `ctx.player.userId` を使う。 |
| `seal.newMessage()` | `{}` | 空のメッセージのオブジェクトを作る。必要に応じて `platform`、`messageType`、`groupId`、`sender` を補えば返信の API と一緒に使える。 |
| `seal.createTempCtx()` | `{player:{userId,name}, group:{groupId}}` | 最小限のコンテキストを作る。userId / groupId は自分で補う必要がある。 |
| `seal.getCtxProxyFirst(ctx, msgOrArgs)` | `ctx` | @ の対象がいれば、最初の対象を `ctx.player` にした代理を返す。いなければ元の ctx を返す。 |
| `seal.getCtxProxyAtPos(ctx, msgOrArgs, pos)` | `ctx` | 同上。pos は 0 から。 |
| `seal.setPlayerGroupCard(ctx, template)` | — | 現在の送信者のグループ内の名前を設定する。プラットフォームの機能と十分な権限が必要。 |
| `seal.applyPlayerGroupCardByTemplate(ctx, template)` | `0` | **互換用の仮の項目**。現在は設定を行わない。 |
| `seal.memberBan(ctx, groupId, userId, durationSec?)` | — | ミュート。プラットフォームが対応していない場合や権限が足りない場合は効果がない。 |
| `seal.memberKick(ctx, groupId, userId)` | — | キック。プラットフォームが対応していない場合や権限が足りない場合は効果がない。 |

`ctx.player` の公開の項目は `userId`、`name`、`card`、`ctx.group` は `groupId`、`logOn`、`logCurName` です。`msg.sender` は `userId`、`nickname`、`card` です。プラットフォームをまたぐ ID はすべて文字列で、QQ の数字だとは考えないでください。

### 変数、キャラクターシート、デッキ、ルール

| API | 引数 / 戻り値 | 説明 |
| --- | --- | --- |
| `seal.setVarInt(ctx, name, value)` / `seal.vars.intSet(...)` | — | 整数の変数を書く。`$` の接頭辞がなければ現在のキャラクターシートの能力値を書く。 |
| `seal.setVarStr(ctx, name, value)` / `seal.vars.strSet(...)` | — | 文字列の変数を書く。`$` の接頭辞がなければキャラクターシートの文章/式の能力値を書く。 |
| `seal.vars.intGet(ctx, name)` | `[number, ok]` | 整数の変数またはキャラクターシートの数値を読む。 |
| `seal.vars.strGet(ctx, name)` | `[string, ok]` | 文字列の変数、キャラクターシートの式の能力値を読む。`$t玩家` / `$t玩家_RAW` は表示名を返す。 |
| `seal.vars.computedGet / computedSet(ctx, name, value?)` | `strGet/strSet` と同じ | **互換のための近似**：現在は文字列の読み書きと同じで、完全な RollVM の計算は行わない。 |
| `seal.format(ctx, text)` / `seal.formatTmpl(ctx, text)` | string | `{$変数}` を評価し、`{1d100}` などのダイスの式は本物のダイスのエンジンで処理する。 |
| `seal.favor.get(ctx, userId?)` | number / `null` | 内蔵の好感度を読む。 |
| `seal.favor.set(ctx, value, userId?)` | number / `null` | 内蔵の好感度を上書きし、新しい値を返す。 |
| `seal.favor.add(ctx, delta, userId?)` | number / `null` | 内蔵の好感度を増減し、新しい値を返す。 |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` / `null` | 内蔵の好感度の成長のルールで判定して書き戻す。 |
| `seal.deck.draw(ctx, name, shuffle?)` | `{exists, err, result}` | 公開のデッキから引く。shuffle の引数は現在互換のために残している。 |
| `seal.deck.reload()` | `0` | **互換用の仮の項目**。デッキは管理パネルまたはファイルから再読み込みする。 |
| `seal.gameSystem.newTemplate(jsonText)` / `newTemplateByYaml(yamlText)` | `{}` | ルール系のプラグインとして印を付け、能力値のテンプレートを `.st/.ra` 用に登録する。 |
| `seal.coc.newRule()` / `newRuleCheckResult()` | `{}` | **互換用の仮の項目**。空のオブジェクトを返すだけ。 |
| `seal.coc.registerRule(rule)` | `0` | ルール系のプラグインとして印を付ける。内蔵の `.ra` の判定のコアは置き換えない。 |

### リスト、ツール、標準のグローバル

| API | 引数 / 戻り値 | 説明 |
| --- | --- | --- |
| `seal.ban.addBan(ctx, id, place?, reason?)` | — | ブラックリストに加える。place は現在互換用の引数のみ。 |
| `seal.ban.addTrust(ctx, id, place?, reason?)` | — | 信頼 / ホワイトリストに加える。 |
| `seal.ban.remove(ctx, id)` | — | リストから外す。 |
| `seal.ban.getList()` | array | すべてのリストの記録を返す。 |
| `seal.ban.getUser(id)` | object または `null` | 1 件のリストの記録を返す。 |
| `seal.getVersion()` | object | `version`、`versionSimple`、`versionCode`、`versionDetail` を返す。 |
| `seal.getEndPoints()` | `[]` | **互換用の仮の項目**。現在は接続先を一覧にしない。 |
| `setTimeout(fn, ms)` / `setInterval(fn, ms)` | timerId | 本物のタイマー。間隔は最小 200ms、有効なタイマーは最大 256 個。 |
| `clearTimeout(id)` / `clearInterval(id)` | — | タイマーを取り消す。 |
| `fetch(url, options?)` | `Promise<Response>` | Response には `ok`、`status`、`statusText`、非同期の `text()` / `json()` がある。内部のリクエストは引き続き同期でブロックする。 |
| `btoa(text)` / `atob(text)` | string | Base64 のエンコードとデコード。`atob` は `data:*;base64,` の接頭辞を受け付ける。 |
| `console.log/info/warn/error/debug/trace(...values)` | — | 対応するレベルで動作ログに書き込む。既定の INFO では DEBUG/TRACE を表示しない。タイマーや非同期の続きの処理でも出所を保つ。 |

## 最小限の動く例：グループ内の名前とキャラクターシートを読む

```javascript
const ext = seal.ext.new('api-example', 'Dice!Next', '1.0.0');
const cmd = seal.ext.newCmdItemInfo();
cmd.name = '卡片示例';
cmd.help = 'グループ内の名前と目星の値を読む';
cmd.solve = (ctx, msg) => {
  const card = ctx.player.card || 'グループ内の名前は未設定';
  const [spot, exists] = seal.vars.intGet(ctx, '侦查');
  seal.replyToSender(ctx, msg, `${ctx.player.name}（${card}）\n目星：${exists ? spot : '未記録'}`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['卡片示例'] = cmd;
seal.ext.register(ext);
```

## 現在の制限の一覧

プラグインを書く前に知っておきたい境界です（これが私たちの改善の道筋でもあります）。

1. `onMessageEdit` はまだ使えません。ほかのプラットフォームのイベントも、アダプターが対応する `BotEvent` を送ったときだけ呼ばれます。
2. `msg.segment` はアダプターのネイティブのセグメントで、プラットフォームをまたいで統一された構造ではありません。送られなければ空で、専用の画像の送信の API もありません（`[CQ:image]` のコードは送れます）。
3. `require`/`import` とファイルシステムの API はなく、プラグインは単一ファイルで完結している必要があります。
4. 単一のスレッドで順に実行し、タイムアウトやリソースの割り当て量はありません。無限ループや遅い同期の処理は避けてください。
5. `registerTask` は毎日のタスクにだけ対応しています。`seal.coc` の独自の判定や `seal.getEndPoints` などはまだ仮の項目です。
6. `fetch` は外部 API のスイッチと許可リストの関門を受けます（これは意図的な安全の設計で、バグではありません）。
