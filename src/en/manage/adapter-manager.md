# Adapters

**Web panel → Platform connections** adds, enables / disables and monitors connections. Connection status refreshes automatically every few seconds, with no need to reload the page.

## Adding an Adapter

After adding a QQ Official Bot, go to **Advanced replies → Cards & buttons**, or use the "More → Cards & buttons" shortcut on the account card, to visually edit the one-to-one chat menu and command panel per account. For specific scenes, item limits and related operations, see [QQ Official API v2](/en/develop/qq-official-api#visual-editing).

Click "Add connection". The form **guides you step by step**: choose the connection method first, and the address and other fields only appear after that.

OneBot v11, Milky, the QQ Official Bot, Discord, KOOK and the experimental OpenOPQ built-in login are supported. Choose the platform first, then fill in the credentials and endpoint for that platform. The connection mode notes in the table below apply to OneBot v11; for Milky and the built-in login, see the sections below, and other platforms use their own connection fields.

| Field | Description |
|------|------|
| Adapter name | Display name for identification |
| Adapter type | Choose according to the actual platform; this table uses OneBot v11 as the example |
| Connection mode | Forward WebSocket / reverse WebSocket |
| Address / port | Forward: the endpoint address (such as `ws://127.0.0.1:3001`); reverse: the port this program listens on |
| Access Token | Authentication token (optional); leave empty to skip the check |

- The connection mode has a **? help icon**; hover over it for a detailed explanation of forward / reverse, and the form also shows a matching hint once you choose.
- Forward addresses have their scheme **corrected automatically** (`ws://` is added if missing, and `http/https` become `ws/wss`), and invalid addresses and ports are flagged immediately.

### Transport modes

| Mode | Behavior | Setting on the framework side |
|------|------|------|
| Forward WebSocket (`forward_ws`) | This bot acts as the WS client and **connects to** the OneBot v11 WS server of the login framework | Choose "WebSocket server / active WebSocket / forward WebSocket" and enter the port the framework listens on |
| Reverse WebSocket (`reverse_ws`) | This bot acts as a WS server listening on a local port and **waits for the framework to connect** | Choose "reverse WebSocket / passive WebSocket / WebSocket client" and enter `ws://this machine's IP:port` |

::: tip Telling forward and reverse apart
It depends on who starts the connection: forward = Dice!Next connects to the framework; reverse = the framework connects to Dice!Next. The settings on both ends must match each other.
:::

For a reverse WS adapter, click "Connection method" to see the **connection information**. The addresses come from the server running Dice!Next, not the computer you opened the panel on:

- **Local**: `127.0.0.1`, only for when the framework and the bot run on the same server.
- **LAN**: read from the server's active IPv4 network interfaces; with several interfaces, VPNs or containers you can choose the address.
- **Public**: the backend queries the server's outgoing IPv4 address through external services instead of reusing a LAN IP.

Detection runs in the background after the program starts and refreshes the cache every 15 minutes. Opening the dialog only reads the cache and doesn't start a new public check; "Refresh addresses" checks manually. Read failures, detection failures and detection in progress each have their own message, and when a refresh fails, the old address still shown is clearly marked; when there is no address, the placeholder text can't be copied.

Public queries use fixed HTTPS address services: [ipify](https://www.ipify.org/) and [AWS checkip](https://docs.aws.amazon.com/batch/latest/userguide/create-a-base-security-group.html). They are only used to learn the server's outgoing IPv4, and never upload configuration, accounts or keys. When the system `curl` is unavailable, the network is down or the query times out, it reports that no address was obtained, without blocking program startup or messaging.

::: warning A public IP doesn't mean the port is reachable
Public connections still require checking NAT / container port mapping, the server firewall and security groups. Address detection never opens ports or changes these settings; having no LAN IPv4 or unavailable external queries doesn't prevent you from using a correct manual address.
:::

## QQ Official Bot

Choose **WebSocket** or **Webhook** to receive events. The card shows the actual connection method directly; click "Connection method" for connection instructions.

- The login area is a square QR code; click "Enter AppID and AppSecret manually" below it to switch to the credentials form. When editing an existing account, the credentials are shown directly, and leaving AppSecret empty keeps it. The bot's real QQ number is obtained from the official API, so you don't need to enter it.
- After choosing Webhook, the form generates the callback address from the panel's current domain and deployment path; after adding successfully, the connection information opens too, so you can copy the address into the QQ Open Platform. Example: if the panel is at `https://dice.example/bot/#/adapters`, the callback address is `https://dice.example/bot/qq-official/webhook`. A reverse proxy must forward that path to the bot service, and QQ must be able to reach it from the internet; local addresses are only for viewing locally. Configure only one Webhook adapter per AppID.
- When the panel is accessed through `127.*`, `localhost`, an IP address or HTTP, the Webhook deployment requirements are shown: the callback server needs a public IP, the domain needs a valid TLS certificate, and events must be received at a publicly reachable HTTPS address. If you have a reverse proxy, open the panel through its HTTPS domain before copying the address; if you can't meet these conditions, choose WebSocket. This notice doesn't block saving and doesn't mean the panel has verified public reachability.
- With WebSocket, the bot connects to QQ itself, so no callback address is needed. WebSocket in the interface corresponds to `receiveMode: gateway` in the configuration file, and old configurations remain compatible.
- Some QQ Official API v2 endpoints (such as the group member list) are only open to invited or allowlisted applications. When an ordinary application calls them, the platform returns a no-permission error such as "application has no API access permission" (error code 40012010). This is a platform permission matter, not a fault: the program logs it as DEBUG so it doesn't flood the log, and related features such as nicknames degrade to the available APIs. These records aren't visible at the default INFO level; lower the log level temporarily in WebUI Settings when investigating.
- "Advanced options" contains the strict check for Markdown image resources, the group member join / leave event subscription, automatic acknowledgement of interaction events, rich reply styles and quick actions. **New** accounts enable Markdown, message buttons, the group member event subscription and automatic acknowledgement of interaction events by default; existing accounts keep their settings when edited. The strict image resource check is off by default.

## Milky Connections

Enter the HTTP / HTTPS base address for the API; events use WebSocket. The event address can be set separately, and when left empty `/event` is derived from the API base address. Webhooks aren't supported yet. Don't use a OneBot endpoint directly as the Milky address; see [Milky configuration](/en/config/adapter#milky-adapter).

## Built-in Login (OpenOPQ, Experimental)

In "Add connection", choose "Built-in login" and enter the QQ number and a valid **BDC bot API key**. After you save and enable it, Dice!Next downloads the protocol client for your system from the center, starts it locally, and shows the download progress, QR code, online status or failure reason in the login dialog. Both WebUIs support it.

- Forward WebSocket is the default; the port and connection credentials are assigned by the program, so you don't need a remote address. Only choose reverse mode when the protocol client supports it.
- The executable doesn't ship with the Dice!Next package; downloads must pass manifest signature, size and SHA-256 checks, and the center must provide a version for the current system. Without a valid key, with no network, or when the center doesn't provide that platform yet, an error is shown and the checks are never skipped.
- The current protocol client needs a new QR scan after restarting. The login window can refresh the QR code, cancel scanning or disconnect QQ; "Test connection" only checks the existing instance and never starts a second protocol client.
- Account device data and logs are stored in `data/openopq/<adapter ID>/`, and executables in `runtime/openopq/<version>/`. Deleting the adapter also deletes that account's local device data and logs.
- After the center rejects the key (401 / 403), automatic retries stop; try again after changing the key or reconnecting manually. Ordinary OneBot adapters aren't affected by this hosting logic.

This is an experimental third-party protocol login, not the QQ Official Bot API, and login success or long-term stability on the platform is not guaranteed. Keep your bot API key and local account data safe.

## Bot Cloud Service Key

The bot API key entry for adapters is kept, and reads and writes the same configuration as [Cloud services → Bot key](/en/manage/cloud-services#bot-key). It is not the platform Access Token; existing keys don't need to be entered again because of the entry change.

## Edit / Test / Delete

- **Edit**: save after changing, and the adapter reconnects with the new settings. **The adapter's platform type can't be changed after creation** (delete and recreate it to switch platforms).
- **Test**: checks whether the endpoint is reachable.
- **Reconnect**: reconnects immediately.
- **Delete**: removes the adapter.

## Reconnecting and Back-off

After a disconnect, the adapter reconnects automatically with back-off: every 5 seconds for the first 10 attempts → every 60 seconds for attempts 11 to 20 → after more than 20 it pauses and shows the "**Connection timed out**" status (different from "Disabled"); click "Enable" to resume reconnecting manually. The retry count only resets after the connection has stayed up for more than 30 seconds, so "connected briefly, then dropped" doesn't cause endless rapid reconnects.

When something is wrong with the connection, check the detailed connection / messaging information in the recent logs of the [Overview](/en/manage/dashboard).
