# Help & Language

Dice!Next has a single unified help registry: built-in command descriptions, rule pack entries, help registered by plugins and customizable help documents all feed into the same `.help`. You can also lock the search scope per group and switch the reply language.

## Looking Up Help `.help`

```
.help              → command overview menu
.help ra           → help for a command / entry (.help .ra also works)
.help 克苏鲁       → entries aren't limited to commands; rules references, deck notes and so on can be looked up too
.help on / off     → group admins turn the help command on / off for the group (saved permanently)
```

The overview menu is grouped by purpose: rolling, checks, character sheets, generation, decks, fun, admin and account.

### Help layout

On the latest main branch, `.help` without arguments adds these two feedback lines at the end by default (`75ec20d`, not yet in beta.925):

```text
Dice!Next 测试群：933145116
如有故障或建议欢迎加群反馈
```

("Dice!Next test group: 933145116 / Join the group to report problems or suggestions.") This only changes the default main help text and doesn't affect `.help <command>` lookups; help overrides the dice master has already customized still take priority and are never forcibly replaced.

Built-in command help follows one layout: a title line, one command per line with a `//` description, and extra notes on separate lines at the end. Arguments are written as `<required>` and `[optional]`. The usage hint for an empty command (for example sending only `.log`) uses the same layout:

```
录卡 .st
.st <属性><值> // 录入或修改属性，如 .st 力量50 敏捷60
.st <属性>±<值> // 增减属性，支持骰子，如 hp-2、理智+1d3
.st show // 查看当前人物卡
.st clr // 清空人物卡
.st del <属性> // 删除某项属性
DND 钱币支持 pp/gp/ep/sp/cp，扣款自动换开。
```

Each of the four interface languages maintains its own copy of these texts, and switching language (see `.lang` below) switches the help language as well.

- Entries support **fuzzy matching**: a single match is shown directly; several candidates are listed for you to choose from; nothing found gives a notice.
- Help sources (gathered into the unified registry, with duplicate names removed automatically):
  1. **Built-in** command descriptions;
  2. **Custom entries** (including help imported from the old `CustomHelp.json`);
  3. Help entries shipped with **rule packs** (entries from the rule pack active in the group take priority over others with the same name);
  4. Help registered by **plugins** (JS / Lua);
  5. **Custom documents** (`data/help/*.md`) and **help document packs** (JSON in `data/helpdoc/` and in each rule pack's directory).
- Very long help content is sent in several parts automatically.

### 溯洄-style references

When a help body starts with `&topic`, it acts as an alias of another topic (added locally on 2026-10-19). Multiple levels of redirection are supported, and the target is still chosen according to the current source priority and search scope; missing, circular or overly deep aliases are never expanded endlessly. This works for custom help imported from the old version, so you don't need to copy the target text by hand.

Help entry content supports 溯洄 format functions: `{entry}` expands the content of another entry (recursively), and a bracket block containing `{}` such as `[{%_1D3}*10]` is evaluated as an expression; `[example]` without `{}` stays as it is. Deck cards support the same reference semantics (see [Decks](/en/use/deck)).

## Custom Help `.helpdoc`

`.helpdoc <entry>` is the same as `.help <entry>`; without an entry it gives a usage hint (browse / search the full list on the "Help Documents" page of the web panel).

Custom help documents go in the `data/helpdoc/` directory (`*.json`, compatible with the SealDice help document format):

```json
{
  "mod": "我的速查",
  "brief": "一句话简介",
  "helpdoc": {
    "词条名": "词条内容",
    "别名": "&词条名"
  }
}
```

A value starting with `&` is an alias (pointing to another entry). Rule packs can also ship help in their own `helpdoc/` directory; the source of those entries is shown as `<pack name>/<mod>`.

### Default source `.helpdoc default`

When several sources have entries with the same name (for example both dnd3r and dnd5r have "猫头鹰熊", owlbear), you can choose the preferred source:

```
.helpdoc default           → show the current default source and the available ones
.helpdoc default dnd5r     → prefer dnd5r for entries with the same name
.helpdoc default clear     → cancel (back to load order)
```

### Search scope `.helpdoc scope`

Stronger than the default source: it **locks** the group's help search to one source, filtering out entries from all other sources (built-in command descriptions are still kept). Useful when running a particular rule system, so you don't get other systems' content:

```
.helpdoc scope coc7包      → .help in this group only searches that source
.helpdoc scope clear       → remove the lock
.helpdoc scope             → show the current search scope
```

## Web Management

On the [Help Documents](/en/manage/help-docs) page of the web panel you can filter by source type and by specific source, search all help entries, and edit custom help. Historical `help.topic.*` entries are included on that page automatically, so existing data doesn't need to be re-imported; built-in help you have edited keeps its built-in source label.

## Switching Language `.lang`

Bot replies support four built-in languages: Simplified Chinese / Traditional Chinese / English / Japanese. Group admins can switch the group's language; in a private chat you switch your own:

```
.lang                  → show the current language and usage
.lang 繁體             → switch (简体 / 繁體 / en / 日本語 and various common aliases are recognized)
.lang clr              → clear the override and go back to the default
```

### Custom language packs

Put a translation file `<language code>.json` into the `i18n/` directory and it is loaded automatically as a new language; `_meta.keywords` in the pack declares the keywords that switch to it (after that, `.lang <keyword>` switches to it). The directory includes a `_custom_language_example.json` template for reference; changing individual texts of a built-in language works the same way.

### AI translation languages

If the argument of `.lang` is neither a built-in language nor has a translation file, the bot also checks the **AI translation languages** the dice master registered in the AI settings. When one matches, replies in that chat are translated into the target language by a large language model in real time before sending (replies are slightly delayed, and dice numbers are guaranteed not to change). See [AI](/en/manage/ai).
