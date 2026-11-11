# Campaign Management (.game)

`.game` is the campaign system ported from the original Dice!: "open a game" in a group to create a game area, manage the GM and player lists and campaign variables, and use roulette dice to prevent reroll fishing. All campaign commands only work in **group chats**.

## Command Overview

| Command | Description |
|------|------|
| `.game new [name]` | Open a game (group admin required; whoever opens it becomes GM automatically) |
| `.game join` / `.game exit` | A player joins / leaves the table |
| `.game master` | Become a GM, or (if already a GM) list the GMs |
| `.game state` | Show the game state (GMs / players / campaign variables) |
| `.game set <variable> <value>` | Set a campaign variable (GM) |
| `.game call` | @mention all players for a roll call (GM) |
| `.game kick <QQ>` | Remove a player from the table (GM) |
| `.game close` / `.game open` | Temporarily close / reopen the game area |
| `.game over` | End the game (clears all campaign data) |
| `.game rou sides[*copies]` | Turn on roulette dice (GM); also `rou hist/reset/clr` |

`.game` without arguments shows the help.

## Opening a Game and the Lists

```
.game new 迷雾之城     → open a game (a name is generated if you leave it out)
.game join             → a player signs up at the table
.game master           → ask to become GM / show the GM list
.game state            → overview of the game state
.game kick 10001       → the GM removes someone from the table
.game exit             → leave yourself (GMs also use this)
```

- Opening a game requires **group admin permission**; opening a new game clears the group's old game data.
- Adding GMs beyond the first requires confirmation from the group owner / an admin / the dice master (reproducing the original permission rules).

## Campaign Variables

The GM can record any key-value pairs for the campaign (such as chapter, weather or timeline):

```
.game set 章节 第三章   → set a campaign variable (also .game set 章节=第三章) (章节 = chapter, 第三章 = chapter 3)
.game set 章节          → show one variable
.game state             → the game state lists all variables
```

Campaign variables are shared with `msg.game` / GameTable data in Lua mods, so mods can read and write the same campaign data directly.

## Closing and Ending

```
.game close            → temporarily close the game area (lists and variables are kept)
.game open             → reopen it
.game over             → end the game and clear all campaign data
```

If a [session log](/en/use/log) is still running in the group, `.game over` reminds you to stop recording with `.log end`.

## Roulette Dice `.game rou`

Roulette dice prevent "rerolling for good numbers": after the GM turns them on for a number of sides, single-die `1dN` / `dN` rolls in the group become **draws from a bag without replacement**. One (or more) of each of 1..N go into the bag, each draw removes one, and the bag refills automatically when empty.

```
.game rou 20           → turn on roulette dice for d20 (one each of 1~20 in the bag)
.game rou 6*3          → turn on for d6, three each of 1~6 (sides × copies at most 100)
.game rou hist         → show the numbers drawn this round
.game rou reset        → restore the bag (clear the draw record and refill it)
.game rou clr          → remove roulette dice and go back to normal rolls
```

Turning on / restoring / removing all require the GM. The roulette only intercepts **single-die, single-round** `1dN` rolls; other expressions are unaffected. While the game area is closed (`.game close`), the roulette is paused too.
