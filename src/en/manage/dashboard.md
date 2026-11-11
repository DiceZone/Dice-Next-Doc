# Web Panel Overview

Dice!Next comes with a web management panel: open the service address in a browser (`http://localhost:18088` by default) to enter. Almost everything can be configured in the panel without editing files.

The server information on the home page shows CPU and memory usage for the last **10 minutes**, updated every **5 seconds**, keeping the raw value of each sample. The backend keeps the last hour of history, and the home page only plots the most recent 10 minutes of it; it starts accumulating again after the backend restarts. With less than 10 minutes of history, the actual samples are shown. The first load shows a loading placeholder, and when a refresh fails, the latest snapshot is kept with a notice. When an older backend has no history, the recent samples from this browser are used.

::: tip Login and security
- **Login password**: after setting a panel login password in [WebUI Settings](/en/manage/settings#webui-settings-page), opening the panel requires the password first (cookie session authentication); saving it empty turns login off.
- **API Key**: the access key for the backend API, the same as `server/api_key` in the configuration file.
- If the panel is exposed to the internet, be sure to set both.
:::

## Global Settings Search

The panel's top bar has a global settings search, which you can also open with `Ctrl+K` (`⌘K` on macOS) on desktop. It matches page names, feature categories, specific settings, descriptions and common aliases at the same time, such as `Markdown`, `敏感词` (sensitive words), `SMTP`, `密码` (password) and `定时任务` (scheduled tasks). Results show the specific feature, the page it belongs to and a content summary; when a result matches only by alias, the matched keyword is highlighted. For example, searching "更新" (update) or "升级" (upgrade) both show "Check & auto-update", and searching "翻译" (translation) goes straight to "AI translation (.lang custom languages)", locating the corresponding subpage and feature card.

Choosing a result opens the matching page directly; for specific items in system settings, notification settings and WebUI settings, it also switches to the right tab, scrolls to the target card and highlights it briefly. The search dialog, result list and keyboard selection all use the panel's own styles rather than the browser's native dropdown.

## Getting-Started Tour

The getting-started tour highlights the relevant features on the real pages and uses read-only demo data to help you learn the interface. The demo isn't real runtime data: it is never saved as bot configuration and never performs real operations, and the page returns to normal when you exit the tour.

## Menu and Pages

The sidebar is grouped by function. All current pages:

### Top-level pages

| Page | Purpose |
|------|------|
| Overview | Status cards (online adapters / uptime / active records / number of custom replies) and recent logs |
| [Command Playground](/en/manage/playground) | Try commands and replies without QQ (switch scene, platform, reply language, nickname) |
| [Platform connections](/en/manage/adapter-manager) | Add / manage OneBot, Milky, QQ Official, Discord and KOOK connections |
| [Advanced replies](/en/manage/replies) | Custom replies, causal rules and counters |
| Commands | All commands, texts and variables (every reply text can be customized, including bot persona management) |
| [Help Documents](/en/manage/help-docs) | View and edit `.help` / `.helpdoc` help entries visually |

### Extensions

| Page | Purpose |
|------|------|
| [Plugins](/en/manage/plugins) | Lua mods and JS plugins in separate tabs (upload / enable / configure / reload) |
| [Rules](/en/manage/rules) | Rule pack management and the visual rule editor |
| Decks | Upload / manage deck files (see [Decks & Randomness](/en/use/deck) for usage) |

### Data

| Page | Purpose |
|------|------|
| [Groups](/en/manage/groups) | Per-group management (switches / members / chat simulator / logs / group files / per-group AI and plugins) |
| [Players](/en/manage/players) | Player profiles, trust / affection and player details |
| [Permissions](/en/manage/permissions) | User trust levels, allowlist, bot detection and blacklist |

### AI

Five subpages: models, conversation, NPC role-play, reply polishing and reply translation; see [AI](/en/manage/ai).

### System settings

| Page | Purpose |
|------|------|
| [Settings](/en/manage/settings) | Master, command prefixes, approval policies, images, global settings, data migration and more |
| [Cloud services](/en/manage/cloud-services) | Bot key, heartbeat, cloud blacklist, cloud character sheets and the log site |
| [Notifications](/en/manage/notice) | Dice master notification windows, SMTP / webhook delivery and audit logs |
| [WebUI Settings](/en/manage/settings#webui-settings-page) | Login password, API key, listening IP / port, theme, console log mode |
| [Scheduled Tasks](/en/manage/schedules) | Timed / conditional pushes and automatic leave tasks |
| Backup & restore | Data backup and restore |

There are also two information pages: "Roadmap" (the built-in roadmap) and "About" (version / license information).

## Overview

- **Status cards**: online adapters, users, groups, session logs, total commands answered and uptime. Every card is clickable and opens platform connections, players, groups, session logs, commands and statistics (including online history) respectively.
- **Recent logs**: shown by time, level, module and content, INFO and above by default; supports search, expanding diagnostics and message correlation. The actual recording threshold is changed in [WebUI Settings](/en/manage/settings#webui-settings-page).

## Program Logs

The six levels in order are **TRACE → DEBUG → INFO → SUCCESS → WARN → ERROR**. The default INFO shows INFO, SUCCESS, WARN and ERROR; normal protocol heartbeats are TRACE, and list refreshes, caches and successful text preview requests are DEBUG. Admin operations such as saving and importing texts are still logged, and failed previews and abnormal timings keep their logs. SUCCESS only means an important operation was confirmed complete; a player's check succeeding or failing is still a normal INFO.

`[处理]` (processing) shows the handler (built-in command, JS/Lua plugin, advanced reply and so on), how it was triggered, the result and the intended content, and assigns an internal msgID. `[消息]` (message) keeps the actual content submitted after platform formatting with the same msgID, without repeating the source; splitting, Markdown fallback retries, platform confirmation and failures can all be matched up. Platform operations use `[事件]` (event). The msgID is not the platform message ID, and submission or acceptance by the platform doesn't mean the user has received or read it.

Logs that plugins write themselves with `log/print/console` show their specific source. A send requested during plugin execution isn't recorded early as the whole execution succeeding, and unfinished asynchronous tasks state that they are waiting. Mixed sources keep each handler, and scheduled tasks, Lua sleepTime and asynchronous continuations across plugins never guess the source from "the most recently run plugin".

On the home page, choose the minimum displayed level, search content / module / plugin / msgID, or click "View related records". The related records window isn't affected by the list's level filter; errors carry their source details too, so you can investigate even when the original INFO record is no longer in the recent window. The C++ file, line number, function and thread ID are in "Diagnostic details" rather than taking up a prefix on every normal log line.

Times keep milliseconds and are shown in the server's time zone, not recalculated for the browser's time zone. The home page keeps a bounded set of recent records from the current process and reads at most the latest 500, without scanning whole-day files; the complete history and details are saved to `.log` and `.jsonl` files in `data/logs/app/`. Both kinds of files are redacted, but still check for unknown personal information before sharing.

## System Tray (Windows)

- After startup the program **hides the console window and minimizes to the system tray by default** (a balloon notification appears the first time); set `dice/console_start_hidden` to `false` to show the console at startup again.
- Hovering over the tray icon shows the port (such as `Dice!Next(18088)`, which helps tell several instances apart); the tray menu can open the web panel, show the console or exit the program.
- Since build 926, you can customize the name under **System settings → Basic settings → Network & system → Windows tray tooltip text**, up to 10 Unicode characters; leave it empty to go back to `Dice!Next`, and it takes effect as soon as you save. The program appends the actual listening port automatically, such as `希亚骰(18089)`, so you don't need to enter it. This is a setting for the whole program and doesn't change with the adapter; it can only be changed on Windows.
