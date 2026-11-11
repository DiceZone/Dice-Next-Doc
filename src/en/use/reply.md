# Custom Keyword Replies

Dice!Next supports flexible automatic replies to keywords, which you can build visually in [Web panel → Replies](/en/manage/replies). The Replies page has three tabs: **Basic replies**, **Causal rules** and **Counters**.

In chat, `.reply on/off` turns the group's custom replies on or off permanently (group admins or trusted users); you can also turn them off with `.group +禁用回复` (see [Group & System Admin](/en/use/admin)).

## Basic Replies

### Match types

| Type | Description |
|------|------|
| Keyword | Triggers only when the whole message is **exactly equal** to the content (case-insensitive) |
| Prefix | Triggers when the message starts with the prefix |
| Regex | The regular expression must match **the whole message** and can capture groups; the same whole-message matching as the original Dice |
| Search | Triggers when the message **contains** the content (case-insensitive) |

A rule supports **multiple conditions combined with AND / OR**, and **random results** (once matched, one of several replies is chosen at random), and can have a priority.

Regexes use the case-insensitive ECMAScript dialect, and whole-message matching doesn't require adding `^` or `$` yourself. For example, `白(丽|麗).{0,6}` only allows 0–6 characters after 白丽 / 白麗, and doesn't trigger with 7. For prefix-style triggering write `白(丽|麗).*`, and for contains-style triggering write `.*白(丽|麗).*`.

`.` doesn't match line breaks by default; to cover line breaks use `[\s\S]`, for example `[\s\S]*白丽[\s\S]*`. Spaces, tabs and line breaks are all part of the message, and the match preview doesn't strip leading or trailing whitespace. Quantifiers count ECMAScript UTF-16 units: common Chinese characters count as 1 and many emoji count as 2, which isn't the same as one visible glyph.

This is ECMAScript's `i` mode, not PCRE, and flags such as `u`, `m` and `s` are not enabled automatically. An expression can be at most 400 UTF-8 bytes; matching still has input, memory and execution time protection, and restoring whole-message matching doesn't remove those safety limits.

Rules that relied on Next's start-anchored regexes, or on partial regex search in causal rules, should state explicitly what is allowed before and after, for example `abc.*` or `.*abc.*`; the program never rewrites saved expressions. Rules from the original Dice that already matched whole messages don't need a `$` or re-importing.

For multiple replies you can set a weight for each one in the web panel and see the actual draw probability. For example, weights 3 and 1 correspond to 75% and 25%; the default weight is 1, the range is 0–999999, and 0 means never drawn. The rule's overall "trigger probability" and each reply's draw weight are calculated separately.

Old `::number::` markers are converted to separate weights when old data is imported or read, so you don't need to re-import; invalid markers keep their original text. The editor uses the separate weight field, so `::number::` in reply text is sent as written.

### Reply template variables

Reply content can use `{…}` placeholders, which are replaced when sending:

| Variable | Meaning |
|------|------|
| `{nick}` | The triggering user's display name (with wrapping symbols, which can be changed in the settings) |
| `{name}` | The triggering user's display name (character sheet name > `.nn` nickname > QQ nickname) |
| `{qqnick}` / `{card}` / `{pcname}` | QQ nickname / group card name / character sheet name (clean, without wrapping; add the `w` suffix, such as `{qqnickw}`, to include the wrapping) |
| `{user}` | The triggering user's account |
| `{self}` | The bot's name for itself |
| `{group}` | Group ID |
| `{date}` / `{time}` | Date / time |
| `{FormFeed}` | Forces a page break, splitting the content before and after into separate messages; case-insensitive, and not an ordinary line break |
| `{$1}` `{$2}` … | Regex capture groups; for prefix matches `{$1}` = the content after the prefix and `{$0}` = the whole message |

Old variable names in the style of the original Dice! (such as `{pc}`) also work as aliases, so old reply texts can be reused as they are.

For example, `First{FormFeed}Second` sends two message bubbles. The marker also works in command texts, personas, decks and Lua mod templates, and can be nested inside `sample:`. Explicit page breaks are not affected by the "split long messages automatically" switch or a platform's exemption from automatic splitting; consecutive, leading or trailing breaks never send extra empty messages. A `{FormFeed}` inside capture groups or nicknames is plain text only and is never executed again.

### Dynamic commands

| Syntax | Effect |
|------|------|
| `{roll:3d6+2}` | Evaluate a dice expression and replace it with the result |
| `{draw:塔罗牌}` | Draw one card from a deck |
| `{deck:塔罗牌}` / `{deck:%塔罗牌}` | Explicitly reference a file deck; the former draws without replacement within the current reply, the latter with replacement; not overridden by the group's temporary decks |
| `{help:entry}` | Explicitly reference a help entry |
| `{text:strHello}` | Explicitly reference a global text imported from the old CustomMsg |
| `{a\|b\|c}` | Pick one of the options at random |
| `{sample:甲\|乙}` | The original Dice! random choice syntax, picking one option with equal probability; in development, requires a version with that fix |
| `{counter:name}` | The current value of a counter (used with causal rules) |
| `{api:URL}` | Request a URL and put the response into the reply |

When importing old data, unambiguous bare references are normalized into the explicit prefixes above. `{deck}` / `{%deck}` become `{deck:deck}` / `{deck:%deck}` respectively, keeping the replacement rule; help and global texts become `help:` and `text:`. Every branch of nested `sample:` is processed, but escaped content isn't rewritten, and no cards are drawn and no dice are rolled during import.

Text that looks like a dice expression keeps its original text and is listed for confirmation, because the characters alone can't guarantee successful evaluation, and an old bare expression keeps its text on failure whereas an explicit `roll:` shows `?`. Once you know the meaning, you can add `roll:` by hand; the importer never changes the failure behavior on its own.

Variables with the same name, several resource types with the same name and references that aren't found keep their original text and are listed in the migration report. Only old replies that still have references awaiting confirmation keep bare deck references for compatibility, so variable meanings are never overridden by decks. Use explicit prefixes for new replies. Old replies that were already imported can be imported again from the original data; old rules with an identical complete definition are upgraded in place rather than duplicated, and the on/off state and priority adjusted by the dice master are kept.

::: warning {api:URL} external requests
`{api:}` makes the bot send requests to external URLs and is **off by default**. Turn it on under "External requests" in [Settings](/en/manage/settings).

For security, only http/https are allowed, and internal network / local addresses are blocked automatically; you can set an allowlist of domains in the configuration file (`dice.api_whitelist`).
:::

### Examples

```
Trigger: 天气
Reply: 今天{a|晴|多云|小雨}，记得带伞～

Trigger (regex): ^点歌 (.+)$
Reply: 已为你点播《{$1}》🎵

Trigger: 今日运势
Reply: {nick} 的运势：{draw:运势}
```

(天气 = weather: "Today it's {sunny|cloudy|light rain}, remember your umbrella"; 点歌 = request a song: "Now playing 《{$1}》 for you"; 今日运势 = today's fortune: "{nick}'s fortune: {draw:fortune}".)

## Causal Rules (Advanced)

"Causal rules" are a stateful reply engine that adds **condition gates** and **action chains** to basic replies, built in a visual editor.

Regex conditions in causal rules work the same as in basic replies and must match the whole message. For example, `\d+` only matches messages that are entirely digits; to match messages containing digits, write `.*\d+.*`. Capture variables come from the condition that actually triggered: OR uses the matching condition, AND prefers the first regex condition and otherwise uses the first condition. For a regex condition `{$0}` is the whole message and `{$1}` and so on are capture groups; when a prefix condition is the capture source, `{$1}` is the content after the prefix and `{$0}` is the whole message. Captured message text is only inserted as text and never executed again as a variable, deck or dice expression.

Causal rules use the shared engine's length limits: expressions up to 4096 UTF-8 bytes and input up to 64 KiB; execution time and memory protection still apply.

- **Conditions**: besides keyword / prefix / regex / search, you can add user filters, group filters, cooldowns (per user / per group / global) and counter checks (such as `check-ins ≥ 7`); multiple conditions also support AND / OR.
- **Actions**: send a reply (several, chosen at random), set / add to / reset a counter, call an API.
- **Scope**: global / specific groups / specific users, with priority and on/off.

Together with the "Counters" tab you can build things like check-ins, limited lucky draws and points; a counter's current value can be referenced in replies with `{counter:name}`.

## Inserting Images

Reply content supports images: when editing a reply in the web panel, click "Insert image" to upload. Images are saved as the platform-neutral code `[img,file=<local path>]` and converted automatically into the matching platform's image message when sending. You can also write CQ codes / SealDice codes directly (`[CQ:image,file=…]`, `[图片:…]`).

Choose how images are sent under System settings → "Image sending": **base64 embedded** (the default; works wherever the QQ framework runs) or **HTTP link** (a host can be configured; the device running the QQ framework must be able to reach it).
