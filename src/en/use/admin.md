# Group & System Admin

Commands that group admins and the dice master (Master) use to control the bot's behavior. Most admin operations can also be done in the [web panel](/en/manage/dashboard).

## Turning the Bot On and Off

| Command | Description |
|------|------|
| `.bot` | Show version / status |
| `.bot on` / `.bot off` | Turn the bot on / off in this group (group admin required) |
| `外置开` / `外置关` | External mode on / off: disables built-in commands and keeps only custom replies |

The `.bot` information can have a header / footer (see [Settings](/en/manage/settings)).

### Per-group feature switches

```text
.bot log on / off       → turn log commands and recording on / off
.bot reply on / off     → turn custom replies and causal rules on / off
.bot roll on / off      → turn built-in rolls, checks, initiative and skill improvement on / off
.bot plugin on / off    → turn plugin commands, message hooks and rule pack commands on / off
.bot log                → show the log feature switch (the other three work the same way)
```

All four feature switches are on by default, only apply to the current bot account in this group, and require group admin permission to change; you can also change them in [Groups](/en/manage/groups#feature-management). Leave out `on/off` to see the state, and append a bot account at the end to target a specific one. Turning a sub-switch on never wakes a bot whose master switch is off, and can't bypass full disabling or blacklists; turning `.bot on` again doesn't reset the sub-switches.

The plugin switch doesn't change each plugin's own on/off setting; rolls inside plugins are controlled by the plugin switch, not by the built-in roll switch. Non-roll actions such as managing character sheets and choosing rules aren't affected by the roll switch. `.bot reply` and `.reply on/off` share the same setting.

In the current version, `.bot off` stops log writing and the timer while keeping the log session. To "record logs only", keep `.bot on` and turn off the features you don't need as described in the [log documentation](/en/use/log#recording-logs-only). The early behavior that allowed recording logs independently while off has been replaced by the per-group switches.

### Plain text for the current chat `.bot text`

```text
.bot text              → show usage and the current state
.bot text plain        → force readable plain text in the current group or private chat
.bot text rich         → go back to the traditional / standard / advanced visual style chosen by the dice master
```

`plain` only turns off rich message delivery such as Markdown, cards and native buttons; it doesn't rewrite the persona's tone or change the text style the dice master chose. Status bars in the advanced visual style fall back to plain text such as `HP [██████░░░░] 6/10`, and action buttons are shown as `.r // roll command`, so the information stays complete. In groups it can be changed by group admins, the inviter or the dice master; in private chats it only affects the current user and the current adapter.

### The original `.master` compatibility entry

Dice master only. Supports adding and removing admins (including the old `+account/-account` form), clock, notice, censor, black and white lists, remote boton/botoff, dismiss and other adapted operations, reusing Next's permission and configuration logic.

It is not a general command executor; unsupported old operations such as reset/delete/groupclr give a clear notice and never change ownership or clear configuration automatically. For scheduled plugin tasks, see [Scheduled Tasks](/en/manage/schedules).

## Group Settings `.group`

```
.group                  → show this group's information (state / logging / card / observers / blacklist and more)
.group +禁用jrrp        → disable a command in this group
.group -禁用jrrp        → re-enable it
.group +禁用回复        → turn off custom replies in this group
.group +禁用回复 -禁用help → adjust several items at once
.group 123456 state     → view a specific group (permission for the target group is checked)
.group 123456 +禁用回复 → adjust a specific group
.group all +禁用回复    → apply to every group of the current bot account (dice master or trust ≥5)
.group clr              → reset this group's feature settings for the current account
```

Available group items: `停用指令` (bot off), `禁用回复` (no replies), `禁用jrrp`, `禁用draw`, `禁用me`, `禁用help`, `禁用deck`, `禁用send` (disable the respective command).

Specific groups can also be managed from a private chat. Admin status in the current group can't be used for other groups, and a fully disabled target group can't be re-enabled through these commands. `clr` doesn't affect other bot accounts, keeps the group's identity information, hard locks and unfinished logs, and doesn't delete log content; old shared settings don't come back into effect after the reset either. `all` only accepts items with a + or − sign and doesn't support clearing in bulk.

### Group automation `.group auto`

Requires the bot to have **admin permission or above** in this group:

```
.group auto                    → show this group's automation settings
.group auto pass 暗号          → automatic join review: approve only when the verification message contains "暗号" (password) (all = approve everyone)
.group auto kick 广告关键词    → remove anyone whose message contains the keyword (广告关键词 = ad keyword)
.group auto mute 刷屏词 10     → mute anyone whose message contains the keyword for 10 minutes (刷屏词 = spam word)
```

Leave the keyword empty to turn that item off.

## Observers `.ob`

```
.ob                     → show help
.ob join                → join as an observer
.ob list                → list observers
.ob exit                → stop observing
.ob clr                 → group admins or the campaign's GM clear the observer list
.ob on / off            → turn the observer feature on / off for the group (group admin required)
```

## Welcome Messages `.welcome`

```
.welcome 欢迎新人{at}   → set the welcome message (supports variables such as {at})
.welcome show / off     → show / turn off
```

## Leaving a Group `.dismiss`

```
.dismiss                → make the bot leave this group
```

Only the group owner / group admins / the inviter / highly trusted users can use it. The bot first sends a farewell message, stops responding to commands in the group, then actually leaves after a random delay of a few dozen seconds (the group record is kept and marked as "left").

## Message Links `.link`

Forward messages between two chats (cross-group links / listening in; requires trust level ≥ 3):

```
.link with 12345678     → create a two-way link with the target group
.link to / from groupID → one-way (this group → target / target → this group)
.link start / close     → resume / pause this chat's links
.link list / state      → all links / this chat's state
```

## Messages to the Dice Master `.send`

```
.send feedback          → leave a message for the dice master
```

The dice master can use `.send group/user <id> <message>` to send to a specific target.

## Language `.lang`

```
.lang                   → show / switch the reply language
.lang 简体 / 繁體 / en / 日本語 → switch the reply language of this group (or yourself in a private chat)
.lang clr               → back to the default
```

For details (including custom language packs and AI translation languages), see [Help & Language](/en/use/help).

## Permission System (Trust Levels)

Dice!Next ports the original nTrust permission ladder; each user has a **trust level** from 0 to 255:

| Level | Meaning |
|------|------|
| 0 | Ordinary user |
| 1–3 | Trusted user (≥3 can use `.link` and so on) |
| 4 and above | Bot admin (can use `.trust`, adjust affection and so on) |
| Master | Dice master, the highest permission |

| Command | Description |
|------|------|
| `.trust @someone / QQ number [level]` | Query / set the trust level (requires admin ≥4; you can only grant levels below your own) |
| `.admin add/del <@/QQ>` | Grant / revoke admin (dice master only) |
| `.admin list` | List admins |
| `.admin account-alias add <alias ID> <main ID>` | Create an old-style account permission link: the alias account's trust / Master status is calculated from the main account (dice master only) |
| `.admin account-alias del <alias ID>` | Remove a permission link (dice master only) |
| `.admin account-alias list` | List permission links (dice master only) |

`.alias` is now used for [SealDice-style shortcuts](/en/use/fun#shortcuts-alias); the old account permission links moved to `.admin account-alias`, and existing `dice/aliases` settings still apply without re-entering them. This only shares permissions; it doesn't merge character sheets, nicknames or other data, and isn't converted to `.bind` automatically. Cross-platform identity verification and data merging still use [identity binding](/en/use/cloud).

## Sensitive Word Management

Dice master only; **System settings → Security & permissions → Sensitive word filter** in the WebUI reads and writes the same configuration as these commands.

```text
.admin censor status
.admin censor on
.admin censor off
.admin censor +=added with the default level Warning
.admin censor +Danger=word0|word1
.admin censor -word0|word1
```

Available levels are `Ignore`, `Notice`, `Caution`, `Warning` (the default when omitted), `Danger` and `Critical`; `Critical` exists for compatibility with old data and is handled as the highest risk. Chat receipts and notifications never repeat the rule text, so the same sensitive content isn't sent to the platform again.

## Dice Master Notifications `.notice`

Make the current chat (group or private) a dice master notification window that receives messages, approvals, runtime errors and other events (dice master only):

```
.notice on / off        → turn notifications for this chat on / off
.notice level 15        → set the subscription level mask (1 routine / 2 important / 4 key / 8 error, combinable, 15 = all)
```

Per-event checkboxes and SMTP email / webhook delivery to third parties are configured on the "Notifications" page of the web panel.

## Dice Master Commands

The dice master can manage several groups and the black / white lists remotely:

| Command | Description |
|------|------|
| `boton` / `botoff [group ID]` | Turn a specific group on / off remotely |
| `blackqq [-]<id>` | Blacklist / unblacklist a user (the `-` prefix removes; no argument lists) |
| `blackgroup` / `whitegroup` | Blacklisted groups / allowlisted groups |
| `whiteqq` | Trusted users |

Non-masters using these commands are politely refused. Dice masters are configured in [Settings](/en/manage/settings).

### System information `.system`

```
.system info       → system information (OS, CPU, memory, this process's memory)
.system stats      → runtime statistics (uptime, commands, friends / groups / players / records)
```

::: warning No remote shell
The old `.system cmd` has not been restored. Chat messages should never be an entry point for operating system commands; do system maintenance in a terminal on the host or in a controlled management environment.
:::

## Original Admin Compatibility Entries

These entries reuse Dice!Next's unified player profiles, permissions and blacklist instead of keeping a separate set of old data:

| Command | Behavior |
|------|------|
| `.user state` | Show your trust, command statistics, profile creation time and number of sheets |
| `.user trust <@/ID> [level]` | Goes to the unified `.trust` query / set logic |
| `.user tojson [@/ID]` | Export a player profile and sheet index; exporting someone else requires admin permission |
| `.user diss <@/ID> [reason]` | An admin adds the target to the local blacklist |

`.user diss` keeps the player profile and character sheets, so the user can continue after being removed from the list; irreversible deletions like the old `.user kill` / `.user clr` can only be confirmed and run in the web panel.

The old `.cloud update` and `.cloud black` are no longer provided: in the original they also only reported status and pointed to a web page. Use `.bot` without arguments for the version number; the cloud blacklist switch is in "System settings" on the web page. `.cloud` is now the entry for account center authorization and cloud character sheets; see [Cloud Services & Identity](/en/use/cloud).

## The Bot's Name `.strSelfName` / `.strSelfCall`

Set the bot's public name and how it refers to itself; this is a system-level setting (dice master). `{self}` in reply texts uses, in order: self-reference → name → the adapter's login nickname → 骰娘 (dice girl).

```
.strSelfName 小海   → set the bot's name to "小海"
.strSelfCall 本喵   → set how it refers to itself ({self} prefers this)
.strSelfName        → show the current value; add reset or NULL to reset
```

## Old Text Commands `.strXXX`

The dice master can keep using original text keys whose one-to-one mapping has been verified:

```
.strRollDice show       → show the mapped roll text in the current language
.strRollDice new text   → write to the unified text override table
.strRollDice reset      → delete the override and go back to the Dice!Next default text
.strRollDice NULL       → keep the override but set the text to empty
```

Only old keys with a genuinely equivalent slot and compatible template parameters are accepted; unknown `.str…` commands aren't swallowed by the compatibility layer and can still be handled by other commands or plugins. For bulk editing, checking invalid old keys and persona texts, use [Web panel → Commands](/en/manage/commands).

## Cross-Platform Identity Binding `.bind` / `.info`

The same person has different identifiers in QQ Official, Discord, KOOK and OneBot / Milky chats. `.bind` links them to a real QQ, and `.info` shows identity information. Just enter `.bind qq <QQ number>`: when the current client has a formal bot key, OAuth is preferred; otherwise the SMTP email verification configured by the dice master is used automatically. Avatar verification has been retired.

```
.info                → show the current chat type, canonical identifier, business ID and bound endpoints
.bind qq <real QQ number>    → start in a QQ Official / Discord / KOOK private chat; the verification method is chosen automatically
.bind confirm        → OAuth: after approving on the web page, confirm back in the original private chat
.bind confirm <8-digit code> → email: submit the code in the original private chat, without re-entering the QQ number
.bind qq <real QQ number> email → choose or switch to email; requires SMTP to be enabled
.bind qq QQ-Official-<bot ID>:<OpenID> → reverse binding in a OneBot / Milky chat
.bind qqgroup QQ-Official-<bot ID>:<group OpenID> → run by the group owner or an admin inside the target real QQ group
.bind discord <user ID> / .bind kook <user ID> → reverse binding of platform users in a OneBot / Milky chat
.cloud auth [write] / .cloud confirm → separate authorization for cloud character sheets; not a prerequisite for binding
```

After binding, the real QQ identity is kept even without a OneBot connection, so character sheets, permissions and so on can be unified across chats. For detailed settings and limits, see [Cloud Services & Identity](/en/use/cloud#qq-email-verification-codes). Email verification can't prove group ownership.

With OAuth, the verified QQ must match the requested number, and a failure never sends an email automatically. The old `.bind email <QQ>` and `.bind qq <QQ> <code>` are kept only for compatibility.

## Global Settings (Dice Master)

Under "Original global settings" in [Settings](/en/manage/settings) you can configure:

- Global silence, globally disabling `.jrrp` / `.me` / `.deck` / `.draw` / `.send` and so on
- Event response switches (group join requests / join feedback / friend requests / friend added / leaving blacklisted groups / automatic banning on kick / automatic banning and leaving on mute)
- Hiding deck metadata keys starting with `_`
- Automatic maintenance such as the number of inactive days before leaving a group and the per-round group cleanup limit
- The `{api:}` external request switch and timeout

**Approval policies** for friend and group invitations (keyword passwords, rejecting invitations from non-friends, leaving groups you were forcibly added to, leaving groups by name keyword, leaving blacklisted groups automatically and so on) are also configured in system settings; see the [web panel](/en/manage/settings).

## Scheduled Tasks

In [Web panel → Scheduled Tasks](/en/manage/schedules) you can push messages to groups / private chats at set times every day (such as good-morning greetings or session reminders), with conditional triggers (such as a group being inactive for a number of days) and actions such as leaving the group. Each push goes to one target at its time; it isn't a mass broadcast.
