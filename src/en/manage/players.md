# Players

**Web panel → Data → Players** shows the profiles of every player who has interacted with the bot.

## Where Profiles Come From

A player profile is **created automatically** the first time someone interacts with the bot; you never need to add them by hand.

## List Columns

| Column | Description |
|----|------|
| Nickname | The most recent display name (with the QQ avatar); click to open the details |
| QQ number | Platform account |
| Trust level | Adjust directly from the dropdown (see below) |
| Affection | Current affection value, editable inline |
| Commands | Total number of commands triggered |
| Last command | When they last used a command |

By default the player list is on the left and the selected player's details are on the right; the old table page is no longer a separate display mode. The toolbar sorts by nickname, account, trust, affection, command count and last command time, in ascending or descending order, and sorts by trust level by default. Platform filtering, search and choosing or typing a page number are supported.

## Trust Levels

The dropdown offers: Ordinary (0), Trust levels 1–3, Admin (4) and **Dice master**.

- 0 = ordinary; 1–3 = trusted (can manage group settings remotely); 4 = admin (can use `.trust` / `.admin` and global operations); dice master = the highest permission.
- Choosing "Dice master" adds the account to the Master list (in sync with the Master card in [Settings](/en/manage/settings)); switching from dice master to another level removes it from the list.
- The matching chat commands are `.trust <QQ> <level>` / `.admin add`; trust values of 5 and above imported from the old version are displayed correctly too.
- Trust levels affect command permissions (for example, globally disabled commands don't apply to trust 4+).

## Actions

- **Search**: filter by nickname / QQ.
- **Edit trust / affection**: change them in the selected player's details area.
- **Delete record**: remove a player's profile.
- **Delete friend**: remove the friend relationship through the adapter (unavailable when the two aren't friends).

## Player Details

Click a player on the left to see their data in tabs on the right. Saving, deleting and friend actions all apply to the current selection, and you are warned about unsaved changes before switching players, changing filters or leaving the page:

| Section | Content |
|------|------|
| Personal info | Nickname, trust, affection and the groups the player has appeared in |
| Character sheets | All sheets and attributes, marking the default sheet and the binding in each group; you can **copy .st** (generate the recording command in one click), edit attributes one by one and delete sheets |
| Settings | The player's settings (global / per group) |
| Plugin data | Player variables and sheet data stored by Lua mods |
| Chat simulator | View the player's private chat history and send messages |

Changes that support batch saving are submitted with **"Save all changes"** after editing (with counts of successes / failures); some immediate actions run when you press their buttons. The list stays on the left, so you don't have to go back a level to choose another player.

## QQ Official User Avatars

The list, cards and details all use the avatar returned and cached from the platform. When there is no avatar field, a QQ app avatar address is generated from the bound AppID and the user's OpenID. Caches for different AppIDs are kept separate and survive restarts. When an address stops working, a user icon is shown instead; the OpenID is never treated as a QQ number, and avatars are never used to judge a user's identity.
