# API Reference

The Dice!Next backend provides a REST API, and the admin panel is built on it. This page lists the currently available endpoints grouped by function. There are many routes, so only paths and purposes are listed; the exact request / response fields follow the actual version (you can compare them against the network requests of the admin panel).

## Basics

| Item | Description |
|------|------|
| Base address | `http://localhost:18088` (port from `server.port`, which can be changed online in the web settings) |
| Data format | JSON, UTF-8 |
| Authentication | Admin panel access key (`server.api_key`); a WebUI login password can also be enabled (cookie session, see "Authentication") |

## Unified Response Format

Unless stated otherwise, endpoints return a uniform envelope:

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code`: `0` for success, non-`0` for failure
- `message`: message text
- `data`: response data (`null` or absent on failure)

A few endpoints don't use the envelope: `/api/test/message` returns the result object directly, and `/api/logs/{id}/export`, `/api/assets/{name}` and image endpoints return file contents directly.

## Authentication and Runtime Control

| Method | Path | Description |
|------|------|------|
| GET | `/api/auth/status` | Whether the login password is enabled / current session state |
| POST | `/api/auth/login` · `/api/auth/logout` | Log in / log out (cookie session) |
| GET / PUT | `/api/system/webui-auth` | Login password settings |
| GET / PUT | `/api/system/server-config` | Runtime IP / port (takes effect after a restart) |
| POST | `/api/system/restart` | Restart the backend |
| GET / PUT | `/api/system/autostart` | Start at boot (Windows) |
| GET / PUT | `/api/system/update` | Read / save the automatic check interval, the action on discovery and the download source |
| POST | `/api/system/update/check` | Check the latest GitHub Release in the background right away |
| POST | `/api/system/update/download` | Download and verify the installer for the current platform |
| POST | `/api/system/update/install` | Install the staged update and restart (Windows or new Linux/macOS manager mode) |

WebUI session cookies are named stably per installation instead of being shared by host or port: different installation directories on the same host can be logged in at the same time, and the same instance keeps its 30-day trusted session after a port change or restart. `GET /api/auth/status` accepts and migrates the old `dice_session`; `POST /api/auth/logout` only revokes the current instance's session.

## System Status and Settings

| Method | Path | Description |
|------|------|------|
| GET | `/api/system/status` | Runtime status |
| GET | `/api/system/settings` | Basic settings (host / port / log level, etc.) |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET / PUT | `/api/system/global` | Scoped settings (response switch / external requests / BotMsg, etc.) |
| GET / PUT | `/api/system/events` | Event policies (approval / leaving groups / automatic cleanup, etc.) |
| GET / PUT | `/api/system/prefixes` | Command prefixes |
| GET / PUT | `/api/system/random-source` | Global random source for dice rolls. The PUT request is `{ "source": "system" \| "openssl" \| "hardware" }` (`hardware` is refused when the CPU doesn't support RDSEED); default system; saving takes effect immediately; changes require full admin permission. The response data also contains `active` (the source actually used by the last roll, which can be `pseudo`), `fallbacks` (number of fallbacks) and `hardware_available` |
| GET / PUT / POST | `/api/system/censor` | Read / save the sensitive word rules as a whole; POST tests text with the same server-side matcher |
| GET / PUT | `/api/system/log-mode` | Raw event log switch |
| GET / PUT | `/api/system/respond-self` | Self-control switch (respond to the bot account's own messages) |
| GET / PUT | `/api/system/logsite` | Log site upload address (logsite_url) |
| GET / PUT | `/api/system/save-log-images` | Switch for saving log images to disk |
| GET / PUT | `/api/system/nick-wrap` | Username wrapping symbols |
| GET / PUT | `/api/system/reply-segment` | Segmented sending |
| GET / PUT | `/api/system/quote-reply` | Quote bubble replies |
| GET / PUT | `/api/system/forward-long` | Merged forwarding for long messages |
| GET / PUT | `/api/system/auto-card` | Auto sheet (COC automatic HP/SAN/MP) |
| GET / PUT | `/api/system/image-host` · `/api/system/image-send` | Image host / image sending method |
| GET / PUT | `/api/system/user-group` | User group enforcement |
| GET / PUT | `/api/system/friend-clean` | Cleanup of friends, groups and local records; `days` / `groupDays` / `userRecordDays` / `groupRecordDays` (0–3650 days), `groupLimit` (0–10000), `maxGroupSize` (0–1000000); saved atomically after all parameters pass validation |
| GET / PUT | `/api/system/chat-config` | Chat persistence (retention period, etc.) |
| GET | `/api/roadmap` | Roadmap data (reads `docs/roadmap.md`) |
| POST | `/api/system/update/cancel` | Request cancellation of an update that is connecting, downloading, verifying or preparing; stops asynchronously and doesn't cancel a formal installation |

### BotMsg Notes

Use `values.bot_msg` of `/api/system/global` to edit the text after the fixed information of `.bot`; `values.bot_header` keeps the old header but is also shown after the fixed information. Both accept only strings of at most 65536 UTF-8 bytes each; an empty string means nothing is shown.

GET queries with `scope=global|adapter|account`, `target` and `platform`; PUT uses the same scope fields plus `values`. Non-global scopes can restore inheritance with `clear: ["bot_msg", "bot_header"]`. The top-level `default_locale` in the response is the backend's persisted global default reply language and is read-only; this endpoint provides no editable fields for the fixed version, build information or compatibility engines.

### Update Endpoints

Update operations run asynchronously; POST endpoints only queue the work and immediately return one status, and the frontend should keep polling `GET /api/system/update`. Main fields:

- `current` / `latest`: the current version and the Release manifest; `latest.asset` is the installer matching the current OS / architecture exactly. `current.prerelease` says whether this build is a Beta; `GET /api/system/status` also returns `prerelease`, and the channel can't be judged from the semantic version alone.
- `phase`: `idle`, `checking`, `available`, `connecting`, `downloading`, `verifying`, `preparing`, `cancelling`, `cancelled`, `staged`, `scheduled` (waiting for scheduled installation), `downloaded`, `installing`, `error` or `up_to_date`.
- `source`, `downloadedBytes`, `totalBytes`, `checkedAt`, `error`: this run's source, progress, time and error.
- `downloadSupported` / `installSupported` / `pending`: whether the program can download, whether one-click installation is possible, and whether a verified staged package exists.
- `cancelSupported` / `canCancel`: whether the server supports cancellation and whether a cancellation request can be accepted now. After a successful request it usually enters `cancelling` first; only polling `cancelled` means the background transfer has stopped. Forcibly interrupting an installation isn't provided.
- `runtime.container`, `runtime.containerType`, `runtime.containerDetection`: the container detection result, runtime type and matched signals; `selfUpdateBlockedReason=container` means only checking is allowed inside a container, not downloading or installing.
- `settings`: `autoCheck`, `intervalHours` (1–168), `autoAction` (`notify` / `download` / `install`), `source` (`auto` / `direct` / `mirror` / `custom`) and `customMirror`.
- `settings.scheduledInstall`: optional boolean, default `false`, which only schedules installation when `autoAction=install`; `settings.installTime` defaults to `04:00` and strictly uses `HH:MM` (`00:00`–`23:59`). Enabling scheduled installation requires full package manager support: `dice-next.exe` on Windows, `start.sh` / `dice-next` on new Linux/macOS; it can't be enabled in containers or direct core mode.
- `scheduledInstallSupported`, `scheduledInstallAt`, `pendingTag`, `timezoneMinutes`: capability, the UTC epoch seconds of the active schedule (`0` when none), the staged package version and the server's actual time zone offset. The frontend should enable settings based on the capability fields and display times using the offset, not the client's time zone.

Scheduled installation is set for the next specified time after the download completes, and the schedule is persisted with the staged package; the schedule only limits restarts initiated by the program. When `autoAction=install` and the package is ready, the manager applies the update at **any next start** (including manual restarts, starting after exit, system reboots and daemon restarts). `POST /api/system/restart` also coordinates the installation and restart; download / notify-only modes keep the staged package without installing.

The Linux/macOS installation capability requires new packages that include the POSIX manager; beta.928 doesn't have it. The backend also checks the manager's parent process, executable and directory write permission; the frontend must judge by the actual `installSupported` / `scheduledInstallSupported`, not by the operating system name alone. An ordinary restart in direct core mode re-executes with the original PID, working directory and arguments, which isn't the same as installation support.

Changing the time or time zone reschedules; turning off scheduling only cancels the planned proactive restart, while switching to `download` / `notify` also revokes the authorization for automatic installation at start. A manual `POST /api/system/update/install` installs immediately. `autoCheck=false` doesn't cancel an existing schedule. The background checks the proactive restart schedule every minute; checking the same staged Release again doesn't re-download or reset the schedule. Packages whose preparation was cancelled or interrupted are neither scheduled automatically nor authorized for installation at start. The authorization is generated by the core after download / verification / preparation completes, and authorization files carried inside installers aren't trusted.

Custom mirrors must be HTTPS address prefixes. The server only accepts schema 1 manifests with `DiceZone/Dice-Next`, safe version fields, known platform architectures, restricted file names, exact sizes and 64-hex-digit SHA-256. SHA-256 only verifies that the downloaded content matches the manifest; it isn't an independent code signature.

When a download source receives no new file data for 60 consecutive seconds, or a single source attempt reaches 20 minutes, the actual transfer is cooperatively cancelled and waited on before switching sources according to the configuration. An HTTP request timeout isn't the same as cancelling the background update task; the client must query the status again to avoid duplicate queuing and old state overwriting new tasks.

Container restrictions are enforced by the server and don't depend on frontend buttons. `POST /download`, `POST /install` and automatic download / install policies in `PUT` are all refused; existing old configuration takes effect as `notify` while running in a container. The version manifest is still written to the container's temporary directory and checked normally.

## Notifications and Audit

| Method | Path | Description |
|------|------|------|
| GET / PUT | `/api/system/notice` | Notification settings (per-event checkboxes, notification windows, SMTP / Webhook) |
| POST | `/api/system/notice/test` | Send a test notification |
| GET | `/api/system/audit` | Audit log (`data/audit/*.jsonl`) |

## Adapters

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/adapters` | List / create |
| PUT / DELETE / PATCH | `/api/adapters/{id}` | Update / delete / partial update |
| POST | `/api/adapters/{id}/test` | Test the connection |
| POST | `/api/adapters/{id}/reconnect` | Manual reconnect (resets backoff) |
| GET / POST | `/api/adapters/{id}/qq-official-actions` | QQ Official capability list / call restricted actions; see [QQ Official API v2](./qq-official-api.md) |

Creation example:

```json
POST /api/adapters
{
  "name": "MyQQBot",
  "type": "onebot_v11",
  "connection_mode": "forward_ws",
  "endpoint": "ws://127.0.0.1:3001/",
  "access_token": "",
  "enabled": true
}
```

## Dice Rules and Rolling

| Method | Path | Description |
|------|------|------|
| GET / PUT | `/api/dice/rules` | Old placeholder rule switches, kept only for compatibility; the dice engine doesn't read these values and the WebUI no longer provides an entry |
| POST | `/api/dice/roll` | Server-side roll (for debugging) |

## Commands, Texts and i18n

| Method | Path | Description |
|------|------|------|
| GET | `/api/commands` | Command catalog (categories / examples / reply keys) |
| GET | `/api/i18n/locales` | Available languages (including custom language packs) |
| GET | `/api/i18n/all` | All text keys (including overrides and original keys) |
| PUT | `/api/templates` | Set a text override |
| POST | `/api/templates/preview` | Read-only text / card serialization preview without sending a message |
| POST | `/api/templates/markdown-source` | Convert plain text into Markdown source that displays the same (`{value}` or `{variants}`); only returns the result without saving |
| POST | `/api/templates/convert-markdown` | Batch-convert the plain text overrides of the global scope or a persona (`personaId`) to Markdown, optionally limited by `locale`; `dryRun: true` only returns `total` and the number `escaped` that need escaping |
| DELETE | `/api/templates/{locale}/{key}` | Reset a text |
| GET | `/api/templates/export` · POST `/api/templates/import` | Export / import text overrides |

Reply entries in the command catalog and entries in all texts provide `presets: {traditional, standard, visual}`, each containing the original `value` and `format`; `presetStyle` is the global display scheme, and `default` / `defaultFormat` match that scheme. Presets don't include existing overrides. Saved custom text still takes effect under the existing global / persona inheritance rules, and loading a preset doesn't change the display scheme setting.

Templates can store `[[action:title|command]]` and `[[bar:name|current|max]]`. Command and persona templates also support `[[math:TeX|plain text alternative]]`, where formula variables use `{{variable}}` and the alternative text uses ordinary `{variable}`. QQ group / C2C Markdown uses the formula; other platforms, the traditional scheme and forced plain text use the alternative text.

Preview request: `{ text, format: "plain"|"markdown", platform: "qq_group"|"qq_private"|"qq_channel"|"kook"|"discord"|"plain", style: "traditional"|"standard"|"visual", forcePlain: false }`. Text is at most 64 KiB. Returns `text`, `plain`, `markdown`, `actions` and `payload` in `data.preview`; for plain text adapters the payload is null, and final CQ / media segments aren't faked. The old `markdown` / `onebot` fields are kept.

When a template contains an explicit page break `{FormFeed}`, a `data.preview.messages` array is also returned; each item has the five fields above and is the preview of one separate message. Paging happens first, then each part is converted to Markdown / plain text and its payload generated. The summary-level payload is null, and the summary text can't be treated as a single send request. Empty messages produced by consecutive page breaks don't enter the array; with only page breaks, the array is empty. Without explicit page breaks, the original single-message structure is used.

QQ/KOOK/Discord text and card structures share the serializer used for actual sending, but this isn't a client screenshot: no network message sending, media upload, identity mapping or platform permission checks are performed. Sending with a real account and platform refusal fallbacks must be accepted separately.

Native probabilistic texts (since build 926): PUT for template and persona entries can use a variants array instead of a single value, together with locale, key and format. Array elements are {text, weight}; weights are integers from 0 to 999999, with at least one positive weight, 1–256 entries and at most 64 KiB of text in total. Export keeps all candidates as variants; the old value field still provides one usable text. Ordinary strings and the old sample are kept.

Preview also supports variants and accepts an args object (such as {nick: "测试玩家", res: "1D100=42"}). Candidates and nested samples are drawn first, then args are substituted, so samples inside variable values aren't executed. A returned data.templateVersion of 1 means native probabilistic texts are supported; all preview fields share one draw.

## Custom Replies and Causal Rules

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/replies` | Keyword reply list / create |
| PUT / DELETE / PATCH | `/api/replies/{id}` | Update / delete / enable or disable |
| GET / POST | `/api/causal/rules` | Causal rules (conditions + actions + counters) list / create |
| PUT / DELETE | `/api/causal/rules/{id}` · POST `/api/causal/rules/{id}/toggle` | Update / delete / enable or disable |
| POST | `/api/causal/rules/test` | Trial run of causal rules |
| GET | `/api/counters` · PUT / DELETE `/api/counters/{key}` | Query, change and delete counters |
| POST | `/api/causal/cooldowns/clear` | Clear causal cooldowns |

`GET /api/replies` without filters keeps the old contract of returning all rules. The WebUI's edit collections use `?scope=global`, `?scope=adapter&target=onebot_v11` or `?scope=account&target=<adapter ID>`; global can't take a target, and local scopes must have one. Filtering returns that scope's own rules, not a merged inherited view.

Creating / changing rules uses `channelScope` (`global` / `adapter` / `account`) and `channelTarget`; old rules default to global. At runtime they are filtered by message platform and adapter ID, and invalid scopes can't be widened to global. At equal priority, account rules take precedence over platform and global ones. Poke configuration and keyword rules have different inheritance / candidate semantics; see [Advanced Replies](/en/manage/replies#global-platform-and-account-scopes).

## Bot Personas

Global random persona pool (since build 926): GET /api/personas/pool queries it; PUT on the same path with the body {pool: [{id, weight}]}. id 0 stands for the base replies; other IDs must exist and can't repeat; at most 256 items. A non-empty pool must have at least one positive weight, with the same weight range as texts; an empty pool [] restores a single global persona. The pool in /api/personas/active returns the global pool, and querying doesn't draw at random. Fixed selections for groups, private chats and accounts still take precedence; activating a single global persona clears the pool, while activating for a group doesn't.

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/personas` | Persona list / create |
| GET / PUT / DELETE | `/api/personas/{id}` | Details / update / delete |
| POST | `/api/personas/{id}/copy` · `/api/personas/{id}/activate` | Copy / activate |
| GET / PUT / DELETE | `/api/personas/{id}/entries` | Persona reply text entries |
| GET | `/api/personas/{id}/export` · POST `/api/personas/import` | Export / import |
| GET | `/api/personas/active` | Currently active persona |

## Decks

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/decks` | Deck list / operations |
| PUT / DELETE | `/api/decks/{id}` | Update / delete records |
| GET / PUT | `/api/decks/file` | Read / write deck files |
| DELETE | `/api/decks/file/{name}` | Delete a deck file |
| POST | `/api/decks/upload` | Upload a deck (.json) |
| POST | `/api/decks/reload` | Reload the deck directory |
| POST | `/api/decks/copy` | Copy a built-in, public, non-empty single deck as a new user file |

Read `/api/decks/file?name=<file name>&source=builtin` or `source=user` to state the source explicitly; a user file with the same name shouldn't make built-in entries read the wrong file. Built-in files are read-only, and the server also refuses to overwrite or delete them. The copy request is `{"filename":"内置合集.json","entry":"entry name","targetFilename":"我的牌堆.json"}`; the target can't already exist and can't have the same name as the source collection. Only the entry's original array is copied; referenced dependencies and collection metadata aren't copied automatically.

## Rules and Rule Packs

| Method | Path | Description |
|------|------|------|
| GET | `/api/rules` | Loaded rule systems |
| GET | `/api/rules/file` | Read a rule file |
| POST | `/api/rules/upload` · `/api/rules/delete` · `/api/rules/toggle` | Upload / delete / enable or disable rule files |
| PUT | `/api/rules/save` | Save a rule file (rule editor) |
| POST | `/api/rules/test` | Trial run of rule custom commands |
| GET | `/api/rulepacks` | Rule pack (bundle) list |
| POST | `/api/rulepacks/upload` · `/api/rulepacks/toggle` · `/api/rulepacks/delete` | Upload / enable or disable / delete rule pack zips |

## Help Documents

| Method | Path | Description |
|------|------|------|
| GET | `/api/help` | Unified help query with search, source type, specific source and paging |
| GET | `/api/help/groups` | Entry counts per specific source under the same conditions |
| GET | `/api/help/files` | Custom Markdown file list (`data/help/*.md`) |
| GET / POST | `/api/help/file` | Read / save a custom Markdown file |
| DELETE | `/api/help/file/{name}` | Delete a custom Markdown file |

`/api/help` parameters: `lang`, `q`, `kind`, `source`, `page`, `size` (at most 200), `management=1`. `kind` can be `custom`, `builtin`, `plugin` (JS / Lua), `rule`, `helpdoc`, `other`, or empty for no limit. Search and source filtering happen before paging; `/api/help/groups` accepts `lang`, `q`, `kind`, `management`.

Entries carry `source`, `kind`, `editable`, `customized`, `format`; management mode returns unrendered original content and keeps empty entries and same-name entries marked `shadowed`. Built-in and legacy custom entries also carry `i18nKey`, `locale`, `contentLocale`; edit / delete through `/api/templates` with that actual language, and don't overwrite another translation based on the browser language. Sources are `builtin`, `custom`, `plugin:<name>`, `lua:<name>`, `rule:<pack>`, `file:<name>`, `helpdoc:<pack>`.

Documents attached to rule packs keep `source` as `helpdoc:<rule pack>/<doc pack>` for compatibility, but `kind` is `rule`; clients should prefer the `kind` in the response rather than guessing from the source string alone.

## Groups

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/groups` | Group list / operations |
| PUT / DELETE | `/api/groups/{platform}/{group}` | Update / remove a group record |
| POST | `/api/groups/{platform}/{group}/action` | Group operations (leave / send a message / upload logs, etc.) |
| GET | `/api/groups/{platform}/{group}/members` | Member list |
| POST | `/api/groups/{platform}/{group}/member-action` | Member operations (mute / kick / change card name, etc.) |
| GET / POST | `/api/groups/{platform}/{group}/messages` | Simulated chat window (read records / send messages) |
| POST | `/api/groups/{platform}/{group}/poke` | Poke |
| POST | `/api/groups/{platform}/{group}/fetch-history` | Fetch message history (NapCat) |
| GET | `/api/groups/{platform}/{group}/files` | Group file list |
| GET | `/api/groups/{platform}/{group}/file-url` · `/file-download` | Group file direct link / proxied download |
| POST | `/api/groups/{platform}/{group}/file-upload` | Upload a group file |
| GET | `/api/groups/plugins` · POST `/api/groups/plugins/toggle` | Per-group plugin switches |

## Players and Friends

| Method | Path | Description |
|------|------|------|
| GET | `/api/players` | Player profile list |
| PUT / DELETE | `/api/players/{platform}/{user}` | Update / delete a profile |
| GET | `/api/players/{platform}/{user}/detail` | Player details (all character sheets / settings / plugin variables) |
| POST | `…/card-attr` · `…/card-del` | Change / delete character sheet attributes |
| POST | `…/setting` | Player settings |
| POST | `…/luavar` · `…/luacard` | Change / delete Lua plugin variables / card data |
| POST | `…/delete-friend` | Delete a friend |
| GET | `/api/friends` | Friend list (aggregated across adapters) |

## Black / White Lists and Dice Masters

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/banlist` | List / add black / white list entries |
| DELETE | `/api/banlist/{rowId}` | Remove |
| GET / PUT | `/api/banlist/whitelist-only` | Allowlist mode switch |
| GET / POST | `/api/masters` · DELETE `/api/masters/{platform}/{id}` | Dice master management |

## Scheduled Tasks and Broadcasts

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/schedules` | Scheduled task list / create (with condition / action) |
| PUT / DELETE | `/api/schedules/{id}` | Update / delete |
| GET / POST / DELETE | `/api/broadcast` | Triggered broadcasts |

## Session Logs

| Method | Path | Description |
|------|------|------|
| GET / POST | `/api/logs` | Log list / operations |
| DELETE | `/api/logs/{id}` | Delete a log (also cleans up cached images) |
| GET | `/api/logs/{id}/export?format=txt\|csv\|html` | Export (txt matches what is uploaded to the log site; html is self-contained with images) |
| POST | `/api/logs/{id}/upload` | Upload to the log site (SealDice V1 protocol) |
| GET | `/api/logs/images/{file}` · `/api/chat/images/{file}` | Cached log / chat images |

## Extensions: Lua Mods

| Method | Path | Description |
|------|------|------|
| GET | `/api/mod/lua` | Mod list (including command trigger words) |
| POST | `/api/mod/lua/upload` | Upload (zip directory mod or single `.lua` file) |
| POST | `/api/mod/lua/toggle` · `/api/mod/lua/delete` · `/api/mod/lua/reload` | Enable or disable / delete / reload |
| POST | `/api/mods/upload` | Lua mod upload (another entry, same behavior) |

## Extensions: JS Plugins

| Method | Path | Description |
|------|------|------|
| GET | `/api/plugins/js` | Plugin list (metadata / enabled state / same-name deduplication info) |
| POST | `/api/plugins/js/upload` · `/toggle` · `/delete` · `/reload` | Upload / enable or disable / delete / reload |
| POST | `/api/plugins/js/config` | Read / write the plugin settings form |
| POST | `/api/plugins/js/check-update` · `/update` | Check / perform updates via `@updateUrl` |
| GET | `/api/plugins/js/storage` · POST `/storage/clear` | View / clear plugin persistent storage |

## AI

| Method | Path | Description |
|------|------|------|
| GET / PUT | `/api/system/ai` | All AI settings (providers `providers` / models `models` / usage assignment `usages` / polishing / translation / chat / memory / tools / NPC / vision / speech `speech`) |
| GET / POST / DELETE | `/api/system/ai/memory` | View and manage AI memory (summaries / long-term facts) |
| POST | `/api/system/ai/test` | Model connectivity test: `{model, provider?}` can test unsaved settings; embedding models return the vector dimension |
| GET / PUT | `/api/knowledge/settings` | Knowledge base settings (reads and writes only `dice/ai.knowledge`) |
| GET | `/api/knowledge/status` | Entry counts per source, whether an embedding model is assigned |
| POST | `/api/knowledge/search` | Retrieval test: `{query, settings?}`, returns hits, relevance, direct FAQ answers and the text that would be injected |
| GET / POST / DELETE | `/api/knowledge/entries` | Custom entry list / add or update `{entry}` / delete `?id=` |
| POST | `/api/knowledge/import` | Bulk import `{entries: [...]}` |

## Assets and Data Migration

| Method | Path | Description |
|------|------|------|
| POST | `/api/assets/upload` · GET `/api/assets/{name}` | Image assets |
| POST | `/api/legacy/import` | Original V2 data migration (request body `{ "dir": "path" }`; the database is backed up automatically before importing) |

## Test Endpoint

```
POST /api/test/message
{ "text": ".r 3d6", "platform": "onebot_v11", "messageType": "group",
  "nickname": "希亚", "userId": "123", "groupId": "456", "locale": "en" }
```

This endpoint is the backend of the "Playground" page and **returns directly** `{ "reply": "...", "matched": true, "segments": [...] }` (without the uniform envelope). It goes through the same complete pipeline as real messages (built-in commands → JS plugins → Lua mods → causal rules → custom replies → AI), so you can test without connecting a platform. Optional fields: `rawContent` (with CQ codes to test image recognition), `selfId` / `atList` (targeting among several bots), `role` / `card` (group card name injection).

::: tip
The above is an overview of the endpoints; field details follow the actual version. All `/api/*` requests must carry the access key (or a logged-in cookie session).
:::
