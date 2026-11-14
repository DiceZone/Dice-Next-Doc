# Quick Start

For password recovery, manual configuration, backups and upgrades, start with the [FAQ](/en/guide/faq).

Get started with Dice!Next 3.0 in 5 minutes, from launching it to rolling your first die.

## 1. Download and start Dice!Next

Download the beta package for your platform. On Windows, extract it and double-click `dice-next.exe`.

The first launch creates the `config/` directory and the SQLite databases (`data/dice.db` and others). On Windows the program runs minimized in the **system tray** by default, with a balloon notification in the lower-right corner.

See [Installation](/en/guide/install) for details.

## 2. Open the web panel

Right-click the tray icon and choose "Open web panel", or visit `http://localhost:18088` in your browser.

::: tip Set a login password
We recommend setting a login password on the **WebUI Settings** page of the panel. Once set, every panel page and API requires login. A normal login session ends with the browser or the Dice!Next session; if you check "Trust this device for 30 days", the login survives browser and program restarts. The same page also lets you change the listening IP / port (a restart is required afterwards, and the page offers a one-click restart button).
:::

## 3. Configure a OneBot adapter

For built-in login, Milky, QQ Official Bot, Discord or KOOK, follow the [setup instructions for your platform](/en/manage/adapter-manager).

Go to **Web panel → Adapters** and click "Add adapter".

### Forward WebSocket (recommended)

Dice!Next connects to the OneBot client (NapCat, Lagrange, LLOneBot and others):

| Parameter | Value |
|------|-----|
| Protocol | OneBot v11 |
| Transport | Forward WebSocket (`forward_ws`) |
| Endpoint | `ws://127.0.0.1:3001/` |
| Access Token | Same as in the OneBot client (can be empty) |

Make sure the forward WS server is enabled in the OneBot client. When the connection drops, Dice!Next reconnects automatically (every 5 seconds at first, then every 60 seconds; after 20 consecutive failures it pauses, and you can reconnect manually in the panel).

### Reverse WebSocket

The OneBot client connects to Dice!Next:

| Parameter | Value |
|------|-----|
| Protocol | OneBot v11 |
| Transport | Reverse WebSocket (`reverse_ws`) |
| Endpoint | A **port number** (such as `6700`); Dice!Next listens on that port |

Then set the reverse WS address in the OneBot client to `ws://<IP of the Dice!Next machine>:<that port>/`.

## 4. Try some rolls

Send commands in a connected QQ group or private chat:

```
.help                 # help
.r                    # default d100
.r 3d6+2              # three 6-sided dice + 2
.coc                  # create a COC character
.ra 侦查              # COC check that reads the character sheet (侦查 = Spot Hidden)
.jrrp                 # today's luck
.draw 塔罗            # draw from the 塔罗 (Tarot) deck
```

If you don't want to connect QQ yet, you can try commands in the **Playground** of the web panel first.

## 5. Explore the features

| Feature | Where | Description |
|------|------|------|
| Dice & checks | [User Guide](/en/use/dice) | Full dice / COC / DND syntax |
| Character sheets | [Character Sheets](/en/use/card) | Creating and managing character sheets |
| Decks & randomness | [Decks & Randomness](/en/use/deck) | Card draws, temporary decks, inline randomness |
| Rules reference | [Rules Reference](/en/use/rules) | Look up COC / DND rules with `.rules` |
| Fun & interaction | [Fun & Interaction](/en/use/fun) | Daily luck, random names, affection |
| Session logs | [Session Logs](/en/use/log) | Session recording and the log site |
| Keyword replies | [Keyword Replies](/en/use/reply) | Custom replies triggered by keywords |
| Group & system admin | [Group & System Admin](/en/use/admin) | Group switches, permissions, scheduled tasks |

## FAQ

### Can't connect to the OneBot client?

Check that your firewall allows the port, and that the address, Access Token and the matching service in the OneBot client are all set up correctly. A status of "Connection timed out" means automatic reconnection has paused; reconnect manually after fixing the problem. See [Troubleshooting](/en/guide/troubleshooting).

### Commands get no response?

Open the Dashboard in the web panel to check the logs and confirm the adapter status is "Connected". Then check whether the group has been turned off with `.bot off`.

### How do I migrate old data?

See [Data Migration](/en/guide/migration): Web panel → System settings → Legacy data import, enter the old data directory and import in one step.
