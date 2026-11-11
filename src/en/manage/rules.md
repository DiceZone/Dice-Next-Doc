# Rules

**Web panel → Extensions → Rules** manages importable rule packs (attribute aliases / derived formulas / reference manuals / custom commands); groups activate them with `.set <rule>`.

## Rule Pack List

Each rule pack shows its name, version, author, `.set` keyword, default die, and counts of aliases / derived formulas / reference entries / help; packs with custom commands, command aliases or disabled commands also list matching command badges.

| Action | Description |
|------|------|
| Enable / disable | Turn a single rule pack on or off |
| Edit online | Open the visual rule editor (see below) |
| Export | Download the rule JSON file |
| Delete | Remove a rule pack (built-in rules can't be deleted) |

The list supports paging (with a selectable page size). Built-in rules (such as COC7, DND) are labeled "Built-in", and imported ones "Imported".

## Importing

- **Import rule file**: a single rule JSON.
- **Import rule pack (zip)**: one zip bundling rules + help documents + Lua/JS plugins (declared in a `pack.json` manifest), all of which take effect together after a group activates it with `.set`. The rule pack section shows statistics of rules / commands / help / plugins for each pack, and whole packs can be enabled, disabled or deleted (deleting removes the whole pack directory).

For the rule pack format and distribution, see [Writing Rule Packs](/en/develop/rulepack) and [Example: Converting a SealDice Plugin](/en/develop/rulepack-example-fu).

## Compatible Rules

Rule systems provided as plugins are also listed on this page and can be turned on or off directly:

- **JS-compatible rules**: SealDice JS plugins (`seal.gameSystem` / `coc.registerRule`), listing the commands they register.
- **Lua-compatible rules**: original Dice! Lua mods (including `model/*.xml` attribute templates such as COC7-TRPG / DND-5E).

To upload / delete / configure such plugins, go to the [Plugins](/en/manage/plugins) page.

## Visual Rule Editor

Click "New rule", or "Edit online" on a rule pack, to open the editor. You can switch between **form mode** and **source mode** (editing the JSON directly) at any time:

| Section | Content |
|------|------|
| Basic info | Name (English, used as the file name), display name, version, author, default die, `.set` keyword |
| Success levels | How check success levels are determined (built-in / custom / none) |
| Attribute aliases | Canonical name + list of aliases (synonyms are normalized when recording with `.st`) |
| Derived formulas | Attribute + formula (for example Dodge = DEX/2) |
| Default values | Default attribute values |
| Reference entries | Entries and explanations for `.rules` lookups |
| Command aliases | Input word → target command |
| Custom commands | Command name + output template (`{expression}` is evaluated and replaced, supporting dice, sheet values, ternary conditions and more) + help text |
| Disabled commands | Built-in commands blocked while this rule is active |

At the bottom of the editor is **live testing**: run commands directly with the content currently in the editor (test attributes can be injected), without saving.

Testing uses the editor's current unsaved JSON draft, covering the rule's custom commands, aliases and blocked commands. It doesn't write to installed rules, doesn't switch the active rule of a real group, and doesn't send messages to real groups. Syntax or rendering failures show the error directly; testing no longer uses only the saved version while ignoring the draft.

## Related Features (Not on This Page)

| Need | Where to go |
|------|--------|
| Command prefix | [Settings](/en/manage/settings) |
| COC house rules (critical success / fumble rules) | `.setcoc 0-7` in a group; `.setcoc help` shows what each number means; see [Dice & Checks](/en/use/dice) |
| Help entries shipped with rule packs | Automatically included in the unified `.help` and the [Help Documents](/en/manage/help-docs) page |
| Custom keyword replies | [Advanced Replies](/en/manage/replies) |
| Black / white lists / trust | [Permissions](/en/manage/permissions) |

## How Changes Apply

Changes in the panel are saved and take effect immediately, with no restart needed.
