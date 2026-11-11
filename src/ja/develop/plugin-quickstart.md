# プラグイン開発入門

このページでは、最初の Dice!Next のプラグインを 5 分で書いて、入れて、動かすところまでを案内します。読み終えるころには、どの拡張方法を選べばよいか、完全な API をどこで調べればよいかがわかります。

## まず拡張方法を選ぶ

Dice!Next には 4 種類の拡張方法があり、「何をしたいか」で選びます。

| やりたいこと | 使うもの | コードは必要か | 参考 |
| --- | --- | --- | --- |
| キーワードの自動返信、条件による反応、カウンター | 管理パネルの「高度な返信」（因果ルール） | 不要 | [高度な返信](/ja/manage/replies) |
| カードを引く、ランダムな文章 | デッキの JSON | 不要 | [デッキとランダム](/ja/use/deck) |
| 項目の検索、ルール早見 | ヘルプ文書 / ルールパック | 不要 | [ヘルプ文書](/ja/manage/help-docs)、[ルールパックの作成](/ja/develop/rulepack) |
| **カスタムのコマンド、処理、ネットワーク、定期タスク** | **JS プラグイン（推奨）** | JavaScript | このページ + [JS プラグイン API](/ja/develop/js-plugin-api) |
| 元祖 Dice! の mod / Lua スクリプトを使い続ける | Lua mod | Lua | [Lua mod リファレンス](/ja/develop/lua-mod) |
| ルール一式（能力値、コマンド、ヘルプ、スクリプト）をまとめる | ルールパックのバンドル | 任意 | [ルールパックの作成](/ja/develop/rulepack) |

::: tip ひとことで言うと
**処理** を書くなら JS プラグイン、**内容** を配るならルールパックかデッキ、**古い mod** を移すなら Lua です。ルールパックは本質的に「入れ物」で、中に JS や Lua も入れられます。
:::

## 5 分で：最初の JS プラグイン

Dice!Next の JS プラグインは SealDice の `seal.ext` のモデルと互換で、SealDice のプラグインは通常そのまま使え、SealDice での開発の経験もほぼそのまま通用します。

### 1. コードを書く

`hello.js` を新しく作ります。

```javascript
// ==UserScript==
// @name         打招呼
// @author       希亚
// @version      1.0.0
// @description  示例插件：.hello 会回复问候
// ==/UserScript==

const ext = seal.ext.new('hello', '希亚', '1.0.0');

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'hello';
cmd.help = '.hello // ボットがあいさつする';
cmd.solve = (ctx, msg, cmdArgs) => {
  seal.replyToSender(ctx, msg, `こんにちは、${ctx.player.name}！今日もセッションを楽しみましょう。`);
  return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['hello'] = cmd;
seal.ext.register(ext);
```

先頭の `// @name` などの UserScript のコメントはプラグインのメタデータです（管理パネルに表示され、同じ名前のプラグインは `@version` が最も高いものを使います）。

### 2. 入れる

どちらの方法でも構いません。

- **管理パネル**（推奨）：「プラグイン管理」→「プラグインをアップロード」で `hello.js` を選びます。
- **手動**：ファイルを `data/plugins/js/` に置き、プラグイン管理ページで「再読み込み」をクリックします。

### 3. 動かす

管理パネルのサイドバーの「テスト台」を開いて `.hello` と入力します。QQ に接続しなくても確認できます。実際のグループで `.hello` を送っても同じ結果になります。

コードを変えたらもう一度アップロードする（または「再読み込み」をクリックする）と反映され、再起動は不要です。

## よく使う機能の早見

以下はどれもそのまま写せる完全な断片です。詳しくは [JS プラグイン API](/ja/develop/js-plugin-api) を参照してください。

**永続的なデータの読み書き**（再起動しても消えず、`data/plugins.db` に保存）：

```javascript
ext.storageSet('count', String(Number(ext.storageGet('count') || '0') + 1));
```

**プレイヤーのキャラクターシートの読み書き**（`.st` と同じシート）：

```javascript
const [hp, ok] = seal.vars.intGet(ctx, 'hp');   // $ の接頭辞なし = キャラクターシートの能力値
seal.vars.intSet(ctx, 'hp', hp - 1);
const [note] = seal.vars.strGet(ctx, '$m备注');  // $m = 個人、$g = グループ、$ = 全体の変数
```

**引数の解析**：

```javascript
cmd.solve = (ctx, msg, cmdArgs) => {
  const who = cmdArgs.getArgN(1);            // 1 番目の引数
  const rest = cmdArgs.getRestArgsFrom(2);   // 2 番目以降の残りの文章
  const at = cmdArgs.at[0];                  // メッセージで @ された人 {userId}
  // ...
};
```

**定期タスク**（毎日決まった時刻に実行）：

```javascript
seal.ext.registerTask(ext, 'daily', '08:30', () => {
  // ここで replyToSender を使うには、自分で保存した ctx/msg を使うか、グループ番号を指定して直接送る
}, 'morning', '朝のお知らせ');
```

**ネットワーク**（管理パネルの「システム設定」で外部 API のスイッチを有効にし、許可リストを設定する必要があります）：

```javascript
const resp = await fetch('https://api.example.com/data');
const data = await resp.json();
```

**プラグインに WebUI の設定項目を加える**（ユーザーがコードを変えずにパラメーターを調整できるように）：

```javascript
seal.ext.registerStringConfig(ext, 'greeting', '今日もセッションを楽しみましょう', 'あいさつの後半');
// solve の中で読み取る：
const greeting = seal.ext.getStringConfig(ext, 'greeting');
```

## コマンドではないメッセージを受け取る

プラグインを通常のチャット（`.` の接頭辞なし）に反応させたい場合は、`ext.onNotCommandReceived` を実装します。

```javascript
ext.onNotCommandReceived = (ctx, msg) => {
  if (msg.message.includes('おやすみ、ボット')) {
    seal.replyToSender(ctx, msg, 'おやすみなさい、いい夢を～');
  }
};
```

## 次のステップ

- 完全な API（`ctx`/`msg`/`cmdArgs` の各項目、すべての `seal.*` の関数、現在の制限の一覧）：[JS プラグイン API](/ja/develop/js-plugin-api)
- 古い Dice! の mod をそのまま使う、または手を加える：[Lua mod リファレンス](/ja/develop/lua-mod)
- 能力値のテンプレート、ヘルプ、スクリプトを 1 つのパックにまとめて公開する：[ルールパックの作成](/ja/develop/rulepack)
- HTTP でボットを操作する（外部のツールを作る）：[API リファレンス](/ja/develop/api)
