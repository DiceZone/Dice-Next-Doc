# QQ Official API v2

This page is based on the [QQ Official API v2 documentation](https://bot.q.qq.com/wiki/develop/api-v2/) and covers the API and event entry points of Dice!Next's current official adapter. An API existing in the documentation doesn't mean every bot account has permission to call it; group members, group information and similar capabilities may still require an invitation or allowlist, and group admin operations may also require the bot to be a group admin.

## Backend Entry Point

### Visual editing

Open the editor in **Advanced replies → Cards & buttons**, or from "More → Cards & buttons" on a single QQ Official adapter card. After choosing a bot account, settings are only published to that AppID. The old `/qq-official` page address still works.

- **Global menu**: reads the existing configuration; add, edit, delete and reorder items; supports sending messages, HTTPS links, submenus and switches. The layout and request previews never run commands.
- **Command panel**: filter by one-to-one chat, group chat, text sub-channel and channel direct message, read page by page; supports creating, editing, deleting, admin restrictions and notes. An existing panel's scene and scope don't change when its content is edited.
- **Linked objects**: one-to-one chats use user OpenIDs, and group chats use group OpenIDs. Up to 20 can be entered when creating; afterwards add or remove them in batches through "Manage links"; the existing complete list is never replaced with the current input.

Content being edited is kept when switching tabs; leaving the page or switching accounts asks before discarding unpublished drafts. Before publishing, the platform version is read first, and overwriting stops if other changes are found; this isn't a platform-level atomic lock, so still avoid several people publishing at once. Publishing a menu fully overwrites the old one, and publishing with no items clears the menu; you're asked to confirm first.

When the platform refuses or the network fails, the draft is kept; after a timeout, read the status again to confirm and avoid creating duplicates. Character lengths, item counts and HTTPS addresses are validated in the frontend, but real permissions and final validation are decided by QQ. Unknown fields are kept; unrecognized item types block publishing until you change or delete them explicitly.

### REST actions

Using a logged-in panel session or the panel's `X-API-Key`, access:

```http
GET /api/adapters/{adapterId}/qq-official-actions
POST /api/adapters/{adapterId}/qq-official-actions
```

GET returns the `actions` and `capabilities` supported by the current account. POST requests always have the structure below; the key is the panel API key, not the QQ AppSecret or AccessToken:

```json
{
  "action": "qq_generate_share_url",
  "params": { "callbackData": "my-dice" }
}
```

The `data` of a successful response keeps the data returned by the platform. The share link is at `data.url` in the platform response, so it is `data.data.url` in the panel API's successful response. Failed calls return a readable error; unauthorized, rate-limited and business errors are never treated as success. This entry only allows the listed actions and doesn't proxy arbitrary URLs or HTTP methods.

Group / user identifiers can be the current bot account's OpenIDs, or already linked bare public group / user numbers. Endpoints of different bot AppIDs can't be mixed. Bulk member operations take at most 20 people at a time; join request pages hold at most 50, and group blacklist pages at most 100.

## Action Categories

| Capability | Actions |
| --- | --- |
| Group info, members and bot role | `qq_group_info`, `qq_bot_state`, `qq_group_members`, `qq_group_member` |
| Muting | `qq_get_mute`, `qq_set_mute` |
| Join approval | `qq_join_requests`, `qq_approve_join` |
| Automatic approval policies | `qq_list_join_strategies`, `qq_create_join_strategy`, `qq_update_join_strategy`, `qq_delete_join_strategy`, `qq_execute_join_strategy`, `qq_update_join_whitelist` |
| Member removal and group blacklist | `qq_remove_members`, `qq_blacklist`, `qq_set_blacklist` |
| Messages and recall | `qq_send_message`, `qq_recall`, `qq_stream_message` |
| Private typing status and interaction recall | `qq_input_notify`, `qq_wakeup_message` |
| Share links | `qq_generate_share_url` |
| Global menu | `qq_get_menu`, `qq_set_menu` |
| Command panels | `qq_list_panels`, `qq_create_panel`, `qq_get_panel`, `qq_update_panel`, `qq_delete_panel`, `qq_panel_target` |
| Rich media and chunked uploads | `qq_media_files`, `qq_upload_prepare`, `qq_upload_part_finish` |
| Markdown image materials | `qq_material_prepare`, `qq_material_complete`, `qq_material_list`, `qq_material_delete` |
| Channels and bot profile | `qq_me`, `qq_my_guilds`, `qq_guild`, `qq_guild_channels`, `qq_create_channel`, `qq_channel`, `qq_update_channel`, `qq_delete_channel`, `qq_gateway` |
| Interaction acknowledgement | `qq_interaction` |

Basic parameters use fields such as `groupId`, `userOpenId`, `memberOpenId`, `strategyId`, `panelId`, `guildId`, `channelId`, `interactionId` and `messageId`. Actions that submit a full platform configuration (menus, panels, policies, streaming messages, messages and uploads) submit the object from the official documentation through `params.body`. Platform scope, permissions, rate limits and field limits still apply.

### Global menu and panels

The `body` of `qq_set_menu` is the complete `{ "menu": { "items": [...] } }` configuration and overwrites the existing menu. One-to-one chat menus support sending messages, HTTPS links, submenus and the `switch` type; the state of a switch's `switch_id` can be read from later message scene extensions, and never changes Dice!Next's global AI configuration automatically.

Panel lists use `scope`, `cursor` and `limit`; creating and editing use the official panel `body`. Linked objects use `panelId`, `op: "add" | "del"` and `userOpenIds` / `groupOpenIds`, at most 20 at a time. Global panels or scenes that don't support linked objects are rejected by the platform and never quietly converted locally.

### Markdown image materials

Based on the [official material management API](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html), the following panel actions are provided:

| Action | `params` | Purpose |
| --- | --- | --- |
| `qq_material_upload` | `fileName`, `base64` | Request, direct image upload, digest check and upload confirmation in one step |
| `qq_material_prepare` | `body: { file_name, file_size, content_type, md5, sha1 }` | Request an upload, returning `upload_id` and `presigned_url` |
| `qq_material_complete` | `body: { upload_id, md5 }` | Confirm the upload and get the material reference |
| `qq_material_list` | Optional `cursor` | List this account's materials page by page |
| `qq_material_delete` | `imageId` | Delete a material |

Between prepare and complete, the caller PUTs the file's binary to the presigned address returned by the platform, using the Content-Type from the request; this upload doesn't carry the QQ AccessToken. `qq_material_upload` does these three steps on the server automatically and only accepts the HTTPS COS upload address returned by the platform, never an arbitrary upload URL from the caller.

Files are limited to PNG, JPEG, GIF and WebP, at most 10 MB; the file name extension must match the MIME type, MD5 is 32 and SHA-1 40 hexadecimal characters. Materials belong to the current bot account and shouldn't be reused across AppIDs. When sending Markdown, use the returned `qqbot-media://image/v1/...` reference; the temporary `preview_url` isn't suitable as a persistent image address. Under "Cards & buttons → Image materials" you can upload, browse page by page, preview on demand, copy image code and delete. The list doesn't load images automatically; each account holds at most 100, and materials unused for 90 days in a row expire, with the actual period depending on the platform response.

### Rich cards and @everyone

`qq_send_message` can send the new image-text cards as-is through `params.body`: `msg_type: 8`, `card.type: "tuwen"`, with the card content and links using the fields defined by the [official group message API](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html). In "Cards & buttons → Messages & image-text cards" you can fill in a title (1–50 characters), description (1–200 characters), HTTPS link and image address. After choosing a group or user OpenID under the current AppID, it only sends once you confirm; when replying to an existing message you can enter a valid message ID, and proactive sends are still subject to platform quotas.

In replies or native message requests that explicitly use Markdown, `<qqbot-at-everyone />` is passed to QQ as-is. The bot must be a group admin, and the platform limits it to once per group per day; ordinary user text is never turned into an @everyone automatically. After switching the message editor to Markdown, use "Insert @everyone" to add the tag. Markdown image material references are also kept as-is. These capabilities depend on the [official changelog](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html) and the account's actual permissions.

### Quick buttons

QQ message button titles are at most 10 characters. Next removes extra content such as examples after a comma from the action description; titles still too long keep an ellipsis, and full command arguments are never truncated. "Check again" reuses the original command, including the prefix, skill modifiers, advantage / disadvantage and reason, and the user confirms sending after clicking. The button itself never rolls again automatically.

### Typing status

```json
{
  "action": "qq_input_notify",
  "params": { "userOpenId": "user OpenID", "seconds": 30, "msg_id": "received message ID" }
}
```

Private chats only, lasting 1–60 seconds. Use either `msg_id` for ordinary messages or `event_id` for event replies.

### Interaction recall and streaming messages

`qq_wakeup_message` uses `userOpenId` and a message `body`, adding `is_wakeup: true` automatically. It can't be combined with `msg_id` / `event_id`. The recall quota is controlled by QQ; this entry never broadcasts or sends recall messages on users' behalf automatically.

`qq_stream_message` is for private chats only; `body` keeps official fields such as `input_mode`, `input_state`, `index`, `content_type`, `content_raw` and `stream_msg_id`. The `id` returned by the first chunk is used for later chunks; the caller maintains the order and content prefix. This is an API capability and doesn't mean the existing AI chat switches to streaming by default.

## Native JS Event Hooks

The following are **native hooks added by Dice!Next**, not declarations of SealDice standard interfaces. The existing SealDice-style event interfaces keep their original signatures.

```javascript
ext.onQQInteraction = (ctx, event, msg) => {
  // event.interaction_id is the interaction acknowledgement ID; don't confuse it with the outer event_id.
  // event.interaction_data.resolved keeps button, menu, feedback or authorization data.
  if (event.interaction_type === 11) {
    seal.replyToSender(ctx, msg, 'Button action received.');
  }
};

ext.onQQSubscriptionStatus = (ctx, event, msg) => {
  // event.subscription_results keeps the template, allow / deny, subscription ID and time.
};

ext.onQQOfficialEvent = (ctx, event, msg) => {
  // Other official non-message events, such as friend deletion and channel profile changes.
};
```

`event.groupId`, `userId` and `operatorId` use the unified public identity; `event.data` keeps the platform event body. Interaction and authorization notices never raise the operator's permissions, and hooks still respect the existing plugin on/off and group switches.

When automatic acknowledgement is on, `event.interaction_ack_automatic` is true, and plugins shouldn't submit an acknowledgement again. To acknowledge manually, turn off the adapter's "Automatically acknowledge interaction events", then call `qq_interaction` with `interactionId` and `body: { "code": 0 }`. Codes are 0–5, and each interaction can only be acknowledged once. Other interaction types usually don't need acknowledging; button data is never run automatically as a dice command.

For ordinary official messages, `msg.qqOfficial` provides `message_type`, `message_scene`, `ark_data`, attachments and reference indexes. The `auth_token` in the message scene isn't exposed on this object; non-credential extensions such as menu switches are kept. The existing `msg.segment` can still access quoted message elements. Text in cards, speech recognition and quotes is never stitched into new commands.

Quoting the current message uses the `msg_idx` provided by the platform, handled separately from the `msg_id` of passive replies. When an old message or historical targeted quote lacks an index, the body is still sent normally, and a logical message ID is never passed off as a reference index; multi-part replies don't quote repeatedly.

## Limits and Verification

The APIs and events have regression tests for offline request mapping, repeated pushes, parameter limits, timestamps and plugin callbacks. Real accounts that haven't been authorized can't be considered verified online on that basis.

References: [Group member join event](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html), [Interaction event](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html), [Interaction acknowledgement](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/interactions_interaction_id.put.html), [Subscription authorization status](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html), [Global menu](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_menu.put.html), [Generate share link](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html).
