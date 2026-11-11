# Notifications

**Web panel → System settings → Notifications** manages notification sources, subscription scopes and audit logs per receiving window.

## Notification Windows

The page supports cards / list, search and server-side paging. Cards show the recipient's nickname, account and avatar; click edit to adjust the subscribed events.

Click the add button at the top and first choose **one notification window**: a group, a user, a recipient email address or a webhook. For chat windows, then choose the sending account; you can choose several accounts on the same platform. Email and webhooks are each managed as a separate window too. The same target can't be added twice; edit the existing window instead.

Then configure which sources this window listens to (all adapters, one or more platforms, one or more bot accounts) and its subscription scope (all notifications, by level, or by specific events). Events without a specific source account, such as system updates, are controlled separately by "Also receive program-level notifications". The dialog saves from the top, the content area scrolls independently, and it uses two columns on wide screens and one on narrow screens.

Several historical rules pointing to the same window are shown merged, but each rule's source and event scope are still saved separately, so subscriptions are never widened. For example, "friend notifications for account A" and "error notifications for account B" are never combined into "all friend and error notifications for A and B". If old rules use different sending accounts, they are kept by default and only change when you explicitly choose a single sending account.

Source filtering and choosing the sending account are independent: an explicitly chosen sending account never switches to another account on failure on its own; only automatic selection tries other available accounts on the same platform according to the existing strategy.

You can also send `.notice on` in chat (dice master only) to make the current chat a notification window; see [Admin commands](/en/use/admin).

Each window can **check individually** which notification events it receives; events are grouped into four areas:

| Area | Level value | Events included |
|------|--------|----------|
| Routine | 1 | Changes to trust, account permission links, scheduled tasks and notification subscriptions |
| Important | 2 | Friend and group requests, the bot joining and leaving groups, mutes and group admin permissions, the various active leave rules, group switches, task triggers, global silence, update progress; the actual level of sensitive word events depends on the rule |
| Key | 4 | Changes to bot admin permissions, black / white lists and the bot list |
| Error | 8 | Runtime errors, failed leave requests, failed updates |

When subscribing with `.notice level <n>` (1 routine / 2 important / 4 key / 8 error, combinable, 15 = all), all events in the matching areas are checked by default.

This is different from the TRACE / DEBUG / INFO / SUCCESS / WARN / ERROR filter of the program log. An empty event list imported from an old version keeps the level-subscription meaning and is shown with the events actually in effect; it only means "receive no events" when you explicitly switch to per-event subscription and clear the list.

Update checks are system events without a specific source group. Automatic installation results are reported by the manager after restarting, checked against the version actually running. Level subscriptions include newly added events of the same level; rules already filtered item by item are never widened on their own, so check new events as needed.

## How Notifications Describe Results

```text
[骰娘被踢出群聊] 骰娘被小明(3569827618)踢出群未归星璇(792364383)。
适配器 OneBot:3626455591
```

("[Bot kicked from group] The bot was kicked from 未归星璇(792364383) by 小明(3569827618). Adapter OneBot:3626455591")

An active leave is split into "request submitted, waiting for the platform to confirm" and the platform's actual receipt. A kick receipt that names someone else, and a disband receipt, take priority over an earlier leave request. A "kick" receipt with no other operator (the operator is empty, 0 or the bot itself) that matches a leave request this program just submitted is confirmed as an active leave and is not written to the blacklist or cloud blacklist.

Automatic banning on kick / mute is configured in [System settings → Original global settings → Event responses](/en/manage/settings#original-global-settings) and is off by default on new installations. Only a kick that names someone else bans the operator; the leave receipts described above never trigger a ban. When the reason is unknown, it says so explicitly rather than guessing from the operator's account.

Friend and group requests state the requester, the group, the decision and its basis. Approval calls only say "automatic accept / reject submitted"; the relationship is confirmed by the actual platform event.

Names come first from the event and the source account's cache, then from history; when there's no reliable name, the account is kept and no nickname is made up. When a panel password login has no verifiable QQ identity, the notification says so honestly. Plugin errors keep the plugin name, the operation and the real interpreter error (including the real line number), without guessing a root cause the lower layer didn't report.

## Email and Webhook Windows

Receive notifications even when you're not on QQ:

### SMTP email delivery

The shared SMTP configuration on the permissions / identity verification page is reused first, so a window only needs one recipient address and no repeated SMTP password; when the shared sending configuration isn't set, the old notification SMTP is used for compatibility. Port 465 uses SSL, and 587 and others follow the mail transport settings.

Without a valid SMTP configuration, the editor shows a notice and blocks saving; click "Configure SMTP" to open the existing settings in a new tab. When you come back, the configuration status refreshes and the window draft is kept. Old notification SMTP credentials are never cleared by editing or deleting a recipient window.

The email subject is `[Dice!Next] event title`, the body matches the chat notification, and change notifications never expose authorization codes or similar information.

### Webhook delivery

When adding a window, choose Webhook and enter the full HTTP(S) address. A missing or invalid address shows a notice with a button that jumps to the address field.

Generic JSON, WeCom, DingTalk and Feishu presets are built in. Choose the matching type to generate a text message request body; when a DingTalk or Feishu bot has signing enabled, enter the signing secret in the advanced options, and a timestamp and signature are generated when sending. The bot's own keyword, IP allowlist and similar restrictions still need to be configured as the provider requires. Generic JSON uses `POST` by default with a compatible format:

```json
{ "ts": "…", "level": 2, "op": "group_left", "title": "骰娘被踢出群聊", "msg": "[骰娘被踢出群聊] …", "origin": "onebot_v11:792364383" }
```

`op` is the stable subscription key; `title` distinguishes the specific result, such as kicked, active leave or disbanded. Email and webhooks are also controlled by the rule's level / event and source filters, and remain compatible with the old global channels.

### Advanced requests and notification variables

The advanced options support `POST` / `PUT` / `PATCH`, static JSON request headers and a custom JSON request body. "Request body example" only previews in the browser and never sends a network request. Switching presets restores that type's template.

Variables are written inside JSON string values; a value that is exactly a placeholder keeps the variable's type, for example `"severity": "{{level}}"` is sent as a number. Quotes and line breaks in the notification body are JSON-escaped automatically, so don't escape the whole body by hand.

```json
{
  "summary": "{{title}}",
  "text": "{{message}}",
  "severity": "{{level}}",
  "source": { "adapter": "{{adapter_id}}", "group": "{{group_name}}" }
}
```

| Variable | Content |
| --- | --- |
| `{{message}}` | The full notification body |
| `{{title}}` | The title of this event |
| `{{time}}` | Notification time in the server's configured time zone |
| `{{level}}` / `{{level_name}}` | Notification level number / name |
| `{{event}}` / `{{origin}}` | Stable event key / where it happened |
| `{{platform}}` / `{{adapter_id}}` / `{{account_id}}` | Source platform / adapter ID / bot account |
| `{{group_id}}` / `{{group_name}}` | Source group ID / group name |
| `{{user_id}}` / `{{user_name}}` | Source user ID / nickname |

System events may have no group, user or source account, in which case the values are empty and no identity is made up. Variables are replaced only once: no scripts run, and placeholders that happen to appear in the notification body aren't parsed again; the URL, request headers and JSON object keys aren't substituted.

The request body template must be a JSON object of at most 64 KiB, nested at most 16 levels deep, and at most 256 KiB after rendering. Request headers only support string values, can't contain line breaks, and can't override protected fields such as Host and Content-Length. Webhook addresses, signing secrets, custom headers and credentials in request bodies are excluded from list search and masked for restricted admins.

WeCom text over the provider's length limit is truncated safely, and the full content is still available in the audit details. HTTP errors from webhooks, or failure statuses returned by the preset providers, are recorded in the local log; "request submitted" is never treated as delivered.

Testing a window only tries the sending account or channel configured for that window; even if an old rule also included other channels, nothing is sent to them along the way. Manual tests bypass the window's pause and everyday event subscriptions; global tests still only use enabled rules. Testing doesn't change subscriptions and doesn't guarantee final delivery on the platform.

## Audit Logs

All notification events are persisted in `data/audit/notice_*.jsonl`, so you can look back at the time, level, event, location and content. Notifications are never pushed back into the same chat that produced them, to avoid duplicating command replies; delivery follows the updated subscriptions, and a closed window never temporarily gets one more notification about itself.

Each table row has a fixed height, and long content is truncated to one line; click it to open a details dialog with the full body and event information. On narrow screens the table scrolls horizontally, and the headers don't wrap character by character.

The same kind of error from the same source is merged over a short period, without hiding new errors from other groups or plugins. When a notification window itself is unreachable, only a local error log is written; it can't generate its own failure notification, to avoid endless nesting. The detailed platform reason stays in the local structured log.

The full template review draft is in the main repository at `docs/notification-templates.md`, listing each trigger condition, level, text and how missing information is handled.

::: tip
Events are written to the audit log whether or not any notification windows are configured; windows and delivery only decide "whether anyone is told proactively".
:::
