# Decks & Random Draws

Dice!Next is compatible with the original Dice! deck format, and gives the game master (KP) runtime temporary decks and inline randomness tools.

## Command Overview

| Command | Description |
|------|------|
| `.draw` / `.drawh` | Public draw / hidden draw from a deck |
| `.deck` | List decks / manage temporary decks / set the default deck |
| `.gacha` | Gacha draw (gacha decks) |

## Drawing `.draw`

```
.draw 塔罗牌        → draw one card from the "塔罗牌" (Tarot) deck
.draw3 塔罗牌       → draw 3 cards in a row
.draw              → draw from the group's default deck (set one with .deck set first)
.drawh 塔罗牌       → the result is sent privately to the drawer; the group only gets a hidden-draw receipt
```

### Inline randomness (handy during games)

No deck needed: separate the options with `/` to pick one at random:

```
.draw 红/蓝/绿      → pick one of the three (red / blue / green)
.draw3 左/中/右     → pick 3 times (left / center / right)
```

Handy when you want the dice to make a quick random decision on the spot.

## Temporary Decks `.deck new`

Anyone (including a KP without admin permission) can create temporary decks for the group, which is very useful during sessions:

```
.deck new 出招 石头/剪刀/布   → create the temporary deck "出招" (rock / paper / scissors)
.draw 出招                    → draw from the temporary deck
.deck del 出招                → delete the temporary deck
```

## Private Campaign Decks `.deck session`

First create a campaign with `.game new`; then the campaign's GM, group admins or the dice master can manage decks without replacement. The following describes the current main branch; check the source version of the Release you use to see whether your package includes the new entries:

```text
.deck session new 出场 甲/乙/丙       // create a private deck
.deck session from 敌人 公共敌人堆   // copy a public deck without changing the source
.deck session range 编号 1 20 2      // generate 1, 3, 5…19 from an integer range
.deck session members 抽签名单       // snapshot the group members cached by the current account
.deck session rest 出场              // show how many cards remain
.draw 出场                          // draw one card without replacement
.deck session reset 出场             // restore all cards
.deck session del 出场               // delete a private deck
.deck session clr                    // clear all private decks of this campaign
```

`::2::甲` means two copies of 甲; a session can have at most 10 private decks. Several groups connected to the same campaign share the card pool, and different campaigns don't affect each other. The remaining cards are saved permanently, and the drawn state from old saves is kept. Once a deck is empty it must be reset explicitly; it never refills or falls back to a public deck with the same name. If saving fails, no card is used up for that draw.

Draws look in this order: **private campaign decks → the group's temporary decks → public file decks**. The group's temporary decks still draw with replacement, and `.deck new/set/del/clr` keep their original meanings; campaign management uses the explicit `session` entry above. The three-argument Lua `drawDeck(gid, uid, name)` shares the campaign card pool, while the one-argument `drawDeck(name)` still only draws from public decks.

A number range takes a start, an end and an optional positive integer step; reversed start and end are swapped, a single number means from 0 to that number, and at most 10,000 cards are generated. Generating from group members requires the current adapter account to be online with a usable member cache; another bot is never used to fill in. With an empty cache, the bot asks the current account to refresh and tells you to retry, without creating an empty deck. After deduplication each person gets one card, and nicknames are stored as a snapshot that doesn't follow later renames. OneBot uses the existing member cache and name index directly, without fetching names one by one over the network. Generated cards are stored as literal text: `::count::` or `{template}` in a nickname are never executed, and forged CQ codes and paging control characters are neutralized. Both generation methods still follow the campaign, GM / group admin / dice master permissions and the existing protection against failed saves.

## Default Deck `.deck set`

```
.deck set 塔罗牌    → set as the group's default deck (group admin required); then just .draw
.deck default       → show the current default deck
.deck clr           → clear the default deck
```

## Deck Files

A deck is a JSON file (`{"deck name": ["card 1", "card 2", …]}`; one file can hold several decks), loaded from two directories:

| Directory | Purpose |
|------|------|
| `decks/` | Built-in / sample decks distributed with the package (replaced when upgrading) |
| `data/decks/` | Your own decks (uploaded or placed by hand; unaffected by upgrades) |

When decks share a name, the one in `data/decks/` wins. After placing files by hand, click "Reload" in the web panel or restart.

### Uploading and editing in the WebUI

On the "Decks" page of the [web panel](/en/manage/dashboard) you can:

- **Upload** `.json` decks or `.deck` packages in the SealDice layout; JSON is saved to `data/decks/`, images are filed into `data/images/deck/` by file name, and decks are reloaded;
- Pick a file on the left and see its deck entries on the right; pages can be chosen by clicking or by typing a page number.
- User files can be **edited online, downloaded or deleted**; built-in files are read-only, enforced by both the panel and the server, so they can't be overwritten or deleted directly. Even when the two sources have files with the same name, they are labeled separately and the wrong file is never read or written.
- Built-in files can be downloaded for safekeeping, and a single public, non-empty deck can be **copied into a user deck file** to edit. This keeps that entry's card text, but doesn't copy the whole collection, other sub-decks or the collection's metadata. References still depend on the original decks being loaded; if you need to distribute it on its own, check the dependencies separately.
- View deck metadata such as `_title` and `_author`;
- **Reload** all deck directories in one click (added, changed and deleted files are all picked up).

Editing an entry keeps the original weights, references, multi-line text and unknown extension fields, and switching away without saving asks for confirmation. The problem where reading an empty object caused "this deck can't be read" has been fixed; a real loading failure shows the error and lets you retry, instead of treating empty content as loaded.

### `.deck` packages {#deck-牌堆包}

"Download with resources" collects local images and the loaded cross-file deck dependencies whose sources can be located statically, and creates a `.deck` ZIP. Without local dependencies, it still downloads JSON.

The JSON and `assets/` sit directly at the package root; **don't wrap them in another folder**. Image references use `./assets/…`. Weights, escapes and nested `sample` are kept as-is; exporting never draws cards or runs templates or plugins. Next-specific text syntax is not guaranteed to mean the same thing in other engines.

Remote images are not downloaded automatically; missing local dependencies produce a clear error instead of an incomplete package. Dynamically built deck names or image paths can't all be collected, so check them yourself.

Importing validates the package content first, then asks before overwriting. Images for each JSON deck go together into `data/images/deck/<that file name>/`, keeping subdirectories. Bundled images that aren't referenced statically go to the first deck, with a warning. Packages can't contain scripts, out-of-bounds paths, symbolic links, encrypted content or files whose names differ only in case.

An uploaded package can be at most 128 MiB, with each file at most 128 MiB; extracted and filed images at most 512 MiB / 10,000 files; and at most 100 JSON decks. Split anything larger.

To organize or reference images on their own, use [Files](/en/manage/files).

The `.deck` chat list hides metadata keys starting with `_` by default (you can turn this off in [Settings](/en/manage/settings)).

### Compatibility with old decks

- The following **original Dice! deck syntax** is supported: sub-deck references `{deck}` (without replacement), `{%deck}` (with replacement), dice expressions `[1d6]`, weights `::N::card`, and escapes `\{` `\[`.
- When upgrading from the original Dice! with [Data Migration](/en/guide/migration), external decks in the `PublicDeck/` directory are validated and imported into `data/decks/` automatically.
- Deck files must be **UTF-8 encoded** JSON; convert old GBK-encoded files to UTF-8 before adding them. Chinese file names are fine.

Cards can nest [safe text functions](/en/develop/lua-mod#safe-text-functions) such as `sample / case / grade / ran / len / expired / var / at / print / wait`, and support explicit calculations such as `[1d{ran:6~6}]`; variables follow the current message context. Only the chosen branch draws cards, rolls dice or registers waits; local variables and sub-deck pools without replacement are reused within one expansion, and one rendering pass uses a single snapshot of the deck directory.

Existing images / CQ codes, weights and the `\{` / `\[` escapes keep working. Nicknames, captured text and other runtime fields are never parsed again, even if they contain `{deck}`, `[1d100]` or `{wait:1000}`. Snapshot cards generated from members are still shown completely literally, and code in member nicknames is never executed because of the new template capabilities.

::: tip Referencing help entries in decks
If a `{reference}` in a card isn't a deck name, the bot tries a **help entry** with the same name and expands its content (the reference semantics of 溯洄 / OneDice), so you can combine decks with help documents to build complex draw structures. See [Help & Language](/en/use/help).
:::
