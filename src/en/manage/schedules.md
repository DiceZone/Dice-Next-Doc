# Scheduled Tasks

**Web panel → System settings → Scheduled tasks** sets up daily messages pushed to groups / private chats at set times (good-morning greetings, session reminders, event announcements). You can also add **trigger conditions**, **plugin commands** and **leave actions** for cause-and-effect automation (such as calling DailyNews on a schedule, or "leave if nobody has used the bot for 7 days").

## Creating a Task

The main page shows a search box, an "Add" button and the existing tasks by default. Click "Add" to open the configuration dialog; editing a task also happens in the dialog, so the full form no longer sits above the list permanently.

| Field | Description |
|------|------|
| Name | A note naming the task |
| Time | Daily trigger time (hour:minute) |
| Target type | Group / private chat |
| Target ID | Group ID / QQ number |
| Days | Choose any of Monday–Sunday; none selected = every day |
| Action | **Send message** / **Run plugin command** / **Leave group** |
| Trigger condition | Empty = trigger on time unconditionally; `inactive>=7` means trigger only when the group has had no commands for ≥7 days. `>=` `>` `<=` `<` `==` are supported |
| Content / plugin command / farewell | For the send action, the text to push; for the plugin action, the full trigger command; for the leave action, an optional farewell before leaving |

Content supports variables and function rendering: `{self}`, `{group}`, `{date}`, `{roll:1d100}` (roll dice), `{draw:deck}` (draw from a deck) and so on.

::: tip Cause-and-effect example: leaving inactive groups automatically
Choose "Leave group" as the action and `inactive>=7` as the condition. This means "check at the set time; if nobody in the group has used a command for 7 days or more, send the farewell and leave"; if someone has used a command, that day is skipped.
:::

## Running Plugin Commands

After choosing "Run plugin command" as the action, enter the full command the plugin normally receives in chat, for example:

```text
.dailynews
.专长 星质形 ASTRAL_AQUAN
求签 月老
```

At the scheduled time, the enabled **SealDice JS plugin or Dice! Lua plugin** is called in the context of the chosen account and group / private chat, and whatever the plugin returns is sent to the target. "Run now" is also available for testing.

This action uses a dedicated low-privilege virtual message that only reaches the JS / Lua plugin command layer and never runs Dice!Next built-in admin commands such as `.admin`. If the plugin is disabled in the target group, it doesn't run either.

### Adding a task for the current group from chat

The dice master can also create plugin command scheduled tasks directly in the target group or private chat:

```text
.admin clock + 本群早报 07:30 .dailynews
.admin clock + 本群求签 08:00 求签 月老
.admin clock list
.admin clock - 本群早报
```

Tasks created by command record the current bot account, platform and group / private chat target, and appear immediately in the panel's scheduled task list. They are the same as "Run plugin command" tasks created on the web page: you can edit the time, days, trigger, target and command, and enable, disable, run now or delete them. Adding the same name again in the same chat updates the existing task instead of creating a duplicate.

The original compact form also works, for example `.admin clock+本群早报=7:30 .dailynews`. Only the dice master can add or delete tasks with `.admin clock`; scheduled runs still use the low-privilege plugin context.

## Behavior

- A task runs once when the set time is reached, it hasn't fired yet that day, the day of the week matches and the trigger condition is met.
- **One target per task, no mass broadcasts**: it only affects the target you specified, avoiding spam and account ban risks.

## Management

- Use the switch in the list to **enable / disable** a task at any time, or **delete** it.
- Click the edit icon to **edit** an existing task (the form is pre-filled; save when done).
- Check several tasks to **enable / disable / delete in bulk**. Bulk deletion requires confirmation; actions run one by one, and when some fail, the failed items are kept for retrying rather than claiming everything succeeded. The actions available for old Lua plugin tasks are still limited by their task type.

## Scheduled Tasks of Old Dice! Lua Plugins

After a single-file Lua plugin registers a scheduled entry with `task_call['task name'] = 'global function name'`, the dice master can configure it directly in chat:

```text
.admin clock + task-name 07:30
.admin clock list
.admin clock - task-name
```

These tasks also appear in the list on this page, with the action labeled "Lua plugin task"; they can be disabled, run immediately or deleted. Both `7:30` and `07:30` are accepted. The target of these tasks is decided by `sendMsg` inside the plugin function, so the target and content editing form of ordinary tasks isn't offered. Only the dice master can run `.admin clock`.

The `.admin notice group/QQ … +8` subscriptions and `.send notice 8 …` pushes used by old plugins such as DailyNews are connected automatically to this project's unified notification windows, without modifying each plugin's source.

::: tip Clocking in and out
Want a "morning greeting + good night"? Just create two tasks (for example one at 09:00 and one at 23:00).
:::
