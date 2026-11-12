# Deployment & Operations

This page is for running Dice!Next long term (self-hosting for yourself or a small group). For basic startup, see [Installation](/en/guide/install).

## Directory Layout

After the first launch, the program folder looks roughly like this:

```
DiceNext/
├── dice-next.exe       # Windows launcher / manager
├── app/                # service core (dice-next-core.exe on Windows)
├── lib/                # Windows runtime dependencies
├── config/             # configuration (JSON split by area, created on first launch)
├── data/              # all of your data lives here
│   ├── dice.db        #   main database (plus cards.db / logs.db / chat.db and others)
│   ├── decks/         #   decks
│   ├── rules/         #   rules reference library
│   ├── rulepacks/     #   rule packs
│   ├── helpdoc/       #   custom help documents
│   ├── mod/  plugins/ #   Lua mods / JS plugins
│   ├── logs/          #   session logs and crash reports; runtime logs are in logs/app/
│   └── audit/         #   notification audit trail
├── i18n/              # localized texts (custom language packs go here)
├── web/dist/          # web panel frontend
└── docs/              # roadmap / command table (data for panel pages)
```

Configuration and user data normally live in `config/` and `data/`. Include databases, plugins and resources stored outside them when using custom paths. See [backups and server moves](/en/guide/faq#backup).

## Connecting a OneBot Client

Dice!Next does not log in to QQ by itself. It needs a OneBot v11 client (such as NapCat, Lagrange or LLOneBot):

1. Enable the forward WS server in the OneBot client and note its address, such as `ws://127.0.0.1:3001/`.
2. Create a connection in Dice!Next's [Adapters](/en/manage/adapter-manager) page, choose "Forward WS" as the transport, enter the address above as the endpoint, and use the same token on both sides.
3. Save and enable it. When the status shows "Connected", you're done.

When the connection drops, it reconnects automatically (backing off from every 5 seconds to every 60 seconds; after 20 consecutive failures it pauses and shows "Connection timed out", and you can reconnect manually).

## Running in the Background

Dice!Next is a single executable that minimizes to the system tray when started:

- **Start with Windows**: turn on "Start at login" in Web panel → System settings (it starts automatically when you sign in to Windows).
- For stronger supervision such as automatic restart after a crash, use any process supervisor (for example, register it as a Windows service with nssm).

::: tip Working directory
At startup, Dice!Next switches to the folder that contains the exe (for release packages), so it can find `config/` and `i18n/` whether it is started at login, by double-clicking or from somewhere else. When using a third-party supervisor, we still recommend setting the "working directory" to the program folder.
:::

## Security Recommendations

- **Set a WebUI login password** on the WebUI Settings page of the panel. Once set, every panel page and `/api/*` requires login (cookie session). If you check "Trust this device for 30 days", the login survives browser and Dice!Next restarts. Trusted sessions are stored in `config/webui_sessions.json`; do not share that file.
- **Multiple instances on one machine stay separate**: when several Dice!Next installations run on the same host, each installation folder uses its own session cookie, so they don't log each other out even when they only differ by port. Changing the port of one instance does not affect its 30-day trusted sessions. After upgrading from an older version, panels whose login was previously overwritten by another instance may need to log in once more.
- **Do not expose the web panel directly to the internet.** If you need remote access, put it behind a reverse proxy (nginx or similar) with HTTPS and extra authentication or IP restrictions.
- **Keep the OneBot token safe**: it is equivalent to control over your QQ bot.
- **`{api:URL}` is off by default**: only turn it on when you need it (`dice.api_enabled`), and configure a domain allowlist (`dice.api_whitelist`).

::: warning AGPLv3 network service clause
Dice!Next is licensed under the AGPLv3. If you **modify** the source code and **provide it as a service to others** (even only as a network service, without distributing the software itself), you must make the corresponding source code available to its users. See [License](/en/other/license).
:::

## Reverse Proxy (Optional)

To access the web panel through a domain name with HTTPS, you can use nginx to forward requests to the local port `18088` (example):

```nginx
location / {
    proxy_pass http://127.0.0.1:18088;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;   # the panel uses WebSocket
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## Backups and Upgrades

- **Backups**: use panel backups and check the selected categories. For manual copies, stop the service first and save its actual configuration directory, `data/` and custom data stored elsewhere.
- **Upgrading a native installation**: stop the service, extract the new package over the old files completely, then start again. Configuration files and databases are not in the archive and won't be overwritten; see [Installation](/en/guide/install#upgrading).
- **Upgrading a container deployment**: inside a container the program only checks for and announces new versions, and the server refuses manual or automatic download and installation. Pull the new image and recreate the container; do not extract files over the program in a running container's layer. The mounted `config/` and `data/` are kept.
- Back up `data/` before upgrading.

## Troubleshooting

| Symptom | What to check |
|------|----------|
| The panel won't open | Port in use and moved to the next one / process not started / firewall; see `data/logs/app/` |
| The program crashes | See `data/logs/crash_*.txt` (crash reports) |
| An adapter won't connect | Endpoint address / port / token; is the OneBot client online; "Connection timed out" needs a manual reconnect |
| Commands get no reply | Is the group turned off with `.bot off` or globally silenced; see [Group & System Admin](/en/use/admin) |
| Debugging without QQ | Use the [Playground](/en/manage/dashboard) |

For a more complete troubleshooting process, see [Troubleshooting](/en/guide/troubleshooting).
