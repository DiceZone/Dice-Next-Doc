# 实战：把海豹规则插件转成规则包

本文以一个真实的海豹（SealDice）规则插件 **`seal-fu.js`（最终物语 / Fabula Ultima）** 为例，完整演示如何把它拆成 Dice!Next 的[规则包](/develop/rulepack)，并讲清楚背后的**原理**。读完你就能照葫芦画瓢，转化任意海豹自订规则。

> 原作者：Mint Cider（[seal-fu](https://github.com/MintCider/seal-fu)，MIT）。**转化他人作品务必保留原作者信息。**

---

## 一、先看清楚：海豹插件由两部分组成

打开 `seal-fu.js`，会发现它其实是**两类东西**揉在一个文件里：

| 部分 | 在 seal-fu.js 里长什么样 | 本质 |
| --- | --- | --- |
| **声明式模板** | `ruleTemplate = { name, setConfig, alias, attrConfig, nameTemplate … }`，最后 `seal.gameSystem.newTemplate(...)` 注册 | 「这套规则有哪些属性、别名、默认几面骰、名片长啥样」——**纯数据** |
| **命令式逻辑** | `commandRc / commandRi / commandBuff …` 一堆函数，`seal.ext.registerCommand` 注册 | 「`.rc` 怎么算、`.buff` 怎么改状态」——**程序** |
| **帮助文本** | `rcHelp / buffHelp …` 一堆字符串 | 说明书 |

Dice!Next 的规则包恰好把这三者**分门别类**地放：

```
最终物语/
├── pack.json              ← 清单（名字 / 作者 / 激活键）
├── rules/最终物语.json     ← 声明式：属性别名 + 默认骰 + 覆盖内置指令
├── helpdoc/最终物语.json   ← 帮助说明书
└── js/seal-fu.js          ← 命令式：原插件原样放进来，跑在我们的海豹兼容引擎上
```

> **一句话原理**：能用「数据」描述的（属性 / 别名 / 默认骰 / 帮助）抽进 `rules` 和 `helpdoc`；只能用「程序」表达的复杂逻辑（检定算法、状态机）原样留在 `js/` 插件里。

---

## 二、四个文件怎么写

### 1. `pack.json` —— 清单

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

- `setKeys` 取自插件 `ruleTemplate.setConfig.keys`（`["fu", "最终物语"]`）——玩家 `.set fu` 即激活。
- `author` 原样保留 `ruleTemplate.authors`。

### 2. `rules/最终物语.json` —— 声明式部分

把插件 `ruleTemplate` 里的 `alias`、`setConfig` 翻译过来，再加一个**关键的 `commands.disable`**：

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

- `set.diceSides: 6` ← `setConfig.diceSides`：激活后本群默认切 6 面骰。
- `alias` ← `ruleTemplate.alias`：**直接照抄**。这样 `.st mig=8` 会自动识别成「力量骰面初始值」，`.st dex=10` 识别成「敏捷骰面初始值」。
- `commands.disable` ← **这是把海豹插件接进来的关键一步**，下面专门讲。

### 3. `helpdoc/最终物语.json` —— 帮助

把插件里的 `rcHelp / buffHelp …` 字符串收成词条，玩家 `.help rc`、`.help buff` 即可查：

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

（`"命刻": "&clk"` 表示「命刻」是「clk」的别名词条。）

### 4. `js/seal-fu.js` —— 命令式部分

**原封不动**把 `seal-fu.js` 放进 `js/`。我们的 JS 子系统兼容海豹插件 API（`seal.ext.*`、`seal.vars.*`、`seal.replyToSender`、`cmdArgs.*` 等），插件里的 `.rc / .ri / .buff / .ds / .eval / .bond / .clk` 会照常注册、运行。

---

## 三、三个让它「真的能用」的机制

光把文件摆好还不够。海豹插件能在 Dice!Next 里跑起来，靠的是三个底层机制：

### ① 属性别名自动并入 `.st` / `.ra`

`rules/*.json` 的 `alias`（以及插件 `seal.gameSystem.newTemplate` 里的 `alias`）会**自动并入**人物卡系统。于是无论玩家写 `.st 力量=8`、`.st mig=8` 还是 `.st might=8`，都归并到同一个规范属性「力量骰面初始值」。插件按规范名读取即可，不用关心玩家用了哪个写法。

### ② `commands.disable` —— 覆盖内置指令

最终物语的 `.rc`（检定）、`.ri`（先攻）、`.buff`、`.ds` 这些指令名，Dice!Next **本身就有内置含义**（`.rc` 是 COC 检定、`.ds` 是 DND 死亡豁免…）。默认情况下**内置指令优先**，会把插件的同名指令挡住。

`commands.disable: ["rc","ri","buff","ds"]` 的作用是：**在激活了本规则包的群里**，让这些内置指令「让位」——内置静默后，消息就落到插件的同名指令上。于是这些群里 `.rc` 走的是最终物语的检定，而**没激活的群**仍是内置 COC 检定，互不干扰。

> 这是「单群规则覆盖」的精髓：同一个 `.rc`，在不同规则的群里意义不同。

### ③ `seal.vars` ↔ 人物卡桥接

海豹插件用 `seal.vars.intGet(ctx, "力量骰面")` 读属性。在海豹里，**无 `$` 前缀的变量名 = 玩家人物卡属性**（和 `.st` 录入的是同一份卡）。

Dice!Next 实现了同样的语义：`seal.vars` 里**无 `$` 前缀**的名字直达玩家人物卡，**有前缀**的按作用域走插件自己的存储：

| 写法 | 指向 |
| --- | --- |
| `力量骰面`、`生命值`、`中毒` | **玩家人物卡属性**（= `.st` 那份） |
| `$g…`（如 `$gfu_clocks`） | 群变量（本群共享） |
| `$m…` | 个人变量（跨群） |
| `$t玩家` / `$t玩家_RAW` | 当前玩家昵称（内置临时变量） |

正因如此，玩家 `.st mig=8` 之后，插件 `.rc mig+ins` 的检定才**读得到** 力量骰面=8，并在回复里带上玩家名字。

---

## 四、装上去试试

1. 把 `最终物语/` 压成 zip，后台「规则」页上传（或直接放进 `data/rulepacks/最终物语/`）。
2. 群管理员发 `.set 最终物语`（或 `.set fu`）→ 本群切到最终物语，默认骰变 d6。
3. 录卡、检定：

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

异常状态、属性骰临时调整都会实时反映到检定里——和在海豹上的体验一致。

---

## 五、哪些**不会**自动转换（留意）

转化时心里要有数，下面这些海豹特性目前**不会**自动迁移，靠插件自身逻辑或留作手动：

- **复杂的 `attrConfig.showAs` / `nameTemplate` 表达式**（海豹 rollvm 的 `{if …}` 脚本）：这些是声明式模板里的「带条件的计算」，Dice!Next 的 `rules` 只支持简单算术衍生（`computed`）。最终物语的名片、`.st show` 折叠是靠插件自己调 `seal.setPlayerGroupCard` 实现的，照样能用，但不是经 `rules` 翻译来的。
- **字符串型人物卡属性只读不写**：整数属性经 `seal.vars.intGet/intSet` **读写**双向桥接；`.st 物防='dex+1'` 这类**表达式属性**可用 `seal.vars.strGet` 读到原文（插件据此联动求值），但 `strSet` 写入走插件自己的变量存储，**不会写回人物卡**。
- **`seal.gameSystem` 的复杂 successRank / 自订成功等级**：`alias` 与简单 `defaultsComputed` 会并入，复杂判定仍由插件代码自行处理。

> 简单说：**「属性别名 + 默认骰 + 整数属性读写 + 指令覆盖 + 帮助」全自动可用；只有海豹 rollvm 那一套复杂模板表达式不翻译**——但它们通常本就由插件代码自己消费，不影响使用。

---

## 六、对照速查

| seal-fu.js 里的 | 放进规则包的 |
| --- | --- |
| `ruleTemplate.setConfig.keys / diceSides` | `pack.json` 的 `setKeys` + `rules` 的 `set` |
| `ruleTemplate.alias` | `rules` 的 `alias` |
| 与内置同名的指令（rc/ri/buff/ds） | `rules` 的 `commands.disable` 列出来 |
| `commandRc / commandBuff …` 等函数 | 原样留在 `js/seal-fu.js` |
| `rcHelp / buffHelp …` | `helpdoc/*.json` 词条 |
| `authors` | `pack.json` 的 `author`（**务必保留**） |

照这张表，任何海豹规则插件都能拆成 Dice!Next 规则包。基础概念见[规则包编写指南](/develop/rulepack)。
