# Character Sheets

Dice!Next has a complete built-in character sheet system with multiple sheets, random generation, sheet locking, group card name sync and check statistics.

::: tip Names in the examples
Attribute and skill names are whatever is recorded on your sheet. The examples use the Chinese names of the built-in COC rules, for example 力量 (STR), 敏捷 (DEX), 体质 (CON), 体型 (SIZ), 意志 (POW) and 侦查 (Spot Hidden). Names such as 张三 or 老猎人 ("old hunter") are just sample character names.
:::

## Command Overview

| Command | Description |
|------|------|
| `.st` | Record / change / view attributes |
| `.pc` | Manage multiple sheets (new / bind / copy / export / generate / lock / delete) |
| `.en` | Skill improvement (see [Dice & Checks](/en/use/dice)) |
| `.nn` | Set your nickname in the dice bot |
| `.nnn` | Random name (draws a random name and sets it as your nickname) |
| `.sn` | Set your group card name from a template |
| `.setsn` | Set which attributes the group card name shows in this group |
| `.hiy` | Check statistics |

## `.st` Recording Attributes

```
.st 力量50 敏捷60 hp12/12     → record attributes; hp/san/mp can be written as "current/max"
.st hp-2                       → increase or decrease (dice expressions allowed, such as san+1d3)
.st show                       → show the current sheet
.st show 60                    → show only attributes ≥60
.st show 力量 敏捷             → show only the listed ones
.st del 力量                   → delete an attribute
.st clr                        → clear the sheet (including linked attributes / formulas / weapons / maximums)
.st export                     → export as a single line that .st can import again
.st fmt                        → normalize attribute names using the synonym table (convert the sheet)
```

Chinese and English names and common aliases are normalized automatically (for example, 计算机 / 电脑 / 计算机使用 are recognized as the same Computer Use skill).

### Weapons and damage bonus

```
.st &手枪=1d10+2   → bind the weapon "手枪" (handgun); after that, .r 手枪 rolls its damage directly
.st db=1d4         → record the damage bonus by hand (the formula text is stored, not rolled into a number)
```

`db` (damage bonus) is a **formula attribute**: what you record is a dice formula, which is only expanded when rolling (`.r 1d3+db`). If you haven't recorded it by hand, after you record the sheet it is **calculated automatically** from STR + SIZ using the COC7 table, and the receipt tells you so; a manually recorded value always takes priority.

### Linked attributes (expressions)

```
.st 物防=敏捷+1     → 物防 (physical defense) always equals "DEX+1" and follows DEX when it changes
.st pd='dex+1'     → references to English attribute names need quotes
```

A linked attribute stores an expression. When it is read (in checks or `.st show`), it is evaluated against the current values of the attributes it references, and shown as "物防=敏捷+1(=61)".

### Automatic recalculation

With automatic sheet updates on (the default, COC mode only), when you change base characteristics such as CON / SIZ / POW, HP / MP adjust their current values **by the change in their maximum** (for example 4/13 becomes 6/15 after CON increases, rather than resetting to full), with a note such as "(auto sheet) recalculated because … changed".

The initial SAN equals POW (as in the original Dice!). 99 − Cthulhu Mythos is only the maximum: when Mythos increases, SAN is only pushed down if it exceeds the new maximum, not reduced by the difference. If SAN isn't recorded on the sheet yet, `.sc` checks against POW and writes the result to the sheet afterwards.

## `.pc` Multiple Sheets

### BDC cloud character sheets

Cloud character sheets and account authorization are all under `.cloud`; see [Cloud Services & Identity](/en/use/cloud) for the full description. The most common commands:

```text
.cloud auth [write] // request account center authorization; read-only by default, add write to also request write access
.cloud confirm // after entering the code on the web page and approving, confirm here in the private chat
.cloud list // list your cloud character sheets
.cloud pull <cloud sheet ID> [local sheet name] // pull a cloud sheet into a local sheet
.cloud push <local sheet name> // upload a local sheet for the first time
.cloud sync <local sheet name> // submit changes against the last synced version
```

All `.cloud` commands only work in private chats. After pulling, bind the sheet in your game group with `.pc tag <local sheet name>`; `.st`, `.ra` and `.sc` keep reading and writing the local sheet. Syncing is manual, and ordinary dice rolls make no network requests.

BDC device authorization currently only returns short-lived tokens, so you need to authorize again after it expires or the bot restarts, but local sheets and their sync links are kept. To revoke completely, go to "Authorized applications" in the account center. If the first upload times out, run `list` first to check whether it was created, so you don't upload twice.

### Managing local sheets

```
.pc new 张三       → create the sheet "张三"
.pc tag 张三       → use "张三" in this group
.pc rename 李四    → rename the current sheet (original alias: .pc nn 李四)
.pc untag          → unbind the current sheet (the sheet itself is kept)
.pc list           → list your sheets
.pc del 张三       → delete
.pc @someone       → view someone's sheet
.pc stat 侦查      → check statistics for the current sheet
.pc cpy 备份=张三  → copy "张三" into "备份" (backup) (also .pc copy)
.pc cpy 备份       → copy the currently bound sheet into "备份"
.pc grp            → show which sheet is bound in each group
.pc tojson [sheet] → export the given sheet or the current sheet as JSON
.pc type [rules]   → show / switch the group's rule system
.pc temp           → list sheet templates available for build
```

Once a sheet is bound, your roll nickname shows the sheet's name automatically. `.pc type` reuses Dice!Next's group rule system instead of keeping a separate "sheet type" that could drift; in the copy syntax the order around the equals sign is `target=source`.

### `.pc build` random generation

```
.pc build          → generate a sheet from the COC7 template (attributes with values are skipped)
.pc build pc:bg    → chain several templates with colons (pc = COC7 characteristics, bg = background)
.pc redo           → clear the current sheet first, then generate again
```

Templates are customizable: put a JSON template in the `card-templates/` (or `data/card-templates/`) directory and restart the bot to add new generation parameters. Templates support dice formulas, deck draw text and JS expressions (they can't yet be distributed with [rule packs](/en/develop/rulepack) and must be placed by hand).

### `.pc lock` locking a sheet

```
.pc lock w         → lock writing (.st and other changes are refused)
.pc lock r         → lock viewing
.pc unlock w       → unlock
```

Useful when the Keeper asks for sheets to be locked, so they can't be changed in the middle of a session.

## `.npc` Shared NPC Sheets for a Group

`.pc` manages **your own** sheets; `.npc` manages NPC sheets **shared by the whole group**, so the Keeper can create sheets for NPCs and roll for them. It only works in group chats.

```
.npc new 老猎人           → create the NPC "老猎人"
.npc list                → list all NPCs in this group
.npc 老猎人 st 力量50 敏捷60 → record attributes for the NPC (same syntax as .st)
.npc 老猎人 ra 侦查        → roll a Spot Hidden check as "老猎人"
.npc show 老猎人          → view the NPC's sheet
.npc del 老猎人           → delete the NPC and its sheet
.npc clr 老猎人           → clear the NPC's attributes (the NPC is kept)
```

`.npc <name> <subcommand>` runs the subcommand as that NPC (such as `st` to record or `ra`/`rc` to roll on its behalf), and the reply is prefixed with `【NPC：老猎人】`. You can't nest another `.npc` call while rolling on an NPC's behalf.

## `.nn` / `.nnn` Nicknames

```
.nn 阿强           → set your dice nickname to "阿强"
.nn                → clear the nickname
.nnn               → pick a random name and set it as your nickname (random Chinese / English / Japanese name)
.nnn jp            → a Japanese name (cn / en / jp)
```

When a sheet is bound, `.nn` / `.nnn` also rename the bound sheet, so the two names stay the same.

## Group Card Names `.sn` / `.setsn`

QQ Official can't change real group card names, so after you run `.sn` or `/sn`, your current sheet status appears at the top of later replies; `.sn off` turns your status line off. The dice master can choose under **Settings → Replies & display → QQ Official SN status line** between colored text (red by default; change it with the palette or a color picker), a quote, plain text, a custom format, or hiding it. Hiding it doesn't delete players' templates, which come back when it is shown again. It can be set globally, per adapter type and per account. Other supported platforms still change the real group card name. To put values such as HP and SAN at a chosen place in a reply, use the [dynamic status bar in roll texts](/en/manage/commands#show-character-status-in-roll-replies).

```
.setsn hp san dex  → set which items group card names show in this group (group admin required)
.sn                → update your group card name from the group template
.sn {nick} SAN{san} → set your personal status content
.sn auto           → turn on automatic sync: the card name updates as soon as attributes change
.sn auto off       → turn automatic sync off
.sn off            → clear
```

`hp` / `san` / `mp` derive their maximums automatically under the COC rules and are shown as "current/max".

## Check Statistics `.hiy`

```
.hiy               → show overall check statistics
.hiy 侦查          → show the roll counts / success rate / level distribution for one skill
```

::: tip In the web panel
Character sheets can also be viewed and edited in [Web panel → Players](/en/manage/dashboard).
:::
