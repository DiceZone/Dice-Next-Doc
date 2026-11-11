# Dice & Checks

All commands start with `.` (period); `。`, `!`, `！` and `/` also work by default, and custom prefixes follow your basic settings. Use **half-width (ASCII)** symbols in command arguments.

> This page covers four groups: general dice, COC checks, BRP checks and DND. For character sheets, see [Character Sheets](/en/use/card); for fun commands, see [Fun & Interaction](/en/use/fun).

::: tip Attribute and skill names in the examples
Checks read the names recorded on your character sheet. The examples use the Chinese names of the built-in COC rules, for example 侦查 (Spot Hidden), 聆听 (Listen), 心理学 (Psychology), 斗殴 (Fighting / Brawl), 力量 (STR), 敏捷 (DEX), 体型 (SIZ) and 理智 (SAN). Replace them with the names used on your own sheet. Plain text after an expression, such as 攻击 (attack) or 测试 (test), is the reason shown in the reply.
:::

## General Dice

| Command | Description |
|------|------|
| `.r` / `.rs` | Full roll / show only the final value; change the default die with `.set` |
| `.rd` | Roll the default die (`.rd6` and similar forms roll the given die) |
| `.rh` / `.h` / `.H` | Hidden roll; the result is sent to you privately (`.h` / `.H` are the original short aliases) |
| `.rah` / `.rch` | Hidden check (COC); the result is sent privately |
| `.rx` | Hidden Psychology roll (for the Keeper) |
| `.ww` | WOD dice pool (counts successes, 10s explode) |
| `.dx` | Double Cross chain roll |
| `.set` | Set / reset your personal default die, or switch the group's rule system |

### `.r` rolls

```
.r 3d6+2 攻击      → roll 3d6 plus 2, reason "攻击"
.r3d6+2 攻击       → same; the space between the command and the expression is optional
.r 2#d20           → roll d20 twice
.rs 3d6+2          → show only the final value, without each die
.rd                → roll the default die (d100 if not set)
.rd6               → roll a d6
.r 1d3+db          → db expands to the damage bonus formula on your character sheet
.r 他带着西服去干洗店 → text that isn't an expression becomes the reason; rolls the default die
.r 1次掷骰          → when digits are followed directly by text, the whole thing is the reason; rolls the default die
.rd 1次掷骰         → same; when d is followed by a space, d means the default die
```

Text after `.r` that isn't a dice expression is treated as the reason and the default die is rolled, as in the original Dice!. A start that has only digits and no dice (such as "1次掷骰" or "3次攻击", "roll once" / "3 attacks") is also treated as part of the reason; to roll a fixed expression, write the dice explicitly, such as `.r 1d6 打了3次`. The dice master can turn on "Disable roll reasons" in [Settings](/en/manage/settings); then only the result is shown, without any reason.

`db` (damage bonus) in an expression is replaced automatically with the formula recorded on your character sheet. If none was recorded, it is computed from STR + SIZ under the COC7 rules. See [Character Sheets](/en/use/card).

### `.rh` / `.h` hidden rolls and hidden checks

```
.rh 1d100          → hidden roll, result sent to you privately
.h 1d100           → same; uppercase .H also works and doesn't interfere with .help
.rah 侦查           → hidden check (reads the sheet), result sent privately
.rch 侦查 60        → hidden check with a given success chance, result sent privately
```

The group only sees a message that someone made a hidden roll; others can't see the numbers. House rules (`.setcoc`), bonus and penalty dice and so on still apply.

### `.rx` hidden Psychology roll

```
.rx @someone       → roll one Psychology check for the @mentioned investigator
.rx @someone 40    → with a given success chance
```

For the Keeper only: the detailed result, including the success level, is **sent to you privately**, and the group only gets a spoiler-free receipt. If you omit the success chance, the target's "心理学" (Psychology) on their sheet is used, defaulting to 10.

### `.ww` WOD dice pool

```
.ww 8              → roll 8 d10s; each ≥8 is a success, 10s add an extra die
.ww 8 7            → change the success threshold to 7
.ww8测试           → a reason ("测试") can follow the dice right away
.ww 8a10c7 攻击    → custom explode / success thresholds, with the reason "攻击"
```

Unlike `.r`, `.ww` counts **successes** rather than the total of the dice.

### `.dx` Double Cross

```
.dx 3c8            → 3 dice, critical value 8 (reaching it adds exploding dice)
.dx 5 10           → equivalent form (separated by a space)
.dx5c10测试        → reason with no space; the reply shows "掷骰 测试"
.dx 5c10 测试     → with a space, same effect
.dx 5a7            → a form: unlimited exploding dice pool (counts successes, WOD style)
```

### `.rs` short results / Fate (NdF)

```
.rs 3d6+2          → show only the final value, without the full calculation
.rsh d100          → short result can be combined with the hidden flag
.r 4dF             → roll 4 Fate (FUDGE) dice
```

`.rs` reproduces the short-result behavior of the original Dice!; Fate dice are still provided by the `NdF` expression. Each Fate die shows `+`, `0` or `-` (that is +1 / 0 / −1), and the full result looks like `4dF=[+ − 0 +]=1`.

### `.set` default die and rule system

```
.set 20            → set your personal default die to d20 (1-9999)
.set               → reset to d100
.set list          → list the rule systems you can switch to (★ marks the group's current one)
.set coc7          → switch the group's rule system and its default die (group admin required)
```

After setting a default die, both `.r` without an expression and `.rd` roll it. Rule systems are provided by [rule packs](/en/develop/rulepack); after switching, the commands, synonyms and so on from the pack apply to that group.

## COC (Call of Cthulhu)

| Command | Description |
|------|------|
| `.coc` | Generate COC7 investigator characteristics |
| `.ra` / `.rc` | Skill / characteristic check (reads the character sheet automatically) |
| `.rb` / `.rp` | Bonus die / penalty die |
| `.rad` | Roll d100 first, then check with the same roll |
| `.rav` | Opposed check |
| `.sc` | Sanity check (deducts SAN and saves it to the sheet automatically) |
| `.en` | Skill improvement |
| `.ti` / `.li` | Temporary / indefinite insanity symptoms |
| `.setcoc` | Set the group's house rule (critical success / fumble rules) |
| `.hiy` | Check statistics |

### COC character creation `.coc`

```
.coc / .coc7       → generate one set of COC7 investigator characteristics
.coc6              → generate one set of COC6 investigator characteristics
.cocd / .coc7d     → detailed COC7 character creation
.coc6d             → detailed COC6 character creation
.coc7d 3           → generate 3 sets at once (up to 10)
```

The trailing `s` flag that the original used for column layout is also accepted, for example `.coc7ds 3`; it doesn't change the numbers.

### Checks `.ra` / `.rc`

```
.ra 侦查           → check against Spot Hidden on your sheet
.ra 力量60         → check against a given value
.ra 困难侦查        → hard difficulty (困难 = hard)
.ra 侦查 @someone   → check on behalf of someone (reads their sheet)
.ra 2#侦查         → check twice in a row
```

Temporary modifiers such as `.ra 侦查-20` / `.rc 侦查+20` apply to the actual value on the currently bound character sheet, including linked attributes you have recorded; the rule's base value is only used when nothing is recorded, and the sheet is never changed. For example, with Spot Hidden at 50, these check against 30 and 70 respectively.

### Success chance arithmetic

The success chance can be written as an expression. Checks, opposed checks and attribute changes share the same arithmetic rules:

```
.ra 力量+20-30        → several additions / subtractions (checks against 50 when STR is 60)
.ra 力量 +20 -30 攻击  → modifiers can be separated by spaces; the text after them is still the reason
.ra 力量*2 / .ra 力量/2 → multiplication and division; the result is rounded down
.ra (力量+敏捷)/2      → parentheses and several attributes
.ra 侦查+1d10         → dice; the reply marks the rolled value
.ra 力量^0.5*10       → powers and functions such as sqrt, cbrt, exp, ln, log, sin, cos, max, min; constants pi, e
.ra 力量70+10         → the inline value replaces the sheet value before the arithmetic
.rav 力量+10 敏捷-5    → also works on both sides of an opposed check
.rc 力量+2-1          → in DND mode, applies to the modifier
.st hp-1d6+2         → everything after the sign is one amount: deducts (1d6+2), so you can copy a weapon's damage formula directly
```

For `.st`, everything after `+` / `-` is treated as one amount (as in the original Dice!), so a low roll never turns damage into healing; to calculate parts separately, add parentheses or split it into several commands. Check modifiers (such as `.ra 力量+20-30`) are a series of additions and subtractions on the skill value.

Intermediate values are real numbers and the final result is rounded down; the minimum success chance for a check is 1. Referring to an attribute that isn't recorded tells you its name. Syntax errors, division by 0 and values out of range (such as `10^1000`) produce an error immediately instead of a guessed result. To prevent abuse, a single expression is limited to 512 bytes, nesting depth and the number of terms are capped, and an expression can roll at most 1000 dice.

The fixed-result preview form `.ra(1)50` is unaffected: it is only treated as a preview when the parentheses contain just digits and dice and are not followed by an operator; `.ra (力量+敏捷)/2` is treated as an expression.

By default, and after switching to `coc7` / `coc7r`, both `.ra` and `.rc` use d100. `.pc type coc7r` (equivalent to `.set coc7r`) also leaves the old DND mode; `.setcoc <0-7>` restores CoC checks as well. `.rc` only uses d20 when DND is explicitly turned on, and `.ra` is always a CoC check. "Check again" in visual replies is an optional shortcut that keeps the original command's modifiers, difficulty, reason and prefix; it never re-rolls automatically.

If you were affected by the old mixed-mode problem and `.st` previously saved skills into the separate DND skill area, switch to CoC and record them again once with `.st 侦查50` and so on. Updates never move all DND skill bonuses into the character sheet as CoC percentages automatically, so as not to confuse your actual DND data.

Checks determine the success level automatically: critical success / extreme / hard / regular success / failure / fumble, affected by the group's `.setcoc` house rule.

### Bonus / penalty dice `.rb` / `.rp`

```
.rb 侦查           → 1 bonus die
.rp2 60            → 2 penalty dice, check against 60
.rapass23          → no-space form: parsed as .rap ass 23 by "longest command first"
```

### `.rad` check with the same roll

```
.rad               → roll a d100 and use it directly as a "d" check
.rad 侦查          → the first line shows the roll like .r, the second checks Spot Hidden with the same roll
.rad 侦查50 搜书房  → same, with a given success chance and a reason (搜书房 = search the study)
.rad 打了3次怪      → not a skill: the whole sentence is the reason, same as .rad
```

Good for "show the die first, then apply it to a skill": both lines use **the same roll**.

### Opposed check `.rav`

```
.rav 侦查 @someone  → both sides roll d100; compare success levels first, then the numbers
.rav 斗殴 60       → your side reads the sheet, the other side gives a value directly
```

### Sanity check `.sc`

```
.sc 1/1d6          → lose 1 on success, 1d6 on failure; SAN is deducted from the sheet automatically
.sc 1d3/1d10 50    → current SAN given as 50
.sc b 1/1d6        → sanity check with 1 bonus die (.scb also works)
.sc p2 1/1d6       → with 2 penalty dice
```

### Skill improvement `.en`

```
.en 侦查            → roll d100 for Spot Hidden; if it exceeds the current value (or >95), gain 1d10 and save it
.en 侦查 60         → with a given skill value
.en侦查60           → the original compact form, same as above
.en 侦查 +1d6       → custom gain on success (starts with +/-)
.en 侦查 -1/+1d10   → two-part "change on failure / change on success"
.en 侦查 0 -1/1     → lose 1 on failure, gain 1 on success; each side's sign is applied separately
.en 侦查 聆听        → improve several skills (also .en 侦查|聆听)
```

### Insanity symptoms `.ti` / `.li`

```
.ti                → draw a temporary insanity symptom
.li                → draw an indefinite insanity symptom
```

### House rules `.setcoc`

Changing it requires group admin permission, and the setting only applies to the current bot account in the current group; several bot accounts in the same group don't overwrite each other. House rules for coc7r are saved separately.

```text
.setcoc 2          → set house rule 2 (0–7)
.setcoc show       → show the current house rule
.setcoc help       → show what each number means (also .help setcoc / .setcoc list)
.setcoc clr        → back to rule 0
.setcoc dg         → use rule 6
```

In the table below, A is the skill value and D is the D100 result; integer division rounds toward zero. Special successes or failures are determined before the normal levels.

| Rule | Critical success | Fumble | Other levels |
| --- | --- | --- | --- |
| 0 (default) | D=1 | D≥96 when A<50; otherwise D=100 | Normal levels |
| 1 | D=1 when A<50; otherwise D≤5 | Same as rule 0 | Normal levels |
| 2 | D≤5 and D≤A | D=100, or a failed check with D≥96 | Normal levels; for example A=99, D=99 still succeeds |
| 3 | D≤5 | D≥96 | Normal levels |
| 4 | D≤5 and D≤A/10 | D=100, or A<50 with a failed check and D≥96+A/10 | Normal levels |
| 5 | D≤2 and D<A/10 (note: strictly less than) | D≥96 when A<50; otherwise D≥99 | Normal levels |
| 6 (DG) | A successful check with D=1 or doubles 11/22/…/99 | A failed check with D=100 or doubles | Otherwise only regular success / failure, no hard / extreme; A=100, D=100 is a regular success |
| 7 | No critical success | D=100; or D=96–99 and (90−A)/20+D≥100 | When D<96, D=1 or D≤A/5 is extreme, otherwise regular success / failure by A; 96–99 without a fumble is also a failure; no hard success |

"Normal levels" for rules 0–5: D≤A/5 extreme, D≤A/2 hard, D≤A regular success, otherwise failure. For example, under rule 5 with A=20 and D=2 the result is extreme, not a critical success; under rule 7 with A=50, 98–100 is a fumble.

House rules affect COC skill checks and bonus / penalty dice; they don't change the numbers of ordinary `.r` rolls or other rule systems. Sanity checks also have their own rules for sanity loss, so skill levels can't be used directly as a sanity loss formula.

### Check statistics `.hiy`

```
.hiy               → show overall check statistics
.hiy 侦查          → show the roll counts / success rate / level distribution for one skill
```

## BRP (Basic Roleplaying)

| Command | Description |
|------|------|
| `.ba` | BRP check (d100 roll-under) |
| `.bav` | Resistance table opposed check |

### `.ba` BRP check

```
.ba 侦查           → check against the sheet
.ba 斗殴60         → with a given success chance
.ba 侦查 @someone   → roll on someone's behalf
.ba 2#侦查         → roll several times
```

Success levels: critical ≤ skill/20, special ≤ skill/5, success ≤ skill, failure > skill, fumble (a roll of 100, or 99 on a failure).

### `.bav` resistance table

```
.bav 力量 体型      → active side's STR vs. passive side's SIZ (names read from the sheets, or give numbers directly)
```

Target % = 50 + (active − passive) × 5; the active side wins if 1d100 ≤ target.

## DND (Dungeons & Dragons)

| Command | Description |
|------|------|
| `.dnd` | Generate DND ability scores (4d6, keep the highest 3) |
| `.setdnd` | Turn the group's DND5e mode on or off |
| `.rc` | d20 check in DND mode (advantage / disadvantage) |
| `.buff` | Temporary ability bonuses |
| `.ri` / `.init` | Initiative list |
| `.ss` | Spell slot management |
| `.cast` | Spend spell slots to cast |
| `.longrest` | Long rest (restore HP and all spell slots) |
| `.ds` | Death saving throw |

### DND mode `.setdnd`

```
.setdnd on         → turn on DND5e mode for the group (.rc becomes a d20 check)
.setdnd off        → turn it off (.rc goes back to COC d100)
.setdnd            → toggle
```

### d20 checks `.rc`

In DND mode `.rc` becomes a d20 check. For the six abilities, the ability score (including `.buff` bonuses) is first converted into the modifier `floor((score−10)/2)`, then the temporary modifier in the command is added; skills use the recorded check bonus. For example, with STR 18, `.rc 力量-5` is `1d20 +4 -5`:

```
.rc 力量           → 1d20 + STR modifier
.rc 优势 力量+2     → advantage (two d20s, keep the higher), plus 2 (优势 = advantage)
.rc 劣势 敏捷       → disadvantage (keep the lower) (劣势 = disadvantage)
.rc 5 攻击         → give the modifier 5 directly
```

### Modifier checks `.rdc`

`.rdc` checks directly against the ability modifier: abilities use `(score−10)/2` rounded down, and skills read their separate check bonus.

```
.rdc 力量+2 破门 15       → 1d20 + STR modifier + 2, reason "破门" (break the door), DC 15 (≥ counts as success)
.rdc 3# B 力量+2 破门 15  → 3 rounds; B keeps the higher (P keeps the lower)
```

Up to 9 rounds, using the `N#` prefix. `.rdc` is only available in groups with DND5e mode on (`.setdnd on`).

### Temporary bonuses `.buff`

```
.buff 力量:2       → set a +2 STR buff
.buff 力量+1       → increase or decrease
.buff              → show current buffs
.buff del 力量     → delete one
.buff clr          → clear all
```

Buffs count toward DND-mode `.rc` checks and attribute reads.

### Initiative `.ri` / `.init`

```
.ri +2             → roll d20+2 and join the initiative list
.ri +2 哥布林       → join under a given name (哥布林 = goblin)
.ri +1d4 哥布林     → roll d20+1d4; the modifier dice are not taken as a name
.ri 1d6 哥布林      → use the given initiative expression
.ri 1d6 3#哥布林    → three separate initiative entries, each rolling d6, numbered
.init              → show the list sorted by initiative
.init clr          → clear the initiative list
.init del 哥布林    → delete one entry
```

### Spell slots `.ss` / `.cast`

```
.ss init 4 3 2     → set the maximum slots for levels 1/2/3
.ss set 3环 5      → set one level (3环 = 3rd level)
.ss 3环 -1         → increase or decrease
.ss                → show current spell slots
.ss rest           → restore all
.ss clr            → clear the settings
.cast 3            → spend 1 3rd-level slot
.cast 3 2          → spend 2
```

### Long rest `.longrest` / death saves `.ds`

```
.longrest          → restore HP to maximum and all spell slots (also .长休)
.ds                → death saving throw (also .死亡豁免); requires HP 0
```

Death saves follow the DND5e rules: 3 accumulated successes stabilize, 3 failures mean death; a natural 20 restores 1 HP, and a natural 1 counts as 2 failures. A long rest requires setting maximum HP first with `.st hpmax:<value>`.

## Command Conventions

- Use half-width (ASCII) punctuation; `[required]`, `(optional)`.
- Use the `N#` prefix for several rounds of checks to avoid flooding the chat.
- **The space between a command and its arguments can be omitted** (as in the original Dice!): `.help指令`, `.ri+2` and `.rd6` are all valid. When names overlap, the longest command wins (for example `.rapass23` = `.rap ass 23`); to give letter arguments to a shorter command, separate them with a space.
- When you hit a rate limit there is a cooldown; please wait.
