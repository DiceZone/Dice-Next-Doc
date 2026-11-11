# Changelog

## 2026-11-04 · Random source fallback, install as app and global command search (unreleased)

- **Dice random source**: when the selected source is unavailable, another secure random source is used in turn, and only when all are unavailable is the emergency pseudo-random generator (xoshiro256**) used; the program log reports it and switches back automatically after recovery, so rolling is no longer interrupted. New CPU hardware entropy source: on x86-64 it reads RDSEED and XORs it with the system random source, about 1 microsecond each time with no extra memory. The setting moved to [Basic settings](/en/manage/settings#dice-random-source); the old "Dice rules" page was removed and redirects.
- **Install as app**: the manifest now uses relative addresses and supports reverse proxy subpaths; a new Service Worker that only handles page navigation and caches nothing lets the browser show the install prompt; WebUI settings gain an install entry explaining why HTTP LAN addresses can't be installed. See [Install the web panel as an app](/en/guide/install#install-the-web-panel-as-an-app). The root cause of the address bar never showing an install icon before was that the backend's static file allowlist didn't include `.json`, so `manifest.json` was refused; it's now served separately as `application/manifest+json`. When the browser allows installation, the top bar shows an "Install app" button.
- **Command list**: new [global search](/en/manage/commands#global-search) across all categories, with hit counts on category tabs.
- **QQ Official**: fixed occasional QR code 404s when the scan session ID contained `/`; the "application has no API access permission" log of the internal invite API was lowered to DEBUG; [session logs](/en/use/log#qq-official-sn-status-line) no longer record SN status lines; SN "small red text" became "colored text", with a color palette or picker to choose the color.
- **Check arithmetic**: fixed multi-level modifiers such as `.ra 力量+20-30` only counting the first term; checks, opposed rolls, DND checks and `.st` share the arithmetic rules, supporting multiplication and division, powers, parentheses, dice rolls, several attributes and common functions; see [Success chance arithmetic](/en/use/dice#success-chance-arithmetic). `.st hp-1d6+2` subtracts 1d6+2.
- **Home**: the CPU and memory charts now show the last hour as recorded by the backend; status cards can be clicked to open the matching page; see [Dashboard](/en/manage/dashboard).
- **Interface**: the command playground replies in the interface language by default; the backup page's items and hints are complete in all four languages; the dashboard no longer shows the database path; macOS system icons were added; the About page's project introduction was rewritten and the explanatory sentence of the changelog removed.

## 2026-10-18 · .bot fixed information and BotMsg (main)

- The fixed information always stays at the top, showing "希亚" when the default reply language is Chinese and "ShiaNyaa" for other languages; build information comes from the actual program, and the compatibility engine and expression configuration stay consistent.
- New editing entry for BotMsg additional notes and default feedback information; import of the old `strBotMsg` / `strBotHeader` was added, keeping the original text, avoiding repeated appending and not overwriting existing custom notes.

## 2026-10-18 · Group cleanup consistency (main)

- Fixed groups still appearing in "Left groups" or "Active groups" after leaving and cleaning up, covering shared old records, cached group lists, in-flight messages and restart recovery.
- Bulk leaving gains "Also clean up group management records", and "Left groups" gains bulk cleanup. Only confirmed accounts are processed; character sheets and session logs are kept; failed items can be reviewed and retried.

The version history of Dice!Next. For complete feature progress, see the [Roadmap](/en/other/roadmap).

Records up to **2026-10-05**. This update is archived as **v3.0.0-beta.926 / build 926**; installers and actual release times follow [GitHub Releases](https://github.com/DiceZone/Dice-Next/releases). Cross-platform builds and acceptance on real machines are recorded separately; test counts and "in development" status in historical entries keep the context of the time.

## 2026-10-05 · build 926: probabilistic replies, multiple personas and startup protection (released)

- **Probabilistic replies**: dice and persona texts can add, delete and edit several candidates, set integer weights and show the actual probability; the old sample is kept and nesting inside candidates is supported. Previews support redrawing, and Markdown / plain text versions are cached on save.
- **Random multiple personas**: the global persona pool draws by weight, and one command keeps the same persona; fixed selections for group chats, private chats and accounts still take precedence, and restarts, copying and import / export keep the configuration.
- **Windows startup and tray**: temporary directory startup protection; the tray name can be set globally, the actual listening port is appended automatically, and it takes effect immediately after saving.
- **Build fix**: `1a7fe1f` fixed the ambiguous JSON → optional conversion in the cloud character sheet comparison, resolving the shared compile blocker of five platforms and two groups of backend tests on October 4.
- **Help feedback**: the test group and feedback hint of `.help` without arguments are included in this build, without overwriting texts the dice master has edited.
- **Verification scope**: local Windows Release build, 510 core cases / 3414 assertions passed; 78 frontend-related items, the production build and the docs build passed. Cross-platform release results follow the corresponding Actions runs, which doesn't mean every platform has been accepted on real machines.

## 2026-10-03 · Version entry, update recovery and help feedback

Recent commits are grouped by feature; automatic build number records and pure merge commits aren't listed again as new features; historical "in development" entries keep the context of the time.

- **Version entry**: removed the fixed version number in the sidebar and the "Connected" badge in the top bar; the top right is now a clickable text entry; when an update is found a red New icon is shown, and clicking goes straight to the update area of the About page. Beta shows `beta-3.0.0(123)`, and official builds show `v3.0.0(123)`; the build time is marked UTC+8.
- **Download recovery**: new download cancellation; connecting, downloading, verifying, preparing, cancelling and cancelled are shown as separate stages. When a single download source has no new data for 60 consecutive seconds or a single attempt reaches 20 minutes, that transfer stops and other sources are tried according to the configuration; after failure or cancellation the leftovers of that run are cleaned up, and retrying doesn't require a restart. An installation in progress can't be cancelled.
- **State consistency**: an update request timing out doesn't mean the server stopped; the panel only re-enables actions after querying the state again, and old polling results can't overwrite a new action. After changing the download source, an excluded cached source is no longer used.
- **Interface finishing**: the chat area of the command playground uses its own card background, with extra separator lines above and below removed; the AI cost warning's duplicate icon was removed, and the narrow-screen top bar keeps the version and common entries.
- **Help feedback (merged into main, not yet in beta.925)**: `.help` without arguments now ends with two extra lines by default: `Dice!Next 测试群：933145116` (Dice!Next test group) and `如有故障或建议欢迎加群反馈` (feel free to join the group with problems or suggestions). Synchronized in four languages; help texts the dice master has edited aren't forcibly overwritten.
- **Verification records**: 102 WebUI tests, type checking and the production build passed; 22 backend update module cases / 169 assertions and 29 help and i18n cases / 138 assertions passed. These are targeted verifications, not a full backend run or acceptance on every platform's real machines.
- Corresponding commits: main repository `22904bb`, `2c704f7`, `75ec20d`; WebUI `b788f0b`, `fe9060d`. beta.924 / 925 are released; `75ec20d` awaits the next package.

## 2026-09-30 · Channel-scoped advanced replies and Release build fixes

- **Advanced reply scopes**: the page header uniformly selects global, an adapter platform or a specific bot account; adding, editing, import / export and match testing work on the current channel. Only that scope's editable rules are shown, and inherited rules aren't mixed into the current collection; old rules still default to global.
- **Poke and dialogs**: poke reuses the header scope and no longer offers its own scope selection. The advanced options for adding / editing replies and command texts are collapsed by default on narrow screens and expanded on wide screens; once expanded they scroll, and the save / discard buttons at the bottom don't cover the editing area.
- **Caching and gates**: release builds turn off test targets, while separate Windows / Linux backend tests remain release gates; binary dependency caches refresh by runner environment and ABI. vcpkg keeps the full history to fetch the pinned version of the Lua port, without loosening locked dependencies.
- Corresponding commits: main repository `6ce919a`, `b2e1806`, `832edb6`; WebUI `3ebac4c`, `218708f`, `ec99e4a`. The related changes shipped with beta.921–925.

## 2026-09-29 · Split-pane paging, layout fixes and install as app

- **Split-pane paging**: the left-side lists of help, decks, groups, players and others share page number buttons and jump-to-page input; compact paging is fixed to two rows to avoid irregular wrapping when the width changes.
- **Layout fixes**: the command playground keeps a fixed height and only scrolls the chat area; group detail switches and the full disable action moved into the right-side details, and the feature panel fills its container. Tooltips have a limited width, list cards use their own background, and notification audit level labels are no longer squeezed onto several lines.
- **Install as app**: the WebUI provides an app manifest and icons, supporting the browser's install entry. What gets installed is the admin panel at the current address, not the backend; it still needs a network connection to the running backend, with no offline management or Service Worker API caching.
- **Persona tests**: fixed assertions in inheritance cases that hard-coded the old default name, now checking the current translation; persona permissions and inheritance behavior didn't change.
- Corresponding commits: main repository `20d6e97`; WebUI `a2888ef`, `01a8d6f`.

## 2026-09-27–28 · Admin panel upgrade and data editing fixes

- **Unified workspace**: settings are split into tabs by function, and the main pages use consistent compact tabs, toolbars and light / dark content backgrounds; vague descriptions were cleaned up. WebUI settings gain "Content width": the new style uses uniform margins, and classic keeps each page's old width.
- **Groups and players**: list on the left and details on the right by default; groups keep card / table views as options and support filtering by adapter account. Players use split-pane management, with a prompt about unsaved changes when switching targets or pages.
- **Scheduled tasks**: adding / editing now uses a dialog, and the main page keeps the search and task list; multi-select bulk enable, disable and delete are supported, with failed items kept for retrying.
- **Help and rules**: the help file library now browses and edits in split panes; built-in texts can be restored to defaults, and self-made documents can be imported and exported; empty documents and shadowed same-name entries can still be managed. The rule editor tests unsaved drafts directly, without saving to the database or changing real group activation.
- **Deck reading**: fixed empty JSON objects causing read errors, and clearly distinguished the sources of built-in and user files with the same name, so the wrong file isn't opened or saved.
- Corresponding commits: main repository `cab5a3d`, `f8409a9`; WebUI `878288d`, `9f715d7`, `4735b00`.

## 2026-09-26–27 · Built-in deck protection and old Mod compatibility

- **Built-in decks read-only**: the API and the panel together prevent directly overwriting or deleting shipped resources; user decks remain editable. User content with the same name takes precedence, and path validation and hot reloading were fixed along with it; built-in files can be downloaded, or public non-empty single decks copied as user files and then modified.
- **Old Mods**: `.mod` regains its global management meaning, requiring the dice master or trust level 4; `.plugin` still enables and disables per group. Common TOML replies, Lua cycle events, game collections, template references and import / enable order were added, and mod changes also refresh XML templates.
- **Boundaries**: old JS / Python actions, clock/hook, complex TOML, nested Mods and complete rulebook/tape aren't fully implemented yet; the compatibility subset mustn't be described as "any old mod works".
- Corresponding commits: main repository `58f1c69`, `13f3ba1`; WebUI `9379e16`, `ec99e4a`.

## 2026-09-19–21 · Persona permissions, three visual levels and default resources

- **Persona permissions**: ordinary QQ Official group members can't switch personas freely; the inviter can change group settings that don't involve kicking / muting, and the permission policy covers every adapter. Accounts can limit which personas are offered publicly, and private chat selection only affects the individual without changing the global default.
- **Three visual levels**: traditional, standard and advanced visual can be combined per global / platform / account while still sharing character sheets and other data; status bars and action hints use semantic components and don't generate images automatically. QQ Official group chats / C2C with the permission can show pre-filled command buttons, and channels and unsupported adapters use readable text.
- **Resources and logs**: the 溯洄 series of built-in decks was added and packaged; logs save the name itself without the wrapping symbols used to decorate names in replies.
- **Windows test build**: `0058880` fixed the packaging failure caused by duplicate symbols in the test target, without bypassing the problem by skipping tests.
- **Advanced reply deduplication**: fixed duplicate entries, keeping exact deduplication, filtering, sorting and hints, without crudely deleting by similar content.
- Corresponding commits: main repository `575882d`, `06c6492`, `b081e56`, `9185d54`; WebUI `4ac40d6`, `06aca28`.

## 2026-09-18 · Reply weights, poke and old reference migration

- **Separate weights**: the several candidate replies of one rule can have their own weights and probabilities shown; rule trigger probability and candidate draw weights are configured separately, and old `::N::` markers are normalized on read / import.
- **Poke entry**: moved into advanced replies, alongside the new broadcasts; as the only event trigger it supports weights, cooldowns, probability and scope limits.
- **Reference migration**: on import, unprefixed references are normalized according to known decks, help and texts; ambiguous ones aren't rewritten on our own, and a migration report is provided for the dice master to check.
- Corresponding commits: main repository `870512d`; WebUI `1251411`.

## 2026-09-17 · Unified identity verification (released with later Releases)

- **Avatar verification deprecated**: public avatars are no longer used as identity credentials; the old implementation is backed up on the local `archive-avatar-verification` branch, and the main branch removed the obsolete code without deleting existing bindings or historical database tables.
- **Unified binding entry**: in QQ Official / Discord / KOOK private chats use `.bind qq <QQ number>`; with an official bot key OAuth is preferred, otherwise email is used automatically. After agreeing on the OAuth web page use `.bind confirm`, and for email `.bind confirm <8-digit code>`; `.bind qq <QQ number> email` chooses email explicitly, and failures don't switch silently. Old commands remain compatible, and help and the `.info` guidance were updated. See [Binding quick start](/en/use/cloud#binding-quick-start).
- **Dedicated SMTP settings**: system settings provide a global QQ mailbox verification configuration, separate from dice master notifications; TLS is enforced, passwords aren't echoed, codes expire in ten minutes, are single-use, and have send / error count limits; codes don't enter plugins, AI or chat records. Binding OAuth only verifies identity without requesting cloud sheet permissions, and is refused when the target QQ doesn't match or another binding exists.

## 2026-09-16 · In development

- **`.cloud` takes over cloud operations**: the original `.cloud update` / `.cloud black` could only report status and point people to the website, so they were removed entirely; the version number is now shown by `.bot` without arguments, and the cloud blacklist switch is in the website's "System settings". `.pc cloud <subcommand>` silently forwards to `.cloud`, so old forms already published keep working. See [Cloud services and identity binding](/en/use/cloud).
- **Authorization verifies the real QQ**: the device code flow of `.cloud auth` also requests `email`; after confirmation the real QQ is taken from the prefix of the account center's registered email and a binding is created. The account center only accepts purely numeric QQ mailboxes and requires an email verification code, so the prefix itself is a verified QQ number; the authorization page explicitly lists "read your QQ number".
- **Avatar verification in official windows (deprecated 2026-09-17)**: at the time QQ was verified by comparing avatar bytes; it has been replaced by the OAuth / email unified flow above and is no longer used.
- **Unified command help layout**: the 47 topics of `.help <command>` and the 66 "usage" hints shown for empty commands all use "title line + one command per line + `// description`"; the `.help` main menu gains a `· 账号：.bind .info .cloud` (account) group.
- Added the old `{sample:A|B}` random texts, supported in command replies such as rolls, personas, custom replies and `.text`; items are chosen with equal probability, nesting and variables are supported, and the existing custom reply shorthand is kept.
- Text selection happens before variables are inserted, so user nicknames or regex captures aren't executed as new templates; Markdown keeps using the pre-generated plain text version, and the text random source is independent of game dice rolls.

## 2026-09-14 · builds 907–908: cloud character sheets and cloud services

- **BDC cloud character sheets**: players can authorize, list, pull, upload and manually sync cloud sheets in private chat; read-only by default, with writes requiring confirmation on the web. Local session data is kept, conflicts stop syncing, re-authorization is needed after expiry or restart, and player tokens aren't persisted.
- **Cloud service management**: the bot key, heartbeat, cloud blacklist, cloud character sheets and log site are gathered on a separate page; the adapter's original key entry still reads and writes the same configuration. Basic settings keep the image host, and old entries and search links redirect compatibly.
- **Tutorials and settings compatibility**: the cloud service migration and the read-only beginner tutorial on real pages are both kept; demo data doesn't overwrite real settings.

## 2026-09-11 · builds 905–906: QQ Official APIs and file export

- Added QQ Official group info, members, management, menu, recall, channel and other APIs, offered to plugins through `qq_*` actions; fixed GET query parameters and rich media field formats.
- `.log export` connects to the official rich media file channel, fixing the earlier issue where export showed success without calling file sending.
- The APIs are still subject to account permissions, allowlists and platform limits; code integration and automated tests don't mean end-to-end sending on real accounts has been accepted.

## 2026-09-08 · Per-group feature switches and command regressions

- New per-group switches for four categories (logs, replies, rolls, plugins), supporting chat commands and the group management panel, isolated per bot account.
- **Current behavior**: `.bot off` again controls log recording and timing; turning off doesn't end the session, and turning back on doesn't cancel a user's manual pause. The September 7 plan of "logs independent while off" has been replaced by this.
- "Log only" requires keeping the master switch and logging on, and turning off unneeded features such as rolls, replies and plugins.
- Fixed `.en` growth values, `.ri` initiative dice and counts, `.ob` spectating operations, and `.group` cross-group permissions, multiple entries and clearing behavior.

## 2026-09-04–07 · Milky, personas and original behavior

- New Milky adapter, calling the API over HTTP and receiving events over WebSocket; Webhook isn't supported for now. Fixed temporary private chat identity, group history and group file field compatibility.
- Persona switching unifies group, channel and account scopes and inheritance rules; `.setcoc` setting, querying, clearing and reading during checks are unified, fixing the case where setting succeeded but the official rules were still used.
- `.me` narrates based on the body text and no longer forcibly adds the speaker's name; remote narration still checks permissions.
- Added a compatibility entry for operations `.master` already supports, without opening arbitrary admin command execution; unimplemented destructive old operations give a clear hint.

## 2026-09-03 · In development

- Update checking and download subprocesses support cancellation and reaping on stop; mirror checks actively cancel slow sources after getting the first valid result; update temporary files gain process isolation, and the core service also recognizes `DOTNET_RUNNING_IN_CONTAINER`.
- Update errors on the About page are no longer cleared automatically by periodic polling and can be copied or closed manually; global search adds container / Docker / image upgrade / automatic detection, and fixes qualifiers lost in Chinese compound words without spaces. Seven new frontend pure-logic tests were added and connected to the Release build.
- The Docker image release flow adds a real startup gate: an amd64 candidate image is built with the same Dockerfile and Release parameters as the official multi-arch images, and after starting it verifies container self-detection, refusal of manual download / install, refusal of the automatic download policy and service liveness; when candidate verification fails, the official push isn't executed. The build cache is reused between the candidate image and the images to push.
- The docs separate released versions, automated verification and acceptance on real machines that needs credentials; for the full manual checklist see the [Roadmap](/en/other/roadmap#manual-acceptance-of-release-candidates-requiring-real-credentials).

## 2026-09-01 · builds 892–893

- Fixed complete plugin command words being taken over by old compact prefixes such as `.ra`; only exact priority for real built-in commands and public aliases is kept, and third-party plugins aren't broadly blocked by similar names. 求签 (fortune drawing) and DailyNews are still ordinary third-party plugins, not built-in system features.
- Fixed `.rd测试` / `.rdtest`, `.r 2#d100`, `.dx5c10测试`, `.ww5测试`, DiceScript non-numeric results and the final Double Cross `+N/-N` modifier; four-language error texts and old built-in aliases were added.
- SealDice JS adds context temporary variables, real endpoints, multi-account bot numbers and per-group plugin switches; Dice! Lua fixes `@` argument routing, the old ResourceSearchEngine index path, DailyNews refreshing across days and the call lifecycle of single-file plugins.
- Fixed WebUI logins of several instances on the same machine kicking each other out: each installation uses its own stable cookie name, so different ports can be logged in at the same time; the same instance keeps its 30-day trusted state after restart or a port change, old cookies migrate automatically, and logging out only revokes the current instance.
- The top bar's global search extends to all main backend pages and adds cross-language synonyms, common pinyin and light typo tolerance; results distinguish pages, features and settings, and show why an alias or fuzzy match hit.
- New container runtime self-detection: the official image uses an explicit marker, with Docker / Podman files, Kubernetes environment variables, Windows container variables, systemd markers, cgroup and mountinfo as fallbacks. Inside containers, Releases are still checked and notified, but the server refuses manual / automatic download and installation, and the Windows manager doesn't apply leftover staged packages; old automatic update policies take effect as "notify only", and the WebUI explains that the image should be updated and the container recreated.
- Verification: core tests are now 286/286 (1153 assertions), WebUI search and update error state tests 7/7; Lua self-contained compatibility tests 68/68, real plugin corpus 123/123 assertions; plus real HTTP regressions for `18088` / `18089` dual-instance login, separate logout and trusted restart. These don't include real network delivery on the four platforms or platform-side Markdown / rich media rendering.

## 2026-08-31 · In development

- The admin panel top bar gains global settings search: the index is refined into three levels (page / feature category / specific setting), supporting `Ctrl/⌘+K` and matching titles / descriptions / multilingual aliases; AI models, reply polishing, reply translation, chat, short- and long-term memory, tool calls, image recognition, allowlist and NPC are each separate results that go straight to the matching card; results show the page, a content summary and hints for hidden alias hits, and synonyms such as "update / upgrade" go straight to the automatic update card; the dialog and result list all use the frontend's own styles.
- Fixed `ResourceSearchEngine.lua` detailed lookups making the process exit directly: the Lua file audit first normalizes mixed UTF-8 / CP936 paths into valid UTF-8, and C++ exceptions from the audit callback can't cross the Lua boundary; when the plugin cache keeps absolute paths from an old Dice! installation, the safe `plugin/…` tail is remapped to the current plugin directory. Detailed lookups were verified with the complete QQBot resource library provided by a user.
- Scheduled tasks gain a "run plugin command" action: in a specified account, group or private chat, enabled SealDice JS or Dice! Lua plugins can be called on daily / interval / one-time schedules and their replies sent; it uses low-permission virtual messages that only enter the plugin layer and don't execute Dice!Next built-in admin commands.
- Restored the original compact syntax `.admin clock+task=H:MM`, and extended `.admin clock + <name> HH:MM <plugin command>`: plugin tasks scoped to the account and window can be created from the current group / private chat; adding the same name again updates it, and the task enters unified WebUI management automatically.
- Fixed `.dx5c10测试` and `.dx 5c10 测试` not showing the reason, and `.ww` failing when text followed the dice expression; `.dx` / `.ww` now both distinguish dice expressions and reasons whether adjacent or separated by a space.

## 2026-08-30 · In development

- Reworked the statistics page: supports 7 / 30 / 90-day ranges and all platforms, per platform and per adapter filters; the daily trend shows every date in the selected range, and adds platform / adapter comparisons, command distribution, adapter availability and Top active groups, while keeping Top active users, 24-hour distribution, check results and dice distribution. Old all-platform history remains visible, and breakdowns by platform, adapter, group and so on accumulate from this version.

- Restored the online status granularity chart on the statistics page, switchable between 5 minutes / 1 hour / 6 hours / 1 day (5 minutes is limited to a 7-day range); aggregation keeps the worst online status within an interval so short disconnections aren't averaged away; active users now use a single-person icon, clearly distinct from active groups.

- WebUI dropdowns, confirmation dialogs and date / time pickers all switched to the project's own frontend components instead of the browser's native styles, keeping interaction consistent across platforms and themes.

- Added the four-language texts for "Stay logged in on this device for 30 days" on the first-time password page; new or changed admin passwords must be 8–64 characters and contain uppercase letters, lowercase letters, digits and half-width special symbols; the frontend filters Chinese / full-width characters / spaces and the backend validates the same; old non-compliant passwords must be changed at the next login after successful verification, and no session is issued until then.

- Fixed online upgrades from 883 to 885 where the updater still required the old `lib/` directory and misjudged the new self-contained `app/` runtime package as incomplete; both old and new package layouts are now recognized, and errors list the actual missing items; later Windows packages keep a non-empty compatibility directory so 883 can cross the layout change without a manual upgrade.

- New sensitive word blocking compatible with the original Dice!: command-level fuzzy matching, Ignore–Critical levels, trust demotion and notification window integration; system settings provide rule adding, deleting and testing, `.admin censor` manages it in chat, and the old `CustomCensor.json` is migrated automatically.

- Fixed the WebUI login state being lost after restarting Dice!Next even with "Trust this device for 30 days" checked; the first-time password setup can also choose to trust the device directly.
- Fixed space-less multi-round forms such as `.r 2#d100` and `.r 12#d6 reason` being parsed as expressions named `2#` / `12#`.
- Restored the `task_call` scheduled entry of old Dice! Lua single-file plugins and `.admin clock + / - / list` management, accepting `7:00` / `07:00`; DailyNews's old notification window registration and push commands map to the unified notification system, and `sleepTime(ms)` resumes after a non-blocking delay via coroutines.
- Windows automatically accepts GBK / CP936 Lua source; plugin messages and JSON boundaries are normalized to valid UTF-8, and C++ exceptions propagating out of plugin callbacks are caught, so the process doesn't exit after invalid bytes cause an error.
- Lua plugin scheduled tasks also appear in the admin panel list, where they can be disabled, run immediately or deleted; the docs add registration, configuration and encoding behavior.

## 2026-08-27 · build 869

- New GitHub Release detection and automatic updates: checks every 6 hours by default, notify only; supports checking immediately, automatic download, and installing and restarting in Windows manager mode.
- Downloads in mainland China support direct GitHub connections with parallel probing of several mirrors, a 30-minute available-source cache, and direct-only / mirror-only / custom HTTPS mirror modes.
- Releases add a schema 1 `update-manifest.json`, recording package name, size and SHA-256 per OS / architecture; the client strictly verifies repository, version, platform, architecture, file name, size, digest and archive paths.
- Windows updates use staging + transactional replacement + automatic rollback on failure, keeping `config/`, the database, user data and non-conflicting third-party plugins; non-Windows platforms currently provide detection and download.
- The About page adds four-language update status, download progress, source, automatic policy and installation confirmation; the update API and installation docs were updated.
- Markdown replies now use a single source with two runtime versions: built-in, custom and persona templates pre-generate traditional text on load / save, and OneBot, the global traditional mode and the account-level traditional mode pick it directly before interpolation, no longer converting again for each sent segment.
- After QQ Official Markdown is refused by HTTP twice in a row, a 10-minute circuit breaker sends pre-rendered traditional text directly in the meantime; when it expires capability probing resumes automatically, so not every message has to wait for a failure and then request again.
- Verification: the backend and the Windows manager compiled completely; all 258 test cases and 940 assertions passed; WebUI TypeScript checks and the production build passed.

## 2026-08-27 · build 863

- The reply display form is now a global Markdown / rich message master switch that saves immediately; when turned off, QQ Official, Discord, KOOK and explicit Markdown templates all fall back to traditional text, and platform / account local settings can't bypass the global off.
- The command text editor gains per-variable Markdown styles, choosing normal, bold, italic, inline code or strikethrough for each item, with synchronized Markdown and plain text previews.
- Fixed the inconsistent priority where QQ Official, Discord and KOOK still sent explicit Markdown in traditional text mode.

## 2026-08-26 · build 860

- Completed original Dice! command compatibility: hidden / short rolls, COC6/7 character generation, group switches, hidden draws, character sheets, rule books, Mods, users, texts and cloud service compatibility entries connect to the unified implementation.
- Clear safety boundaries: the `.system cmd` remote shell isn't restored; irreversible deletion of players / sheets and plugin file updates and deletions still require confirmation in the web admin panel; chat doesn't trigger external cloud blacklist sync.
- SealDice JS compatibility aligns loading, message, command, sending and platform event hooks with `sealdice-core`, completing the endpoint, message ID, channel, time, rich media segment and @ state fields.

## 2026-08-11 · build 828

- QQ Official Bot 2.0 follows the capability update of 2026-08-10: the OpenAPI domain is unified to `api.bot.qq.com`, and optional Markdown image resources are strictly validated; group management adds member muting, manual approval of join requests, automatic approval policies and allowlist management; user join request events enter the existing notification and automatic approval pipeline.

## 2026-08-06 · build 796

- Multi-account group management: when several bot accounts of the same platform are in the same group, switches, locks, AI, group card names, welcome messages, plugins and the current log are independent per account, and group lists no longer overwrite each other; logs are still shared, and group details can switch accounts.
- Backup stability: automatic backups no longer fail because files are in use; old backup directories are skipped, transient locks are retried automatically, and manual / automatic backups are mutually exclusive.
- Backups exclude the instance lock: the runtime single-instance lock file `data/.instance.lock` is skipped, fixing the Windows backup "file in use" error.
- Group management permissions: group admins can use `.bot on/off`; when OneBot lacks the role, it's looked up from member information automatically.
- Default dice fix: `.rd-5` / `.r-5` roll as "current default dice − modifier".
- Unified time zone: system settings add "Time zone"; log upload bodies, web exports, audits, backup names and scheduled tasks all output in the configured time zone, while storage stays UTC.
- Message segmentation: new "Message segmentation" switch; QQ Official Bot, Discord and KOOK aren't segmented; segments are sent in order at intervals.
- QQ Official dice master: when adding a Master you can choose "QQ Official Bot", identified by the dice master's OpenID.
- QQ Official group record fix: group events are uniformly mapped to the public group number, so OpenID "left group" ghost records no longer appear; historical ghost records are cleaned up automatically at startup; speaking in a group clears deleted / left markers and rebuilds the record.
- Adapter last activity: adapter details show the time of the most recently received message / event.
- Dice master settings: when adding a QQ Official dice master the dropdown shows the OpenID, with a hint that the `.info` command can look it up.
- Scheduled tasks per account: the platform dropdown became an account (adapter:ID), so a specific bot account can be chosen to send / leave groups.
- Message sending form per account: each adapter can choose traditional text / card messages separately or follow the global default.
- Notifications by source account: notification windows support global or a specified adapter account, and notifications are sent by the source account.
- Notification sending fallback order: system-level notifications are sent in the order of internal adapter numbers until one succeeds; source-account notifications prefer the source account and fall back after failure.

## 2026-07-26 · Multi-platform adaptation

- New QQ Official Bot 2.0: supports AppID + AppSecret, QR code binding, official group and private messages, and several official bots side by side.
- New native Discord Gateway adapter: supports server channels, private chats and `@bot command`. Turn on the Message Content Intent in the Discord Developer Portal before use.
- New native KOOK Gateway adapter: supports server channels, private chats, text and KMarkdown, and `@bot command`.
- Multi-platform messages enter the unified dice, character sheet, log and group management logic; each adapter can be added, enabled and managed separately in the admin panel.

## v3.0.0 (public beta)

The first rewritten version, currently in public beta.

### Core
- Brand-new architecture with separate frontend and backend: C++ backend + React admin panel
- OneBot v11 adaptation (forward / reverse WebSocket, HTTP)
- Multilingual support (Simplified Chinese / Traditional Chinese / English)
- One-click migration of old data

### Rolling and Rules
- General rolls, hidden rolls, WOD dice pools, Double Cross
- The full set of COC checks (bonus / penalty dice, opposed, hard / extreme, rolling for others, repeated rolls, sanity, growth, madness, house rules)
- BRP checks (`.ba`) and resistance table opposed rolls (`.bav`)
- DND: `.setdnd` mode, d20 checks, initiative, spell slots (`.ss/.cast/.longrest`), temporary bonuses (`.buff`)
- COC / DND character generation, `.pc build` generation from templates
- Rule quick reference (COC / DND, extensible)
- Space-free combined commands (`.ra侦查`, `.rapass23`, etc.), `.rd` hooked to the default dice

### Character Sheets
- Attribute entry and alias recognition, multiple sheets, group card name sync, check statistics
- Damage bonus (DB) formula entry: `.st db=1d4` stores the roll formula without rolling, and `.r 1d4+db` expands it automatically when rolling; it can also be calculated automatically from STR+SIZ via the table
- Linked attributes: `.st 物防=敏捷+1` stores an expression evaluated together
- Sheet locking (`.pc lock`), custom sheet templates (can ship with rule packs)
- When HP / SAN maximums change, current values are synced by the difference, with clear hints on automatic recalculation

### Games
- `.game` game system (all original subcommands): start / restart / GM / game variables / roll call / kick / pause / end
- Roulette dice `.game rou` (drawing without replacement to prevent rerolling, with history / reset)
- Game data shares its source with Lua mods' `msg.game`

### Fun
- Today's / tomorrow's / yesterday's luck, random names (each name randomly Chinese / English / Japanese by default), rest, affection system
- Third-person actions `.me`, choice divergence `.ak`, random renaming `.nnn`

### Decks
- Compatible with original decks, inline random, runtime temporary decks, default decks

### Extensions and Plugins
- Rule pack system: importable rule packs (attribute templates / synonyms / rule quick reference / help / scripts), switchable per group
- Lua mod subsystem: compatible with original Dice! mods (sheet templates, rule books, causal replies, affection, inventory)
- JS plugin subsystem: compatible with SealDice plugins
- Unified help system: built-in commands / rules / plugins merged from three sources, with paged search

### Session Logs
- Logging switch and the full set of query / statistics / delete / export subcommands, TXT / Excel / HTML export
- Log site upload compatible with the SealDice V1 protocol, with a selectable site address (unofficial sites show a hint)
- Hidden Psychology rolls `.rx` (the Keeper's hidden checks for investigators, with results in private chat + a receipt in the group)
- Cross-window message forwarding `.link` (two-way / one-way links between two chat windows)

### Permissions and Notifications
- Trust level system (a 0–255 ladder, `.trust` / `.admin` commands, same semantics as the original)
- Account alias merging `.alias` (alias account permissions are calculated by the main account)
- Dice master notification system: `.notice` registers notification windows, and the web page can check each of 14 event types (routine / important / critical / error)
- SMTP email / Webhook third-party push (with send tests)
- Audit log: full records of permission changes / approvals / runtime errors, viewable on the web

### AI (optional, off by default)
- AI gateway: multi-model management, global request parameters, OpenAI API compatible
- Roll reply polishing: rewrites style according to the bot persona, with digit preservation checks (dice results can never be changed by mistake)
- AI translation: works with `.lang` custom languages, translating automatically before sending
- Chat replies: triggered by @ / keywords / idle probability, with cooldowns and group context; per-group switch `.ai on/off` + allowlist mode
- Short-term memory (rolling group chat summaries) and long-term memory (vector retrieval of character sheet / story facts)
- Tool calls: AI rolls go through the real engine, and it can draw cards / look up sheets / run commands
- NPC roleplay: performs according to script settings, limited to groups and trigger words
- Image recognition (multimodal), option to forbid emoji
- Parallel AI calls, so slow responses don't block ordinary commands

### Group Management and System
- Group switches, external mode, per-group / global command disabling, permission levels
- Join welcome (delayed merging to prevent flooding), leaving groups, messages to the master, spectating, black / white lists
- Friend / group invitation approval policies (keyword / level thresholds), leaving forced invites, leaving by group name keywords, automatic leaving for blacklisted groups
- Group automation: automatic approval / kicking / muting by message keywords (`.group auto`)
- Bot detection: recognizes other dice bots in the group and @-silences them; default replies don't start with commands, preventing cross-bot mis-triggering and loops
- Chat record persistence (recall marking, configurable retention), and the web simulated chat supports avatars / images / stickers / poke / group card names
- Japanese added to the languages, with user-defined language packs (loaded automatically when placed in the i18n directory)
- Finer name variables: separate variables for QQ nickname / group card name / sheet name, with controllable wrapping symbols
- Scheduled tasks (each with its own switch / online editing): trigger conditions can be set for "causal" behavior, such as `inactive>=7` meaning no commands in the group for 7 days; actions support sending messages or leaving the group (e.g. "leave automatically after 7 idle days"), and content supports variables / functions such as `{group}` `{date}` `{roll:..}` `{draw:..}`
- Keyword custom replies (multiple conditions, random results, dynamic commands `{roll}` `{draw}` `{api}`, etc.)
- Low-code "causal" rules: visual "conditions (match / filter / cooldown / counter) → actions (reply / change counter / call API)", with no scripting needed
- Bot personas: several named sets of texts; choose a persona on the "Commands" page to edit its reply texts directly; supports create / copy / edit / delete / set as default
- The original fun text "flavor" layer: the original Dice! text style can be layered on
- Merged forwarding for long messages (multiple `.coc 5` results / overly long help sent as chat records, switchable)

### Old Data Migration
- Character sheets, player profiles (including affection), blacklists, custom replies, help texts, Master
- Mods, external decks (PublicDeck), group configuration (disabled / house rules / welcome text)

### Admin Panel
- Dashboard, adapter management, rule management, reply management, deck management
- Group management (including log management, group files, per-group plugin / AI switches), player management (a secondary details page to view and change all attributes), scheduled tasks, system settings
- Permission settings, notification settings, AI, extension management (Lua / JS tabs), help documents, playground
- Panel login password (cookie authentication), online changes to the runtime IP / port, system tray, start at boot, hidden console at startup
- Image sending method: images inserted on the web are saved as the platform-neutral code `[img,file=…]` and, when sending, converted to embedded base64 (default) or HTTP links (configurable host) according to the settings, so images arrive correctly even when the QQ framework runs on another device
- Crash self-diagnosis: exceptions are written automatically to `data/logs/crash_*.txt` with startup stage markers, for easier bug reports

---

## In Progress / Unfinished

Parts still in development or not yet finished during the public beta:

- **Public online character creation page**: web form character creation + sharing the same sheet with chat (requires an account binding mechanism)
- **Deeper rule extensions**: uploading self-made rules, `seal.gameSystem` custom rule systems
- **Cloud telemetry / developer management site** (a separate project)
- Hot-swapping binary plugins, full cron expressions, `.story` scenario maps, and more

For complete feature progress, see the [Roadmap](/en/other/roadmap).
