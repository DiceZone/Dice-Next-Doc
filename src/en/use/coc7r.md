# coc7r: Keeper Companion Optional Rules

This feature follows Chaosium's **Call of Cthulhu Keeper Companion (2026, CHA23197-H)**. It is a supplement for the seventh edition; `coc7r` is just the Dice!Next configuration name and doesn't mean an official new edition was released. Page numbers below are the printed page numbers in the book.

The revised rules in the book are all options that can be adopted one by one (introduction, page 5), so every part of this rule pack can be turned on or off individually, and parts that are off fall back to core CoC7.

## Turning It On and Back Off

A group admin enters:

```
.set coc7r
.coc7r help
```

To go back to the original CoC7:

```
.set coc7
```

Every `.coc7r` command can be shortened to `.c7r`. Switching only selects the rules for this group; existing sheets are never converted or overwritten. Your original CoC7 house rules are kept; the skill check house rule for `coc7r` is saved separately and defaults to rule 0. `.coc7` and `.coc6` still explicitly generate the original characteristics.

"Rules" in the WebUI can edit the default value of each rule in this pack. Updating built-in resources never overwrites changes or disabled states saved to `data/rules/`.

## The Rules

The examples use the Chinese skill names of the built-in rules, such as 侦查 (Spot Hidden), 安抚 (Psychology used to reassure), 理智 (SAN) and 幸运 (Luck).

| Rule name | Content | Default | Book pages |
| --- | --- | --- | --- |
| `creation` | `.coc` and `.pc build` give a pool of 8 `(2D6+5)×5` characteristic values for the player to assign freely, without writing them to the sheet | On | 9–10 |
| `skills` | Revised skill list: new base values; Reassure APP/5; Charm, Fast Talk and Intimidate inputs count as Persuade; Lore counts as Occult | On | 15, 17–24 |
| `movement` | MOV = `7+(STR>SIZ)+(DEX>SIZ)`, keeping the age modifiers | On | 10 |
| `sanity` | Sanity revisions: Shock, Aftershock, Changed, Lost, Reassure, reality checks, Mythos growth and recovery | On | 85–99 |
| `bases` | Calculate skill base values from characteristics (requires `skills`) | Off | 23–24 |
| `specialties` | Fighting / Firearms specialties are at least half the highest value in the same group (requires `skills`) | Off | 19 |
| `take5` | A successful improvement check always adds +5 instead of rolling 1D10 | Off | 51 |

```
.coc7r options
.coc7r options sanity off
.coc7r options take5 on
```

Only group admins can change these, and the group's settings take priority over the rule pack defaults. Recorded skill totals are not recalculated when characteristics change; the specialty minimum only affects the effective value and never rewrites the original number. Explicit improvement expressions (such as `.en 侦查0+3`) keep their meaning; with `take5` on, write `.en 侦查 +1d10` if you want to roll 1D10 as usual.

Religion, language, science and similar skills need a specialty, for example `.st 宗教(道教)30` (Religion (Taoism)) or `.ra 母语(汉语)` (Own Language (Chinese)). A skill can't be determined from "submachine gun" alone: choose Handgun or Rifle / Shotgun according to the actual weapon.

## Character Creation and Movement

```
.coc7r
.coc7r 3
.coc7r array 1
.pc new 新调查员
.st STR60 CON60 SIZ50 DEX65 APP60 INT70 POW60 EDU65 年龄30
.coc7r mov
.st show 兴趣点
```

The generator only gives a pool of values; save them yourself after assigning. `.coc7r` and `array` work in any group. Personal interest points (兴趣点) are EDU+INT; point buy uses 480 points in total with each characteristic between 30 and 90; a custom occupation picks 6–12 occupation skills (including Credit Rating) and assigns 300 points. Characteristic changes for age (年龄), Luck, occupation and skill point allocation still follow the book and the KP. When POW is recorded, SAN is set to POW automatically (page 85).

### Merging skills on old sheets

```
.coc7r migrate
.coc7r migrate @someone
```

On old sheets, Charm, Fast Talk and Intimidate are merged into Persuade, Lore into Occult, and every Survival specialty into Survival, each taking the highest value, and the old fields are deleted. Switching rules never merges automatically; only running `migrate` changes the sheet. Converting someone else's sheet requires group admin. Submachine guns are not converted automatically; record them again according to the actual weapon.

## Sanity and Conditions

```
.sc 0/1d6
.sc 0/1d6 mythos
.coc7r loss 1d4 mythos
.coc7r show
.coc7r show @someone
```

`mythos` means the KP has confirmed that the loss comes from the Cthulhu Mythos; the program never guesses the cause from a description. Use `loss` for direct losses from books, spells and so on, which doesn't roll SAN again. Ordinary `.sc` disallows bonus / penalty dice and pushing, and a fumble on the failure expression takes the maximum computable loss. Non-negative integers, NdM and combinations with + and − are supported; unsupported expressions show the usage instead of guessing a maximum at random.

- A given value such as `.sc 0/1d6 50` only calculates; it doesn't write the sheet or guess POW, INT or accumulated states.
- Automatic resolution needs POW and INT on the sheet; when SAN isn't recorded yet, the check uses POW. SAN and states are saved together; a locked sheet, concurrent changes or a failed save refuse the write.
- When a single actual loss reaches 5, roll INT; on a success the investigator goes into Shock, the player chooses how it shows, and it lasts 1D10 rounds. When already Changed, the threshold is 10.
- When the accumulated loss in this chapter reaches one fifth of POW, the investigator becomes Changed. One fifth is rounded down under the official characteristic rounding rules; for example, it is 10 when POW=51.
- SAN=0 is Lost, and the recovery commands refuse further treatment. Recovering SAN does not reduce the accumulated loss.

Each state is ended by the KP in the game, not automatically by the real-world clock:

```
.coc7r end shock
.coc7r end sleep
.coc7r end chapter
.coc7r end changed
```

| Command | Effect |
| --- | --- |
| `end shock` | Shock rounds end; losses are no longer prevented afterwards |
| `end sleep` | A night's sleep in a safe place ends Aftershock |
| `end chapter` | New chapter: resets the accumulated loss and this chapter's Reassure recoveries; does not end Changed |
| `end changed` | The KP confirms at least a week of rest and the revised, locked backstory, ending Changed |

States are saved with the sheet and survive renames and restarts; chapter records are separate for each platform / adapter / conversation. The sheet itself still follows the existing sharing rules: if the same sheet is bound in several groups, its SAN is still a single value.

`.st` is a manual sheet edit; it doesn't infer the source of a loss or run the sanity procedure. Use `.sc` / `loss` for deductions that should count toward the chapter. With `sanity` on, `.st 理智` never exceeds 99 − Cthulhu Mythos. After POW is adjusted by hand, `.coc7r loss 0` re-evaluates the states with the new threshold.

## Reassure, Mythos Growth and Reality Checks

```
.ra 安抚
.coc7r reassure @someone
.coc7r reassure @someone push
.coc7r reassure targetUserID
.coc7r mythos first
.coc7r mythos later
.sc reality
.sc reality b
```

`reassure` can @mention the target or take their user ID directly. It writes to someone else's sheet, so only group admins can resolve it on their behalf; an ordinary player can roll `.ra 安抚` first and ask the KP to handle it. The target must already have a sheet with the required values, and you can't reassure yourself. A success recovers 2 SAN (benefiting only once per chapter, limited by maximum SAN), ends Shock and temporarily suppresses phobias; Aftershock remains.

**A fumbled or failed pushed Reassure currently uses a 1D4 SAN loss.** The book says 1D4 on page 22 and 1D6 on page 94; this is a deliberate choice for now, and we don't claim an official erratum exists. `push` can only be used after a previous Reassure failed and the KP allows it.

Shock / Changed caused by the Mythos registers a pending event: choosing `first` the first time adds 5, and `later` afterwards adds 1 (page 88, part of the main text of the sanity revisions). When one event triggers both, it counts only once. A sheet that has already confirmed it can't claim the first-time bonus again.

A reality check is a sanity roll: failure loses 1 SAN; success resists hallucinations until the next SAN loss. `b` means another investigator has already successfully reassured and helped, adding 1 bonus die.

## Recovering Sanity

After the KP confirms the conditions:

```
.st 理智+1d6
.coc7r therapy 80
.coc7r therapy 80 phobia
.coc7r therapy 80 push
.coc7r selfhelp INT 30 5
```

- The KP's end-of-chapter reward uses `.st 理智+expression` directly and never exceeds 99 − Cthulhu Mythos.
- `therapy` is once per game month, using the therapist's skill or the institution's rating. Success recovers 1D3, or choose `phobia` to remove one phobia; failure recovers nothing; a fumble or failed push loses 1D6 and notes that the therapeutic relationship ends.
- `selfhelp` is for the development phase. Roll INT or POW first, then enter **the D100 result you already rolled** and an optional Luck spend; the program resolves that result without re-rolling. Reaching a hard success recovers 1D6; otherwise the investigator loses 1 SAN, with a reminder to revise and lock the backstory. You can't spend more Luck than you have or change a fumble.
- When a skill improves from below 90 to 90 through `.en` during actual play, a 2D6 SAN reward is resolved automatically; creating or manually editing a skill doesn't award it.
- While Changed, `.en 幸运` refuses to recover Luck, but Luck can still be spent according to the rules.

Therapy months, development phases and eligibility for KP rewards use in-game time confirmed by the KP; the server date never grants them automatically.

## Combat and Chases

```
.coc7r ri
.coc7r chase 7 fail 3
```

`ri` is round-table initiative (page 59): the attacker acts first, and in disputes the higher DEX goes first. Roll 1D6 once: even passes to the left, odd to the right, and that direction is used for the whole fight. Seating order is managed by the KP.

For chases, enter the current MvP and the already determined success / failure / failed push. A failure rolls 1D6 to spend MvP, and the investigator only moves forward if MvP remain; at zero they drop out, and a failed push drops out immediately. Starting MvP usually equal MOV and are halved by a major wound. Locations, obstacles, check difficulty, help from teammates and story consequences are still managed by the KP.

## Scope

This pack provides repeatable mechanics and adaptations of the existing dice commands; **it is not an automatic Keeper for the whole book**. Automatic fire and bursts, close-range firearm counterattacks, groups of enemies, explosions, major wound / dying treatment, occupation lists, phobia tables and backstory narration are still handled by the KP with basic rolls and the rules in the book.

References: [Chaosium's official product page](https://www.chaosium.com/call-of-cthulhu-keeper-companion-hardcover/), [official rounding of half / fifth characteristic values](https://cthulhuwiki.chaosium.com/investigators/step-one-investigator-characteristics.html).
