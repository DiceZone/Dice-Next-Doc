<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 實戰：把海豹規則插件轉成規則包

本文以一個真實的海豹（SealDice）規則插件 **`seal-fu.js`（最終物語 / Fabula Ultima）** 為例，完整演示如何把它拆成 Dice!Next 的[規則包](/zh-hant/develop/rulepack)，並講清楚背後的**原理**。讀完你就能照葫蘆畫瓢，轉化任意海豹自訂規則。

> 原作者：Mint Cider（[seal-fu](https://github.com/MintCider/seal-fu)，MIT）。**轉化他人作品務必保留原作者資訊。**

---

## 一、先看清楚：海豹插件由兩部分組成

開啟 `seal-fu.js`，會發現它其實是**兩類東西**揉在一個檔案裡：

| 部分 | 在 seal-fu.js 里長什麼樣 | 本質 |
| --- | --- | --- |
| **宣告式模板** | `ruleTemplate = { name, setConfig, alias, attrConfig, nameTemplate … }`，最後 `seal.gameSystem.newTemplate(...)` 註冊 | 「這套規則有哪些屬性、別名、預設幾面骰、名片長啥樣」——**純資料** |
| **命令式邏輯** | `commandRc / commandRi / commandBuff …` 一堆函式，`seal.ext.registerCommand` 註冊 | 「`.rc` 怎麼算、`.buff` 怎麼改狀態」——**程式** |
| **幫助文本** | `rcHelp / buffHelp …` 一堆字串 | 說明書 |

Dice!Next 的規則包恰好把這三者**分門別類**地放：

```
最终物语/
├── pack.json              ← 清单（名字 / 作者 / 激活键）
├── rules/最终物语.json     ← 声明式：属性别名 + 默认骰 + 覆盖内置指令
├── helpdoc/最终物语.json   ← 帮助说明书
└── js/seal-fu.js          ← 命令式：原插件原样放进来，跑在我们的海豹兼容引擎上
```

> **一句話原理**：能用「資料」描述的（屬性 / 別名 / 預設骰 / 幫助）抽進 `rules` 和 `helpdoc`；只能用「程式」表達的複雜邏輯（檢定演算法、狀態機）原樣留在 `js/` 插件裡。

---

## 二、四個檔案怎麼寫

### 1. `pack.json` —— 清單

```json
{
  "name": "最终物语",
  "version": "1.0.0",
  "author": "Mint Cider",
  "description": "Fabula Ultima（最终物语）TRPG 规则。示例：由海豹 seal-fu.js 插件转化而来。",
  "setKeys": ["fu", "最终物语"],
  "convertedFrom": "seal-fu.js (https://github.com/MintCider/seal-fu, MIT)"
}
```

- `setKeys` 取自插件 `ruleTemplate.setConfig.keys`（`["fu", "最终物语"]`）——玩家 `.set fu` 即啟用。
- `author` 原樣保留 `ruleTemplate.authors`。

### 2. `rules/最终物语.json` —— 宣告式部分

把插件 `ruleTemplate` 裡的 `alias`、`setConfig` 翻譯過來，再加一個**關鍵的 `commands.disable`**：

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
  "help": { "最终物语": "Fabula Ultima 规则。.set fu 切换…" }
}
```

- `set.diceSides: 6` ← `setConfig.diceSides`：啟用後本群預設切 6 面骰。
- `alias` ← `ruleTemplate.alias`：**直接照抄**。這樣 `.st mig=8` 會自動識別成「力量骰面初始值」，`.st dex=10` 識別成「敏捷骰面初始值」。
- `commands.disable` ← **這是把海豹插件接進來的關鍵一步**，下面專門講。

### 3. `helpdoc/最终物语.json` —— 幫助

把插件裡的 `rcHelp / buffHelp …` 字串收成詞條，玩家 `.help rc`、`.help buff` 即可查：

```json
{
  "mod": "最终物语速查",
  "author": "Mint Cider",
  "helpdoc": {
    "rc": "最终物语检定：.rc <属性1>+<属性2>+<修正值>…",
    "buff": "最终物语异常状态：.buff <状态> / .buff add|del …",
    "命刻": "&clk"
  }
}
```

（`"命刻": "&clk"` 表示「命刻」是「clk」的別名詞條。）

### 4. `js/seal-fu.js` —— 命令式部分

**原封不動**把 `seal-fu.js` 放進 `js/`。我們的 JS 子系統相容海豹插件 API（`seal.ext.*`、`seal.vars.*`、`seal.replyToSender`、`cmdArgs.*` 等），插件裡的 `.rc / .ri / .buff / .ds / .eval / .bond / .clk` 會照常註冊、執行。

---

## 三、三個讓它「真的能用」的機制

光把檔案擺好還不夠。海豹插件能在 Dice!Next 裡跑起來，靠的是三個底層機制：

### ① 屬性別名自動併入 `.st` / `.ra`

`rules/*.json` 的 `alias`（以及插件 `seal.gameSystem.newTemplate` 裡的 `alias`）會**自動併入**人物卡系統。於是無論玩家寫 `.st 力量=8`、`.st mig=8` 還是 `.st might=8`，都歸併到同一個規範屬性「力量骰面初始值」。插件按規範名讀取即可，不用關心玩家用了哪個寫法。

### ② `commands.disable` —— 覆蓋內建指令

最終物語的 `.rc`（檢定）、`.ri`（先攻）、`.buff`、`.ds` 這些指令名，Dice!Next **本身就有內建含義**（`.rc` 是 COC 檢定、`.ds` 是 DND 死亡豁免…）。預設情況下**內建指令優先**，會把插件的同名指令擋住。

`commands.disable: ["rc","ri","buff","ds"]` 的作用是：**在激活了本規則包的群裡**，讓這些內建指令「讓位」——內建靜默後，訊息就落到插件的同名指令上。於是這些群裡 `.rc` 走的是最終物語的檢定，而**沒啟用的群**仍是內建 COC 檢定，互不干擾。

> 這是「單群規則覆蓋」的精髓：同一個 `.rc`，在不同規則的群裡意義不同。

### ③ `seal.vars` ↔ 人物卡橋接

海豹插件用 `seal.vars.intGet(ctx, "力量骰面")` 讀屬性。在海豹裡，**無 `$` 字首的變數名 = 玩家人物卡屬性**（和 `.st` 錄入的是同一份卡）。

Dice!Next 實現了同樣的語義：`seal.vars` 裡**無 `$` 字首**的名字直達玩家人物卡，**有字首**的按作用域走插件自己的儲存：

| 寫法 | 指向 |
| --- | --- |
| `力量骰面`、`生命值`、`中毒` | **玩家人物卡屬性**（= `.st` 那份） |
| `$g…`（如 `$gfu_clocks`） | 群變數（本群共享） |
| `$m…` | 個人變數（跨群） |
| `$t玩家` / `$t玩家_RAW` | 當前玩家暱稱（內建臨時變數） |

正因如此，玩家 `.st mig=8` 之後，插件 `.rc mig+ins` 的檢定才**讀得到** 力量骰面=8，並在回覆裡帶上玩家名字。

---

## 四、裝上去試試

1. 把 `最终物语/` 壓成 zip，後臺「規則」頁上傳（或直接放進 `data/rulepacks/最终物语/`）。
2. 群管理員發 `.set 最终物语`（或 `.set fu`）→ 本群切到最終物語，預設骰變 d6。
3. 錄卡、檢定：

```text
.st mig=8 dex=10 ins=8 wlp=6 hp=20 hpmax=20
.rc mig+ins      → 希亚的力量+洞察检定结果为：d8+d8=[2+7]=9   HR：7
.buff 中毒       → 希亚进入中毒状态了……
.ds 力量+1       → 希亚力量属性骰临时+1
.rc mig+mig      → 希亚的力量+力量检定结果为：d8（中毒、ds+1）+d8（中毒、ds+1）=[4+1]=5   HR：4
.bond add 阿强 喜爱   → 希亚与<阿强>建立了喜爱羁绊
.clk add 末日 6 3     → 已创建大小为6的命刻：末日
.help rc          → （来自 helpdoc 的检定说明）
```

異常狀態、屬性骰臨時調整都會即時反映到檢定裡——和在海豹上的體驗一致。

---

## 五、哪些**不會**自動轉換（留意）

轉化時心裡要有數，下面這些海豹特性目前**不會**自動遷移，靠插件自身邏輯或留作手動：

- **複雜的 `attrConfig.showAs` / `nameTemplate` 表示式**（海豹 rollvm 的 `{if …}` 指令碼）：這些是宣告式模板裡的「帶條件的計算」，Dice!Next 的 `rules` 只支援簡單算術衍生（`computed`）。最終物語的名片、`.st show` 摺疊是靠插件自己調 `seal.setPlayerGroupCard` 實現的，照樣能用，但不是經 `rules` 翻譯來的。
- **字串型人物卡屬性只讀不寫**：整數屬性經 `seal.vars.intGet/intSet` **讀寫**雙向橋接；`.st 物防='dex+1'` 這類**表示式屬性**可用 `seal.vars.strGet` 讀到原文（插件據此聯動求值），但 `strSet` 寫入走插件自己的變數儲存，**不會寫回人物卡**。
- **`seal.gameSystem` 的複雜 successRank / 自訂成功等級**：`alias` 與簡單 `defaultsComputed` 會併入，複雜判定仍由插件碼自行處理。

> 簡單說：**「屬性別名 + 預設骰 + 整數屬性讀寫 + 指令覆蓋 + 幫助」全自動可用；只有海豹 rollvm 那一套複雜模板表示式不翻譯**——但它們通常本就由插件碼自己消費，不影響使用。

---

## 六、對照速查

| seal-fu.js 裡的 | 放進規則包的 |
| --- | --- |
| `ruleTemplate.setConfig.keys / diceSides` | `pack.json` 的 `setKeys` + `rules` 的 `set` |
| `ruleTemplate.alias` | `rules` 的 `alias` |
| 與內建同名的指令（rc/ri/buff/ds） | `rules` 的 `commands.disable` 列出來 |
| `commandRc / commandBuff …` 等函式 | 原樣留在 `js/seal-fu.js` |
| `rcHelp / buffHelp …` | `helpdoc/*.json` 詞條 |
| `authors` | `pack.json` 的 `author`（**務必保留**） |

照這張表，任何海豹規則插件都能拆成 Dice!Next 規則包。基礎概念見[規則包編寫指南](/zh-hant/develop/rulepack)。
