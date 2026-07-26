# 规则包编写指南

规则包（Rule Pack）是 Dice!Next 把**规则、帮助文档、插件**打包成一个**可整体安装 / 启停 / 删除**的单元。骰主在后台上传一个 zip，玩家在群里用 `.set` 激活，整套规则就在这个群生效。

> 一句话：**一个 zip = 一个文件夹 + 一份 `pack.json` 清单 + 按目录摆放的资源**。约定优于配置——你只要把文件放进对应子目录，系统自动发现，不用手写文件清单。

---

## 一、目录结构

```
我的规则包/
├── pack.json          ← 必需：包的元数据（名字 / 版本 / 作者 / 激活键）
├── rules/             ← 规则文件（属性别名 / 默认骰 / 自定义指令 / 帮助）
│   └── xxx.json
├── helpdoc/           ← 帮助速查（词条→内容，可被 .help 查询）
│   └── xxx.json
├── lua/               ← Lua 插件（原版 Dice! mod，目录或单文件）
│   ├── 某模块/
│   └── 某单文件.lua
└── js/                ← JS 插件（兼容海豹 SealDice）
    └── 某插件.js
```

所有子目录都是**可选**的——你可以只放 `rules/`（纯声明式规则），也可以只放 `lua/`（纯插件规则），或任意组合。把整个文件夹打成 **zip** 即可分发。

::: tip 整体装卸
删除/停用一个包 = 删除/改名这个文件夹（后台一键完成）。包内所有资源随之注册或注销，不会有残留。
:::

---

## 二、`pack.json`（清单）

只放元数据，**不用**逐个列出文件：

```json
{
  "name": "我的克苏鲁扩展",
  "version": "1.0.0",
  "author": "张三 (QQ:12345678)",
  "description": "一句话简介，会显示在规则页卡片上",
  "setKeys": ["mycoc"]
}
```

| 字段 | 说明 |
| --- | --- |
| `name` | 包名（也是文件夹名 / 规则页显示名） |
| `version` | 版本号，如 `1.0.0` |
| `author` | **作者**。转化他人作品时**务必保留原作者** |
| `description` | 简介 |
| `setKeys` | 激活键数组。玩家用 `.set <key>` 激活。如 `["mycoc"]` → `.set mycoc` |

> 若包内 `rules/*.json` 自己声明了 `set.keys`，`setKeys` 可省略（会自动采用规则的激活键）。

---

## 三、`rules/` —— 规则文件

规则文件是普通 JSON，定义这套规则系统的属性、指令、默认骰等。激活后**优先级高于内置指令**，同名帮助词条也覆盖内置。

```json
{
  "name": "我的克苏鲁扩展",
  "set": {
    "keys": ["mycoc"],
    "diceSides": 100
  },
  "alias": {
    "侦查": ["侦察", "观察", "spot"],
    "力量": ["str", "STR"]
  },
  "computed": {
    "理智上限": "99 - 克苏鲁神话"
  },
  "commands": {
    "disable": ["jrrp"],
    "alias": { "检定": "ra" },
    "add": {
      "稳定": {
        "output": "{nick} 进行稳定判定：1d100={1d100}",
        "help": ".稳定 —— 进行一次稳定判定"
      }
    }
  },
  "help": {
    "本规则": "这是我的克苏鲁扩展，包含……"
  }
}
```

| 块 | 作用 |
| --- | --- |
| `set.keys` | 激活键；`set.diceSides` 激活后本群默认骰面 |
| `alias` | **属性同义词**：`规范名 → [别名…]`。让 `.st 侦察50`、`.ra 观察` 都识别为「侦查」 |
| `computed` | **衍生属性**：用表达式从其它属性算出（如理智上限） |
| `commands.disable` | 屏蔽内置指令（激活的群里这些指令静默） |
| `commands.alias` | 指令别名：`输入词 → 目标指令`（`.检定` 走 `.ra`） |
| `commands.add` | **自定义指令**（DSL，见下）。值可为字符串（输出模板）或 `{output, help}` 对象 |
| `help` | 包级帮助：`主题 → 文本`，`.help <主题>` 可查 |

### 自定义指令的表达式（DSL）

`commands.add` 的 `output` 模板里，`{…}` 会被求值：

| 写法 | 含义 |
| --- | --- |
| `{nick}` `{user}` `{group}` `{self}` `{date}` `{time}` | 昵称 / QQ号 / 群号 / 骰娘自称 / 日期 / 时间 |
| `{1d100}` `{3d6+2}` | 掷骰（同一指令里同一表达式只摇一次） |
| `{力量}` `{侦查}` | 取发送者人物卡的属性值 |
| `{arg}` | 指令后面跟的参数 |
| 四则 / 比较 / 三元 | `{力量 + 5}`、`{1d100 <= 侦查}`、`{1d100<=侦查 ? "成功" : "失败"}` |
| `min/max/abs` | `{max(力量, 敏捷)}`、`{abs(hp - 10)}` |

属性缺失或函数未知时，这条指令返回失败提示而不是错误。

---

## 四、`helpdoc/` —— 帮助速查

结构化帮助文档，**兼容海豹 SealDice** 的格式。一个文件含多条词条：

```json
{
  "mod": "克苏鲁术语表",
  "author": "张三",
  "brief": "常用术语速查",
  "helpdoc": {
    "百分骰": "投 1d100，用于大部分检定。",
    "理智": "调查员的精神稳定度，归零则永久疯狂。",
    "SAN": "&理智"
  }
}
```

- 键 = 词条名，值 = 内容；玩家用 `.help <词条>` 查询。
- 值以 `&` 开头表示**别名**（`"SAN": "&理智"` 即 SAN 指向「理智」）。
- 海豹的 `.xlsx` 表格帮助文档，可用 `tools/convert_helpdoc.py` 转成本格式（见下）。

激活了本包的群，包内同名词条**优先**于内置/其它来源。

::: tip 三种「帮助/速查」入口怎么选？
规则包里有三个长得像的东西，作用不同：

| 入口 | 玩家怎么查 | 适合放什么 |
| --- | --- | --- |
| `helpdoc/` 目录（本节） | `.help <词条>` | 术语、技能、法术等**大量速查词条**——首选 |
| `rules/*.json` 里的 `help` 块 | `.help <词条>` | 跟某条自定义指令强相关的**少量说明** |
| `rules/*.json` 里的 `entries` 块 | `.rules <词条>` | 目前**仅对独立放置的规则文件生效**，规则包 bundle 内暂不接入——先别用它 |

拿不准就统一放 `helpdoc/`。
:::

::: warning 卡模板暂不能随包分发
`.pc build` 用的人物卡模板（`card-templates/*.json`）目前只从骰娘本地的 `card-templates/` 与 `data/card-templates/` 目录加载，**放进规则包 zip 不会生效**，且改动后需重启骰娘。想分发卡模板，请提示用户手动把文件放进 `data/card-templates/`。
:::

---

## 五、`lua/` 与 `js/` —— 插件

复杂逻辑（需要联网、状态机、复杂判定）放插件：

- `lua/` —— 原版 Dice! 的 Lua mod：可以是**目录**（含 `reply/` 因果回复、`script/`、`speech/` 等），也可以是**单文件 `.lua`**（用 `msg_order` 派发）。
- `js/` —— 兼容海豹 SealDice 的 `.js` 插件。

::: warning 包内插件是「按群激活」的
包内插件的指令**默认不生效**，只有在 `.set <key>` 激活了本包的群里才响应（其它群、私聊都不受影响）。这正是「单群规则覆盖」的关键。
:::

> 想让插件**全局生效**（所有群都能用，不随规则激活）？那它就不是规则包的一部分——直接在「扩展管理」里单独上传即可。

---

## 六、激活与优先级

1. 骰主在后台「规则」页 **上传 zip** → 解压进 `data/rulepacks/<包>/`。
2. 群管理员在群里发 `.set <激活键>`（如 `.set mycoc`）→ 本群规则系统切换。
3. `.set list` 列出所有可用规则系统，`★` 标记本群当前激活的。
4. 激活后，在这个群里：
   - 包的**自定义指令 / 别名 / 默认骰 / 属性映射**生效，**优先于内置指令**；
   - 包内**插件指令**生效；
   - 包的**同名帮助词条**优先于内置。
5. 其它没激活的群完全不受影响。

---

## 七、把现有 mod / 插件转化成规则包

现有的原版 Dice! Lua mod、单文件 Lua/JS 插件，都能包装成规则包。**转化时务必保留原作者信息**（尊重作者、便于追溯）。

### 用脚本（Lua mod / 单文件）

```bash
python tools/convert_mod_to_pack.py <mod路径> [激活键] [输出目录]
# 例：把女仆RPG规则 mod 转成规则包，激活键 maid
python tools/convert_mod_to_pack.py server/data/mod/Maid-TRPG maid
```

脚本会：
- 从 mod 的 `descriptor.json` / `<name>.json` 读取 **name / author / version / brief**，写进 `pack.json`（**作者原样保留**）；
- 把 mod 目录原样放进 `lua/`；
- 若 descriptor 带 `helpdoc`，抽成 `helpdoc/<name>.json`；
- 自动生成激活键（或用你指定的）。

生成的 `pack.json` 会带 `"convertedFrom"` 字段注明来源。转换完打成 zip 即可分发。

### 海豹 Excel 帮助文档转换

```bash
python tools/convert_helpdoc.py <源目录> <输出目录>
```

把海豹的 `.xlsx`（列 `Key | Synonym | Content | Description`）和 `.json` 帮助文档统一转成本格式，放进包的 `helpdoc/` 即可。

### 手动转化

照「目录结构」新建文件夹、写 `pack.json`（**填上原作者**）、把插件文件放进 `lua/` 或 `js/`、帮助放进 `helpdoc/`，打成 zip。

::: tip 关于属性模板与规则手册（旧版 mod 兼容）
- `model/*.xml` 里 `<any name='力量' alias='STR/str'>` 这类**属性别名会自动并入** `.st`/`.ra`——`.st STR50`、`.ra DEX` 直接认得该规则系统的属性名，无需手写。
- `rulebook/*.yaml`（`{rule, manual:{术语:解释}}`，如 COC 法术/武器/神话、DND 法术/怪物/物品、女仆 RPG 手册）的条目**自动并入** `.help`——`.help 弓箭`、`.help 深层魔法` 直接出速查。
- `speech/*.yaml` 模板词条照常生效。
- `model/*.xml` 里 `text='javascript'`/`text='dicexp'` 的**简单算术衍生/默认值**（如 `闪避 = 敏捷/2`、`生命 = (体质+体型)/10`、`理智 = 意志`）**会自动计算并落地**——读这些属性时若没显式 `.st` 过，按公式算出；新建 COC 卡 `.st` 基础属性后自动填 HP/SAN/MP 并附卡面摘要（设置页可关「自动卡面」）。
- **JS 插件规则**：`seal.gameSystem.newTemplate(ByYaml)` 里的 `alias`（属性别名）与 `defaultsComputed`（简单算术衍生）也会自动并入 `.st`/`.ra`——海豹的 JS 自订规则系统的属性名直接可用。
- **仅**复杂表达式（带条件/字符串/`Math.max`/`$` 临时变量）暂不翻译，可在 `rules/*.json` 的 `computed` 块自行声明。
:::

---

## 八、一个最小完整例子

```
口袋规则/
├── pack.json
├── rules/pocket.json
└── helpdoc/pocket.json
```

`pack.json`
```json
{ "name": "口袋规则", "version": "1.0.0", "author": "你的名字", "setKeys": ["pocket"] }
```

`rules/pocket.json`
```json
{
  "name": "口袋规则",
  "set": { "keys": ["pocket"], "diceSides": 100 },
  "commands": { "add": { "运势": { "output": "{nick} 今日运势：{1d100}/100", "help": ".运势 —— 看今日运势" } } },
  "help": { "口袋规则": "一个最小示例规则包。" }
}
```

`helpdoc/pocket.json`
```json
{ "mod": "口袋速查", "author": "你的名字", "helpdoc": { "运势": "投 1d100 看今日运势。" } }
```

打包：把 `口袋规则/` 压成 `口袋规则.zip` → 后台「规则」页上传 → 群里 `.set pocket` → `.运势` 即可用，`.help 运势` 出速查。

---

## 九、小结

| 你想做的 | 放哪 |
| --- | --- |
| 属性同义词 / 默认骰 / 衍生属性 | `rules/*.json` 的 `alias` / `set` / `computed` |
| 简单自定义指令（模板 + 骰点 + 属性） | `rules/*.json` 的 `commands.add`（DSL） |
| 屏蔽 / 重命名内置指令 | `rules/*.json` 的 `commands.disable` / `alias` |
| 速查词条 | `helpdoc/*.json` |
| 复杂逻辑（联网 / 状态 / 复杂判定） | `lua/` 或 `js/` 插件 |
| 元数据（名字 / 作者 / 激活键） | `pack.json` |
