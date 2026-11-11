# Adapter Configuration

Dice!Next uses a pluggable adapter architecture. Add and manage adapters in [Web panel → Adapters](/en/manage/adapter-manager); the configuration is saved to `config/adapters.json` and loaded directly at the next startup.

## OneBot v11 Adapter

Two transport modes are supported, set by `connection_mode` in the configuration:

| Mode | `connection_mode` | Meaning | What to enter as the endpoint |
|------|-------------------|------|----------|
| Forward WebSocket | `forward_ws` | Dice!Next connects to the OneBot client | The full WS address, such as `ws://127.0.0.1:3001/` |
| Reverse WebSocket | `reverse_ws` | The OneBot client connects back to Dice!Next | A **port number** (such as `6700`); Dice!Next listens on that port |

In reverse mode, point the OneBot client's reverse WS address to `ws://<IP of the Dice!Next machine>:<port>/`. The port accepts only one OneBot connection; extra connections are closed immediately.

::: tip Reconnecting after a disconnect (forward WS)
Automatic reconnection backs off: every 5 seconds for the first 10 attempts, then every 60 seconds for attempts 11 to 20. After 20 consecutive failures, automatic reconnection pauses and the status shows "Connection timed out"; click reconnect in the panel to resume (the failure count resets after the connection has been stable for 30 seconds).
:::

## Configuration File Fields

The adapter array is stored in `config/adapters.json`:

```json
{
  "adapters": [
    {
      "name": "MyQQBot",
      "type": "onebot_v11",
      "connection_mode": "forward_ws",
      "endpoint": "ws://127.0.0.1:3001/",
      "access_token": "",
      "enabled": true
    }
  ]
}
```

| Field | Description |
|------|------|
| `name` | Display name of the adapter |
| `type` | Protocol type; OneBot v11 uses `onebot_v11` |
| `connection_mode` | `forward_ws` / `reverse_ws` |
| `endpoint` | Forward: the OneBot side's WS address; reverse: the port number to listen on |
| `access_token` | Connection token; leave it empty to send none (sent in an `Authorization: Bearer` header on forward connections, and must match the OneBot side) |
| `enabled` | Whether the adapter is enabled |

## Configuring in the Web Panel

Go to **Web panel → Adapters**, create a connection, fill in the connection details for the platform, then save and enable it. Changes in the panel take effect immediately, with no restart needed.

## Multiple Adapters

You can add several adapters to connect different accounts or to serve as backup connections.

## Milky Adapter

Choose **Milky** as the platform connection. API calls go over HTTP and events arrive over WebSocket. Only `forward_ws` is currently supported; incoming webhooks are not.

| Field | Description |
| --- | --- |
| API address (`endpoint`) | HTTP / HTTPS base address of the Milky service, such as `http://127.0.0.1:3000`; not a OneBot WS address |
| Event address (`eventEndpoint`) | WebSocket address, such as `ws://127.0.0.1:3000/event`; derived from the API address when left empty |
| Connection mode (`connectionMode`) | `forward_ws`; Dice!Next connects to the event service |
| Access Token (`accessToken`) | The authentication token configured on the Milky server; not the BDC bot key |

Group and private chats, group members and cards, group files and related management features are supported; what actually works still depends on the protocol implementation and the bot's permissions. Temporary private chats keep their source group information, but the group ID is never used as a private chat target. A single read of group history is limited to 1–30 messages by the protocol.

Do not expose the connection service to the internet without authentication. A working API does not mean events are connected; if messages get no response, check the API address, event address, authentication and server logs together.

## Limits of the QQ Official Bot

- Group chats, C2C (one-to-one) chats and channels have different capabilities. Markdown in group / C2C chats requires the corresponding platform permission; channels send messages in the formats they support and should not be assumed to support Markdown in the same way.
- Official APIs for group information, members, management, message recall, menus and channels are available, and the `qq_*` actions can be called through the [backend API action entry](/en/develop/qq-official-api#backend-entry-point). Some APIs require an invitation or allowlist; without permission, the platform error is still returned.
- `.log export` uses the rich media file channel (`file_type=4`). Uploads are pre-checked against a 200 MB limit, and whether a file can actually be sent still depends on the platform and account permissions. If the file doesn't arrive, use the log site link or download it from the WebUI.
- Having the APIs connected and passing offline tests does not mean every real account scenario has been verified. When investigating, keep the error codes and times, and never publish the AppSecret, tokens or sensitive player data.

### Official nicknames and group names

`author.username` in group messages, group @ messages and one-to-one messages goes into the nickname cache. When it is empty, the existing cache is used rather than overwriting the real nickname with "User" or the OpenID. The cache is separated by bot AppID, survives restarts and is synced to player profiles. Nicknames obtained from member queries are also used in member lists, event notifications and plugin events.

After connecting, Dice!Next warms up, in the background, the groups this bot knows about and hasn't left. Warm-up is postponed while messages are being sent or received; when idle, it refreshes group names and member nicknames in turn, one page at a time, and refreshes stale data about once an hour. A group is also queued when a new group message or join event arrives. An ordinary `bot off` does not affect name warm-up; leaving the group, deleting the group record or stopping the adapter stops the corresponding refresh.

The group member API returns at most 30 members per page. Dice!Next saves the page cursor and keeps fetching, rather than truncating the whole group at 3,000 members. It pauses when rate-limited or at the end of a batch and continues later in the background. Nicknames from each page go into the cache immediately, but only a fully fetched list is used for the member list and group management. Repeated cursors, abnormal pages and failed requests never mark a partial list as complete.

The friend-add event `FRIEND_ADD` has no nickname field. If a nickname for the same OpenID already exists, or the `union_openid` provided by the platform matches a known nickname, the notification can reuse it; the first time a user appears with no known name, they are still shown as an unknown user. The unified ID is only used to reuse names; it never binds accounts, merges character sheets or shares permissions automatically.

Group names are obtained from `group_name` in `GET /v2/groups/{group_openid}/info` and saved permanently in the group data. The group information, member list and member detail APIs require platform allowlist permission; without it they return `11253`. Queries run in the background; on failure the old name is kept and retried with back-off. Messages never wait for nicknames, and partial lists are never treated as complete.

API references: [Group message event](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_message_create.html), [Friend add event](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/friend_add.html), [Group information](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_info.get.html), [Member list](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_members.get.html), [Member details](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_members_member_openid.get.html).

### Group member and interaction events

The official adapter settings have two switches:

- **Subscribe to group member join/leave events**: uses the official `GROUP_MEMBER_EVENT (1<<24)` to send member join and leave events to welcome messages, group management and plugin events, and to update the member cache. It is on by default for newly created accounts, and existing accounts keep their subscription settings. It requires the corresponding platform capability; reconnect after saving.
- **Automatically acknowledge interaction events**: on by default. Message button and quick menu events (types 11 and 12) are acknowledged once, ending the loading state in the QQ client. Receiving a callback does not mean a command was executed, and callback data is never run automatically as a chat command. If a plugin or external handler needs to choose its own response code, turn automatic acknowledgement off.

Message feedback, conversation clearing, story collections, model switching, user / group authorization and subscription template authorization states can be handled by native plugin event hooks. Authorization notifications never lift blacklist entries, turn the dice on or grant admin permissions automatically. New timestamps, reference indexes, cards and message scene data are also kept; repeated pushes are deduplicated by message ID and message index so that the same command is not executed twice.

For official API calls, native plugin hooks and parameter examples, see [QQ Official API v2](/en/develop/qq-official-api).

## Reply Texts and Visual Styles

In **System settings → Basic settings → Replies & display → Reply texts and visual style**, choose traditional, standard or advanced visual texts. The setting can apply globally, per adapter type and per account, with the priority account > adapter type > global. A local override can choose any style on its own and is no longer limited by the old two-state "global master switch".

| Platform | Rich text rendering | Notes |
| --- | --- | --- |
| OneBot v11 | Traditional text | The OneBot standard has no card protocol that works across implementations. |
| Milky | Traditional text and protocol message segments | Does not use the QQ Official Bot's Markdown capability. |
| Discord | Embed | Messages over the Embed length limit stay as traditional text. |
| KOOK | CardMessage | Uses the official card message format; overly long content stays as traditional text. |
| QQ Official Bot 2.0 | Markdown | The platform must enable Markdown for the bot. If the API keeps rejecting it, Dice!Next temporarily trips a circuit breaker and sends traditional text directly. |

Only one editable source is kept for each Markdown template. Dice!Next automatically generates the plain text version when built-in texts load, when custom texts are saved or when a persona is loaded. When sending, it first picks the version based on the source adapter and scope settings, then fills in dynamic variables such as nicknames and dice expressions. Traditional texts use an overlay with the historical wording, standard texts use the current defaults, and advanced visual texts add status bars and action hints on top of the same semantic data, so the dice master doesn't have to maintain three copies that easily drift apart. When interactions are enabled on QQ Official, usage lines and `[[action:label|.command]]` become buttons to be filled in; other adapters keep receiving the full text without QQ-specific tags.

## Adapter Persona Scope

After choosing a bot account in [Commands → Persona access](/en/manage/commands), you can set the following options individually; they are no longer in the add / edit dialog of the platform connection:

- **Default persona**: follow the global setting, or pin a persona for this bot.
- **User persona choice**: open all personas, open only the checked ones, or prevent ordinary users from switching with `.rpmode`.

The default persona and the open list are independent. The dice master can always bind any persona to an adapter or group in the WebUI; the open list only limits what group admins, inviters and private chat users can discover and choose through chat commands. This way several bots can share the same character sheets and reply data while keeping their own range of characters, without exposing unsuitable personas to each other.

Clickable buttons on cards require the platform's interaction events and specific authorization for the feature. Dice!Next only offers buttons when a feature really needs the user to choose and the platform supports it; admin or sensitive operations are never turned into generic buttons.

## QQ Official Bot 2.0

On the Adapters page, choose **QQ Official Bot 2.0**. Click "Enter AppID and AppSecret manually" below the square QR code area to switch to the credentials form. Events can be received over WebSocket or Webhook. The Webhook callback address is generated from the current page's domain and deployment path; after adding the adapter, view and copy it under "Connection method" on the card. Messages are still sent through the official API. See [Connecting QQ Official](/en/manage/adapter-manager#qq-official-bot).

Since the [QQ Bot 2.0 capability update on 2026-08-10](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html#_20260810), OpenAPI requests all use `https://api.bot.qq.com`. Dice!Next uses this domain for authentication, Gateway, profiles, share links, messages, rich media and other requests; the old domain is no longer used for API calls.

With the "standard" or "advanced visual" text style, the adapter can send Markdown. The adapter edit page has a **strict check for Markdown image resources**: when on, if the QQ platform can't store the images in the Markdown, the whole message fails and falls back to plain text. It is off by default to keep the platform's original compatible behavior. The matching field in `config/adapters.json` is `force_verify_image_resource`. If the same adapter receives two HTTP rejections of Markdown / cards in a row, Dice!Next sends pre-rendered plain text for the next 10 minutes, then automatically tries again after the cooldown, with no manual reconnect needed.

The QQ official platform identifies users and groups by OpenID rather than providing real QQ numbers. Dice!Next can link a verified OneBot QQ identity with an official OpenID so that character sheets, group settings and logs continue the same records. Use `.info` to see the identity of the current chat and binding instructions.

::: warning Group permissions
When the newer official message events provide `member_role`, Dice!Next uses the admin / owner role from it. When it is missing, the compatibility rules for the dice master and the inviter recorded for this account still apply; permissions are never judged by nickname. Muting, join approval and automatic approval policy APIs require **the bot itself to be a group admin**; without permission, the QQ platform rejects the request and the panel shows the error.
:::

### Official group management

Under **Groups → choose a QQ Official bot account → Official group management** you can:

- Query the current mute-all mode and member mutes still in effect, and mute or unmute members by OpenID;
- Fetch pending join requests for the current group, view the verification message, Q&A, source and risk hints, and approve or reject them manually;
- Create, enable or disable, edit notes on, run or delete automatic join approval policies, and add or remove allowlisted QQ numbers in bulk.

The Gateway `GROUP_JOIN_REQUEST` event is also connected to the unified event pipeline. It notifies the dice master and reuses `.group auto pass` and the global join request policy; the event's `join_request_id` is passed back unchanged with the approval request. Official automatic approval policies are executed by the QQ platform and can coexist with Dice!Next's local keyword-based automatic approval.

::: tip API limits
The join request event requires the bot to be a group admin and uses the `GROUP_AND_C2C_EVENT (1<<25)` intent. API rate limits, allowlist eligibility and specific error codes are controlled by the QQ official platform.
:::

## Discord

On the Adapters page, choose **Discord** and enter the Bot Token created in the Discord Developer Portal. The adapter receives server channel and direct messages through the Discord Gateway, and supports `@bot command`, channel messages and direct messages.

Turn on **Message Content Intent** in the Bot settings of the Discord Developer Portal; otherwise Discord won't give the bot the content of ordinary messages.

## KOOK

On the Adapters page, choose **KOOK** and enter the bot token. The adapter connects through the KOOK Gateway and REST API, and supports server channels, private chats, text and KMarkdown messages, and `@bot command`.

## Adapter Development

Adapters plug in through a common interface, which makes it easy to add more platforms. See [Adapter Development](/en/develop/adapter-dev).

## FAQ

- **Can't connect**: check the endpoint address and port, the firewall and whether the Access Token matches; see the dashboard log for the detailed error.
- **Status "Connection timed out"**: automatic reconnection has paused (20 consecutive failures). Fix the OneBot side, then reconnect manually.
- **Messages go missing**: confirm the adapter status is "Connected" and the OneBot client is reporting message events normally.

For more, see [Troubleshooting](/en/guide/troubleshooting).
