# Groups

**Web panel → Data → Groups** manages each group the bot is in, as a "list + details".

## Group List

- Two tabs: **Active groups / Left groups**. By default the list is on the left and the details on the right; the display buttons can still switch to cards / table. Supports search (group name / group ID / note) and filtering by adapter account.
- Paging in the split list lets you click or type a page number; on narrow screens items are laid out according to the available space, instead of squeezing the feature content on the right to keep a full horizontal layout.
- Group records appear automatically when the bot joins a group or after `.bot` / `.group` has been used, and you can also add one by entering the group ID manually.
- Shows the group name, group ID, note labels and the bot's role in the group (owner / admin / member).
- **Last command**: the list, cards, table and details all show the last time a command was actually handled; ordinary chat and custom replies don't count. The all-adapters view summarizes the accounts in a group, while filtering by account shows only that account's record; you can sort by most recently used or longest unused.
- Old records that only have a date are labeled "date only", and those with no record show "no command record yet"; the time of an upgrade or of opening the page is never treated as a historical command time. Exact times are shown in the browser's local time zone.
- **Enable / disable**: equivalent to a remote `.bot on/off`.
- **Fully disable / re-enable**: silences a group completely (stronger than `.bot off`: nobody in the group can turn it back on, and it can only be restored from this page).

In the split view, these actions are in the details area of the selected group on the right; check the "adapter account" before changing anything. When filtering by account, the filtered account is used rather than accidentally changing another main account in the same group; states such as left or fully disabled limit the corresponding actions.

### Leaving groups manually in bulk

Click "Bulk leave" to enter selection mode, check groups one by one or "Select this page"; you can select up to 100 groups across pages. Changing the search, account filter or the "Active groups / Left groups" tab clears the selection, and nothing is checked automatically based on the last command time.

For groups with several accounts, filter by a specific bot account first; accounts that are offline, have already left or whose adapter doesn't support leaving can't be checked. OneBot V11 and Milky are currently supported; platforms such as QQ Official that don't provide leaving aren't shown as actionable.

The confirmation window lists the group name, group ID and the bot account that will actually act. Group management records are kept by default, and you can also check "Also clean up group management records"; leaving and cleaning up are handled in the same backend request and never make other bot accounts in the same group leave or get cleaned up. Character sheets and session logs are always kept. Partial failures are listed separately and stay checked so you can review and retry; the request being accepted doesn't mean the platform has finished leaving.

### Cleaning up left-group records in bulk

Switch to "Left groups", click "Bulk clean up records", check items one by one or "Select this page", review the group IDs and bot accounts, then confirm. You can select up to 100 items across pages; offline accounts can also be cleaned up, and the adapter doesn't need to support leaving. Groups with several accounts still need a specific account filter first; the panel never guesses which bot to clean up.

This only cleans up the selected account's group management settings: it doesn't send another leave request, and doesn't delete character sheets, session logs or other accounts' data in the same group. The backend checks the leave status again when cleaning up, and refuses to clean up an account that has rejoined; failed items stay checked so you can refresh, review and retry.

After an explicit leave, leftover group list caches on the platform, messages in transit and delayed leave events don't rebuild a cleaned-up record; restarting the program or waiting ten minutes doesn't make it reappear either. The record only comes back for that account after it really rejoins the group. Removing a record for a group the bot is still in isolation doesn't mean leaving; later real group messages can create the record again.

## Detail Tabs

| Tab | Features |
|--------|------|
| Feature management | Group card name / note / inviter / reply language / welcome message / send message / leave |
| AI | The group's AI switch and group memory management |
| Plugins | Enable / disable plugins / mods for this group only |
| Members | Member list and group admin actions such as mute / kick |
| Logs | Export / upload / delete session logs |
| Group files | View, download and upload group files |
| Chat simulator | See group messages in real time and speak directly |

### Feature management

- **Log / reply / roll / plugin**: four separate switches, matching the `on/off` of `.bot log`, `.bot reply`, `.bot roll` and `.bot plugin`. They are saved per current bot account and group and don't affect other accounts in the same group.
- **How the switches relate**: sub-switches can't bypass the master switch or full disabling. Turning off the master switch or the log switch stops recording and the timer; if recording is in progress, a pause notice is shown, but the log isn't deleted and the session isn't ended. After turning them back on, a log that was in progress resumes, while a log paused by hand with `.log off` still needs `.log on`.
- **Recording logs only**: keep the master switch and logs on, and turn off replies, rolls and plugins; if AI, welcome messages, automation or forwarding are enabled, turn them off separately as needed. For the full steps, see [Session Logs](/en/use/log#recording-logs-only). This isn't a dedicated mode that silences every non-log behavior.
- **Bot group card name**: the group card name the bot shows in this group (the QQ nickname is used when not set).
- **Group note**: a note label visible only in the panel.
- **Group inviter**: records who invited the bot into the group; their permissions are treated like a group admin's.
- **Group reply language**: once set, replies in this group use that language (equivalent to `.lang` in the group).
- **Welcome settings**: the group's welcome message (supports `@mention` / QQ number / nickname variables), send delay and cooldown (seconds). The actual values are never lower than the global minimum delay / cooldown in [Settings](/en/manage/settings), to prevent flooding when people join in quick succession.
- **Group actions**: send a message, leave (choose "Leave and remove the record" or "Leave only, keep the record"), remove the record (only deletes the panel record without leaving).

### AI

- **Group AI** switch: when off, the group no longer triggers the bot's AI conversation / NPC and builds no group memory (the global switch on the "AI" page must be on first; in the group, `.ai on/off` also works, requiring group admin).
- **Group memory**: view / clear the group's AI memory (summary + facts); memory is generated as the conversation goes on.

See [AI](/en/manage/ai).

### Plugins

Enable or disable plugins (Lua mods / JS plugins) for this group only. When off, that plugin's commands get no response in this group, without affecting other groups or global settings.

### Members

Fetches the member list and roles; admins can mute / unmute / kick / change card names, and the owner can set special titles. Search by nickname / card name / QQ is supported.

::: tip Permissions
Muting, kicking and similar actions require the bot to be an admin in that group; if the bot is only an ordinary member, the panel reports insufficient permission.
:::

::: tip Group automation (configured by command)
When the bot has group admin permission, group admins can configure automation in the group with `.group auto pass keyword` (join requests whose verification message contains the keyword are approved automatically; `all` = approve all) and `.group auto kick keyword` / `.group auto mute keyword [minutes]` (messages containing the keyword get the sender kicked / muted automatically, exempting the dice master, group admins, trusted users and the inviter); `.group auto` shows the settings, and leaving the keyword empty turns it off.
:::

### Logs

View the group's session logs (name / creator / start time / last recorded / message count):

- **Export**: TXT / Excel / web page (HTML; with "Save log images" on, images are embedded).
- **Upload**: upload to the log site and copy the share link automatically. The log site address and upload protocol are configured in [System settings → Cloud services → Log site](/en/manage/cloud-services#log-site).
- **Delete**: delete a log (its locally cached images are cleaned up too).

### Group files

- Browse group files and folders (name / size / uploader / upload time).
- **Download**: downloads directly from the QQ direct link first, keeping the real file name.
- **Upload**: upload a file to the group (up to 30 MB); it appears in the list after QQ processes it.
- Requires a connected NapCat / go-cqhttp adapter.

### Chat simulator

See the group's messages in real time and send directly, without switching to QQ:

- Messages show **avatars** and sender names (the group card name if there is one; the bot shows the name it was given).
- Send **text, images and stickers** (uploaded images are saved as local stickers you can send with a click) and **pokes**.
- Recalled messages are marked "recalled"; quoted messages appear as bubbles; file messages can be downloaded directly.
- "Fetch history (NapCat)" back-fills older messages; scrolling up isn't interrupted by new messages, and "Back to latest" jumps down in one click.
- Chat history is saved in `chat.db`, and the retention period is configured in [System settings → Chat history retention](/en/manage/settings).
