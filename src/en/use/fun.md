# Fun & Interaction

Light everyday commands to liven up group chats.

## Command Overview

| Command | Description |
|------|------|
| `.jrrp` | Today's luck |
| `.mrrp` | Tomorrow's luck |
| `.zrrp` | Yesterday's luck |
| `.name` | Random names (alias `.gn`) |
| `.nnn` | Random rename |
| `.me` | Narrate your text |
| `.ak` | Choose between options |
| `.sleep` | Rest |
| `.text` | Evaluate a text template |
| `.alias` / `.&` / `.a` | Group and personal shortcuts |
| `.rpmode` | Switch the bot's persona |
| Affection | The affection system (see below) |

## Luck `.jrrp` / `.mrrp` / `.zrrp`

```
.jrrp              → today's luck (fixed per person per day)
.jrrp on / off     → group admins turn today's luck on / off for the group (saved permanently)
.mrrp              → tomorrow's luck (a peek ahead)
.zrrp              → yesterday's luck (a look back)
```

Luck values are generated deterministically from the user and the date, so repeated queries on the same day give the same result.

## Random Names `.name` / `.nnn`

```
.name              → one random name (each name randomly Chinese / English / Japanese)
.name en 3         → 3 English names (cn / en / jp; at most 10 at a time)
.nnn               → pick a random name and set it as your nickname right away
.nnn jp            → rename with a Japanese name (cn / en / jp)
```

Without a country, each name is randomly chosen from Chinese / English / Japanese (matching the original's mixed "random name" deck). Like `.nn`, `.nnn` also renames the character sheet currently bound.

## Narration `.me`

Have the bot repeat the text you enter (the "narration" often used in games), without adding the speaker's name automatically:

```
.me 推开了古宅的大门       → 推开了古宅的大门 (pushes open the door of the old mansion)
.me on / off               → group admins turn .me on / off for the group
```

- Ordinary users and Masters both get the text as written, without the sheet name or nickname added; if you want a name, write it into the text.
- In a private chat you can narrate into a specific group remotely: `.me <group ID> <action>`.
- `.me` can be disabled globally or per group (`.group +禁用me`).

## Choices `.ak`

List a few options and let fate choose for you (saved per chat):

```
.ak#走哪条路               → start a choice "走哪条路" (which way to go)
.ak+左边的隧道|右边的楼梯   → add options (separate several with |)
.ak-2                      → delete option 2
.ak show                   → show the current options
.ak=                       → draw one at random (the list is cleared afterwards, as in the original)
.ak clr                    → clear manually
```

You can also create it in one line: `.ak#title+option1|option2`.

## Rest `.sleep`

```
.sleep             → the bot goes to rest and replies with a line about it
```

## Affection System

The bot remembers your affection level and gives you a title (厌恶 disliked / 陌生 stranger / 友好 friendly / 亲密 close / 挚友 best friend / 恋人 sweetheart).

```
好感               → show your affection and title (no prefix needed)
好感排行           → global affection ranking
群内好感排行       → affection ranking in this group
```

The dice master and highly trusted users (trust level ≥ 4, see [Group & System Admin](/en/use/admin)) can adjust affection, optionally with `@someone` as the target:

```
.好感增加 10       → increase affection (also .favor add 10)
.好感成长          → roll one growth under the original DiceFavor rules
.好感覆写 50       → overwrite the affection value directly (.favor set)
.好感擦除          → clear all affection records (.favor clr)
```

The higher the affection, the harder natural growth becomes (reproducing the original DiceFavor growth check).

## Text Templates `.text`

`.text` evaluates expressions and variables inside `{braces}` in the text and outputs the result, compatible with SealDice's `.text`.

Compatibility with the old random-choice syntax, now in development, also supports `.text {sample:效果拔群|干得漂亮}`; options may contain variables or dice expressions supported by `.text`. Build 909 and earlier don't support this yet.

```
.text 看看手气 {1d16}      → 看看手气 7 ("let's see my luck 7")
.text {$t玩家} 掷出 {2d6}   → mix variables and dice
```

## Shortcuts `.alias`

Save a frequently used command under a short name, compatible with SealDice's usage. It **runs a command**; it doesn't reply with your text as-is, and it isn't account binding.

```text
.alias 侦查 .ra 侦查        // save a shortcut in the current group
.&侦查 60                  // actually runs .ra 侦查 60
.a 侦查 60                 // same; you can append arguments when calling
.alias --my 攻击 .r d20+3   // save a personal shortcut
.&攻击                     // actually runs .r d20+3
.alias 侦查 .ra 侦查 70     // defining the same name overwrites it
.alias show                // list this group's shortcuts and your own (list also works)
.alias del 侦查             // delete a group shortcut (rm also works)
.alias del --my 攻击        // delete a personal shortcut
```

- **Scope**: in group chats, shortcuts are saved for the group by default, and ordinary members can manage them too; add `--my` to save a personal one, which is the default in private chats. `--my` can go before or after the name, but `"--my"` in quotes stays as an argument of the target.
- **Priority**: the current bot account's entry for this group is used first, then the caller's personal entry. Group shortcuts don't leak across groups or bot accounts; personal ones work across groups and private chats, and sharing across platforms requires identity binding first.
- **Permissions and switches**: built-in, rule pack and JS / Lua plugin targets all run as **the caller**, without inheriting the creator's dice master permissions. bot off, full disabling, blacklists, sensitive words and feature / single-command switches still apply; shortcuts can't bypass them.
- **Limits**: names contain no whitespace and are at most 80 UTF-8 bytes; each group / personal scope holds at most 100 entries. The target must be a single command with a currently valid prefix, at most 4096 UTF-8 bytes including appended arguments. It can't call another `.a` / `.&`; `.bind` uses a dedicated flow that protects verification information and can't be a target. If you change the command prefix, update the saved targets too.
- **Results**: a normal reply is preceded by the command actually run; a target that is deliberately silent stays silent and doesn't fall through to custom replies. Plugin commands that aren't installed or are no longer available give a notice and never trigger ordinary chat replies. QQ Official structured cards keep their original card format.

The receipts for defining and calling shortcuts can be rewritten in [Commands → Tools → Shortcuts](/en/manage/commands), with personas, multiple candidates and weights. The old main / alt account permission links keep their data, but are now managed with [`.admin account-alias`](/en/use/admin#permission-system-trust-levels); don't use `.alias add` to manage accounts any more.

## Switching the Bot's Persona `.rpmode`

A "persona" is a set of overrides for the bot's reply texts. After switching personas, the bot's replies take on that persona's tone. Personas are created and edited on the [Commands page](/en/manage/commands) of the panel.

```
.rpmode                    → show the current persona and the available ones
.rpmode set 傲娇           → switch to the "傲娇" (tsundere) persona
.rpmode off                → explicitly turn personas off for this chat and use the base / global custom texts
.rpmode default            → clear the current choice and inherit the adapter or global default persona again
.rpmode inherit            → same, inherit the adapter or global default persona
.rpmode copy 傲娇 温柔      → copy the "傲娇" persona into "温柔" (gentle) (Master)
.rpmode del 温柔           → delete a persona (Master; built-in personas can't be deleted)
```

Groups and channels can each choose a persona; switching requires group admin, inviter or dice master permission. The QQ Official Bot no longer treats every member as an admin just because the group role is temporarily unavailable; when the platform provides trusted group roles in the future, the same permission entry will be used. Inviters can adjust non-destructive group settings such as the persona and the dice switch, but being the inviter alone doesn't allow platform admin actions such as kicking or muting.

When an ordinary user chooses a persona in a private chat, it only affects their own private chat with the current adapter and never changes the bot's global persona. The dice master sets which personas are available per bot account in [Commands → Persona access](/en/manage/commands); personas that aren't open don't appear in the list and can't be chosen by name either. `off` explicitly uses no persona in the current chat, while `default` / `inherit` remove the current override and inherit the adapter or global default. Management actions such as `copy` / `del` are still Master-only.
