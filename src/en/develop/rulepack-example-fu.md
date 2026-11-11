# Example: Converting a SealDice Rule Plugin into a Rule Pack

This article takes a real SealDice rule plugin, **`seal-fu.js` (Fabula Ultima)**, as an example and walks through splitting it into a Dice!Next [rule pack](/en/develop/rulepack), explaining the **principles** behind each step. Once you've read it, you can convert any SealDice custom rule the same way.

> Original author: Mint Cider ([seal-fu](https://github.com/MintCider/seal-fu), MIT). **Always keep the original author's information when converting someone else's work.**

---

## 1. First, See Clearly: A SealDice Plugin Has Two Parts

Open `seal-fu.js` and you'll find it's actually **two kinds of things** mixed into one file:

| Part | What it looks like in seal-fu.js | What it really is |
| --- | --- | --- |
| **Declarative template** | `ruleTemplate = { name, setConfig, alias, attrConfig, nameTemplate … }`, registered at the end with `seal.gameSystem.newTemplate(...)` | "What attributes and aliases this rule system has, how many sides its default die has, what the card name looks like": **pure data** |
| **Imperative logic** | A set of functions such as `commandRc / commandRi / commandBuff …`, registered with `seal.ext.registerCommand` | "How `.rc` is calculated and how `.buff` changes state": **program code** |
| **Help text** | A set of strings such as `rcHelp / buffHelp …` | The manual |

A Dice!Next rule pack puts these three things in **separate places**:

```
最终物语/
├── pack.json              ← manifest (name / author / activation keys)
├── rules/最终物语.json     ← declarative: attribute aliases + default die + overriding built-in commands
├── helpdoc/最终物语.json   ← help manual
└── js/seal-fu.js          ← imperative: the original plugin as-is, running on our SealDice-compatible engine
```

> **The principle in one sentence**: whatever can be described as **data** (attributes / aliases / default die / help) goes into `rules` and `helpdoc`; complex logic that can only be expressed as **code** (check algorithms, state machines) stays as-is in the `js/` plugin.

---

## 2. Writing the Four Files

### 1. `pack.json`: the manifest

```json
{
  "name": "最终物语",
  "version": "1.0.0",
  "author": "Mint Cider",
  "description": "Fabula Ultima TRPG rules. Example: converted from the SealDice seal-fu.js plugin.",
  "setKeys": ["fu", "最终物语"],
  "convertedFrom": "seal-fu.js (https://github.com/MintCider/seal-fu, MIT)"
}
```

- `setKeys` comes from the plugin's `ruleTemplate.setConfig.keys` (`["fu", "最终物语"]`); players activate it with `.set fu`.
- `author` keeps `ruleTemplate.authors` as-is.

### 2. `rules/最终物语.json`: the declarative part

Translate `alias` and `setConfig` from the plugin's `ruleTemplate`, then add the **crucial `commands.disable`**:

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
  "help": { "最终物语": "Fabula Ultima rules. Switch with .set fu…" }
}
```

- `set.diceSides: 6` ← `setConfig.diceSides`: once activated, the group's default die becomes a d6.
- `alias` ← `ruleTemplate.alias`: **copied directly**. This way `.st mig=8` is recognized as 力量骰面初始值 (initial Might die), and `.st dex=10` as 敏捷骰面初始值 (initial Dexterity die).
- `commands.disable` ← **this is the key step for bringing the SealDice plugin in**; it's explained separately below.

### 3. `helpdoc/最终物语.json`: help

Collect the plugin's `rcHelp / buffHelp …` strings into entries so players can look them up with `.help rc` and `.help buff`:

```json
{
  "mod": "最终物语速查",
  "author": "Mint Cider",
  "helpdoc": {
    "rc": "Fabula Ultima check: .rc <attribute1>+<attribute2>+<modifier>…",
    "buff": "Fabula Ultima status effects: .buff <status> / .buff add|del …",
    "命刻": "&clk"
  }
}
```

(`"命刻": "&clk"` means 命刻 (clock) is an alias entry of clk.)

### 4. `js/seal-fu.js`: the imperative part

Put `seal-fu.js` into `js/` **unchanged**. Our JS subsystem is compatible with the SealDice plugin API (`seal.ext.*`, `seal.vars.*`, `seal.replyToSender`, `cmdArgs.*` and so on), so the plugin's `.rc / .ri / .buff / .ds / .eval / .bond / .clk` register and run as usual.

---

## 3. Three Mechanisms That Make It "Really Work"

Laying the files out isn't enough. A SealDice plugin runs in Dice!Next thanks to three underlying mechanisms:

### ① Attribute aliases merged into `.st` / `.ra` automatically

`alias` in `rules/*.json` (as well as `alias` in the plugin's `seal.gameSystem.newTemplate`) is **merged automatically** into the character sheet system. So whether a player writes `.st 力量=8`, `.st mig=8` or `.st might=8`, it's all normalized to the same canonical attribute 力量骰面初始值. The plugin just reads by the canonical name and doesn't care which form the player used.

### ② `commands.disable`: overriding built-in commands

The Fabula Ultima commands `.rc` (check), `.ri` (initiative), `.buff` and `.ds` **already have built-in meanings** in Dice!Next (`.rc` is a COC check, `.ds` is a DND death save…). By default **built-in commands take priority** and block the plugin's commands with the same names.

`commands.disable: ["rc","ri","buff","ds"]` makes these built-in commands "step aside" **in groups that have activated this rule pack**: once the built-ins are silent, the message falls through to the plugin's command with the same name. So in these groups `.rc` runs the Fabula Ultima check, while **groups that haven't activated it** still get the built-in COC check, without interfering with each other.

> This is the essence of "per-group rule overrides": the same `.rc` means different things in groups using different rules.

### ③ The `seal.vars` ↔ character sheet bridge

SealDice plugins read attributes with `seal.vars.intGet(ctx, "力量骰面")`. In SealDice, **a variable name without a `$` prefix = a player character sheet attribute** (the same sheet `.st` records into).

Dice!Next implements the same semantics: names **without a `$` prefix** in `seal.vars` go straight to the player's character sheet, and names **with a prefix** go to the plugin's own storage by scope:

| Form | Points to |
| --- | --- |
| `力量骰面`, `生命值`, `中毒` | **Player character sheet attributes** (= the `.st` sheet) |
| `$g…` (such as `$gfu_clocks`) | Group variables (shared in the group) |
| `$m…` | Personal variables (across groups) |
| `$t玩家` / `$t玩家_RAW` | The current player's nickname (built-in temporary variable) |

That's why, after a player runs `.st mig=8`, the plugin's `.rc mig+ins` check **can read** Might die = 8 and include the player's name in the reply.

---

## 4. Install It and Try

1. Zip `最终物语/` and upload it on the panel's "Rules" page (or put it directly in `data/rulepacks/最终物语/`).
2. A group admin sends `.set 最终物语` (or `.set fu`) → the group switches to Fabula Ultima, and the default die becomes d6.
3. Record a sheet and make checks:

```text
.st mig=8 dex=10 ins=8 wlp=6 hp=20 hpmax=20
.rc mig+ins      → 希亚's Might + Insight check: d8+d8=[2+7]=9   HR: 7
.buff 中毒       → 希亚 is now poisoned…
.ds 力量+1       → 希亚's Might die is temporarily +1
.rc mig+mig      → 希亚's Might + Might check: d8 (poisoned, ds+1) + d8 (poisoned, ds+1) = [4+1] = 5   HR: 4
.bond add 阿强 喜爱   → 希亚 has formed an Affection bond with <阿强>
.clk add 末日 6 3     → Created a clock of size 6: 末日 (doom)
.help rc          → (the check description from helpdoc)
```

Status effects and temporary attribute die adjustments are reflected in checks in real time, just as on SealDice.

---

## 5. What Is **Not** Converted Automatically (Watch Out)

Keep in mind that the following SealDice features currently **aren't** migrated automatically; they rely on the plugin's own logic or are left for manual work:

- **Complex `attrConfig.showAs` / `nameTemplate` expressions** (SealDice rollvm's `{if …}` scripts): these are "conditional calculations" inside the declarative template, while Dice!Next's `rules` only support simple arithmetic derivations (`computed`). Fabula Ultima's card names and the `.st show` folding are implemented by the plugin calling `seal.setPlayerGroupCard` itself; they still work, but they weren't translated through `rules`.
- **String-type sheet attributes are read-only**: integer attributes are bridged **for reading and writing** through `seal.vars.intGet/intSet`; for **expression attributes** such as `.st 物防='dex+1'`, `seal.vars.strGet` can read the original text (which the plugin uses for linked evaluation), but writes with `strSet` go to the plugin's own variable storage and are **not written back to the character sheet**.
- **Complex successRank / custom success levels in `seal.gameSystem`**: `alias` and simple `defaultsComputed` are merged, but complex judgments are still handled by the plugin's own code.

> In short: **"attribute aliases + default die + reading and writing integer attributes + command overrides + help" all work automatically; only SealDice rollvm's complex template expressions aren't translated**, and those are usually consumed by the plugin's own code anyway, so they don't get in the way.

---

## 6. Quick Mapping Table

| In seal-fu.js | In the rule pack |
| --- | --- |
| `ruleTemplate.setConfig.keys / diceSides` | `setKeys` in `pack.json` + `set` in `rules` |
| `ruleTemplate.alias` | `alias` in `rules` |
| Commands with the same names as built-ins (rc/ri/buff/ds) | Listed in `commands.disable` in `rules` |
| Functions such as `commandRc / commandBuff …` | Kept as-is in `js/seal-fu.js` |
| `rcHelp / buffHelp …` | Entries in `helpdoc/*.json` |
| `authors` | `author` in `pack.json` (**always keep it**) |

Following this table, any SealDice rule plugin can be split into a Dice!Next rule pack. For the basic concepts, see [Writing Rule Packs](/en/develop/rulepack).
