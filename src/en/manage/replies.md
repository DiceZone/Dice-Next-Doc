# Custom Replies

**Web panel → Advanced replies → Custom replies** manages automatic replies triggered by keywords. The page has three tabs: **Custom replies**, **Causal rules** and **Counters**.

## Custom Replies

### Global, platform and account scopes

The page header chooses **Global / an adapter platform / a specific bot account**. The custom reply list, adding, editing, import / export and match testing all use the current choice; only rules of that scope are shown, without mixing other scopes or inherited rules into the editable list. Historical rules are still global by default and aren't migrated automatically when you switch the selector.

At runtime, only rules that apply to the message's channel are matched. Account, platform and global rules can all be candidates; switching to an account scope doesn't turn off global rules entirely. At the same priority, account beats platform and platform beats global; otherwise rules are chosen by priority, conditions, probability and limits as usual. Pokes use the same header scope, but their configuration inherits account > platform > global. Causal rules and counters don't become per-channel data because of this selector.

Under each reply's content, **buttons and status bars** can be added, edited and deleted: buttons take a title and a command, and status bars take a name, current value and maximum. They are saved with the body as source such as `[[action:roll command|.r]]` and `[[bar:HP|{hp}|{hpmax}]]`, and the body can still be edited directly. Components follow the traditional / standard / advanced visual style of the global, platform or account scope, and platforms without rich messages use the plain text form automatically. Formula editing is currently available for [command and persona texts](/en/manage/commands#formulas-in-texts).

### Reply list

| Column | Description |
|---|---|
| Match type | Keyword / prefix / regex / search |
| Match content | The trigger text |
| Reply content | The reply when matched |
| Priority | When several match, a larger number wins (default 100) |
| Status | Enabled / disabled switch |
| Actions | Edit / delete |

The search box at the top filters by match content or reply content.

### Adding / editing a reply

Click "Add reply" to open the editor:

Common trigger conditions and reply content are shown directly; on/off, probability, cooldown, daily limit, group / user restrictions and priority are under "Advanced options". On narrow screens they are collapsed by default, and on wide screens expanded and laid out in a grid; you can still toggle them by hand. When expanded, the editing area scrolls on its own, and the save / discard buttons stay at the bottom without covering the text.

- **Trigger conditions**: add several conditions and choose "All match (AND)" or "Any matches (OR)"; each condition's match type can be keyword / prefix / regex / search (message contains).
- **Reply content**: add several replies; when matched, **one is chosen at random by weight** and sent. Each has its own weight field (0–999999, default 1) and shows its actual draw probability; weight 0 means it is not drawn for now. For example, weights 3 and 1 correspond to 75% and 25%. At least one non-empty reply with a weight above 0 must remain. Old `::5::reply text` is converted automatically to weight 5 when old data is imported or read, so you no longer need to write the marker by hand; in the editor, reply text is saved exactly as written. Click "Insert image" to upload an image, which is saved as the platform-neutral code `[img,file=<local path>]` and converted automatically when sending according to ["Image sending" in system settings](/en/manage/settings); CQ codes / SealDice codes are also supported.
- **Variables**: `{nick}` nickname · `{user}` QQ · `{group}` group ID · `{roll:1d100}` roll · `{draw:deck}` draw from a deck · `{a|b|c}` pick one at random · with regex, `{$1}` is a capture group. For more variables, see [Keyword Replies](/en/use/reply).
- **Priority**: the order when several rules match at the same time.
- **Trigger probability**: decides whether the whole rule triggers, which is different from the weight that decides "which reply is chosen once matched". For example, with a rule trigger probability of 50% and a reply taking 25%, that reply's overall chance is 12.5%.

Old reply references are normalized when imported; ambiguous content is never replaced automatically. View or download the reference migration report in "System settings → Backup & restore", and add the `deck:` / `help:` / `text:` / `roll:` prefixes according to their purpose. See [reply template variables](/en/use/reply#dynamic-commands).

### Poke replies

Click the "Poke reply" button to the left of "Add broadcast". It is a single event trigger: it needs no keyword and doesn't take part in the priority ordering of keyword rules.

- It also supports several weighted replies, variables, images, trigger probability, cooldown, daily limit and group / user restrictions.
- It uses the global, adapter platform or specific bot account choice in the page header, so the scope is no longer chosen again in the dialog; without an override it inherits the parent setting, and a local setting can go back to inheriting.
- The old single reply and "mapped command" are kept; when the mapped command isn't empty, the command runs first, otherwise a random reply is sent.
- Poke replies respect the bot's global switch and the group's custom reply switch.

### Match testing

Enter text in "Match testing" below the list to see the candidate rules and the result in the context of the chosen platform or account; an account scope uses that account's platform, so you can't use another channel's result to judge whether the current account is configured correctly. Testing never sends messages to real groups.

### Trigger-based broadcasts

"Add broadcast" sets up a **trigger-based broadcast** (such as an event announcement):

- The broadcast is **never sent proactively to all groups** (to avoid account bans for sending too often). Instead, it is attached automatically after the reply the **next time any dice command is triggered** in each group, and sent only once per group.
- The buffer holds only one pending broadcast; adding / replacing overwrites the previous one and restarts the count, and you can revoke it at any time. The limit is 200 Chinese characters.
- While a broadcast is pending, a banner at the top of the page shows how many groups it has been pushed to.

## Causal Rules

A "condition → action" engine more powerful than custom replies. The visual editor lets you **start from a template** (good-morning greetings, daily check-ins, rate-limited card draws, song requests, personalized responses): pick one, then change the text.

- **When** (conditions, several with AND/OR): contains / exactly equals / starts with / regex match (capture groups can be used in replies as `{$1}`) / sender allowlist / sender blocklist / specific groups / counter condition.
- **Then** (actions, several): reply with a message (one of several lines at random) / add to or subtract from a counter / set a counter / reset a counter / call an API (store the response in a variable and reference it in replies as `{variable name}`; requires external requests to be enabled in system settings).
- **Advanced settings**: priority and cooldown seconds (per user / per group / global).
- **Try it**: enter a message to see in real time whether the rule would trigger and what it would reply.

The rule list supports search, on/off switches, editing and deleting.

## Counters

View, edit and reset the **persistent counters** of the causal rule engine (such as check-in counts). Counters are stored separately per user / per group / globally, and referenced in replies as `{counter:name}`.
