# Commands

**Web panel → Commands** shows every command in one place and lets you **customize the bot's reply texts** and manage the bot's **personas**.

At the top of the page are the persona dropdown and the "Persona management" and "Persona access" buttons; below, all editable texts are shown in tabs by category.

## Global Search

The search box above the category tabs works across all categories: search by command name (with or without `.`), example, description, category, reply key or current reply text, and multiple keywords must all match. While searching, the list shows matching commands from every category labeled with their category; clicking a category label clears the search and jumps to that category, and the tabs on the left show each category's match count. If reply texts also match, a count appears above the results; click it to view them in "All texts".

## Show Character Status in Roll Replies

Edit a roll text, and under the body choose **Buttons, status bars & formulas → Add status bar**, then fill in the name, current value and maximum. By default `[[bar:HP|{hp}|{hpmax}]]` is inserted. After saving, the current sheet's HP and maximum are read when the reply is sent; you can change it to `[[bar:SAN|{san}|{sanmax}]]`. A global search for "SN" or "状态条" (status bar) also finds the entry.

There is also the separate `.sn` feature: run `.sn` or `/sn` in a QQ Official group, and later replies show your current sheet status at the top; `.sn off` turns your status line off. The dice master can adjust its appearance or hide it in [Settings → Replies & display → QQ Official SN status line](/en/manage/settings#qq-official-sn-status-line). QQ Official can't change real group card names, so the status is shown at the top of replies instead. Other adapters that support changing group card names keep changing the real card name. The dynamic status bar is for inserting values at the place you choose in a roll text, and doesn't require `.sn` first.

## Tabs

| Tab | Content |
|---|---|
| All texts | Reply texts of every command (each can be customized) |
| All variables | Descriptions of the variables available in texts |
| Invalid texts | Orphaned text keys that are referenced but no longer exist (for cleanup) |
| Rolls | Expression rolls, dice pools and roll error messages |
| COC | COC checks, sanity, skill improvement, plus BRP checks and opposed rolls; includes success level phrases |
| DND | DND character creation, ability checks, initiative and related rules |
| Campaigns | Session logs, sessions and campaign operations |
| Interaction | Decks, fun, AI conversation and bot persona switching |
| Tools | Character sheets, attribute management, nicknames and other utilities |
| Admin / permissions / system | Group and account management, permission messages, system settings and old text compatibility |

"All texts" is shown as **command example → description → key → current text**; click any column header to switch between ascending / descending, and the narrow-screen card mode also offers sorting options. The global search at the top works on this table too, matching command examples, feature descriptions, original key names and current text at once, and you can filter by feature category. Automatic events and shared messages with no fixed command are clearly marked, and no nonexistent commands are generated.

Each feature group can also be expanded to edit its texts directly; for example, "COC → Check result levels" changes critical success, extreme, hard, regular success, failure and fumble. BRP keeps its own feature entries and result texts but shares the tab with COC. Character sheet features belong to "Tools", and decks, fun and AI to "Interaction". Unknown texts brought in by imports or extensions remain in "All texts" labeled uncategorized; standalone `help.topic.*` custom help, however, has moved to [Help Documents](/en/manage/help-docs) and shouldn't be cleaned up as invalid text. Usage text tied to commands and help text editing in the persona layer are unaffected.

Click `Edit` on the right of a text to rewrite it; changed entries are marked with `●` and can be **restored** to the default text in one click. "System → Old text compatibility" also includes the receipts of `.strSelfName` / `.strSelfCall`; the name and self-reference themselves still use their dedicated configuration rather than ordinary template overrides.

"Tools → Shortcuts" includes the management receipts, lists and call result prefix of `.alias` / `.&` / `.a`; the question mark next to the title shows the full usage. Text-specific variables include `{shortcut}` (shortcut name), `{source}` (group / personal), `{command}` (the expanded target command) and `{list}` (the list); previews use sample values in the language and never run the target. The call prefix and the body are placed on separate lines automatically; you can set the prefix to empty to hide it, but that doesn't change the target logic or switches. The receipts for old account permission links remain under "Permissions → Account aliases", matching `.admin account-alias`, and aren't overwritten by the new shortcut texts.

## Customizing Reply Texts

Almost all of the bot's replies (roll results, check success / failure, all kinds of messages) are stored as template text that you can rewrite here. Click "Edit" on an entry to open the editing dialog:

- **Wide screens**: edit on the left with a live preview on the right; each column scrolls on its own, so you always see the expected reply while editing.
- **Narrow screens**: switch between "Edit / Expected reply example" at the top.
- Save, discard and "Load preset" stay at the bottom.

### Roll reasons and text inheritance

The ordinary single-round reply `dice.roll.result` and the reply with a reason `dice.roll.result_reason` can be set separately. When the reply with a reason isn't set on its own, it inherits the ordinary single-round text customized for the current persona or globally; when neither is set, the original built-in text is used. Multi-round works the same way: `dice.roll.multi_reason` inherits a customized `dice.roll.multi`. An explicitly saved empty reply still means no output.

For example, the input `.r 5-\(-1\)` contains backslashes and isn't a valid arithmetic expression; the old-version compatibility logic treats it as the reason for a default roll, and it also follows the text inheritance above. To subtract a negative number, use `.r 5-(-1)`, which gives `6`.

### Editing and the format toolbar

Above the text box is a Markdown format toolbar: **bold, italic, strikethrough, inline code, heading, quote, bulleted list, numbered list, horizontal rule, link**. Select text and click once to apply, click again to remove; with nothing selected, a sample text you can rewrite is inserted. Bold and italic also work with Ctrl/⌘+B and Ctrl/⌘+I.

- A selection spanning several lines is applied line by line, because inline formatting on QQ, Discord and KOOK can't span lines.
- When you add a list after ordinary text, the blank line QQ requires is added automatically.
- The horizontal rule `***` is only displayed by QQ Official; Discord and KOOK show it as raw text.
- QQ Official Markdown supports headings, bold / italic / strikethrough, links, images, lists, quotes and horizontal rules, but not tables or code blocks, and the built-in presets only use these forms.

The toolbar only adds and removes markers in the source; template syntax such as `{variables}`, `[[buttons]]` and `{sample:…}` always stays exactly as you see it and is never rewritten or escaped.

The variable and image buttons sit right below the text box:

- Command-specific variables are shown as light chips; click to insert at the cursor;
- General variables such as `{nick}` and `{user}` are inserted with "Insert global variable";
- `{FormFeed}` is the old-compatible forced page break marker, not a display value like a nickname, and the preview shows the actual separate messages.

Buttons, status bars and formulas are all written into the same template; you can add, edit and delete them separately below the body or edit the source directly, and they are kept when the body changes.

### Content format

**Newly edited texts use Markdown by default.** Platforms such as the QQ Official Bot, Discord and KOOK send rich text; plain text platforms such as OneBot automatically use the plain text version generated when saving, keeping the visible text, CQ codes and dice expressions.

**Plain text** is for old texts, plugin replies and historical persona texts: characters such as `**`, `#` and `>` are sent as they are. For entries already saved as plain text, a notice appears at the top when editing, with "Convert to Markdown":

- The server only escapes characters outside `{variables}` and `[[buttons]]` that would actually trigger formatting, so the text players see doesn't change;
- After conversion, the format toolbar can be used.

**You don't need to change entries one by one when migrating from the old version**: "More → Convert all to Markdown" in the upper-right corner of the Commands page converts in bulk for the current language and the layer currently being edited (global or a persona). Before converting, it shows the count and how many need escaping, and only writes after you confirm.

The format choice is under "Advanced options", collapsed by default, together with the entry's default text.

Dynamic values such as nicknames and reasons are still escaped by the server, so player input can't change the template layout. Level phrases (such as failure in "COC → Check result levels"), Psychology receipts, affection titles and so on are texts too:

- When saved as Markdown, they keep their own style after being substituted into the check result, and plain text platforms only show the text;
- When saved as plain text, characters such as `**` are shown as written;
- The editing preview and the actual reply follow the same rules.

You only edit this single Markdown source. When saving, the server rebuilds the plain text version along with it: built-in templates are generated at startup / reload, and persona templates when loaded. Both versions keep the same `{variables}`, and actual values are only substituted when replying, so switching the display style doesn't require re-saving entries one by one.

### Loading presets

The "Load preset" menu at the bottom chooses a starting point for editing:

- **Traditional / Standard / Advanced visual**: puts the complete built-in text, buttons and status bars of that display style into the current reply. If there is content, it asks first, and other random replies and weights are kept; it takes effect after saving. When an account uses a different display style on its own, you can load the matching preset here.
- **Clear customization (follow default)**: deletes the saved custom text, and the reply follows the global display style again. For entries tiered by result, this is shown as "Restore inheritance".

Loading a preset only changes the editor content and never changes the global or account display style; existing custom texts are never replaced automatically. The advanced visual preset uses bold headings and quote blocks for layout, without emoji.

### Live preview

The preview area offers:

- **Platform choice**: QQ Official group chat, C2C and channels separately, plus KOOK, Discord, and OneBot / Milky / plain text; channels are never previewed as QQ Markdown.
- **Style choice**: traditional, standard, advanced visual, and simulating `.bot text plain`. These choices are only for previewing and don't change the saved global / account configuration.
- **Text view / transport structure**: the backend uses the actual text / card serializers. Formulas are shown with restricted local math rendering, not a screenshot of the QQ client; CQ / media uploads, identity mapping and platform permissions aren't simulated. When the API is unavailable, an error is shown, and the original text is never passed off as the degraded result.

Template variables are filled with sample values in the preview; this is only for viewing the layout, and no real dice are rolled and no messages are sent.

::: tip Switching the whole display style
Choose traditional, standard or advanced visual texts in **System settings → Replies & display → Reply texts and visual style**, or override only a platform or an account. Personas still control the tone, and the display style only controls layout and interaction.
:::

> Rewriting texts doesn't change command logic, only the wording. For different sets of tone for different situations, use the "personas" below.

## Full Replies by Check Result

In "COC → Standard replies by result level", you can set the **full reply** for critical success, extreme success, hard success, success, failure and fumble separately, not just the level phrase at the end. There are also "special success" for BRP and "tie" for opposed checks.

Other check features have matching levels too, each of which can turn on "Set a reply for this level separately". The inheritance order is:

```text
This check's reply for the level → the standard check's reply for the same level → the command's original text
```

Levels that aren't set keep inheriting, and no fixed copy of the text is created automatically. Clicking "Restore inheritance" only deletes the override in the current editing layer; when editing a persona, items the persona doesn't set inherit the global item with the same name first. The interface shows the current source and previews the inherited text.

| Check | Results that can be set separately |
| --- | --- |
| COC `.ra/.rc/.rad`, including hidden checks | The six COC levels; the detailed reply of hidden checks is still only sent privately |
| Bonus / penalty `.rb/.rp`, `.rab/.rap`, `.ra b/p` | Six levels each; pure bonus / penalty rolls without a skill / success chance don't determine success or failure |
| BRP `.ba` | Critical, special success, success, failure, fumble; special success is never passed off as COC extreme success |
| SAN `.sc` (including bonus / penalty) | The six COC levels; only the text changes, and the loss and sheet deduction happen as usual |
| Improvement `.en` | Success / failure, judged by the high roll of improvement rather than COC's roll-under success rule |
| Hidden Psychology `.rx` | Detailed private results for six levels; the group receipt still doesn't reveal the result |
| Opposed `.rav/.rcv` | First party wins / loses / ties, using the success / failure / tie replies respectively |
| BRP resistance `.bav` | Active side success / failure |
| DND `.rdc` | Success / failure when a target DC is given; `.rdc` without a DC and DND `.rc` keep ordinary results |
| Death save `.ds` | Natural 20 (critical), success, failure, natural 1 (fumble); stabilized / dead state messages are still kept |

Ordinary `.r`, WOD success pools and Double Cross totals have no overall target, so they're never forced into success / failure. Consecutive checks choose the matching level for each roll rather than using the first roll's result for the whole command; when no result replies are configured, the original output layout is kept.

Each level can use native multiple replies, weights, persona overrides and nested `{sample:…}`. For example, the bonus die "success" can be set to:

```text
**{nick}** 的奖励骰检定：`{roll}/{rate}` **{level}**
{sample:好运站在你这边|这次抓住了机会}
```

General variables include `{nick}`, `{attr}`, `{reason}`, `{roll}`, `{rate}`, `{level}`, `{res}`, `{result}` and `{outcome}`. `{result}` is the plain numeric value used for judging; `{roll}` is the roll detail; `{res}` keeps the original meaning of its command. SAN's `{loss}/{final}`, improvement's `{change}/{final}` and so on are only offered in the editors of those features and can't be put in the standard level replies shared across commands. A custom full reply that should show the reason must keep `{reason}` itself.

The preview uses sample values for the chosen level, never rolls real dice and never sends messages. When inheriting "the command's original text", the preview shows a representative template; in practice, the original variants are still chosen based on the reason, sanity loss, whether improvement changed and so on.

Existing global / persona texts and old imported items are never overwritten because of the new result slots; new slots are empty by default. This doesn't mean every old text macro is compatible, though; see [the limits of old text migration](/en/guide/migration#custom-texts-and-help).

## Old Check Text Compatibility

"COC → Old check text compatibility" provides the single-round level phrases and the check prefix separately; the SAN and improvement entries have their own old templates as well. **The built-in compatibility defaults aren't enabled automatically**; they are only used after you save an override or migrate old texts, with this priority:

```text
This kind's full level reply → the standard full reply for the same level → a native command template you set → an enabled old compatibility template → the native default template
```

Old single-round phrases only affect the level text, and multi-round checks still use the original shared level phrases; `{level}` in ordinary native templates also uses the corresponding phrase you set. When consecutive multi-round checks use the old prefix, it is inserted only once before the first compatible output. Hidden checks still only send results privately, keeping a short receipt in the group.

Text-only conditional macros can be nested:

```text
{grade:rank?2={strSuccess}&1={strFailure}&0={strFumble}}
{case:loss?0=没有理智损失&else=理智减少{change}，剩余{final}}
{sample:今天精神不错|{case:loss?0=松了口气&else=保持冷静}}
```

`case` matches the field string exactly, and `grade` chooses the largest numeric threshold not above the field value; `else=` specifies the branch when nothing matches. Conditions only choose text and never run scripts, network requests or file operations.

You can also use safe functions such as `{var:本次={ran:1~100}}{本次}`, `{len:nick}`, `{len:game.pls}`, `{expired:timestamp field}`, `{at:}` and `{print:uid}`; the fields depend on the context available at the current entry point. `len` counts text in UTF-8 bytes and returns the number of people for the current campaign's player / GM sets; `print` only reads names from the current account's cache and keeps the ID when the cache is missing.

`{wait:1000}` asks for the final reply to be delayed by one second without blocking message reception; the preview only removes this control syntax and doesn't actually wait. Each reply can wait at most ten minutes, and the queue has count and size limits; disabling, blacklisting, disconnecting, reloading plugins or restarting the program may cancel replies not yet sent. It never delays admin actions the command has already executed. For the full syntax and limits, see [Safe text functions](/en/develop/lua-mod#safe-text-functions).

In the old SAN slot, `{res}` is "roll detail / SAN", and `{rank}` is fumble 0, failure 1, success 2, hard 3, extreme 4, critical 5 in order; `{change}` is the detail of the same sanity loss roll, and `{loss}/{final}` are the actual loss and remaining sanity. These old meanings only apply to the compatibility slots and **don't change the numeric meaning of `{res}` in the new SAN level replies**. In the improvement compatibility slot, `{res}` keeps the old roll, skill value and level description.

Mapped references such as `{strEnRoll}` are resolved in the current language and persona, and can also be written explicitly as `{text:dice.compat.growth.base}`. References keep their dynamic relationship rather than copying fixed text; referenced multiple probability replies and nested samples are still chosen at each output. Circular or overly deep references are capped, and content in player nicknames or reasons is never executed as a macro.

The editor preview uses the same backend parser, with the current language and persona also applied to reference resolution; when inheriting old slots, they are shown with the corresponding old variable meanings. Template parsing and Markdown / plain text conversion are still cached at load and save time. For import or historical repair reports, see "Backup & import" and [the migration limits](/en/guide/migration#custom-texts-and-help).

## Status Bar and Action Hint Components

Built-in texts, persona texts and advanced replies share two semantic components. The editor can insert examples directly; then replace the values or text with variables the current text supports:

```text
[[bar:HP|{hp}|{hpmax}]]
[[action:roll command|.r]]
```

The button editing area takes the button text and the command to fill in separately. QQ titles are at most 10 characters, and long titles are shortened; command arguments are never truncated. Command templates support the current reply's variables; for example, a check text can use `[[action:check again|{command}]]` to keep the original command, modifiers and reason.

Components aren't a Markdown snippet for any one platform. After variables are substituted, Dice!Next renders them according to the current display style: the traditional style keeps concise data, the standard style uses ordinary emphasis, and the advanced visual style generates character status bars and action hints. When QQ Official has Markdown and interaction permissions, action hints become command input shortcuts that fill the clicker's own input box rather than running immediately; on OneBot, Milky or when rich messages fail, readable text such as `.r // roll command` is still sent, and no images are generated automatically.

The advanced visual style also recognizes `.command // description` lines in built-in usage. For example, `.bot on/off` generates two options, `on` and `off`, and usage with `<name>` or `[argument]` leaves the cursor where you need to fill in. Buttons only help you fill in; the user still confirms sending, and existing permission checks are never bypassed.

### Formulas in Texts

Command texts and persona texts also have "Add formula": enter TeX without `$` on the left and plain replacement text on the right. For example, in a check result:

```text
[[math:\textcolor{#E5484D}{\frac{ {{roll}} }{ {{rate}} }}|{roll}/{rate}]]
```

Template variables inside formulas use double braces `{{roll}}` to distinguish them from TeX group braces; the replacement text on the right still uses `{roll}`. Variable values are escaped by the program into numbers or text in the formula, so player nicknames can't become TeX commands. Formulas never re-roll; they only show data this check already has. Use `\vert` for a vertical bar inside a field; don't use the component's `|` separator or the `]]` end marker.

Markdown displays that support formulas use the formula on the left; the traditional style, forced plain text and plain text platforms use the text on the right. The editor lets you switch platforms and plain text mode to check both. The supported formula range on QQ depends on the platform's actual capabilities, and the local preview never runs HTML, external links or images in formulas.

## Random Texts `{sample:…}`

The local compatibility additions of 2026-10-19 add template-local variables and small functions, which still need to ship in an installation package. For example:

```text
{var:今日签={ran:1~100}}{nick} 抽到 {今日签} 号，再次引用还是 {今日签} 号。
```

`{var:name?value}` also displays the assigned value, while `{var:name=value&other=value}` only saves local variables for this rendering; nothing is written to character sheets or system settings. They can be mixed with nested sample, case and grade.

`{ran:min~max}` is an inclusive integer random number independent of game rolls; `{len:field}` returns the UTF-8 byte length of the text, and `{expired:field}` checks whether a Unix time has passed. `{at:}` mentions the current user, `{at:account}` mentions a specific account and `{at:self}` mentions the current bot, all output as CQ mention segments the platform can convert; invalid targets produce no segment. `{print:uid}` / `{print:gid}` show the current identity, and explicitly given accounts don't trigger extra network lookups for names.

The current context can also read `uid`, `gid`, `selfId`, `user.trust`, `user.favor`, and the values of your own character sheet that aren't read-locked as `char.attribute`. Catalog variables such as `list_all_deck` are good for writing usage notes that update themselves; see [Lua mod automatic catalogs](/en/develop/lua-mod#automatic-catalogs). The preview uses the same backend parser but only with sample data, without listing real group members or private directories.

The original Dice!'s random choice syntax has shipped in later Releases and is included in beta.925; build 909 and earlier don't support it. You can write it directly in roll replies or persona texts; for example, edit `dice.roll.result`, keep the existing variables and append:

```text
{nick} 掷骰：{res}
{sample:效果拔群|干得漂亮}
```

Each rendering picks one option with equal probability, and `sample:` never appears in the result. Dice results and check rules don't change. Options can reference variables the text already supports, and can be nested:

```text
{sample:本次结果是 {res}|{sample:效果拔群|干得漂亮}}
```

Plain text and explicit Markdown texts are supported, and only the chosen option is processed. Options are separated with the half-width `|`, and separators inside nested braces aren't split into outer options. The existing `{a|b}` shorthand in custom replies is kept; in roll and persona texts, use the explicit `{sample:a|b}`.

## Native Multiple Probability Texts (Shipped, Build 926)

When editing a roll reply or persona entry, use "Add reply" and "Delete this one" to manage several candidates. Each has its own body and an integer weight, with the actual probability shown next to it: weights 1 and 3 correspond to 25% and 75%; 0 pauses that candidate, and at least one must be above 0. Up to 256 candidates, with at most 64 KiB of candidate text in total.

Only one candidate is drawn each time, and line breaks are just line breaks within that candidate. Variable insertion and the format toolbar apply to the current candidate; the whole reply key uses one output format.

Old {sample:a|b} doesn't need rewriting. A complete outer sample can be expanded with "Convert the outer sample into equal-probability multiple replies", after which you can adjust each weight; samples in the middle of a sentence or inner samples are never split by mistake. Native candidates can still contain nested samples; for example, choose the Markdown format and write:

```text
**{nick}** 掷骰：`{res}`
{sample:效果拔群|{sample:干得漂亮|再接再厉}}
```

In ordinary roll results, {res} contains the expression and the result; each reply key can only use the variables listed by the editor, and other variables in preview samples can't be assumed to work for every command.

The preview first draws by candidate weight, then resolves the samples inside, and finally fills in the sample variables. Click "Draw preview again" to see another random result; the different transport views of one preview share the same draw. No real messages are sent and no game dice are used.

When saving, the Markdown / plain text versions of each candidate are cached, so the whole set of texts isn't reconverted on every send. Copying personas, import / export and restarts keep the text, weights and format. Both the core and the WebUI need upgrading; the new frontend refuses to save native probability texts to an older backend that doesn't support them.

## Bot Personas

A **persona** is a set of overrides for the reply texts above. With a persona enabled, its entries take priority over the "Default (global)" texts with the same name; entries the persona doesn't rewrite still fall back to the global custom texts or the built-in texts. After switching to a persona and editing texts, changes are only saved to that persona; groups and channels switch personas with [`.rpmode`](/en/use/fun) to change the whole tone at once.

- **Persona dropdown**: choose "Default (global)" to edit global texts, or a persona to edit its own overrides. When a persona is selected, the page shows "Editing persona '…'".
- **Persona management** (button): create / copy / rename / delete personas, or set one as the global default. Built-in personas can't be deleted. "Feature management" in a group's details can make a single group inherit the adapter or global default, turn personas off explicitly, or use its own override persona.

Click "Persona access" at the top of the page, choose a bot account first, then set that account's default persona and which personas users can see and choose through `.rpmode`: all personas, only selected personas, or no switching by users. After choosing "Only selected personas", check the personas to open and save. The settings are saved separately per bot account; the persona dropdown used for editing texts at the top doesn't change the account settings here.

The account's default persona and the user access list are independent, so a bot can always use one persona while only opening a few personas of the same character, without another bot's character accidentally appearing in the list. The access list grants no extra permissions: switching in groups still requires group admin, inviter or dice master permission, and switching in private chats only affects the current user. The dice master can still bind any persona to a group in the panel. Editing platform connection information never overwrites these settings.

For the matching chat commands, see [Fun & Interaction → Switching the bot's persona](/en/use/fun).

### Random multiple personas (shipped, build 926)

In "Persona management", open "Random multiple personas", enable several candidate personas, set a weight for each, then click "Save persona probabilities". The base reply can also be a candidate, and probabilities are calculated the same way as native multiple texts.

Each command draws one persona first, and the whole reply uses that persona; then each reply key draws its text and inner samples. Unrewritten keys still fall back to the global or built-in texts. Persona and text draws don't use the game dice random source.

The priority stays: personal private chat / explicit group choice → the account's default persona → the global random pool → the single global persona. Turning personas off explicitly still works; `.rpmode inherit` or "Inherit" in the group details uses the account / global policy again. Querying with `.rpmode` shows the random multiple personas without drawing.

The configuration is kept across restarts. Switching back to a single persona clears the global random pool; deleting a persona removes it from the pool, and if the last positively weighted candidate is deleted, the single persona / base reply is restored rather than keeping an all-zero pool.

## Import / Export

`Export` / `Import` in the upper-right corner back up or migrate all custom texts and persona overrides, making it easy to sync between deployments.

::: tip Compatibility
This page shows Dice!Next's native commands and the compatibility entries verified one by one. For differences from the original Dice! and safety limits, see [Data Migration → Compatibility limits of old commands](/en/guide/migration#compatibility-limits-of-old-commands); for the scope of SealDice JS plugin compatibility, see the [JS Plugin API](/en/develop/js-plugin-api).
:::
