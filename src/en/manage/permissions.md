# Permissions

**Web panel → Data → Permissions** manages user trust levels, allowlisted groups, bot detection and the blacklist, in three tabs.

## The Trust Level Ladder

DiceNext ports the original Dice!'s nTrust system, and every permission gate is based on it:

| Level | Meaning |
|------|------|
| 0 | Ordinary user |
| 1–3 | Trusted tier (trusted users who can manage group settings remotely) |
| 4 | Admin (can use `.trust` / `.admin` / global operations; not affected by globally disabled commands) |
| 255 | The bot itself (reserved internal value) |
| 256 | Dice master (Master), the highest permission |

The matching chat commands are `.trust <@someone/QQ number> [level 0-255]` (omit the level to query; available to admins ≥4, who can only set levels below their own), and `.admin add/del <@someone/QQ number>` and `.admin list` (dice master only). See [Admin commands](/en/use/admin).

## Permission Management

### User trust levels

The list only shows users with permissions (trust level > 0 or dice master), with QQ avatars, search and paging (20 per page by default, adjustable). The dropdown on each row switches the level directly: Ordinary / Trust 1–3 / Admin / **Dice master**. "Dice master" is one of the selectable levels: choosing it adds the user to the dice master list, and switching to another level removes them.

The "Add permission" dialog works by **search and add**: first choose the platform (QQ; Discord isn't selectable yet), enter a QQ number or search existing users, then choose the permission level. A profile is created automatically once a user has used a command, after which they can be found.

### Allowlisted groups

Users don't need an allowlist: reaching a trust level means they are trusted. Only **groups** need to be added to the allowlist separately. Enter the group ID (optionally with a reason) to add it.

**Allowlist-only mode** switch: when on, only allowlisted groups get responses, and all other groups are ignored.

## Bot List

Recognizes other dice bots in groups to avoid triggering each other:

- **Automatic detection**: registers bots automatically from the fixed-format `.bot` replies of each bot family (Dice! / Dice!Next / OlivaDice / SealDice are supported), recording the QQ number, bot family and detection time.
- **Manual registration**: enter the QQ number and bot family name to add one.
- **@ silence**: when a user sends "@another bot + command", this bot stays silent instead of treating it as rolling on someone's behalf.

## Blacklist

Blacklisted users / groups get no response to any command (blacklisted groups are also left automatically; see the notification event "Automatic leave from blacklisted group").

- The "Add to blacklist" dialog: choose the platform, the target type (user / group), enter the ID (suggestions come from existing players / groups) and a reason.
- The list shows avatars, target type labels, reasons and times added, with search by QQ / group ID / reason and paging.

::: tip Migrating old data
The original Dice!'s `BlackList.json` can be migrated in one step through "System settings → Import legacy data"; see [Data Migration](/en/guide/migration).
:::

## Cloud Blacklist

The cloud blacklist switch, service address, token, automatic reporting, danger level and sync interval are now all in [System settings → Cloud services](/en/manage/cloud-services#cloud-blacklist). This page keeps local blacklist management, cloud source labels and a link to Cloud services.

Cloud records that pass verification and meet the danger level threshold are merged into the local blacklist; revoking in the cloud only removes the corresponding cloud source record and never deletes local entries the dice master added independently. Blacklisted users can log in to the [cloud blacklist site](https://cloudban.dice.zone) to submit an appeal.
