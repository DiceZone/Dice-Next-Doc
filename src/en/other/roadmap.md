# Roadmap

## Implemented · Text editor and Markdown migration (2026-11-04, unreleased)

- Text editing dialog:
  - Editing and preview side by side, each scrolling on its own; narrow screens use a toggle button.
  - New Markdown formatting toolbar: select text to make it bold, quote it or turn it into a list, with Ctrl/⌘+B and I supported.
  - Removed the per-variable style settings.
  - The "Load preset" menu merges the former preset selector and restore button.
- New texts default to Markdown. Plain text entries can be converted one by one with a single click, or in bulk by language and persona in the command list. Conversion keeps template syntax as-is and only escapes characters that would trigger formatting, so the display doesn't change.
- The advanced visual preset and standard texts drop all emoji in favor of bold titles and quote blocks. Only syntax listed in the QQ Official docs is used, and new tests keep emoji from coming back.
- Embedded texts such as check levels, opposed results, Psychology receipts and affection titles keep their styling once set to Markdown, and the editing preview shows it too.
- `.r` expansions keep parentheses and minus signs as in the original formula; for example `5-(-1)` no longer displays as `5--1`.

## Implemented · Random source fallback, install as app and global command search (2026-11-04, unreleased)

- When the dice random source is unavailable it falls back to another secure random source automatically, and only when all are unavailable does it use the emergency pseudo-random generator and log it, so rolling is no longer interrupted; new CPU hardware entropy source (RDSEED XORed with the system random source, x86-64 only). The random source setting moved to Basic settings, and the ineffective "Dice rules" placeholder page was removed.
- Install as app: fixed the backend refusing to serve `manifest.json` (the static allowlist didn't include `.json`), which meant browsers never offered installation; the manifest now uses relative addresses, and a navigation-level Service Worker that caches no content was added; when the browser allows installation the top bar shows an "Install app" button, and WebUI settings explain the HTTPS requirement.
- The command list gains cross-category global search; the command playground replies in the interface language by default; the backup page is complete in all four languages.
- QQ Official: fixed occasional QR code 404s, lowered the internal invite API's no-permission log to DEBUG, session logs no longer record SN status lines, and the SN "colored text" color can be picked with a palette or a screen color picker.
- Checks and attribute changes share one arithmetic module: fixed multi-level modifiers only counting the first term, with support for multiplication and division, powers, parentheses, dice rolls, several attributes and common functions; `.st` additions and subtractions are calculated as a whole.
- The home page charts now use a 1-hour history sampled by the backend, and status cards can be clicked to jump to their pages.
- The dashboard no longer shows the database path, macOS system icons were added, and the About page's project introduction was rewritten.

## Implemented · QQ Official SN appearance settings (2026-11-03)

- The top status line now uses small red formula text, with quote, plain text, custom Markdown format and off options added.
- Basic settings provide scoped configuration, preview and restoring inheritance; `{sn}` / `{sn_tex}` are supported, special characters are escaped, and plain text and formats refuse to degrade.

## Done · Connection configuration and cleanup maintenance (2026-11-03)

- Improved QQ Official Webhook address guidance, WebSocket labels, QR code and manual credential entry, adapter editing and card layout.
- Added `/` to the default command prefixes; the dice random source supports secure system random and OpenSSL, using the system interface without an extra random pool by default.
- The home page server info keeps samples for the current browser session, with loading and error states added; fixed duplicate cards after switching settings, and light-theme dialogs and input areas are uniformly white.
- `.setcoc help` explains all house rules 0–7; the scopes and options of `.bot`, `.set`, `.lang` and `.sn` were documented as well.
- Basic settings add leaving inactive group chats and cleanup of local user / group records, with old Dice record periods migrated by their original meaning; existing scheduled tasks are unchanged.

## New WebUI becomes official (2026-11-02)

- The former V2 is now the only admin panel interface, maintained on WebUI `main`; version switching and dual-version installers were removed, and the old version is archived on the `v1-webui` branch without further maintenance. Old `/v1/` and `/v2/` addresses redirect to the home page automatically.

## Done · WebUI V1 / V2 dual-version transition

- The current interface is named V1 (default); V2 is developed on the separate `webui-v2` branch of the WebUI and labeled "Preview". The first version completed the migration of Tailwind 4 and shared component themes, unifying the light, dark and narrow-screen appearance of the sidebar, top bar, cards, forms and lists.
- V2 connects real hash routing and per-page loading, in-memory caching of remote data, structured form validation, calendar and notification components. The statistics trend chart keeps all dates, filters, dice distribution, online history and user / group rankings. Write operations aren't retried automatically, and cancelling a page leave keeps the draft.
- Added component unit tests, page and theme browser regressions and Biome quality checks; the existing business regressions of both UIs are kept. Fixes to the shared old blacklist format parsing and icon paths in version subdirectories were synced to V1/V2.
- Version selection replaces the content width setting and is persisted to `config/webui.json`; data and login are shared, switching doesn't require restarting the bot, and missing resources fall back with a hint.
- Releases build both sets of resources, and the full packages for all five platforms include V1/V2; the source record lists the SHAs actually built from both branches.
- Until V2 officially replaces V1 and V1 is deleted, every feature change must be synced to both UIs, maintaining translations, help, search and tests together. This requirement is written in the repository's `AGENTS.md`. See [WebUI settings](/en/manage/settings#webui-settings-page).

## Release candidate · MCP server first version

- Off by default with loopback direct connections preferred; provides real mathematical dice rolls, help search, non-sensitive runtime status, and read-only queries authorized per specific sheet.
- Separate Bearer credentials, shown in plain text only on creation / rotation, with permission changes, explicit renewal and immediate revocation; editing permissions doesn't extend validity, and BDC keys or browser login state aren't reused.
- The panel provides connection guidance, authorization management, and server-side paged records filterable by client / result; Host / Origin validation, locked reads, request rate limiting, workload and integer overflow protection are kept, and invalid sheets don't prevent disabling an authorization.
- Admin writes add cross-site protection and atomic saves; audit failures don't lose generated credentials. Timeouts can be checked against the operation status without automatic retries; tool and admin queues are isolated, and revocation discards in-flight query results.
- Recovery from errors only releases the operation lock after the current configuration has been read back successfully; per-credential concurrency limits, execution deadlines and cooperative cancellation on exit were added. After restoring the configuration / main database old keys become invalid, the authorization scope is kept for review, and it can only be enabled after regeneration; restoring resources alone isn't affected.
- Added joint testing of the old and new protocols with the official MCP SDK / Inspector, running behind an HTTPS prefix reverse proxy verified with a temporary certificate, included in Windows / Linux CI tests without turning off TLS verification.
- Added a local connection self-check that doesn't run tools; the authorization page adds the selected sheet names, owners and invalid states, judges expiry by the server clock, and shows the most recent successful calls kept in the audit.
- Added isolated Chromium page interaction regressions; the macOS packaging job adds HTTP and official client HTTPS interoperability checks, with actual macOS results awaiting workflow runs.
- Doesn't open sending messages, changing settings, arbitrary commands / plugins or sheet formula execution, and adds no user runtime dependencies. See [MCP Service](/en/manage/mcp).

## Release candidate · Built-in login (OpenOPQ, experimental)

- Platform connections gain built-in login: after entering a QQ number and a valid BDC bot API Key in the panel, the protocol client is downloaded and managed, showing the QR code and download progress; supported in both V1 / V2.
- The protocol client isn't shipped with installers; the manifest signature, file size and SHA-256 are verified before execution, and abnormal manifests aren't executed. The management interface uses local loopback, and ordinary OneBot configuration and reconnection policies are unchanged.
- This feature needs the center to provide protocol clients and a signing service for the corresponding system, and remains experimental. For operation and boundaries see [Built-in login](/en/manage/adapter-manager#built-in-login-openopq-experimental).

## 2026-10-19 · Safe compatibility for old convenience features (main)

- Help aliases now cover custom entries and file entries; lookups respect source, language, search scope and loop limits, and no longer copy the target body in advance.
- Lua `msg:format/get/echo` bring in the current message's scalars and controlled dotted paths; collection length, cached identity display for the current account and local variables were added. Ordinary texts, advanced replies, Lua and decks share safe template parsing, keeping the decks' existing weight, media and escaping rules.
- Dynamic catalogs filter by account, group, user and enabled state, adding JS command snapshots that don't run scripts and static variable condition checks for Lua, without consuming rule counters; game decks add integer ranges and group member snapshots, keeping the meaning of `.deck set` and all permission boundaries.
- `wait` became a bounded asynchronous reply / Lua coroutine resumption; previews don't wait, and reload, disabling and exit keep cancellation protection. Template script execution, thread-blocking waits, privilege escalation via arbitrary virtual messages and host configuration pass-through aren't restored; see the [Lua reference](/en/develop/lua-mod), [Help Documents](/en/manage/help-docs) and [Decks](/en/use/deck).

## 2026-10-19 · Lua roulette plugin self-mute compatibility (main)

- Added controlled compatibility for old plugins requesting a self-mute of the current group and current player via `eventMsg`, keeping the duration in minutes; admin permission for arbitrary virtual messages isn't opened.
- When the bot itself is the virtual private-chat user, it no longer sends a receipt; OneBot fills in the account identity from valid events and blocks invalid send targets, avoiding the platform error of private chat `0`.
- Group disabling, blacklists, per-group plugins and bot admin permission checks are kept, blocking cross-group use, target switching and permission borrowing through virtual / delayed messages. See the [Lua mod compatibility notes](/en/develop/lua-mod#old-self-mute-calls-in-roulette-plugins).

## 2026-10-19 · Custom help and source filtering (main)

- Help entries added by historical commands and imported from the old version are included in Help Documents and can be queried, edited and deleted; the original content, language and format are kept, and existing data doesn't need re-importing.
- Help Documents support filtering by user custom, built-in, plugin, rule pack, doc pack and other sources, then choosing a specific source; whole-catalog search, counts and paging are consistent.
- Backups include custom files and help text overrides in all languages, compatible with the old file format; separate custom help is no longer listed as unclassified text. See [Help Documents](/en/manage/help-docs).

## 2026-10-18 · .bot fixed information and BotMsg (main)

- `.bot` has three fixed lines of system information: the author name follows the backend's persisted global default reply language, and the compatibility engines match the expression settings actually enabled for the current account.
- The WebUI can edit additional notes per scope; the old BotMsg and header can be migrated, keeping the original text and appending the default feedback note at the bottom of BotMsg, without appending again on repeated imports. See [BotMsg additional info](/en/manage/settings#botmsg-additional-info).

## 2026-10-18 · Group record cleanup and bulk operations (main)

- Fixed account records reappearing after deletion via shared old record fallback, cached group lists or in-flight messages; really rejoining a group restores per account without affecting other bots in the same group.
- Bulk leaving can also clean up group management records; "Left groups" supports bulk cleanup, offline account cleanup, failure retries and rechecking rejoin status.
- Cleanup doesn't delete character sheets or session logs. For the entry and boundaries see [Groups](/en/manage/groups#cleaning-up-left-group-records-in-bulk); whether an installer includes the change follows the source version of the corresponding Release.

## 2026-10-09 · Complete automatic updates for Linux/macOS (unreleased)

- New lightweight foreground manager: full packages started via `start.sh` / `dice-next` can install and restart, install automatically on a schedule, and apply an authorized ready package on ordinary restarts.
- Strict unpacking, execution probing and transactional recovery protect program replacement, keeping configuration, the database, user decks and non-built-in plugins; the database isn't downgraded automatically and Gatekeeper isn't bypassed. See [Installation and upgrades](/en/guide/install#upgrading).
- Linux/macOS packages of beta.928 and earlier need one manual full upgrade first; running the core directly doesn't support installation, and containers still upgrade by updating the image.
- The local macOS update suite of 48 cases / 376 assertions and isolated process tests passed; the Linux release pipeline added a lightweight smoke test, while cross-version acceptance of full packages on real machines and the new release are still pending.

## 2026-10-05 · Scheduled update installation

- Windows manager mode supports downloading and verifying first, then installing at a scheduled time in the server's time zone, 04:00 by default. For operation and restart recovery rules see [Update settings](/en/manage/settings#check-auto-update).
- With automatic installation on, any earlier restart installs the ready package without waiting for the schedule; the schedule only limits restarts initiated by the program. Download-only / notify-only policies keep the package but don't install at startup.
- The installation plan is persisted, interrupted / cancelled preparation isn't scheduled automatically, and checking the same staged version again doesn't re-download or change the plan.

## 2026-10-05 · Probabilistic texts and multiple personas (released, build 926)

- Command and persona texts support adding, deleting and editing several candidates, weights and actual probabilities; compatible with the old sample, with nested samples allowed inside candidates.
- The preview shares the backend renderer and can redraw; the Markdown / plain text cache from saving is kept, without introducing full conversion on every use.
- Several probabilistic personas can be activated globally, with one chosen per command; the priority of fixed selections for group chats, private chats and accounts is kept, and configuration, copying and import / export persist.
- See [Commands and Texts](/en/manage/commands) for usage. build 925 and earlier don't include this feature.

## 2026-10-05 · Startup directory protection and tray hints (released, build 926)

- The Windows launcher and core refuse to run in a temporary directory and prompt you to extract completely to a fixed directory; the check happens before configuration, logs and the database are written. See [Installation](/en/guide/install).
- Basic settings can customize the global tray name, up to 10 Unicode characters, with the actual port appended automatically and taking effect on save. See [Settings](/en/manage/settings).
- Fixed the ambiguous optional JSON conversion in the cloud character sheet comparison, resolving the same compile error of the October 4 release builds on Windows, Linux and macOS.

> Current stage: **Beta public testing and stability polishing**. Below is the current status test users need to know; historical development details have been moved off this page.

> Unconfirmed plans aren't listed in the roadmap; the cross-platform identity and group data linking plan under discussion has been [archived](./discussion-archive) separately for later evaluation only, and doesn't mean it's scheduled or promised.

Records up to **2026-10-10**. Historical release entries are archived by the build numbers shown; whether the latest completed capabilities are in the installer you use follows the source version and actual release time on [GitHub Releases](https://github.com/DiceZone/Dice-Next/releases).

Recorded local Windows full baseline (2026-09-28–30): **470 core cases / 2996 assertions, 151 Lua assertions passed**; see the [build records](https://github.com/DiceZone/Dice-Next/blob/main/docs/ci-release-build.md). On October 3 there were also targeted verifications of 102 WebUI items, 22 update module items / 169 assertions and 29 i18n / help items / 138 assertions; see the [test records](https://github.com/DiceZone/Dice-Next/blob/main/server/tests/TEST_REPORT.md). Different scopes aren't added together; "released" only means the installer has been produced, not that delivery and rendering acceptance on real platforms are all complete.

## Current Progress

### Implemented (2026-10-16, local wrap-up): Mod self identity, game decks and log hooks

- The bot's own ID, `self_var` and delayed events follow the triggering account, and another account isn't borrowed when the identity is unclear.
- Lua three-argument draws and native `.draw` share the game's no-replacement deck pool, with old saves and remaining counts persisted; new [Session deck management](/en/use/deck#private-campaign-decks-deck-session), while the original group temporary decks are unchanged.
- `LogEnd` provides the actual file name, path, log name, count and source; `.game over` calls it after settling and releasing the game lock. Not yet committed or shipped with an installer; for the final verification scope see the main repository's test records.
- Added copy-based acceptance with four groups of real corpus: ResourceSearchEngine, 求签 (fortune drawing) / DailyNews, inventory and slot management; fixed speech case / random arrays and variable leakage between directory files / text scripts. Network and messages use stand-ins, the original plugin source files weren't modified, and real accounts and Linux/macOS are accepted separately.
- Added case handling for script names / help topics, the directory `init.lua` entry and multi-level help aliases across mods. Ordinary `.help` and help references render the selected entry with context, without changing Next's existing priority and search scope, and loop expansion is bounded.

### Implemented (2026-10-15, local verification): Safe compatibility extensions for old Dice! Mods

- Added multi-line TOML / complex tables, text candidates and empty replies, plus probability, lists, shared cooldowns, daily limits, synchronization locks and type conditions.
- Supports server time zone clock, safe lifecycle / message hooks, rule book inheritance and tape, nested mod management and script namespaces; asynchronous replies keep the triggering account, and old callbacks are cancelled after reload / destruction.
- XML only converts safe numeric formulas without running arbitrary JS; disabling, blacklists, content blocking and existing permissions are kept, and old remote installation or safety policy overrides aren't restored.
- Not yet committed or shipped with an installer in this round; for capabilities and remaining differences see the [Lua mod reference](/en/develop/lua-mod), and for the verification scope the [main repository test records](https://github.com/DiceZone/Dice-Next/blob/main/server/tests/TEST_REPORT.md).

### Implemented (2026-10-12): Program logs and message pipeline

- INFO by default, with unified time, six log levels, feature modules and content; code locations, threads and script stacks are kept in diagnostic details.
- Processing results and the content about to be sent explain their source, while actual sending keeps the content and uses msgID to correlate segments, format fallbacks and failures; scheduled tasks, Lua delays and JS cross-plugin asynchronous continuations keep the real source.
- The home page supports level filtering, search and related records, and WebUI settings control the actual recording threshold separately; normal heartbeats and polling don't flood INFO.
- For the full format and boundaries see [Program logs](/en/manage/dashboard#program-logs). Installers follow the actual results of GitHub Releases.

### Released: Cloud service commands reorganized and identity verification

`.cloud` takes over cloud operations, and `.pc cloud` remains as a compatibility entry. `.bind qq <QQ number>` prefers OAuth when there's an official bot Key, and otherwise uses the QQ mailbox verification configured by the dice master; avatar verification is deprecated. All command help uses one command per line plus `// description`. See [Cloud services and identity binding](/en/use/cloud).

### Released: Old random text compatibility

`{sample:A|B}` is supported and can be used in command replies such as rolls, persona texts, custom replies and `.text`, with nesting and the variables already available at that entry; the existing `{A|B}` shorthand of custom replies is kept. build 909 and earlier don't support it. See [Text editing](/en/manage/commands).

### Recently Completed

- **SealDice-style shortcut commands**: `.alias` supports group / personal definitions, overriding, deletion and listing; `.&` / `.a` run built-in and plugin targets with the caller's permissions and append arguments; the old account permission linking is kept and moved to `.admin account-alias`. Frontend text categories, previews and usage notes were updated; see [Shortcuts](/en/use/fun#shortcuts-alias).
- **Admin panel upgrade**: unified tabs, content width, split-pane paging, group / player details, help editing and read-only deck management; scheduled tasks are edited in dialogs and support bulk operations.
- **Channel-scoped advanced replies**: the page header uniformly selects global / platform / account, and poke reuses that scope; advanced options collapse responsively, and scrolling and overlapping bottom buttons were fixed.
- **Versions and updates**: a text version entry with a New hint at the top right; download cancellation, stall timeouts, source switching and retries; installation still can't be cancelled. The WebUI can be installed as a standalone window via the browser, but offline management isn't supported.
- **Basic old Mod compatibility**: global `.mod` management, common TOML replies, cycle events and import order are released; the local extensions of October 15 are described above and aren't counted in the released scope.
- **Release builds**: dependency caches can be refreshed, the pinned vcpkg baseline keeps the full history, and releases are separated from backend tests; the most recent beta.925 release build succeeded, which doesn't mean every platform has been accepted on real machines.

For detailed dates, commit IDs and verification scopes, see the [recent changelog](/en/other/changelog).

| Module | Progress | Current capabilities |
| --- | --- | --- |
| Rolling and rules | <Icon name="circle-check" tone="ok" />Usable | General dice, COC, BRP, DND, WOD dice pools, hidden rolls, character sheets and rule quick reference |
| Sheets and games | <Icon name="circle-check" tone="ok" />Usable | Multiple sheets, BDC cloud sheet authorization and manual sync, automatic character creation, `.game`, group-shared NPCs, HP / initiative / coins |
| Group management and logs | <Icon name="circle-check" tone="ok" />Usable | Per-group switches for logs / replies / rolls / plugins, permissions, notifications, automation, session logs, cross-game log export, decks, cross-window forwarding |
| AI (optional) | <Icon name="circle-check" tone="ok" />Usable | OpenAI-compatible gateway, polishing / translation, conversation memory, tool calls, NPC roleplay |
| Mods and rule packs | <Icon name="wrench" tone="warn" />In progress | SealDice JS plugins, Lua mods, rule packs; custom rules are still being improved, and Python isn't planned for now |
| Platforms and panel | <Icon name="circle-check" tone="ok" />Usable | QQ OneBot v11 / Milky / QQ Official Bot 2.0, Discord, KOOK, web admin panel, cloud services, read-only beginner tutorial, multiple languages, data migration, simulated chat, automatic Release detection and download |
| Testing and docs | <Icon name="wrench" tone="warn" />In progress | Public beta feedback, stability and documentation improvements |

## Known Issues and To-Do

- AI polishing / translation now has Markdown structure validation, and mixed built-in and JS hooks have format isolation; acceptance with real models and the full message pipeline is pending.
- The text editor's Markdown toolbar replaced the per-variable style settings; interface acceptance on more real texts and persona entries is pending.
- Continue accepting the combined experience of account > platform > global overrides of the three schemes, restoring inheritance, and group / private `.bot text` forcing plain text; the old two-state global master switch rule has been replaced by the three-scheme approach.
- Command text previews share the send serializers of QQ Official, KOOK and Discord, distinguishing QQ group chats / C2C from channels; they only illustrate text / card structure, and media and client rendering still need real-machine acceptance.
- The updater's Windows download cancellation, retries, extraction preparation and installation flow still need acceptance with real installers; installation itself can't be cancelled.
- Old Dice! JS isn't supported for compatibility; existing JS uses the SealDice system, and Python isn't planned for now. On October 15 Lua clock / safe hooks, nested Mods and full TOML parsing were added locally; the next focus is cross-platform and real plugin acceptance, and loading diagnostics still keep safety boundary hints.
- Cloud character sheets currently sync manually, with a new personal private-chat `.cloud diff` three-way comparison; automatic sync and per-field conflict editing are still being designed, and re-authorization is needed after expiry / restart.
- QQ msg_type, KOOK card types and Discord literal output now have payload-level regression tests; media and real account behavior are still pending acceptance.
- The WebUI has a separate lightweight CI that doesn't trigger backend builds or releases; its first remote run after committing is pending.

## Manual Acceptance of Release Candidates Requiring Real Credentials

The following items can't be replaced by the playground, simulated HTTP chains or credential-less CI. Until the corresponding checks are done, they shouldn't be described as "verified on real machines":

- [ ] **OneBot v11**: sending and receiving in group and private chats over forward / reverse WS, reconnection, CQ images / files / voice / video, and the final text after explicit Markdown replies degrade.
- [ ] **QQ Official Bot**: the message capability boundaries of group chats, C2C and channels each; successful Markdown / cards, traditional text fallback after platform refusal, and end-to-end sending of images / files / voice / video.
- [ ] **Discord**: server channels, private chats, mention commands, final online text / Embed rendering and attachment sending.
- [ ] **Milky**: HTTP API and WebSocket event connections, group / private chats, media and group files, reconnection; Webhook isn't open.
- [ ] **KOOK**: channels, private chats, mention commands, final rendering of KMarkdown / CardMessage and media sending.
- [ ] Record adapter versions, account permissions, test windows and results; Bot Tokens, AppSecrets and OneBot Access Tokens must not appear in logs, screenshots or the repository.

## Changelog

Item-by-item records from 2026-09-18 to 2026-10-03 have been added to the [Changelog](/en/other/changelog). The historical entries below keep their status at the time and aren't a current list of unfinished work.

### 2026-09-14 · builds 907–908: cloud character sheets and cloud services

- **BDC cloud character sheets**: players can authorize, list, pull, upload and manually sync cloud sheets in private chat; read-only by default, with writes requiring confirmation on the web. Local session data is kept, conflicts stop syncing, re-authorization is needed after expiry or restart, and player tokens aren't persisted.
- **Cloud service management**: the bot key, heartbeat, cloud blacklist, cloud character sheets and log site are gathered on a separate page; the adapter's original key entry still reads and writes the same configuration. Basic settings keep the image host, and old entries and search links redirect compatibly.
- **Tutorials and settings compatibility**: the cloud service migration and the read-only beginner tutorial on real pages are both kept; demo data doesn't overwrite real settings.

### 2026-09-11 · builds 905–906: QQ Official APIs and file export

- Added QQ Official group info, members, management, menu, recall, channel and other APIs, offered to plugins through `qq_*` actions; fixed GET query parameters and rich media field formats.
- `.log export` connects to the official rich media file channel, fixing the earlier issue where export showed success without calling file sending.
- The APIs are still subject to account permissions, allowlists and platform limits; code integration and automated tests don't mean end-to-end sending on real accounts has been accepted.

### 2026-09-08 · Per-group feature switches and command regressions

- New per-group switches for four categories (logs, replies, rolls, plugins), supporting chat commands and the group management panel, isolated per bot account.
- **Current behavior**: `.bot off` again controls log recording and timing; turning off doesn't end the session, and turning back on doesn't cancel a user's manual pause. The September 7 plan of "logs independent while off" has been replaced by this.
- "Log only" requires keeping the master switch and logging on, and turning off unneeded features such as rolls, replies and plugins.
- Fixed `.en` growth values, `.ri` initiative dice and counts, `.ob` spectating operations, and `.group` cross-group permissions, multiple entries and clearing behavior.

### 2026-09-04–07 · Milky, personas and original behavior

- New Milky adapter, calling the API over HTTP and receiving events over WebSocket; Webhook isn't supported for now. Fixed temporary private chat identity, group history and group file field compatibility.
- Persona switching unifies group, channel and account scopes and inheritance rules; `.setcoc` setting, querying, clearing and reading during checks are unified, fixing the case where setting succeeded but the official rules were still used.
- `.me` narrates based on the body text and no longer forcibly adds the speaker's name; remote narration still checks permissions.
- Added a compatibility entry for operations `.master` already supports, without opening arbitrary admin command execution; unimplemented destructive old operations give a clear hint.

### 2026-09-03 · In development

- **Updater reliability**: checking and download subprocesses support cancellation and reaping on stop; mirror checks cancel slow sources after the first valid result; temporary file names add process and random isolation; the Windows container probe adds `DOTNET_RUNNING_IN_CONTAINER`.
- **Recoverable WebUI errors and search**: update operation errors stay until the next operation or until the user closes them, and can be copied; search adds container / Docker / image upgrade / automatic detection, and handles Chinese compound words without spaces with AND semantics. Seven pure-logic regression tests are connected to the Release WebUI build.
- **Official image startup gate**: before pushing multi-arch tags, the Docker release workflow generates an amd64 candidate image with the same Dockerfile, Release parameters and build cache and actually starts it; without platform credentials it verifies container self-detection, refusal of the download / install APIs, refusal of the automatic download policy and process liveness. On failure it doesn't proceed to the official push step.
- **Verification status corrections**: released versions, automated tests and real-machine platform acceptance requiring credentials are recorded separately; outdated test counts were corrected, and references to a nonexistent roadmap file removed.

### 2026-09-01 · builds 892–893

- **Command routing and expression regressions**: complete command words registered by plugins take precedence over old compact prefixes; the original built-in aliases were added, and `.rd测试`, `.r 2#d100`, `.dx5c10测试`, `.ww5测试`, DiceScript non-numeric results and the final Double Cross modifier were fixed. 求签 and DailyNews are still ordinary third-party plugins and aren't blocked as system features just because they took part in tests or ship with the package.
- **SealDice JS / Dice! Lua compatibility**: added `seal.format` temporary variables, real endpoints and multi-account context; Lua commands support `@` arguments; fixed the old ResourceSearchEngine index path, DailyNews refreshing across days and the call lifecycle of old single-file Lua.
- **WebUI multi-instance login isolation**: when several Dice!Next instances run on the same host, each installation uses its own stable session cookie; different ports don't push each other's login out, and the same instance keeps its 30-day trusted state after restart or a port change. Old cookies migrate automatically, and logging out only affects the current instance.
- **Global search keeps improving**: the search scope extends to pages, features and specific settings, adding backend pages such as statistics, logs, help and roadmap; synonyms such as "upgrade / update" and "翻译 / 翻訳" (translate) hit the same feature, and light tolerance for common typos is provided, with results clearly marking the content type and match method.
- **Update boundaries inside containers**: the official image declares the container environment explicitly, and the program also falls back on Docker / Podman markers, Kubernetes environment variables, Windows container variables, systemd markers, cgroup and mountinfo. New Releases can still be checked and notified inside containers, but manual / automatic download and installation are blocked hard by the server, and the Windows manager doesn't apply leftover staged packages; old policies run as "notify only", and upgrading should pull the image and recreate the container.
- **Verification**: core tests are now 286/286 (1153 assertions), WebUI search and update error state tests 7/7; Lua self-contained compatibility tests 68/68, and 123/123 assertions with ResourceSearchEngine, 求签 and DailyNews actually mounted; plus a real test of `18088` / `18089` dual instances coexisting in the same browser cookie jar, logging out separately and recovering trusted restarts. These are automated and local HTTP / plugin corpus verifications, and don't mean real network delivery is complete for OneBot, QQ Official, Discord or KOOK.

### 2026-08-27 · build 871 (in development)

- **GitHub Release updater**: reads `update-manifest.json` by current OS / architecture, supporting manual / periodic checks, notify only, automatic download, and automatic installation and restart in Windows manager mode.
- **Mainland China mirrors**: following NapCat's parallel probing idea, GitHub and built-in mirrors are tried at the same time and available sources cached briefly; direct-only, mirror-only and custom HTTPS mirrors are supported.
- **Integrity and rollback**: strictly verifies repository, version, package name, size and SHA-256, and blocks archive path traversal; when the Windows transactional replacement fails, the old version is restored automatically, and user data isn't in the replacement list.
- **Management and distribution**: the About page provides four-language status / progress / source / policy settings; the Release workflow generates and uploads the update manifest automatically.
- **Asset name compatibility**: new installers uniformly use safe file names that GitHub won't rewrite, and the workflow refuses unsafe names; the updater accepts asset names in historical manifests where GitHub normalized parentheses to dots, and includes the HTTP status in failure messages.
- **Update notifications**: finding a new Release and the success and failure of automatic download / installation all connect to notification windows, third-party push and the audit log; Windows installation results are reported after checking the actual version after restart.
- **macOS CI**: the updater thread drops the `std::jthread / stop_token` dependency missing from Xcode 15.4 libc++, using the equivalent `std::thread + condition_variable`.
- **Old Dice! Lua plugins**: `loadLua()` restores support for subdirectories next to single-file plugins and Chinese paths, so 求签 can read `求签/*.lua`; Lua `http.get/post` restores default public network access, so DailyNews can fetch data at load time while SSRF / protocol protection is kept.
- **Verification**: the server compiled completely; the main tests with 259 cases / 941 assertions and the standard Lua compatibility tests with 2 cases / 11 assertions all passed; after loading the user-provided 求签 seven-lot library and DailyNews, 42 assertions passed in total.

### 2026-08-26 · build 860 (in development)

- **Original command compatibility**: added `.h/.H/.rs`, detailed COC6/7 character creation, `.help/.jrrp/.reply on/off`, `.drawh`, old `.pc` subcommands, `.rule set`, `.mod`, `.user`, `.strXXX` and safe `.cloud` entries.
- **Single data source**: character sheets, rule books, plugin switches, permissions, lists and texts keep reusing Dice!Next's unified storage, without building a parallel old core.
- **Safety boundaries**: `.system cmd` isn't restored; chat doesn't perform irreversible player / plugin deletion or actively pull external cloud blacklist data.
- **SealDice JS events**: aligned `onLoad`, `onMessageReceived`, `onCommandReceived`, `onMessageSend` and join, friend, recall, poke and leave events with `sealdice-core`, completing message and @ fields.
- **Verification**: all 883 backend tests passed, and the Release build succeeded.

### 2026-08-22 · build 857 (in development)

- **System settings re-sectioned**: the admin panel is reorganized into basic, group events, replies, data and images, network and cloud services, maintenance, and security and permissions; heartbeat and log site belong to the network section, images, image host and chat records to the data section, and the "obsolete settings" collapsed section is no longer kept.
- **Issue #17 · Configuration scope extension**: message sending form, join welcome threshold, user group, chat record retention, saving log images, image sending method, image host, response switch, deck display, event responses and external requests all support "global / adapter type / specific account", still taking effect as "account > adapter > global"; the panel shows the source and can restore inheritance.
- **Configuration per account at execution**: outbound message format, image sending and image host, and chat record cleanup all read the effective configuration of the adapter account the message belongs to; chat records gain an adapter account field so several accounts on the same platform don't affect each other.
- **Automatic cleanup of friends and group chats**: the former friend cleanup card extends to friend and group chat cleanup, adding a per-run group cleanup limit and a maximum group size; when the group size exceeds the limit or an enabled blacklist leave rule matches, the bot leaves automatically, with group size and blacklist leaving safely off by default.
- **Old Dice configuration migration**: `InactiveUserLine`, `GroupClearLimit`, `GroupInvalidSize`, `AllowStranger`, `LeaveBlackQQ`, `DisabledListenAt` and others are migrated to existing features; the friend request policy can map to allowlist, having usage records in a group, or automatic approval for non-blacklisted users. Invalid fields such as private mode, automatic leaving of discussion groups and old cloud services are no longer kept.
- **Stability fixes**: fixed the delayed debounce thread after saving configuration referencing destroyed objects, which made tests or short-lived configuration instances crash randomly; Windows full restore now keeps the log directory in use and safely overwrites other data, and can still roll back on failure.
- **Verification**: the WebUI build passed, and all 238 registered backend tests passed.

### 2026-08-21 · Reply formats, cross-platform previews and the full DiceScript runtime

- Reply texts gain an explicit "plain text / Markdown" format instead of guessing from symbols such as `**`, `#` and `>` in the content; historical custom texts, persona texts and plugin replies are treated as plain text for compatibility, so users' original text isn't wrongly filtered by OneBot.
- Built-in Markdown templates escape dynamic parameters such as nicknames and reasons, so user input doesn't accidentally change the layout; QQ Official Bot, Discord and KOOK send by the explicit format, and OneBot only degrades content explicitly marked as Markdown.
- The command text editor adds a Markdown platform preview alongside an OneBot / plain text preview. The OneBot preview reuses the server's actual degradation logic and substitutes sample values for template variables, so the expected receipts on both platforms can be checked before saving.
- Markdown texts use a single source with two runtime versions: plain text is pre-generated on load / save, chosen by adapter before sending while keeping dynamic variables; when QQ Official repeatedly refuses cards, a short circuit breaker kicks in, avoiding reply delays from repeated parsing and a second round trip after failure.
- DiceScript C99 extended from the first numeric dice expression compatibility to a full language runtime: adding strings, arrays, dictionaries, ranges, variables, computed values, functions, control flow, templates, container methods, persistent contexts and UTF-8 indexing / slicing.
- Added the tagged VMValue serialization, pre / post hooks for variable load / save, native functions and objects, custom dice, `^st`, detail rewriting, prefix execution and `matched/rest` needed for host integration; added resource limits on AST, steps, memory, containers, recursion and dice counts.
- Dice!Next's DiceScript branch switched from the old numeric API to the full VM; syntax probing doesn't run code or consume random numbers, formal evaluation runs only once, and dice samples are still returned for statistics. Character sheet attributes can be read directly as expression variables.
- The `dicescript-c-lib` ABI was upgraded to 0.3.0, with the generated parser and MSVC, GCC/MinGW regression tests updated together.

### 2026-08-20 · Expression engine chain, DiceScript C99 and message compatibility

- New four expression parsing modes: the default "enhanced compatibility mode" tries Dice!Next → OneDice → DiceScript; "compatibility mode" is Dice!Next → OneDice; "original mode" keeps only Dice!Next's native old Dicebot expressions; "custom mode" can enable one or more engines and adjust their fixed priority.
- Expression modes support global, per-adapter and per-account settings, still following the override order "account > adapter > global"; ordinary `.r`, multi-round rolls and the AI roll tool share the same engine routing.
- Added safe fallback boundaries: the next engine is only tried when syntax isn't supported or parsing fails; execution errors such as division by zero, invalid dice faces and exceeding dice limits don't fall back, preventing a command from being rolled twice. OneDice compatibility probing doesn't consume the formal random source and requires the expression to be consumed completely.
- Created and maintain the separate [dicescript-c-lib](https://github.com/DiceZone/dicescript-c-lib): DiceScript implemented in C99, with the generated PEG parser committed, building on Windows, Linux and macOS.
- The first DiceScript numeric and TRPG dice expression compatibility layer was actually integrated into the main program and enabled in the panel, then extended to the full language runtime on 2026-08-21.
- Fixed OneBot default Markdown text degradation: empty bold placeholders and stray `**` from splitting long replies no longer leak into QQ, while the original text of expressions or identifiers such as `2**3`, `1||0` and `foo__bar` is kept.

### 2026-08-13 · builds 844–846 (security hardening + plugin compatibility)

- JS fetch allowed by default (T8) + optional strict mode; plugin unloading cleans up leftover configuration.
- Mandatory admin panel password (an empty password must be set first and no longer passes straight through to the API); server-side X-API-Key validation; SSRF protection for image downloads; PBKDF2 password hashing + login rate limiting; Docker privilege removal; random NapCat tokens; secondary backup path validation.
- Optional RSA signature verification for plugins; permission declarations for Lua uploads + high-risk prechecks + manual confirmation + behavior audit logs; optional cpath narrowing.
- JS adds SealDice compatibility: require / WebSocket / base64ToImage / .ts loading / applyPlayerGroupCardByTemplate.
- CI connects Gitleaks / Semgrep / Trivy. Real-machine regression pending.
- **Default dice Markdown and cross-platform degradation**: the general roll, dice pool, COC/BRP check, opposed check, sanity check, character creation and DND check results in Simplified Chinese, Traditional Chinese, English and Japanese uniformly use Markdown emphasis and inline dice expressions. Discord renders natively, KOOK automatically uses KMarkdown, and QQ Official group chats / C2C automatically use Markdown; OneBot, QQ channels and rich text failure fallbacks strip format symbols at the adapter exit while keeping CQ codes, image codes and dice expressions.

### 2026-08-11 · build 828 (in development)

- **QQ Official Bot capability update of 2026-08-10**: all OpenAPI calls migrated to `api.bot.qq.com`; Markdown supports strict validation of optional image resources; added group mute query / setting, join request listing / approval, automatic approval policy query / create / modify / delete / execute and allowlist management; `GROUP_JOIN_REQUEST` is connected to dice master notifications and the existing automatic approval logic, and group details gain an "Official group management" page.

- **Session log size and deletion**: the log management table gains a sortable "Space used" column, with the total including log database content and locally cached images, and image size shown separately; a styled delete button with a second confirmation was added, and deletion also cleans up log messages, local images and leftover current recording state.
- **Dice master identity in heartbeats**: formal heartbeats report both the dice master's nickname and QQ. By default the first OneBot dice master in the list and their player profile nickname are used; heartbeat settings add a manual nickname and QQ, with the manual pair taking precedence, and clearing them restores automatic detection.
- **Issue #8 · Lua song request music cards**: fixed Lua song request plugins returning `[CQ:music,...]` and having the CQ code shown as text. OneBot outbound messages convert it into standard music card segments, all parameters of platform tracks and custom music cards are kept, and both group and private chats work; the Lua API docs added examples.
- **Issue #13 · Plugin affection API**: JS plugins gain `seal.favor.get/set/add/grow`, and Lua mods gain `getFavor/setFavor/addFavor/growFavor`. Both call the built-in affection storage and growth rules directly, isolating users by message platform; the API docs added signatures, return values, multi-platform notes and examples.
- **Default package content restored**: fixed GitHub CI looking for built-in resources in the ignored runtime directory server/data/, which made builds succeed while packages lacked helpdocs, default decks and example plugins. Default resources moved into the version-controlled server/resources/default-data/; Windows, Linux and macOS uniformly include 35 helpdocs, 2 Dice!Next default decks and 3 example JS plugins, packaging fails outright when they're missing, and user data on the development machine is prevented from being shipped by mistake.
- **Rule pack management consolidated and import hardened**: rules, Lua and JS inside rule packs are no longer scattered across separate rule and extension management pages; they're shown on the parent rule pack card and enabled / disabled / deleted as a whole, with the pack contents viewable. ZIP import adds path, symlink, file count, compression and extracted size validation, requires a valid `pack.json`, and packs with the same identifier no longer overwrite silently; hot reload failures on import, enable / disable and delete roll back automatically. Plugins inside packs no longer wrongly take effect in private chat windows outside their scope.

### 2026-08-09 · build 817 (in development)

- **Issue #11 · COC fixed-result text preview**: compatible with SealDice's `.ra(result)skill` syntax. `.ra(1)1` and `.ra(100)1` fix the result to 1 and 100 respectively, to see the success level texts of the current house rule and custom replies directly; dice expressions are supported inside the parentheses, along with hard checks, bonus / penalty dice and hidden checks. Fixed results are for preview only and aren't written to the dice distribution or `.hiy` check statistics; `.help ra` was updated with the usage.
- **Issue #17 · Layered system settings**: the system settings page adds "global / per adapter / per account" scopes. The first batch supports friend and group invitation approval, blacklist / non-friend invitation blocking, leaving by group name keywords, and the poke switch / text / trigger command; a specific account overrides the adapter type, and the adapter type overrides global. The interface shows where the current value comes from and can restore inheritance in one click. Server-level constraints such as time zone, heartbeat, backup, WebUI and welcome threshold stay global.

### 2026-08-06 · build 807

- **QQ Official Bot rich media (joint testing)**: implemented the official QQ Bot 2.0 chunked upload channel; images, files, video and voice share it, and local files no longer depend on an image host. Fixed response parsing errors and added exception fallbacks; end-to-end images and the other types await real-machine confirmation.

### 2026-08-06 · build 796

- **Multi-account group management**: when one client logs in several OneBot accounts, later accounts no longer overwrite earlier accounts' group lists and switches. Group switches, locks, AI, group card names, welcome messages, plugin state and the current log are saved and shown independently per "adapter account"; the log list is still shared; group details can switch accounts to view and change, and old data stays compatible automatically.
- **Backup stability**: fixed occasional automatic backup failures with "file in use". Backups no longer recursively pack old backup directories into new packages, transient locks are retried automatically, manual and automatic backups don't run concurrently, and failure messages name the specific file.
- **Backups exclude the instance lock**: backups skip the runtime single-instance lock file `data/.instance.lock`, fixing the Windows backup "file in use" error.
- **Group management permissions**: group admins can run `.bot on/off` to switch the bot. When OneBot messages don't carry the sender's role, it's looked up from member information, accepting role aliases such as `administrator`.
- **Default dice fix**: `.rd-5` / `.r-5` roll as "current default dice − modifier" (1d100−5 when the default is 100), no longer reporting a negative face count error.
- **Unified time zone**: system settings add "Time zone" (following the system by default). Log upload bodies, web exports, audits, backup names, scheduled tasks and `.time` all output in the configured time zone, while the database still stores UTC.
- **Message segmentation**: system settings add a "Message segmentation" switch that can turn it off entirely; QQ Official Bot, Discord and KOOK are never segmented; segments are sent in order a few milliseconds apart.
- **QQ Official dice master**: when adding a Master the platform can be "QQ Official Bot"; after entering the dice master's OpenID, they're recognized as the dice master in group and private chats.
- **QQ Official group record fix**: fixed official bot group events creating "left group" ghost records by OpenID, and records not being rebuilt after speaking in the group. Group events are uniformly mapped to the public group number, historical ghost records are cleaned up automatically at startup, and receiving a group message clears deleted / left markers.
- **Adapter last activity**: "Last active" in adapter details now shows the time of the most recently received message / event, instead of always "—".
- **Dice master setting hint**: when adding a QQ Official dice master the dropdown shows the OpenID, with a hint that the `.info` command shows your own OpenID.
- **Scheduled tasks per account**: the scheduled task "Platform" became "Account", with the dropdown listing configured adapters (shown as "adapter:ID"); tasks can specify a bot account to send / leave groups, and old tasks fall back by platform.
- **Message sending form per account**: the global Markdown / rich message switch has the highest priority; when it's on globally, each adapter / account can turn it off separately, and when it's off globally all adapters degrade to traditional text.
- **Notifications by source account**: notification windows can be global or a specified adapter account, and notifications are sent by the source account.
- **Notification sending fallback order**: system-level notifications are sent in the order of internal adapter numbers until one succeeds; source-account notifications prefer the source account and fall back by number order after failure.

### 2026-08-02 · build 770

- **Historical configuration upgrade protection**: when the configuration directory only has a leftover historical `default_config.json`, its content is no longer read or written back to the database. The program deletes the file and rebuilds `server.json`, `adapters.json` and the other split files only from the most recent valid configuration snapshot in the database; if there's no snapshot, it stops safely, so default configuration doesn't overwrite the user's existing settings.

### 2026-08-01 · build 769

- **Cross-platform help files shipped with packages**: the Linux, macOS and Windows packaging flows all include `help/`, so the TRPG terms and rule descriptions of `.help` no longer exist only in the Windows development directory.
- **Rule pack reload stability**: fixed a lock re-entry deadlock when modifying, enabling / disabling or deleting rule packs; rule pack hot reload no longer leaves the WebUI loading forever, configuration unable to save and the main program unresponsive.
- **Prefixes and plugin compatibility**: bot detection and multi-bot @ judgment now follow the currently configured command prefixes, so `.bot` no longer triggers through a prefix that has been removed. Commands registered with old names such as `.va` in Lua / JS rule packs are mapped automatically to the current prefix; for example with only `>` enabled, `>va` calls it.
- **@ messages and log recalls**: the message content each adapter passes to Lua / JS still removes the `@` segment used to select the bot, so rule packs can match text; OneBot group message recalls also mark chat records and remove the corresponding original message from the session log being recorded (old logs that never saved message IDs can't be traced).
- **Official QQ friend operation protection**: QQ Official Bot OpenIDs have no friend deletion API, so the Players page no longer enables "Delete friend" for such users. Only when the OpenID is bound to a real QQ, and that QQ is really a friend of a connected OneBot, is deletion shown and performed through that OneBot.

### 2026-07-29 · builds 753–763

- **Optional backups and retention by day**: new "Back up to server now", no longer forcing a browser download; manual and automatic backups are both saved in `data/backups/` as `dicenext_bak_YYYYMMDD-HHMMSS.zip`. Backups exclude that directory, avoiding recursively packing old backups into new ones. System configuration, sheets and database, session / runtime logs, decks, rules and help, JS/Lua plugins and local media can be chosen separately; partial restore only overwrites the chosen content, and unselected data isn't cleared. Automatic backups use the same choices, and the cleanup policy keeps the last N days instead of a number of copies.
- **Restoring saved backups**: the backup list gains a "Restore" action that verifies and stages a manually or automatically saved ZIP directly; the restore is applied after restarting the main program, and the data from before the restore is kept as a rollback copy.
- **Rich message sending form**: system settings add "traditional text / card messages". Discord uses Embeds, KOOK uses CardMessage, and QQ Official Bot prefers Markdown, degrading automatically to traditional text without QQ Markdown permission; OneBot stays traditional text.

### 2026-07-28 · builds 727–752

- **Full backup and restore**: importing old Dice! data is gathered on the "Backup and restore" page; new ZIP local full backup download and restore upload. Backups include the current configuration and all `data/` user data, flushing SQLite WAL before export, and the archive is verified after creation. Backups are now saved uniformly in `data/backups/`; the panel can keep, re-download and delete them, and supports automatic backups by interval / daily time with rolling retention by count. Restore packages are staged after verifying the manifest and file paths, and data is replaced safely before the next start; the data from before the restore is kept automatically as a rollback copy.
- **Cross-bot and self-response mis-trigger prevention**: fixed self-responding accounts that @ a registered bot running `.r/.ra/.pc` and other commands being executed as themselves because of the roll-for-others compatibility branch. Explicitly @-ing another registered bot now always stays silent, covering built-in commands and JS plugins; normal @-ing of players to roll for them isn't affected.
- **DND `.rdc` compatibility fix**: supports the original compact form `.rdc3#+1d4力量 15`; the extra dice are rerolled independently each round, and attribute modifiers / skill check bonuses stack correctly. The receipt expands to the `D20+1D4+5=18+3+5=26>15 成功` (success) format; help explains `+2`, `+1d4` and the round count form.
- **Windows release manager**: the Windows package now has a top-level `dice-next.exe` manager, an `app/dice-next-core.exe` service core and a central `lib/` runtime library. The manager doesn't depend on DLLs in the package; double-clicking it starts the core and inherits the console log; when updating, it copies a temporary maintainer and, after the original process exits, replaces the complete program files including `dice-next.exe` itself, creating a rollback directory. With `DICENEXT_UPDATE_RESTART=NO` set, the update only exits when done without restarting the core itself, suiting process-hosting panels such as MCSM.

### 2026-07-26 · builds 648–701

- New QQ Official Bot 2.0 WebSocket adapter: supports AppID + AppSecret, QR code binding, official group / private messages and several official bots side by side.
- New native Discord and KOOK Gateway adapters: Bot Tokens can be configured separately in the panel, supporting server channels, private chats and `@bot command`; Discord needs the Message Content Intent turned on in the developer portal.
- Official OpenIDs can be linked to real QQ / groups verified by OneBot, unifying character sheets, group settings and logs; `.info` shows the current window's OpenID and binding information.
- By default only reverse binding of official OpenIDs in OneBot windows is allowed; binding a real QQ directly in official windows became a high-risk system setting that's off by default, with a second confirmation and risk explanation.
- The QQ Official API has no trustworthy group role information yet, so basic group-admin-level commands are currently allowed for users in the group, keeping daily operations such as `.bot on/off` usable; real checks will be restored after the platform opens role authentication. Dice master / trust-level permissions aren't obtained through official OpenID mapping.
- Fixed `<@OpenID>` in official messages preventing the command prefix from being recognized; `@bot .r`, `@bot .bot` and so on now run normally, and the backend shows readable records of official inbound messages.

### 2026-07-25 · builds 605–629

- `.dx` critical dice are shown as `<value,critical>`, making successful dice clearer.
- `.ww` supports the `a` reroll threshold, the `c` success threshold and `+X` extra successes, marking successful dice with ⑦⑧⑨⑩.
- Added help / multilingual texts for group-shared NPCs, and experience improvements such as DND temporary HP and bulk initiative.
- `.st pp/gp/ep/sp/cp` supports automatic conversion and change for DND coins.
- Player details gain split panes and a simulated private chat.
- The Roadmap became a current progress table plus a dated changelog, so test users don't have to read a long historical plan.
- Lua/JS added group card name reading, private chat replies and log state compatibility; `.log list` distinguishes in progress, paused and ended.
- Simulated chat supports uploading group files; rule pack deletion and reload gained concurrency protection and exception isolation.
- `.game over` now automatically ends session logs still in progress, consistent with the old Dice! (paused logs aren't affected).
- `.game` supports several groups joining the same game: starting a game generates a 16-digit game ID that can't be guessed sequentially, and after the GM uses `.game open <game ID>` in other groups the game state is shared; closing only affects the current group, and ending the game detaches all joined groups and wraps up logs in progress.
- Data management gains "Log management": search, export and delete by group, log, game name and game ID; shows game ID, joined groups and log state. Cross-game export merges the messages of each game's groups by time, marking scenes with `〔场景：群名〕` (scene: group name), and historical records can still be exported after the game ends.
- Log management is split into two tabs, logs and games: logs use a sortable table, and game cards show the GM, players, creation time and log statistics by state.

### 2026-07-15 · build 605

- Completed a batch of updates to the admin panel, log site, character sheets and default texts; detailed changes have been archived.

## Next

- Collect and handle Beta public testing feedback.
- Keep collecting compatibility feedback on plugins, logs and rule packs in real QQ environments.
- Keep improving the custom rule system; Python isn't planned for now, old Dice! JS isn't supported for compatibility, and JS uses the SealDice system.
- Refine backup item selection: with parent-child checkboxes, while keeping "one-click full backup", each feature area's configuration, players / groups / permissions, character sheets, chat records, session logs, statistics, decks, rule packs, help, templates, JS/Lua plugins and different media types can be chosen separately; manual and automatic backups share the selection list, and restoring overwrites by the list and verifies dependencies.
- Complete per-group isolation of rule pack attribute mappings: move `alias`, `computed`, `defaults` and `derived` from the process-level compatibility registry to the rule context activated in the current group.
- Keep improving real-machine compatibility of Discord / KOOK, and plan more TRPG rules and optional cloud capabilities.
- Keep the QQ Official Bot 2.0 Webhook receiving plan at low priority. For now the Gateway WebSocket, which needs no public HTTPS, stays the default; only after real user demand forms will callback verification, request signature checking, multi-account routing, event deduplication and retry handling be implemented. For the full comparison see the [Discussion Archive](./discussion-archive#_2026-08-11-·-webhook-receiving-mode-for-qq-official-bot-2-0-low-priority).

::: tip Feedback
Please submit issues and suggestions through [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) first; you're also welcome to join QQ group **933145116** to chat.
:::
