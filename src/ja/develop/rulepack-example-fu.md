# 実例：SealDice のルールプラグインをルールパックに変換する

この記事では、実際の SealDice のルールプラグイン **`seal-fu.js`（ファブラウルティマ / Fabula Ultima）** を例に、それを Dice!Next の[ルールパック](/ja/develop/rulepack)に分解する手順をひととおり示し、その背後にある **仕組み** を説明します。読み終えれば、同じ方法でどんな SealDice の独自ルールも変換できるようになります。

> 元の作者：Mint Cider（[seal-fu](https://github.com/MintCider/seal-fu)、MIT）。**他人の作品を変換するときは、必ず元の作者の情報を残してください。**

---

## 1. まず見極める：SealDice のプラグインは 2 つの部分からできている

`seal-fu.js` を開くと、実は **2 種類のもの** が 1 つのファイルに混ざっていることがわかります。

| 部分 | seal-fu.js での見た目 | 本質 |
| --- | --- | --- |
| **宣言的なテンプレート** | `ruleTemplate = { name, setConfig, alias, attrConfig, nameTemplate … }`。最後に `seal.gameSystem.newTemplate(...)` で登録 | 「このルールにはどんな能力値と別名があり、既定のダイスは何面で、グループ内の名前はどんな形か」：**純粋なデータ** |
| **命令的な処理** | `commandRc / commandRi / commandBuff …` などの関数群。`seal.ext.registerCommand` で登録 | 「`.rc` をどう計算し、`.buff` で状態をどう変えるか」：**プログラム** |
| **ヘルプの文章** | `rcHelp / buffHelp …` などの文字列群 | 説明書 |

Dice!Next のルールパックは、この 3 つをちょうど **種類ごとに分けて** 置きます。

```
最终物语/
├── pack.json              ← マニフェスト（名前 / 作者 / 有効化のキー）
├── rules/最终物语.json     ← 宣言的な部分：能力値の別名 + 既定のダイス + 内蔵のコマンドの上書き
├── helpdoc/最终物语.json   ← ヘルプの説明書
└── js/seal-fu.js          ← 命令的な部分：元のプラグインをそのまま入れ、こちらの SealDice 互換のエンジンで動かす
```

> **ひとことで言う仕組み**：「データ」で表せるもの（能力値 / 別名 / 既定のダイス / ヘルプ）は `rules` と `helpdoc` に抜き出し、「プログラム」でしか表せない複雑な処理（判定の計算、状態の管理）は `js/` のプラグインにそのまま残します。

---

## 2. 4 つのファイルの書き方

### 1. `pack.json`：マニフェスト

```json
{
  "name": "最终物语",
  "version": "1.0.0",
  "author": "Mint Cider",
  "description": "ファブラウルティマ（Fabula Ultima）の TRPG ルール。例：SealDice の seal-fu.js プラグインから変換したもの。",
  "setKeys": ["fu", "最终物语"],
  "convertedFrom": "seal-fu.js (https://github.com/MintCider/seal-fu, MIT)"
}
```

- `setKeys` はプラグインの `ruleTemplate.setConfig.keys`（`["fu", "最终物语"]`）から取ります。プレイヤーは `.set fu` で有効にします。
- `author` は `ruleTemplate.authors` をそのまま残します。

### 2. `rules/最终物语.json`：宣言的な部分

プラグインの `ruleTemplate` の `alias` と `setConfig` を移し、さらに **重要な `commands.disable`** を加えます。

```json
{
  "name": "最终物语",
  "set": { "keys": ["fu", "最终物语"], "diceSides": 6 },
  "alias": {
    "敏捷骰面初始值": ["dex", "dexterity", "敏捷"],
    "力量骰面初始值": ["mig", "might", "力量"],
    "生命值": ["hp", "hit point", "hit points"],
    "物防": ["pd", "df", "defense", "物理防御"]
  },
  "commands": { "disable": ["rc", "ri", "buff", "ds"] },
  "help": { "最终物语": "ファブラウルティマのルール。.set fu で切り替え…" }
}
```

- `set.diceSides: 6` ← `setConfig.diceSides`：有効にすると、このグループの既定のダイスが 6 面に切り替わります。
- `alias` ← `ruleTemplate.alias`：**そのまま写します**。これで `.st mig=8` は自動で「力量骰面初始值」（【筋力】のダイスの初期値）として、`.st dex=10` は「敏捷骰面初始值」（【器用】のダイスの初期値）として認識されます。
- `commands.disable` ← **これが SealDice のプラグインを取り込むための重要な一歩** で、下で詳しく説明します。

### 3. `helpdoc/最终物语.json`：ヘルプ

プラグインの `rcHelp / buffHelp …` の文字列を項目にまとめると、プレイヤーは `.help rc`、`.help buff` で調べられます。

```json
{
  "mod": "最终物语速查",
  "author": "Mint Cider",
  "helpdoc": {
    "rc": "ファブラウルティマの判定：.rc <能力値1>+<能力値2>+<修正値>…",
    "buff": "ファブラウルティマの状態異常：.buff <状態> / .buff add|del …",
    "命刻": "&clk"
  }
}
```

（`"命刻": "&clk"` は「命刻」（クロック）が「clk」の別名の項目であることを表します。）

### 4. `js/seal-fu.js`：命令的な部分

`seal-fu.js` を **そのまま** `js/` に入れます。こちらの JS のサブシステムは SealDice のプラグイン API（`seal.ext.*`、`seal.vars.*`、`seal.replyToSender`、`cmdArgs.*` など）と互換なので、プラグインの `.rc / .ri / .buff / .ds / .eval / .bond / .clk` は通常どおり登録されて動きます。

---

## 3. 「本当に使える」ようにする 3 つの仕組み

ファイルを並べるだけでは足りません。SealDice のプラグインが Dice!Next で動くのは、3 つの下支えの仕組みのおかげです。

### ① 能力値の別名が `.st` / `.ra` に自動で統合される

`rules/*.json` の `alias`（とプラグインの `seal.gameSystem.newTemplate` の `alias`）は、キャラクターシートの仕組みに **自動で統合** されます。そのため、プレイヤーが `.st 力量=8`、`.st mig=8`、`.st might=8` のどれを書いても、同じ正式な能力値「力量骰面初始值」にまとめられます。プラグインは正式な名前で読むだけでよく、プレイヤーがどの書き方を使ったかを気にする必要はありません。

### ② `commands.disable`：内蔵のコマンドの上書き

ファブラウルティマの `.rc`（判定）、`.ri`（イニシアチブ）、`.buff`、`.ds` といったコマンド名には、Dice!Next の **内蔵の意味がすでにあります**（`.rc` は COC の判定、`.ds` は DND の死亡セーヴ…）。既定では **内蔵のコマンドが優先** され、プラグインの同じ名前のコマンドを遮ってしまいます。

`commands.disable: ["rc","ri","buff","ds"]` は、**このルールパックを有効にしたグループで**、これらの内蔵のコマンドに「道を譲らせる」ものです。内蔵のコマンドが黙ると、メッセージはプラグインの同じ名前のコマンドに届きます。そのため、こうしたグループでは `.rc` がファブラウルティマの判定になり、**有効にしていないグループ** では引き続き内蔵の COC の判定になり、互いに干渉しません。

> これが「グループ単位のルールの上書き」の核心です。同じ `.rc` でも、ルールの異なるグループでは意味が変わります。

### ③ `seal.vars` ↔ キャラクターシートの橋渡し

SealDice のプラグインは `seal.vars.intGet(ctx, "力量骰面")` で能力値を読みます。SealDice では、**`$` の接頭辞のない変数名 = プレイヤーのキャラクターシートの能力値**（`.st` で記録したものと同じシート）です。

Dice!Next も同じ意味を実装しています。`seal.vars` で **`$` の接頭辞のない** 名前はプレイヤーのキャラクターシートに直接つながり、**接頭辞のある** 名前はスコープに応じてプラグイン自身の保存領域を使います。

| 書き方 | 指す先 |
| --- | --- |
| `力量骰面`、`生命值`、`中毒` | **プレイヤーのキャラクターシートの能力値**（= `.st` のシート） |
| `$g…`（例：`$gfu_clocks`） | グループの変数（このグループで共有） |
| `$m…` | 個人の変数（グループをまたぐ） |
| `$t玩家` / `$t玩家_RAW` | 現在のプレイヤーのニックネーム（内蔵の一時的な変数） |

だからこそ、プレイヤーが `.st mig=8` を実行した後、プラグインの `.rc mig+ins` の判定で 【筋力】のダイス=8 を **読み取れ**、返信にプレイヤーの名前を入れられるのです。

---

## 4. 入れて試してみる

1. `最终物语/` を zip に圧縮し、管理画面の「ルール」ページでアップロードします（または `data/rulepacks/最终物语/` に直接置きます）。
2. グループの管理者が `.set 最终物语`（または `.set fu`）を送る → このグループがファブラウルティマに切り替わり、既定のダイスが d6 になります。
3. シートを記録して判定します。

```text
.st mig=8 dex=10 ins=8 wlp=6 hp=20 hpmax=20
.rc mig+ins      → 希亚 の【筋力】+【知力】の判定結果：d8+d8=[2+7]=9   HR：7
.buff 中毒       → 希亚 は毒の状態になった……
.ds 力量+1       → 希亚 の【筋力】のダイスが一時的に +1
.rc mig+mig      → 希亚 の【筋力】+【筋力】の判定結果：d8（毒、ds+1）+d8（毒、ds+1）=[4+1]=5   HR：4
.bond add 阿强 喜爱   → 希亚 は <阿强> と愛情の絆を結んだ
.clk add 末日 6 3     → 大きさ 6 のクロックを作成：末日（終末）
.help rc          → （helpdoc の判定の説明）
```

状態異常や能力値のダイスの一時的な調整は、判定にリアルタイムで反映されます。SealDice で遊ぶときと同じ感覚です。

---

## 5. 自動では変換 **されない** もの（注意）

変換するときは、次の SealDice の機能が現在 **自動では移行されない** ことを把握しておいてください。プラグイン自身の処理に任せるか、手動で対応します。

- **複雑な `attrConfig.showAs` / `nameTemplate` の式**（SealDice の rollvm の `{if …}` スクリプト）：これらは宣言的なテンプレートの中の「条件付きの計算」で、Dice!Next の `rules` は単純な算術による派生（`computed`）にしか対応していません。ファブラウルティマのグループ内の名前や `.st show` の折りたたみは、プラグインが自分で `seal.setPlayerGroupCard` を呼んで実現しているため、そのまま使えますが、`rules` を通して変換したものではありません。
- **文字列型のキャラクターシートの能力値は読み取りのみで書き込めない**：整数の能力値は `seal.vars.intGet/intSet` で **読み書き** の両方向に橋渡しされます。`.st 物防='dex+1'` のような **式の能力値** は `seal.vars.strGet` で原文を読めます（プラグインはそれをもとに連動して評価します）が、`strSet` での書き込みはプラグイン自身の変数の保存領域に入り、**キャラクターシートには書き戻されません**。
- **`seal.gameSystem` の複雑な successRank / 独自の成功度**：`alias` と単純な `defaultsComputed` は統合されますが、複雑な判定は引き続きプラグインのコードが自分で処理します。

> 簡単に言えば、**「能力値の別名 + 既定のダイス + 整数の能力値の読み書き + コマンドの上書き + ヘルプ」はすべて自動で使え、SealDice の rollvm の複雑なテンプレートの式だけは変換されません**。ただし、それらは通常プラグインのコード自身が使うものなので、使う上で支障はありません。

---

## 6. 対応の早見表

| seal-fu.js にあるもの | ルールパックでの置き場所 |
| --- | --- |
| `ruleTemplate.setConfig.keys / diceSides` | `pack.json` の `setKeys` + `rules` の `set` |
| `ruleTemplate.alias` | `rules` の `alias` |
| 内蔵と同じ名前のコマンド（rc/ri/buff/ds） | `rules` の `commands.disable` に列挙 |
| `commandRc / commandBuff …` などの関数 | `js/seal-fu.js` にそのまま残す |
| `rcHelp / buffHelp …` | `helpdoc/*.json` の項目 |
| `authors` | `pack.json` の `author`（**必ず残す**） |

この表に従えば、どんな SealDice のルールプラグインも Dice!Next のルールパックに分解できます。基本の考え方は[ルールパックの作成](/ja/develop/rulepack)を参照してください。
