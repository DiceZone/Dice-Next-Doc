# Troubleshooting

For password recovery, manual configuration, backups and upgrades, start with the [FAQ](/en/guide/faq).

When something goes wrong, work through this page in order. When reporting a problem, please attach the relevant log or crash report files.

## Find the Logs First

| Content | Location |
|------|------|
| Runtime log | `data/logs/app/dice-<startup timestamp>-<process ID>_<date>.log` (a new file for every launch, split automatically at midnight) |
| Structured diagnostics | A `.jsonl` file with the same name in the same directory, recording the processing source, related msgID, code location, thread and other details; also redacted |
| Crash reports | `data/logs/crash_<timestamp>.txt` |
| Session logs | `data/logs/` (txt / html exported by `.log`) |
| Audit logs | `data/audit/` (event trail of the notification system, jsonl) |

The console window is hidden by default; you can show or hide it at any time from the tray icon's right-click menu.

The home page log shows INFO and above by default, so normal heartbeats and polling don't flood it. When investigating, first lower the "minimum recorded level" in WebUI Settings, then lower the home page's "minimum displayed level"; the latter cannot bring back debug output that was never recorded. For sending problems, look up the msgID to see the source and intended content in `[处理]` (processing) entries, and the actual content and failure reason in `[消息]` (message) entries. See [Program logs](/en/manage/dashboard#program-logs) for details.

## The Program Crashes / "Has Stopped Working"

Dice!Next has a built-in crash diagnostic fallback. Whatever the crash type (access violation, uncaught C++ exception, invalid CRT parameter, abort), the cause is written to **`data/logs/crash_*.txt`** before exiting, including:

- Time, crash type, version / build number
- **Startup phase marker** (`main:chdir` / `config` / `database` / `running` and so on), so you know which step failed even without a stack trace
- Exception code, the **module name + offset** of the faulting address, and the `what()` text of an uncaught exception

Steps:

1. Open the newest `crash_*.txt` in `data/logs/` and look at `phase` and `kind`.
2. Compare it with the last few lines of the runtime log from the same time in `data/logs/app/`.
3. When reporting the problem, send both files to the developers; they are usually enough to pinpoint the cause.

::: tip
If `data/logs/` is not writable, the report is written to `crash.txt` in the program folder instead.
:::

## "Nothing Happens" After Double-Clicking the exe

First check whether the process is still running. By default the program **minimizes to the system tray as soon as it starts** (a balloon notification appears in the lower-right corner) and shows no console window.

- Find the tray icon in the lower-right corner of the taskbar. Right-click it to open the web panel, show the console, open the program folder or exit.
- To restore the old behavior of showing the console at startup, set `dice.console_start_hidden` to `false`.

## A Second Process Exits Immediately

**Only one process may run on the same data** (the same `data/` directory). At startup the program writes a single-instance lock, `.instance.lock`, in the data directory. When it detects an existing instance, the second process exits right away and prints a message to the console / log, to prevent two processes from writing to the database at once and corrupting it.

- To run several dice bots, copy the whole program folder so that each one has its own `data/`.
- Stop the process using the same data directory and any service that restarts it before launching the intended instance. The operating system manages the lock; do not delete `.instance.lock` to bypass it. If it still fails, check runtime logs and directory permissions.

## The WebUI Won't Open

1. **Confirm the process is running**: is the tray icon there? Are new logs appearing in `data/logs/app/`?
2. **The port may have changed**: when the default port `18088` is in use, the program **moves to the next free port and writes it back to the configuration file**, and logs a WARN at startup. The simplest fix is right-clicking the tray icon and choosing "Open web panel", which always uses the current port; you can also check `port` in `config/server.json`.
3. **Remote access**: make sure `server.host` is `0.0.0.0` and the firewall allows the port. Exposing the panel directly to the internet is not recommended; see [Deployment & Operations](/en/guide/deploy).
4. **Asked to log in**: once a WebUI login password is set, every panel page requires login. Check "Trust this device" when logging in to keep the session on this machine for 30 days.

### Forgot the WebUI login password

Follow the [password recovery steps](/en/guide/faq#reset-password): restrict external access, stop and back up the service, clear the `password` field in the active configuration directory’s `webui.json`, delete the old `webui_sessions.json`, then start and set a new password. An empty password opens initial setup; it does not disable authentication.

## An Adapter Won't Connect

First, be clear about forward vs. reverse:

| Mode | Who connects to whom | What to enter as the endpoint |
|------|--------|-----------|
| Forward WS (`forward_ws`) | Dice!Next **connects to** the OneBot client | The OneBot client's forward WS address, such as `ws://127.0.0.1:3001/` |
| Reverse WS (`reverse_ws`) | The OneBot client **connects back to** Dice!Next | Only a **port number** (such as `6700`); then point the OneBot client's reverse WS address to `ws://<IP of the Dice!Next machine>:<that port>/` |

Check each item:

- Has the **OneBot client** (NapCat / Lagrange / LLOneBot and so on) enabled the matching service (forward WS server / reverse WS reporting), and do the ports match?
- Is **`access_token`** the same on both sides (or empty on both)? For forward connections, Dice!Next sends it in an `Authorization: Bearer <token>` header.
- **Firewall**: in reverse mode, allow the port Dice!Next listens on; in forward mode, make sure the OneBot client's port is reachable.
- **Status shows "Connection timed out"**: after a forward WS connection drops, it reconnects automatically (every 5 seconds for the first 10 attempts, then every 60 seconds for attempts 11 to 20). After 20 consecutive failures it stops reconnecting and sets the status to "Connection timed out". Fix the OneBot side, then click reconnect on the Adapters page.
- The dashboard's live log and `data/logs/app/` show the specific error.

## Commands Get No Reply

- Has someone sent `.bot off` in the group (group turned off)? Turn it back on in [Groups](/en/manage/groups) or with `.bot on` in the group.
- Is global silence or a global command switch on ([Settings](/en/manage/settings))?
- Is the user or group on the blacklist?
- In allowlist mode (`dice.whitelist_only`), groups that aren't on the allowlist get no response.
- Is the adapter status "Connected"?
- To debug without QQ, send commands in the panel's **Playground** and look at the replies.

## Still Stuck?

Report the problem with the following information:

1. Version / build number (on the panel's "About" page or in the first line of the startup log)
2. The relevant part of the newest log in `data/logs/app/`
3. For crashes: the full text of `data/logs/crash_*.txt`
4. Steps to reproduce
