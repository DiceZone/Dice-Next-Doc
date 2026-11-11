# Writing Rule Packs

A rule pack is how Dice!Next bundles **rules, help documents and plugins** into one unit that can be **installed / enabled / disabled / deleted as a whole**. The dice master uploads a zip in the panel, players activate it in a group with `.set`, and the whole rule set takes effect in that group.

> In one sentence: **one zip = one folder + one `pack.json` manifest + resources laid out by directory**. Convention over configuration: just put files in the matching subdirectories and the system finds them automatically, with no file list to write by hand.

---

## 1. Directory Structure

```
my-rule-pack/
├── pack.json          ← required: pack metadata (name / version / author / activation keys)
├── rules/             ← rule files (attribute aliases / default die / custom commands / help)
│   └── xxx.json
├── helpdoc/           ← help lookups (entry → content, searchable with .help)
│   └── xxx.json
├── lua/               ← Lua plugins (original Dice! mods, directories or single files)
│   ├── some-module/
│   └── some-file.lua
└── js/                ← JS plugins (SealDice compatible)
    └── some-plugin.js
```

Every subdirectory is **optional**: you can include only `rules/` (purely declarative rules), only `lua/` (purely plugin rules), or any combination. Zip the whole folder to distribute it.

::: tip Install and remove as a whole
Deleting / disabling a pack = deleting / renaming this folder (done in one click in the panel). Every resource in the pack is registered or unregistered with it, leaving nothing behind.
:::

---

## 2. `pack.json` (Manifest)

Only metadata; **no need** to list files one by one:

```json
{
  "name": "My Cthulhu Extension",
  "id": "my-coc-extension",
  "version": "1.0.0",
  "author": "Jane Doe (QQ:12345678)",
  "description": "A one-line summary shown on the rule card",
  "setKeys": ["mycoc"]
}
```

| Field | Description |
| --- | --- |
| `name` | Display name of the pack |
| `id` | Optional stable directory identifier using only safe file name characters; when omitted, the zip file name or the single root directory name is used |
| `version` | Version number, such as `1.0.0` |
| `author` | **Author**. When converting someone else's work, **always keep the original author** |
| `description` | Summary |
| `setKeys` | Array of activation keys. Players activate the pack with `.set <key>`; for example `["mycoc"]` → `.set mycoc` |

> If `rules/*.json` in the pack declares its own `set.keys`, `setKeys` can be omitted (the rule's activation keys are used automatically).

::: warning Importing and updating
An import must include a valid `pack.json`. The system first checks ZIP paths, file count and extracted size, rejecting path traversal, symbolic links and abnormal archives. A rule pack with the same `id` (or directory identifier) is never overwritten silently; `.set` activation keys, JS file names or Lua mod names that duplicate existing rules are also rejected explicitly. Delete the old pack before updating. If hot reload fails during import, enabling, disabling or deletion, the file operations are rolled back automatically.
:::

---

## 3. `rules/`: Rule Files

Rule files are ordinary JSON defining the rule system's attributes, commands, default die and so on. Once activated they **take priority over built-in commands**, and help entries with the same name override the built-in ones too.

```json
{
  "name": "My Cthulhu Extension",
  "id": "my-coc-extension",
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
        "output": "{nick} makes a stability check: 1d100={1d100}",
        "help": ".稳定 — make a stability check"
      }
    }
  },
  "help": {
    "本规则": "This is my Cthulhu extension, which includes…"
  }
}
```

| Block | Purpose |
| --- | --- |
| `set.keys` | Activation keys; `set.diceSides` is the group's default die after activation |
| `alias` | **Attribute synonyms**: `canonical name → [aliases…]`. Makes `.st 侦察50` and `.ra 观察` both recognized as 侦查 (Spot Hidden) |
| `computed` | **Derived attributes**: computed from other attributes with an expression (such as maximum sanity) |
| `commands.disable` | Block built-in commands (these commands stay silent in groups where the pack is active) |
| `commands.alias` | Command aliases: `input word → target command` (`.检定` runs `.ra`) |
| `commands.add` | **Custom commands** (DSL, see below). The value can be a string (output template) or an `{output, help}` object |
| `help` | Pack-level help: `topic → text`, looked up with `.help <topic>` |

### Expressions in custom commands (DSL)

In the `output` template of `commands.add`, `{…}` is evaluated:

| Syntax | Meaning |
| --- | --- |
| `{nick}` `{user}` `{group}` `{self}` `{date}` `{time}` | Nickname / QQ number / group ID / the bot's self-reference / date / time |
| `{1d100}` `{3d6+2}` | Dice rolls (the same expression is rolled only once within one command) |
| `{力量}` `{侦查}` | The value of an attribute on the sender's character sheet |
| `{arg}` | The arguments following the command |
| Arithmetic / comparison / ternary | `{力量 + 5}`, `{1d100 <= 侦查}`, `{1d100<=侦查 ? "success" : "failure"}` |
| `min/max/abs` | `{max(力量, 敏捷)}`, `{abs(hp - 10)}` |

When an attribute is missing or a function is unknown, the command returns a failure message instead of an error.

::: warning Current scope limitation of attribute mappings
Custom commands, blocked commands and Lua/JS plugins in a pack are activated per group; however, `alias`, `computed`, `defaults` and `derived` currently still go into a process-wide compatibility registry. Avoid declaring conflicting attribute aliases or defaults across several rule packs. Moving these attribute mappings to a full per-group scope is in the plan for a later refactor.
:::

---

## 4. `helpdoc/`: Help Lookups

Structured help documents, **compatible with the SealDice** format. One file holds several entries:

```json
{
  "mod": "Cthulhu Glossary",
  "author": "Jane Doe",
  "brief": "Quick reference for common terms",
  "helpdoc": {
    "百分骰": "Roll 1d100, used for most checks.",
    "理智": "An investigator's mental stability; at zero they go permanently insane.",
    "SAN": "&理智"
  }
}
```

- Key = entry name, value = content; players look it up with `.help <entry>`.
- A value starting with `&` is an **alias** (`"SAN": "&理智"` means SAN points to 理智, sanity).
- SealDice's `.xlsx` spreadsheet help documents can be converted to this format with `tools/convert_helpdoc.py` (see below).

In groups where this pack is active, the pack's entries **take priority** over built-in / other sources with the same name.

::: tip Which of the three "help / lookup" entries to use?
A rule pack has three similar-looking things that do different jobs:

| Entry | How players look it up | Good for |
| --- | --- | --- |
| The `helpdoc/` directory (this section) | `.help <entry>` | **Large numbers of lookup entries** such as terms, skills and spells: the first choice |
| The `help` block in `rules/*.json` | `.help <entry>` | **A few notes** closely tied to a custom command |
| The `entries` block in `rules/*.json` | `.rules <entry>` | Currently **only works for standalone rule files** and isn't connected inside rule pack bundles yet; don't use it for now |

When in doubt, put everything in `helpdoc/`.
:::

::: warning Sheet templates can't ship with packs yet
The character sheet templates used by `.pc build` (`card-templates/*.json`) are currently only loaded from the bot's local `card-templates/` and `data/card-templates/` directories; **putting them in a rule pack zip has no effect**, and changes need a bot restart. To distribute sheet templates, tell users to put the files in `data/card-templates/` by hand.
:::

---

## 5. `lua/` and `js/`: Plugins

Put complex logic (networking, state machines, complicated checks) in plugins:

- `lua/`: original Dice! Lua mods; either a **directory** (with `reply/` causal replies, `script/`, `speech/` and so on) or a **single `.lua` file** (dispatched through `msg_order`).
- `js/`: `.js` plugins compatible with SealDice.

::: warning Plugins in a pack are "activated per group"
Commands from plugins in a pack **don't work by default**; they only respond in groups where the pack has been activated with `.set <key>` (other groups and private chats are unaffected). This is the key to "per-group rule overrides".
:::

> Want a plugin to **work globally** (usable in every group, regardless of rule activation)? Then it isn't part of a rule pack; upload it separately in "Extensions".

---

## 6. Activation and Priority

1. The dice master **uploads the zip** on the "Rules" page of the panel → after validation it is installed to `data/rulepacks/<id>/`. The page shows a single parent rule pack card, and the rules, help, Lua and JS children can be viewed together under "View pack contents" rather than being scattered as duplicate, separately editable items.
2. A group admin sends `.set <activation key>` in the group (such as `.set mycoc`) → the group's rule system switches.
3. `.set list` lists all available rule systems, with `★` marking the one active in this group.
4. Once activated, in that group:
   - The pack's **custom commands / aliases / default die / attribute mappings** take effect and **take priority over built-in commands**;
   - **Plugin commands** in the pack take effect;
   - The pack's **help entries with the same names** take priority over the built-in ones.
5. Other groups that haven't activated it don't run the pack's custom commands or plugins; see the warning above for the current limitation of attribute mappings.

---

## 7. Converting Existing Mods / Plugins into Rule Packs

Existing original Dice! Lua mods and single-file Lua/JS plugins can all be wrapped as rule packs. **Always keep the original author information when converting** (to respect the author and make the origin traceable).

### With the script (Lua mods / single files)

```bash
python tools/convert_mod_to_pack.py <mod path> [activation key] [output directory]
# Example: convert the maid RPG rules mod into a rule pack with the activation key maid
python tools/convert_mod_to_pack.py server/data/mod/Maid-TRPG maid
```

The script:
- Reads **name / author / version / brief** from the mod's `descriptor.json` / `<name>.json` and writes them into `pack.json` (**the author is kept as-is**);
- Puts the mod directory into `lua/` unchanged;
- If the descriptor has `helpdoc`, extracts it into `helpdoc/<name>.json`;
- Generates an activation key automatically (or uses the one you specify).

The generated `pack.json` has a `"convertedFrom"` field noting the source. Zip it after converting and it's ready to distribute.

### Converting SealDice Excel help documents

```bash
python tools/convert_helpdoc.py <source directory> <output directory>
```

Converts SealDice's `.xlsx` (columns `Key | Synonym | Content | Description`) and `.json` help documents into this format; put the results in the pack's `helpdoc/`.

### Converting by hand

Create a folder following "Directory Structure", write `pack.json` (**with the original author**), put plugin files into `lua/` or `js/` and help into `helpdoc/`, then zip it.

::: tip About attribute templates and rulebooks (old mod compatibility)
- **Attribute aliases** such as `<any name='力量' alias='STR/str'>` in `model/*.xml` are **merged automatically** into `.st`/`.ra`, so `.st STR50` and `.ra DEX` recognize that rule system's attribute names directly, with nothing to write by hand.
- Entries in `rulebook/*.yaml` (`{rule, manual:{term:explanation}}`, such as COC spells / weapons / Mythos, DND spells / monsters / items, the maid RPG manual) are **merged automatically** into `.help`, so `.help 弓箭` (bow) and `.help 深层魔法` (deep magic) give quick references directly.
- Template entries in `speech/*.yaml` work as usual.
- **Simple arithmetic derived / default values** with `text='javascript'`/`text='dicexp'` in `model/*.xml` (such as `闪避 = 敏捷/2`, `生命 = (体质+体型)/10`, `理智 = 意志`) **are calculated and saved automatically**: when these attributes are read without an explicit `.st`, they are computed from the formula; after `.st` sets the base characteristics on a new COC sheet, HP/SAN/MP are filled in automatically with a sheet summary (the "auto sheet" option can be turned off in settings).
- **JS plugin rules**: `alias` (attribute aliases) and `defaultsComputed` (simple arithmetic derivations) in `seal.gameSystem.newTemplate(ByYaml)` are also merged automatically into `.st`/`.ra`, so attribute names of SealDice's JS custom rule systems work directly.
- **Only** complex expressions (with conditions / strings / `Math.max` / `$` temporary variables) aren't translated yet; declare them yourself in the `computed` block of `rules/*.json`.
:::

---

## 8. A Minimal Complete Example

```
pocket-rules/
├── pack.json
├── rules/pocket.json
└── helpdoc/pocket.json
```

`pack.json`
```json
{ "name": "Pocket Rules", "version": "1.0.0", "author": "Your Name", "setKeys": ["pocket"] }
```

`rules/pocket.json`
```json
{
  "name": "Pocket Rules",
  "set": { "keys": ["pocket"], "diceSides": 100 },
  "commands": { "add": { "运势": { "output": "{nick}'s fortune today: {1d100}/100", "help": ".运势 — check today's fortune" } } },
  "help": { "Pocket Rules": "A minimal example rule pack." }
}
```

`helpdoc/pocket.json`
```json
{ "mod": "Pocket Reference", "author": "Your Name", "helpdoc": { "运势": "Roll 1d100 to see today's fortune." } }
```

Packaging: zip `pocket-rules/` into `pocket-rules.zip` → upload on the panel's "Rules" page → `.set pocket` in a group → `.运势` works, and `.help 运势` gives the quick reference.

---

## 9. Summary

| What you want | Where it goes |
| --- | --- |
| Attribute synonyms / default die / derived attributes | `alias` / `set` / `computed` in `rules/*.json` |
| Simple custom commands (template + dice + attributes) | `commands.add` in `rules/*.json` (DSL) |
| Block / rename built-in commands | `commands.disable` / `alias` in `rules/*.json` |
| Lookup entries | `helpdoc/*.json` |
| Complex logic (networking / state / complicated checks) | Plugins in `lua/` or `js/` |
| Metadata (name / author / activation keys) | `pack.json` |
