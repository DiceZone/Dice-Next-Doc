# Rules Reference

Look up rules during a session without opening the book. Dice!Next uses a local, extensible rules library that works offline and can be extended by you.

## Commands

| Command | Description |
|------|------|
| `.rules entry` / `.rule entry` | Look up a rules entry (`.rule` is the original alias) |
| `.rules book:entry` | Look up in a specific rulebook |
| `.ruleset book` | Set the group's default rulebook (group admin) |
| `.rule set book` | The original syntax, same as `.ruleset book` |

## Usage

```
.rules 大失败           → look up (the group's default book first, then all books) (大失败 = fumble)
.rules coc:困难成功     → look up in the COC7 rulebook (困难成功 = hard success)
.rules dnd:借机攻击     → look up in the DND rulebook (借机攻击 = opportunity attack)
.ruleset dnd            → set the group's default rulebook to dnd
.rule set dnd           → same (original Dice! syntax)
.ruleset show / clr     → show / clear the default rulebook (clearing also requires group admin)
```

Entries are matched exactly or fuzzily (substring).

## Built-in Rulebooks

The CoC7 Keeper Companion options can be switched on with `.set coc7r`; see the [coc7r guide](./coc7r). That is a separate runtime rules configuration, different from the reference book chosen with `.ruleset` for lookups.

| Rulebook | Aliases | Content |
|--------|------|------|
| `coc7` | coc, 克苏鲁 | Critical success / fumble, hard / extreme success, sanity and insanity, damage bonus, build and more |
| `dnd` | dnd5e, 5e, 龙与地下城 | Advantage / disadvantage, initiative, opportunity attacks, saving throws, proficiency bonus, short and long rests, death saves and more |

The built-in entries are written in Chinese.

## Custom Rulebooks

A rulebook is a JSON file in the `data/rules/` directory (`rules/` at the package root is also supported), one book per file:

```json
{
  "name": "coc7",
  "aliases": ["coc", "克苏鲁"],
  "entries": {
    "大失败": "技能值<50 时骰出 96-100 为大失败……",
    "困难成功": "骰值 ≤ 技能值的一半即为困难成功。"
  }
}
```

Add a new file to extend the rules library; dice masters can add whatever the systems they run need. You can also edit rulebooks directly on the Rules page of the web panel.

::: tip Rule packs
The same rulebook JSON can also declare **skill synonyms** (`alias`), the default die and other "rule pack" capabilities; entries and synonyms written in one file take effect together. A complete set of gameplay content (help lookups, sheet templates, plugins and so on) can be packaged as a rule pack, distributed and used right after importing. See [Writing Rule Packs](/en/develop/rulepack).
:::
