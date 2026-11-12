# Settings

**Web panel → System settings → Basic settings** configures dice masters, commands, approvals, images and reply behavior. The panel's own login password, port and so on are managed in [WebUI Settings](#webui-settings-page) in the same group.

The bot key, heartbeat, cloud blacklist, cloud character sheets and the log site are all managed in [Cloud Services](/en/manage/cloud-services); image hosting is still on this page.

Connections, separate credentials, tool permissions and call records for external AI clients are managed in [MCP Server](/en/manage/mcp) in the same group, off by default.

## Check & Auto-update

**Web panel → About → Check & auto-update** shows the current version, the latest Release, the package for your platform, the download source and the update stage in one place, and offers checking, downloading, installing and automatic policy settings.

You can also click the version text in the upper-right corner to go straight to the update section. Beta versions are shown as `beta-3.0.0(123)` and official builds as `v3.0.0(123)`; when a new version is found, a red **New** appears next to it. The sidebar no longer shows a fixed version number, and the top bar no longer uses a "Connected" badge in place of version information. The build time is shown in **UTC+8** and labeled as such, not following the browser's local time zone.

- By default it checks every 6 hours and **only notifies** you when a new version is found, never downloading or restarting on its own.
- After choosing "Install and restart automatically", you can turn on **scheduled installation**, at **04:00** every day by default. The program downloads and verifies first, then schedules installation for the next set time after the download finishes; if that time has passed today, it is scheduled for the next day. It uses **the server time zone from Basic settings**, not the browser's time zone, and the panel shows the full installation date, time and UTC offset.
- **The schedule only decides when the program restarts by itself.** With the automatic installation policy on and a package ready, any earlier restart also installs it, including a panel restart, closing and reopening, a system reboot or a restart by a supervisor process; you don't have to wait for the scheduled window. The download-only / notify-only policies never install at startup.
- The schedule and the staged package are persisted. The program checks the restart schedule every minute, and an update operation in progress finishes first. Changing the time or the server time zone reschedules it; turning the schedule off only cancels the planned restart, and an authorized update is still installed at the next startup. To also prevent installation at startup, change the policy to "Download only" or "Notify only". Turning off automatic checks only stops looking for new versions and doesn't cancel an existing plan. You can also click "Install and restart" directly.
- When a new version is found, the notification system sends "New version found"; a successful automatic download / installation sends "Update result", and a failure sends "Update failed". Each Release is announced only once. If an existing notification window filters events individually, check these three new events in the notification settings.
- Download sources: Automatic, GitHub only, built-in mirrors only, custom mirror. Automatic mode probes the direct GitHub connection and the built-in mirrors in parallel, uses the first source that succeeds with a valid manifest, and caches the working source briefly.
- During a download you can click **Cancel download**, wait for "Cancelled", then download again; connecting, downloading, verifying and preparing can be cancelled, but the actual installation can't. If no new data arrives for 60 seconds or a single source has been tried for 20 minutes, the transfer stops and other sources are tried according to your settings; when all sources fail, an error is shown and you can retry without restarting the program.
- A frontend request timing out doesn't mean the backend stopped. The page fetches the status again before allowing the next step; when the status is uncertain, refresh it rather than clicking download or install again.
- Release packages only use safe file names that GitHub won't rewrite; the updater also accepts package names in historical manifests whose parentheses GitHub normalized into dots. Download failures show both the HTTP status and the curl exit code, so you can tell a missing file from a network failure.
- The manager mode of the full package supports "Install and restart" and optional scheduled automatic installation: Windows uses `dice-next.exe`, and new Linux/macOS packages with the POSIX manager use `start.sh` or `dice-next`. Linux/macOS packages from beta.928 and earlier need one complete manual upgrade first; this capability ships with an upcoming package. Running the core directly only checks and downloads. Inside containers, only checking and new version notifications remain, and the server refuses downloads and installation; update the image and recreate the container instead.
- Downloads are checked against the file size and SHA-256 in the Release manifest, and absolute paths and path traversal are blocked before extraction; on Windows a failed replacement restores the old program automatically. `config/`, databases and user files are never in the replacement list, and third-party plugins not sharing a path with built-in files are kept.
- SHA-256 is a corruption / consistency check, not an independent release signature. Using a mirror (especially a custom one) means trusting that source; if unsure, choose "GitHub only" and keep "Notify only".

For the full upgrade process, see [Installation → Upgrading](/en/guide/install#upgrading); for the API fields, see [API Reference → Update Endpoints](/en/develop/api#update-endpoints).

## Master (Dice Master)

Add / remove dice master accounts (several are allowed, separated by platform). Dice masters have the highest permission and can use admin commands such as remote switches and black / white lists.

## QQ Email Binding Verification

Configure and enable a dedicated SMTP server on this page so that QQ Official, Discord and KOOK users can verify QQnumber@qq.com in a private chat. Fill in the server, port, account, password or authorization code and sender address; 465 usually uses implicit TLS, and 587 enforces STARTTLS. The password isn't shown again after saving, and leaving it empty when editing keeps the existing value. Arbitrary recipient addresses aren't accepted, and this isn't used to verify group ownership. This is a global setting, separate from the dice master's notification email. Users always enter `.bind qq <QQ number>`: when the current client has a formal bot key, OAuth is preferred; otherwise an email is requested automatically. Email verification is completed with `.bind confirm <8-digit code>`; to choose email even when there is a key, use `.bind qq <QQ number> email`. With OAuth, use `.bind confirm` after approving on the web page; a failure never sends an email automatically. For commands and security limits, see [QQ email verification codes](/en/use/cloud#qq-email-verification-codes).

## Expression Engines

Dice expression engines can be configured in layers: "global → per adapter → per account"; per-account settings beat per-adapter settings, which beat global. The next engine is only tried when the previous engine explicitly says "this syntax isn't supported"; execution errors such as division by zero, invalid die faces or too many dice are returned directly, and the dice are never re-rolled with another engine.

| Mode | Engine order | When to use |
|------|----------|----------|
| Enhanced compatibility (default) | Dice!Next → OneDice → DiceScript | Accept as much expression syntax as possible |
| Compatibility | Dice!Next → OneDice | Keep Dice!Next behavior and add common extended dice syntax |
| Original | Dice!Next | Only the native expressions in the style of the old Dicebot, without compatibility engines |
| Custom | Choose one or more engines and set a fixed priority | Control the available syntax and parsing order as the dice master needs |

::: info DiceScript C99 compatibility
Dice!Next uses DiceScript through the separately maintained [dicescript-c-lib](https://github.com/DiceZone/dicescript-c-lib). The C99 runtime covers integers, floats, strings, null, arrays, dictionaries, ranges, variables, computed values, functions, control flow, templates, container methods and host callbacks, and supports ordinary dice, chained `d`, `kh/kl/dh/dl/min/max`, advantage / disadvantage, COC bonus / penalty dice, Fate, WOD and DoubleCross.

Ordinary `.r` still uses the "single expression" entry, so it can reliably separate the check reason after the command; character sheet values can be read as DiceScript variables. Full statements, persistent contexts, templates, native functions / objects, custom dice and tagged VMValue serialization are provided by the library's full C API.

Fallback probing uses the full VM's parse-only interface: it doesn't execute expressions, access host variables or consume random numbers. The next engine is only used when the full syntax isn't supported; errors after evaluation has started never cause a re-roll.
:::

In custom mode, drag the handle at the start of a row to reorder; **top to bottom is the actual priority**, effective after saving. You can also click the up / down arrows, or focus the handle and use the up / down keys; disabled engines are listed below and don't take part in parsing. Each engine keeps its own process format; for example, in OneDice's `1d6[4]=4` the `[4]` is that die's value, while the native engine uses `1D6=4`.

::: tip Fallback never consumes random numbers early
The system first checks, without consuming the real random source, whether a compatibility engine can fully parse the expression, then performs the actual roll. So when an earlier engine rejects the syntax, it never quietly uses up dice or changes the result of the later engine.
:::

## Command Prefixes

Add or remove trigger prefixes (default `.` `。` `!` `！` `/`). A message is only treated as a command when it starts with one of the prefixes; changes take effect immediately after saving. On the QQ official platform you can write `/r` and so on. Existing custom prefix lists aren't overwritten; add `/` here if you need it.

## Dice Random Source

Choose and save under **Basic settings → Dice random source** (a global search for "随机源", random source, goes straight there). It applies globally to Dice!Next, OneDice, DiceScript and MCP rolls, takes effect immediately and is saved permanently. The old "Dice rules" page has been removed, and its old address redirects here automatically.

| Option | Characteristics |
|------|------|
| Operating system secure random (default) | BCryptGenRandom on Windows, getrandom on Linux, getentropy on macOS. The system continuously mixes in entropy from CPU hardware randomness, interrupt timing and more; the application keeps no extra random state and needs no network |
| OpenSSL secure random | Uses RAND_bytes, a DRBG seeded from the system entropy source; also needs no network |
| CPU hardware entropy | Reads the CPU's physical noise entropy source RDSEED every time and XORs it with the operating system's secure random, so the result is never weaker than system random. Only x86-64 CPUs provide it, and the option is unavailable when unsupported; when RDSEED is busy or fails, system random is used for that roll automatically |

All three options cost about 1 microsecond per roll and use no extra memory. Random numbers that plugins generate themselves, daily luck and preview examples aren't controlled by this option.

**Rolling never stops because of a random source failure.** When the chosen source is unavailable, the other secure sources are used in turn; only when all are unavailable is the emergency pseudo-random generator (xoshiro256**) used, with one WARN in the program log, switching back automatically with an INFO when the source recovers. The settings card shows the source actually used by the most recent roll. In practice the system interfaces rarely fail; the common causes are Linux kernels older than 3.17 (such as CentOS 7) without getrandom, or a container security policy blocking it.

Why not use a "true random" service directly: SealDice's core offers PCG (default), system CRNG, NIST AES-CTR-DRBG, the Chinese SM3 standard (disabled by default; enabling it needs about 32 MB of memory to collect entropy) and a mixed mode; OlivaDice uses Python's Mersenne Twister by default and can optionally pull random numbers from random.org. Dice!Next already uses the system's secure random by default, and the hardware entropy option offers a more direct physical noise source when the CPU supports it; online random services depend on the network and have rate limits and privacy issues, so they aren't used.

## QQ Official SN Status Line

Adjust how `.sn` appears at the top under **Basic settings → Replies & display → QQ Official SN status line**; a global search for "SN" or "彩色文字" (colored text) goes straight there. It can be set globally, per adapter type and per account, with the priority account > type > global; changes take effect immediately after saving, and you can restore inheritance.

| Preset | Display |
|---|---|
| Colored text (default) | Uses QQ's formula format `scriptsize` and `\textcolor`, red `#E5484D` by default. When selected, a color wheel, eyedropper, common color swatches and a #RRGGBB field appear below so you can change the color directly. The eyedropper can pick a color from anywhere on the screen (Esc cancels); it requires Chrome / Edge with the panel opened over HTTPS or localhost, and the button is unavailable otherwise. HTML `<font>` is never sent |
| Quote | A Markdown quote block |
| Plain text | No extra decoration |
| Custom format | Edit Markdown and insert the status with placeholders |
| Status line off | Don't show the top status, keeping players' settings |

This only controls the appearance; players still need to run `.sn` or `/sn` in the group to turn on their own status line, and `.sn off` to turn it off. `.setsn` sets the group's default attributes, and `.sn {nick} SAN{san}` sets personal content. Real group card name behavior on other platforms doesn't change.

Custom format examples:

```text
> {sn}
```

```text
$\scriptsize\textcolor{#E5484D}{\text{{sn_tex}}}$
```

`{sn}` inserts already-escaped Markdown text; in formulas, put `{sn_tex}` inside `\text{…}` so that backslashes, parentheses and other characters in nicknames are handled safely. The format must contain at least one placeholder and be at most 2048 UTF-8 bytes; when repeated placeholders make the status line exceed 3000 bytes, it falls back to one plain status text. Switching presets doesn't lose the custom format you edited. The preview uses fixed sample data, and the final appearance depends on the QQ client.

Decorated styles need Markdown: with the traditional text style, when plain text is forced with `.bot text plain`, or when the platform explicitly rejects formatting, the status line falls back to plain text without outputting formula code. The status and the following body are separated into their own paragraphs.

## BotMsg Additional Info

Edit the introduction, contact information or help hints after the fixed `.bot` information under **Basic settings → Replies & display → BotMsg additional info**. It can be set globally, per adapter and per account, with the priority account > adapter > global; leave it empty to hide the additional info.

The first three lines of `.bot` are always generated by the system and can't be replaced by the additional info or the old header:

1. Program version, build number and author name. It uses the persisted backend `i18n.default_locale`: "希亚" in Chinese and "ShiaNyaa" in other languages. The WebUI language in the upper-right corner is stored in the current browser and doesn't change this default reply language.
2. The current program's compiler, build time and adapter information.
3. The compatibility expression engines actually enabled for the current account. By default it shows `OneDice V1 & DiceScript Compatible`; with only OneDice or DiceScript enabled it shows just that name, and with only the native engine it shows `Dice!Next Native`.

The default additional info is:

```text
Dice!Next 测试群：933145116
如有故障或建议欢迎加群反馈
使用 .help 查看帮助
```

("Dice!Next test group: 933145116 / Join the group to report problems or suggestions / Use .help for help.") When importing from the old version, `strBotMsg` keeps its original text and the default info above is appended on a new line at the end; importing again doesn't append it twice. `strBotHeader` is also kept, but moved after the three fixed lines. When custom info already exists and overwriting isn't authorized, the migration report flags the conflict and keeps the existing setting.

## Sensitive Word Filter

In the **Security & permissions** section, this reproduces the original Dice!'s sensitive word check for commands. It is off by default and **ships with no built-in word list**; only rules the dice master saves on the page, or rules migrated from the old `conf/CustomCensor.json`, take part in matching.

- Only incoming messages starting with the current command prefix are checked; ordinary group chat isn't scanned, and the bot's replies and plugin output aren't changed.
- Matching skips spaces and ASCII special characters automatically and is case-insensitive for English; when a command hits several rules, the highest level applies.
- Masters and trust level 4 and above skip the check. Trust levels 1–3 lower the actual action according to the original rules: the command is only blocked when the rule's level isn't lower than the user's trust level.
- Hits are written to the local log and sent to the [dice master notification windows](/en/manage/notice) of the matching level. To avoid triggering the same platform sensitive words again on QQ Official, notifications never repeat the matched words or the original command; the details stay only in the local log.
- The page can test a command before enabling, using the same server-side matcher as live messages.

| Level | Behavior |
|------|------|
| Ignore (0) | Ignore this rule; useful for keeping old disabled items |
| Notice (1) | Only log and send a routine notification, without blocking the command |
| Caution (2) | Remind the user and block the command, sending an important notification |
| Warning (3, default) | Warn the user and block the command, sending an important notification |
| Danger (4) | Refuse the command, sending a key notification |
| Critical (5) | For compatibility with old data; handled as the highest risk, refusing the command like Danger and sending an error notification |

In chat, the dice master can also add, remove or toggle rules with `.admin censor`; see [Admin commands](/en/use/admin#sensitive-word-management).

## Friend / Group Invitation Approval

Set how the bot handles friend requests and group invitations automatically:

| Item | Options |
|------|----------|
| Friend requests | Don't handle automatically (manual) / approve everyone / approve only with a keyword / reject automatically |
| Group invitations | Don't handle automatically (manual) / approve invitations from anyone / approve only invitations from the allowlist and Masters / ignore all / reject all |
| Reject invitations from blacklisted groups automatically | Switch |
| Reject group invitations from non-friends | Invitations from non-friends are rejected automatically; if the bot is forcibly added to a group, it says so and leaves automatically (dice masters and allowlisted users are exempt) |
| Leave groups by name keyword | After joining, the group name is checked, and if it contains any keyword the bot leaves automatically and notifies the dice master (separate keywords with spaces) |

## Log Site

Moved to **System settings → Cloud services → Log site**. For the upload address, protocol and restoring the defaults, see [Log site settings](/en/manage/cloud-services#log-site). Existing settings are kept.

## Heartbeat Reporting

Moved to **System settings → Cloud services → Heartbeat reporting**. For bot binding, the key, public listing, report interval and testing, see [Cloud Services](/en/manage/cloud-services#heartbeat-reporting).

## Pokes

Pokes have moved to [Advanced replies](/en/manage/replies#poke-replies); configure them with the "Poke reply" button to the left of "Add broadcast". Weighted multiple replies and the same restrictions as advanced replies are supported; the existing mapped command and tiered overrides are kept.

## Welcome Settings

The global **minimum delay** and **minimum cooldown** (seconds) for welcome messages, to prevent welcome messages from flooding the chat when new members join in quick succession. Each group's own welcome message, delay and cooldown are set in [Groups → Feature management](/en/manage/groups), and the values actually used are never lower than the minimums here.

## Switches and Sending Behavior

### Reply texts and visual styles

Three styles are available for displaying replies, saved as soon as you switch:

- **Traditional texts**: the concise wording and plain text layout of early versions.
- **Standard texts**: the current standard wording; platforms that support Markdown render it, and others convert it automatically into readable text.
- **Advanced visual texts**: adds semantic components such as status bars and action hints on top of the standard texts. QQ Official can turn usage hints into buttons that fill the input box when clicked, while plain text platforms show stable forms such as `HP [██████░░░░] 6/10` and `.r // roll command`; no images are generated.
- **Scope overrides**: global, platform type and individual adapter accounts can each choose, with the priority account > platform > global; after clearing an override, the level above is inherited again.
- **Sending performance**: plain text versions of Markdown texts are generated in advance when loading or saving. After QQ Official rejects cards twice in a row, plain text is used automatically for 10 minutes before probing again.

Advanced visual presets can be loaded into the editor in full, and the body, buttons, status bars and formulas can all be changed; editing the body doesn't remove existing buttons. Old custom texts stay unchanged; load a preset and adjust it by hand when needed. For editing, see [Commands → Customizing reply texts](/en/manage/commands#customizing-reply-texts).

| Setting | Description |
|--------|------|
| Start at login | Start automatically when you sign in to Windows (Windows only) |
| Windows tray tooltip text | Set the tray icon hover name in the "Network & system" tab, up to 10 characters; empty uses `Dice!Next`; the actual port is appended automatically, takes effect as soon as you save, and can only be changed on Windows |
| Save log images | Images in session logs are saved to `data/logs/images` and embedded when exporting web pages |
| Respond to own messages (self-control) | Messages sent by the bot's own account are processed too, so you can control the bot from its own account; built-in self-echo deduplication and cross-bot loop guards; off by default |
| Disable roll reasons | When on, `.r` only shows the result without the reason: `.r 1d6 攻击` only replies with the 1d6 result, and text alone rolls the default die. Off by default, so reasons are shown as usual |
| Quote the roller's message | Replies quote the message that triggered the command, in QQ's "quote" style |
| Auto sheet summary (HP/SAN) | After `.st` sets base characteristics, HP / SAN / MP are calculated automatically and a summary is attached (COC-type rules only) |
| Merge long messages into forwards | Replies over the threshold (default 1200 characters) are sent as merged forwards to avoid flooding (group chats only, OneBot only) |
| Split length | Overly long replies are split automatically (default 600, about 300 Chinese characters; splitting at line breaks where possible) |
| Username wrapping | The prefix and suffix around usernames in replies (default `<` `>`, as in "\<希亚\>掷骰"; empty = no wrapping) |

Custom tray names are supported since build 926 and saved as `tray_text` in `config/dice.json`; this isn't a per-platform or per-adapter-account override. You can also view `{ text, port, tooltip, supported }` through the authenticated `GET /api/system/tray`, and submit `{ "text": "希亚骰" }` with `PUT /api/system/tray`; the port can't be changed through this API. The name is counted in Unicode characters and can't contain internal line breaks or control characters.

## Image Settings

- **Image sending**: images inserted in replies are saved as `[img,file=local path]` and converted when sending into embedded base64 (default, works across devices) or an HTTP link (NapCat must be able to reach this machine).
- **Image hosting (stable image links)**: decides how log images stay visible on the log site long term: don't upload / third-party image hosting (generic multipart upload, works with ImgBB, sm.ms, Lsky and similar) / local links (self-hosted, requires public HTTPS).

## Chat and Friend Maintenance

- **Chat history retention**: chat simulator messages are persisted (`chat.db`) and cleaned up automatically after the set number of days.
- **User group**: set an official user group, optionally requiring members to join and allowing invitations.

### Automatic Cleanup of Friends, Groups and Local Records

This card is a global setting with two groups; click save after changing, with no restart needed. The first check runs about 5–6 minutes after startup, then every 12 hours.

| Setting | Actual behavior | Meaning of 0 |
| --- | --- | --- |
| User record inactivity period (days) | Cleans up user profiles by the time of the last message received; old profiles fall back to the command / creation time | Off |
| Group record inactivity period (days) | Cleans up group list data by the last message / command time; it reappears after a new message | Off |
| Friend command inactivity period (days) | Calls the adapter to delete friends; uses the profile creation time when there's no command record | Don't delete friends |
| Group command inactivity period (days) | Leaves groups where the current bot account hasn't received commands for a long time; ordinary chat doesn't count as commands. A farewell mentioning the idle days is sent before leaving | Don't leave for inactivity |
| Leave groups with more than this many members | Leaves when the member count is strictly above the limit; not the number of groups the bot can join | Don't leave by size |
| Max groups left per round | Limits how many groups are left in this round; the rest wait for the next round | **Unlimited**, not "cleanup off" |

Local record cleanup never calls the delete-friend / leave-group APIs, and keeps character sheets, session logs, identity bindings, plugin variables, group rules and permissions. Nicknames, affection and counts in user profiles are removed with the profile; expired group list data is hidden for now, and real messages create the record again. Manual removal / left-group markers are never cleared on their own by ordinary messages.

Dice masters and trusted / allowlisted users are exempt; allowlisted groups, old cleanup-exempt / ignore settings and groups currently recording logs are protected. Unknown or invalid activity times are never treated as "inactive for a long time". Friend deletion and leaving groups only run on adapters that are connected and support the corresponding API; another bot account's activity record is never used to decide that the current account should leave. Group cleanup sends a farewell first, then submits the leave; deleting friends sends no private message.

The configuration, enabled state and execution of existing scheduled tasks don't change. If you previously set up automatic leaving through scheduled tasks, check them first so you don't run two identical policies at once.

## Import Legacy Data

Enter the path of the original Dice!'s data directory to migrate character sheets, player profiles, the blacklist, custom replies, decks, mods and more in one step, optionally overwriting data with the same name. See [Data Migration](/en/guide/migration).

## Original Global Settings

Reproduces the original Dice!'s console global configuration, managed in groups:

| Group | Content |
|------|------|
| Response switches | Global silence; globally disable `.jrrp` / `.me` / `.deck` / `.draw` / `.send` / `.help` |
| Decks / display | Whether to hide deck `_` metadata keys |
| Event responses | Group join requests / join feedback (welcome messages) / friend requests / friend added / leave groups with blacklisted users automatically / ban automatically when kicked / ban and leave automatically when muted / also ban the inviter |
| Cloud / network | Cloud visibility and so on (items labeled "record" are reserved for now) |
| External requests | The custom reply `{api:URL}` switch and timeout (off by default, private network addresses blocked automatically) |
| Automatic maintenance | Local user / group record retention periods, friend / group command inactivity cleanup, per-round leave limit (see above) |
| Other compatibility | Private mode and other recorded items |

> Items labeled "record" save their configuration, but the behavior isn't connected yet; they are reserved for compatibility.

::: tip Disabled commands don't apply to trusted users
Globally disabling a command only applies to ordinary users; trust level 4 and above / dice masters aren't restricted.
:::

::: info Dice master notifications have moved to the "Notifications" page
Notification windows, event subscriptions, SMTP / webhook delivery and audit logs are now all managed on the [Notifications](/en/manage/notice) page.
:::

## WebUI Settings Page

**Web panel → System settings → WebUI Settings** manages the panel's own settings:

There is only one panel interface (the former V2 became the official version, and the old interface no longer ships with the package). Previously bookmarked `/v1/` and `/v2/` addresses redirect to the panel home automatically; the old `ui_version` field in `config/webui.json` is no longer used and doesn't affect startup if left in place.

| Setting | Description |
|--------|------|
| API Key | The authentication key for the backend API, the same as `server/api_key` in the configuration file |
| Panel login password | Once set, opening the panel requires the password first (cookie session authentication); when logging in you can trust the device for 30 days, surviving program restarts. Clearing it requires password setup again, and changing / clearing it invalidates existing login sessions; several installations on the same machine use separate cookies, and logging out only affects the current instance |
| Listening IP and port | The listening address of the panel and API (`0.0.0.0` means all network interfaces) and the port (default 18088). **A restart is needed after changing** (HTTP listening is bound at startup and can't be switched on the fly); after saving you can click "Restart now" |
| Theme | Light / dark / follow the system |
| Console log | Minimum recorded level TRACE / DEBUG / INFO / SUCCESS / WARN / ERROR, default INFO; protocol event diagnostics still follow the level, with normal heartbeats at TRACE and polling at DEBUG, never raised to INFO |

The recorded level controls logs written to the console and files from then on; the home page's "minimum displayed level" only filters records in the current browser. Lowering the displayed level can't bring back DEBUG / TRACE output that was never saved. For the format, plugin sources and message correlation, see [Program logs](/en/manage/dashboard#program-logs).

The settings workspace is split into tabs by function, and saving still follows each item's button or the immediate save notice. For installing the panel as a standalone browser window, see [Installation → Install the Web Panel as an App](/en/guide/install#install-the-web-panel-as-an-app).
