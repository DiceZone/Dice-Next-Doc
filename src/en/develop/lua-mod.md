# Lua Mod Reference

Dice!Next keeps compatibility with the original Dice!'s Lua mods and single-file plugins. The local implementation of 2026-10-15 extends TOML, conditions, events, nested mods and safe numeric templates; it hasn't shipped with an installer of this round yet. Part of the community corpus has been verified, but that doesn't imply any old mod works completely; check the boundaries at the end of this page and the version you use before porting.

::: tip Use JS for new plugins
The Lua system is positioned to **carry over the original ecosystem**. For writing new plugins from scratch, [JS plugins](/en/develop/plugin-quickstart) are recommended: the API is more modern, and integration with the panel (settings, storage management, etc.) is more complete.
:::

## Three Forms of a Mod

| Form | Location | Description |
| --- | --- | --- |
| Descriptor + directory (the original standard form) | `data/mod/<name>.json` + `data/mod/<name>/` | Come in pairs; `<name>.json` is the registration file (metadata + helpdoc + speech), and the directory holds resources |
| Descriptor only | `data/mod/<name>.json` | Lookup mods (pure helpdoc packs such as COC skill lookups) have only one json |
| Single-file plugin | `data/plugin/<name>.lua` | `msg_order` prefix command plugin |

**Uploading**: "Plugins" in the admin panel → "Upload plugin", supporting `.lua`, `.json` and `.zip`. Zips are extracted and placed automatically: json+directory pairs, whole-library archives with several mods, and rule-type packs containing only `model/`/`rulebook/` are all recognized. **Disabling / deleting** is managed in the panel: disabling renames with a `.disabled` suffix (the json and directory are handled as a pair), and deleting removes both the descriptor and the directory.

## Descriptor (`<name>.json` / `descriptor.json`)

```json
{
  "mod": "好感度",
  "author": "Author",
  "ver": "1.0",
  "brief": "One-line summary",
  "helpdoc": { "好感": "View the current affection…", "好感排行": "&好感" },
  "speech": { "自称": "骰娘" }
}
```

| Field | Description |
| --- | --- |
| `mod` or `title` | Display name |
| `author` / `ver` (or `version`) / `brief` | Metadata |
| `helpdoc` | Entry table; topics ignore ASCII case; connected to `.help` lookups, and `&topic` can redirect across mods and through several levels |
| `speech` | Template entries (for `{key}` expansion); text or an array of texts chosen uniformly at random; keys ignore ASCII case |

Parsing tolerates trailing commas and comments (common in real community mods).

## Resource Directory Semantics

| Subdirectory | Content | Description |
| --- | --- | --- |
| `reply/*.lua` / `reply/*.toml` | `msg_reply` / TOML reply rules | Keyword-triggered reply logic (see below); TOML supports multi-line strings, quoted keys, inline tables and more, but actions are still subject to the safety boundaries |
| `script/*.lua` | Function scripts | Called by `loadLua()` and `echo={lua=...}` |
| `speech/*.yaml` | Template entries | Flat text or text arrays, merged into the global templates; keys ignore ASCII case |
| `model/*.xml` | Attribute templates | COC7.xml etc.; mods containing this directory are treated as "rule-type" and shown on the Rules page |
| `rulebook/*.yaml` | Rule books | Current-rule priority, parent rule inheritance, topic lookup and controlled tape |
| `event/*.lua` | Scheduled / event declarations | cycle, server time zone clock, and safe lifecycle / message hooks |

Resources can be layered. Nested mods use `parent.child` management IDs, and children don't run when the parent is disabled; directories and single-file plugins with the same name use separate IDs so management operations don't point at the wrong file. Loading keeps the order of `mod_order.json`; scripts are registered by namespace and later loads override earlier ones. Only resources are registered; Lua in resource directories isn't all run automatically. Symbolic links, Windows junctions and path traversal aren't allowed.

Script names ignore ASCII case: for example `loadLua('Tools.Ping')` and `loadLua('tools.ping')` look up the same global script, and the mod loaded later wins. `script/Tools/init.lua` can be called with `loadLua('Tools')`, and Next's explicit `Tools.init` form is kept; this doesn't allow absolute paths or `..`.

## msg_reply Causal Rules (reply/*.lua)

Each file runs in a clean global `msg_reply` table, and the rules in it are enumerated afterwards:

```lua
msg_reply['好感'] = {
  keyword = { match = { '{自称}好感' } },   -- prefix / search also work
  limit = { cd = 10, user_var = { trust = { at_least = 0 } } },
  echo = function(msg)
    local favor = getUserConf(msg.uid, '&favor', 0)
    return 'Current affection: ' .. favor
  end,
}
```

| Field | Description |
| --- | --- |
| `keyword.match` | Triggers only on exact equality (string or array; `{template}` expansion happens first, so `{自称}好感` works) |
| `keyword.prefix` | Prefix match; the remaining text goes into `msg.suffix` |
| `keyword.search` | Matches if contained |
| `keyword.regex` | Time-limited ECMAScript `i` whole-string match, keeping the old 400-byte input limit; non-`u` mode counts UTF-16 units |
| `limit.cd` | Cooldown seconds; `{user=10, grp=30}` sets them separately |
| `limit.user_var.trust.at_least` | Trust level threshold |
| `limit.grp_id` / `limit.user_id` | ID / ID list; `{nor={...}}` excludes the given IDs; group ID `0` means private chat; an empty list doesn't restrict |
| `limit.prob` | Trigger probability in percent; 0 keeps the old "no extra restriction" meaning |
| `limit.today` | Daily limit, with the day changing in the server's time zone; supports shared names and user / chat / global scopes |
| `limit.lock` | Bounded, non-blocking synchronization lock; supports shared names and scopes; the lock is held while Lua is paused |
| `limit.self_var` / `limit.user_var` / `limit.grp_var` | Truthiness or comparison conditions on bot, user or group variables |
| `limit.dicemaid` | ignore / only / off, judged by the host's bot list without trusting identities forged in messages |
| `echo` | A function, static text, an array of text candidates or `{lua="script name / inline Lua"}`; old JS / Python isn't executed |

A rule is collected only if it has `echo` and at least one kind of `keyword`. The reply text gets another template expansion: fields written into the `msg` table in `echo` (such as `msg.favor = 5`) can be referenced in the reply as `{favor}`.

### TOML, Conditions and Priority

`reply/*.toml` is parsed with toml++, supporting multi-line strings, quoted keys, complex tables, inline tables and arrays. Replies support Match / Prefix / Search / Regex, `rule` / `type="Game"`, static text, Lua and text candidates; candidates can use `::weight::` and still nest `{sample:A|B}`. Empty replies, side-effect-only replies and paused waits also count as handled and don't trigger AI or other fallback replies.

Conditions support truthiness, equal, neq, at_least, at_most, more, less, plus the lists / probability / counters / locks in the table above. Several comparison conditions must all be met. Scalar cooldowns are counted per chat window, and shared counters can specify scope and name explicitly. Table declarations and the old text form `limit="prob:50;grp_id:!0;cd:10"` are both accepted. Unknown or invalid conditions are logged as diagnostics and the whole rule is skipped; they don't become unconditional allows.

Directory mods are selected in the order "active game rule → Match → longest Prefix → Search → Regex"; directories at the same level override by load order. ASCII case of keywords is compatible with the old version; single-file plugins keep their original matching habits. One message selects one reply; the old behavior of several Regex rules speaking in a row isn't copied.

### Scheduling and Safe Events

`trigger.cycle` in `event/*.lua` supports 1 second to 7 days, in units of second / minute / hour / day; it runs once right after all mods load and is then rescheduled. `trigger.clock` supports `{hour=4, minute=0}` or a list of such tables, uses the server's time zone and doesn't make up missed days.

Available hooks: `StartUp`, `DayEnd`, `DayNew`, `Message`, `FriendRequest`, `FriendAdd`, `GroupRequest`, `GroupAdd`, `GroupWelcome`, `GroupDecrease`, `GroupRecall`, `GroupUpload`, `Poke`, `LogEnd`. Whether a notification arrives still depends on whether the adapter provides that inbound event. `StartUp` only fires when the host starts, not on reload; day boundary events run when the server date changes.

Request hooks can refuse but can't approve past the host's policy; a hook failure leaves the request pending. Messages and tape respect blacklists, disabling, content blocking and per-group plugin switches, and credential / recovery admin commands aren't swallowed. `LogEnd` only provides a controlled log path and default upload control, and doesn't restore arbitrary file publishing. Hooks that would override authorization, censorship or cloud blacklist policies aren't executed.

`LogEnd` is called after `.log end` or `.game over` has closed the log and settled. It can read `log_file` (the actual export file name), `log_path` (absolute path), `log_id`, `log_name`, `log_count`, and uid / gid / fromUser / fromQQ / fromGroup / platform / adapterId / selfId / msgid / time; the file name isn't the display title the user can type, and the default export doesn't publish local images. When the game-end hook runs, the original game has already been cleaned up, and no modifiable old Session object is kept.

cycle, clock and startup / day boundary actions can pause and resume with `sleepTime`; message, approval, notification and tape hooks that need immediate results run synchronously, and `sleepTime` can't delay host decisions. In calls that can't be suspended, it returns immediately without blocking the message thread.

Event actions can be Lua functions, script names or inline Lua; unsupported mixed actions / trigger conditions are reported as a whole, and only the supported half isn't run. Callbacks and lock queues have count limits, and reload / destruction cancels old tasks. The triggering platform and account are kept across delays; when the original account is offline, another account isn't used to send.

Temporary global variables of directory files / inline text scripts are isolated per execution, and delayed resumption keeps that execution's environment; sub-scripts of `loadLua` share that execution's variables with the entry. After `eventMsg` triggers other commands in a nested way, the outer message is restored, and the outer reply doesn't borrow the inner nickname, user ID or variables. Data that must persist across messages should use the configuration or character sheet APIs instead of relying on global variables left over from the previous script run. Registered Lua functions keep Next's existing closure capability; this isn't a complete independent LuaState or a security sandbox for arbitrary code.

### XML Models and Rule Books

XML supports attribute aliases, CDATA, basic entities and read-only numeric formulas, including arithmetic, comparison, short-circuiting, ternaries, attribute defaults and allowlisted functions such as floor / ceil / round / min / max. For example, `Math.floor(this.力量/2)` can be converted, but script blocks, assignments, dynamic calls and arbitrary JavaScript aren't executed. Attributes that can't be converted show compatibility diagnostics; mod order, enabling / disabling and reloading refresh the templates, and the priority of native rule packs doesn't change.

Rule books support current-rule priority, parent rule inheritance and named topic lookups; tape only runs when the active game, participants and per-group switches allow it.

## msg_order Single-File Plugins (data/plugin/*.lua)

```lua
msg_order['选择'] = 'choose'

function choose(msg)
  local opts = {}
  for w in msg.suffix:gmatch('[^%s]+') do opts[#opts+1] = w end
  return 'The choice is: ' .. opts[ranint(1, #opts)]
end
```

`msg_order[trigger word] = "global function name"`; trigger words are matched by length in descending order (longer words first). The function receives the `msg` table, and the first return value becomes the reply.

When a plugin calls `sleepTime(ms)`, Dice!Next pauses the current Lua processing and returns the message thread, then continues from the same place when the time is up; so segmented delayed replies in old plugins no longer block receiving messages. Plugin reloads cancel old coroutines that haven't resumed yet, so unloaded code doesn't run.

Old single-file plugins can still read resources next to the entry script through io.open. If a generated cache shipped with a plugin still stores old absolute paths from the author's computer, after the first open fails Dice!Next remaps only the plugin/… tail without path traversal to the current data/plugin directory; the file audit log also normalizes mixed UTF-8 / CP936 paths, and invalid encodings no longer make the host process exit.

### task_call Scheduled Entries

Old single-file plugins can register global functions that the dice master triggers on a schedule:

```lua
task_call = task_call or {}
task_call['dailynews'] = 'sendDailyNews'

function sendDailyNews()
  -- fetch news, organize the content and proactively sendMsg(...)
end
```

After registration, the dice master manages the daily run time in chat:

```text
.admin clock + dailynews 07:30
.admin clock list
.admin clock - dailynews
```

Tasks reuse the system timer persistence and appear in the "Scheduled tasks" list of the admin panel, where they can be disabled, run immediately or deleted. Times accept both `7:30`, common in old plugin docs, and standard `07:30`, and are normalized to two-digit hours when saved. `task_call` tasks have no fixed group / user target; the plugin function decides where to send through `sendMsg`.

The original no-space form `.admin clock+dailynews=7:30` is also accepted. To call an ordinary plugin command on a schedule in the current group / private chat, use `.admin clock + 本群早报 07:30 .dailynews` (`本群早报` is the task name); this creates a standard "run plugin command" task scoped to the current account and window, which can be fully edited in the WebUI.

The `eventMsg(".admin notice group/QQ … +8")` and `eventMsg(".send notice 8 …")` used by plugins like DailyNews are mapped to Dice!Next's unified notification windows; this internal bridge only recognizes those two kinds of old notification commands and doesn't grant Lua `eventMsg` any other dice master admin permission.

### Old Self-Mute Calls in Roulette Plugins

Old roulette and similar plugins often use this form (`minutes` is an integer, not seconds):

```lua
eventMsg(".group " .. msg.fromGroup .. " ban " .. msg.fromQQ .. " 1", 0, getDiceQQ())
```

Next provides controlled compatibility for such calls: only self-mutes of the current source account, current group and current triggering user are allowed, for 0–43200 minutes (0 lifts the mute). The bot must be confirmed to have admin permission in the group; the group owner and group admins can't be muted. Group disabling, blacklists, global silence and per-group plugin switches still apply; when the permission cache isn't ready, only a refresh is requested and the reason logged.

The old highest trust level for arbitrary virtual messages isn't restored: crossing groups, changing the target user, or continuing to borrow permission through virtual messages and their delayed resumption are all refused; virtual commands from the WebUI playground and scheduled tasks can't borrow permission either. This compatibility bridge isn't a general `.group ban` admin entry and doesn't support duration expressions. Other `eventMsg` calls still go through normal command permissions.

When the bot itself is the virtual private-chat user, the command only runs without sending a receipt; ordinary group chats / user private chats still reply normally. OneBot fills in the current account identity from the `self_id` of valid events; missing / zero values don't overwrite a known identity, and invalid targets aren't submitted to the platform. Existing plugins don't need to change this line.

## The msg Object

The `msg` received by `echo` functions and `msg_order` functions:

| Member | Description |
| --- | --- |
| `msg.uid` / `msg.gid` | Sender / group ID; usually numbers on QQ, possibly strings on other platforms; gid is 0 in private chats |
| `msg.platform` | Current message platform (such as `onebot_v11`, `qq_official`, `discord`, `kook`) |
| `msg.nick` | The sender's QQ nickname (the group card name doesn't override it) |
| `msg.card` | **Current group card name**; `""` when unset or in private chats |
| `msg.fromMsg` | The full message; `msg.suffix` is the remaining text of a prefix trigger |
| `msg:echo(text)` | Send a message proactively after template expansion |
| `msg:format(text)` | Only do template expansion |
| `msg:get(key, def)` / `msg:inc(key, n)` | Read / increment a variable of this message |
| `msg.char` / `msg.pc` | The sender's character sheet (Actor object) |
| `msg.user` / `msg.grp` | User / group configuration proxy (reads and writes are saved) |
| `msg.game` | Game object (available after `.game new`; `msg.game:message(text)` broadcasts) |
| `msg.at` | `[CQ:at,qq=sender]` text |

```lua
-- The current sender's group card name; falls back to the QQ nickname when absent
local displayName = msg.card ~= '' and msg.card or msg.nick

-- An attribute on the sheet bound in the current group. The fifth argument false forces gid to be treated as a group scope,
-- which is required for non-numeric group IDs such as Discord, KOOK and the QQ Official bot.
local skill = getPlayerCardAttr(msg.uid, msg.gid, '侦查', -1, false)
```

## Global Function Reference

**Basics**

| Function | Description |
| --- | --- |
| `log(...)` / `print(...)` | Written to the `[插件]` (plugin) log at INFO, marking the current plugin source; old usage stays compatible |
| `logTrace/logDebug/logInfo/logSuccess/logWarn/logError(...)` | Write the runtime log at the given level; the default INFO hides TRACE/DEBUG; delayed and scheduled entries keep their source |
| `ranint(a?, b?)` | Random integer in a closed interval; `ranint()` defaults to 1–100; a and b are swapped automatically when a>b |
| `getDiceDir()` | Absolute path of the data directory (`data`) |
| `getDiceQQ()` | The currently triggering account; delayed / event resumption keeps the account. Empty when a known account identity is missing, without borrowing another account; the global configuration is used only when there's no account context |
| `mkDirs(path)` | Create a directory |
| `sleepTime(ms)` | Non-blocking wait during `msg_order` message processing; the coroutine resumes when the time is up without holding the message thread |

**Configuration storage** (persisted in `data/lua_mod.db`)

| Function | Description |
| --- | --- |
| `getUserConf(uid, key, default)` / `setUserConf(uid, key, val)` | User level; passing `nil` as `uid` returns a `{uid→value}` table of all users (for rankings); `val=nil` deletes |
| `getGroupConf(gid, key, default)` / `setGroupConf(gid, key, val)` | Group level |
| `getUserToday(uid, key, default)` / `setUserToday(uid, key, val)` | Today's data (isolated per day; returns 0 when missing) |

Keys starting with `&` are first resolved through speech entries into the actual field name (an original-version idiom).

**Affection** (the same data as the built-in `.favor`)

| Function | Description |
| --- | --- |
| `getFavor(uid, platform?)` | Read the affection; returns `0` when there's no record yet. platform can be omitted during message processing. |
| `setFavor(uid, value, platform?)` | Overwrite the affection and return the written value. |
| `addFavor(uid, delta, platform?)` | Increase or decrease the affection and return the new value. |
| `growFavor(uid, platform?)` | Grow according to the built-in probability rules, returning `success, delta, value`; delta is `0` when it doesn't grow. |

```lua
local before = getFavor(msg.uid)
local after = addFavor(msg.uid, 5)
local success, delta, value = growFavor(msg.uid)
```

`msg_order`, `reply echo` and their `loadLua()` call chains inherit `msg.platform` automatically. When called during plugin loading or other code detached from a message, platform must be passed explicitly; when the platform or uid is missing they return `nil` (`growFavor` returns `false, 0, 0`) and nothing is written.

**Character sheets** (the same sheet as `.st`)

| Function | Description |
| --- | --- |
| `getPlayerCard(uid, scope)` | Returns an Actor object: `pc.hp` reads and writes directly, `pc:set{...}` in bulk, `pc:rollDice(exp)`, `pc:lock('w'/'r')` / `pc:unlock` |
| `getPlayerCardAttr(uid, scope, attr, default?, byName?)` | Read an attribute; returns default when missing (`nil` if not given). A numeric / `nil` `scope` is a group scope, and a string is treated as a sheet name by default; `byName=false` forces reading by group, suitable for non-numeric group IDs |
| `setPlayerCardAttr(uid, scope, attr, val, byName?)` | Write an attribute; deletes it when val is `nil` |
| `lockPlayerCard(uid, scope, key, byName?)` / `unlockPlayerCard(...)` | Lock / unlock sheet attributes; `key='w'` locks `.st` writes, `key='r'` locks `.st show` reads |
| `isPlayerCardLocked(uid, scope, key, byName?)` | Returns a boolean |

**Actions**

| Function | Description |
| --- | --- |
| `sendMsg(text, gid, uid)` | Send a message proactively (empty gid = private chat) |
| `eventMsg(text, gid, uid)` | Run the text through the full command pipeline as if sent by someone (such as `eventMsg('.rd100', msg.gid, msg.uid)`) |
| `drawDeck(gid, uid, deck name)` | Draws from the current group Session's private deck first (without replacement), and only from the public deck when there's no private deck with that name |
| `loadLua(name)` | Directory mods run `script/<name>.lua` first; old single-file plugins also support subdirectories next to the entry script (with `a.b` dotted paths) |
| `askExtra(table)` | Platform extension query (passed through to the adapter, such as OneBot actions) |

Under OneBot v11, text sent with `sendMsg` or returned directly by event hooks can contain CQ music codes; Dice!Next converts them into music card segments instead of showing the raw CQ code. Platform tracks and custom music cards are supported, for example:

```lua
sendMsg('[CQ:music,type=qq,id=SONG_ID]', msg.gid, msg.uid)
sendMsg('[CQ:music,type=custom,url=LINK,audio=AUDIO_URL,title=TITLE,content=SUMMARY,image=COVER_URL]', msg.gid, msg.uid)
```

**Built-in libraries**

| Library | Description |
| --- | --- |
| `http.get(url)` → `ok, body`; `http.post(url, body, headers)` | Public HTTP(S) is allowed by default, and private network / loopback / dangerous URLs are always blocked; strict mode additionally requires the external API switch and allowlist; `http.urlEncode/urlDecode` |
| `json.encode/decode`, `yaml.parse/dump` | Also available via `require("json")` / `require("yaml")` |
| `Set`, `getSelfData(name)`, `Actor`, `GameTable` | The original object layer: SelfData is saved to `data/self_data/<name>.json`; GameTable connects to `.game` |

`package.path` includes the mod directories and `data/plugin`, so `require` across plugins works (such as the commonly used community `lua_useful_extensions`).

On Windows, GBK / CP936 source is detected and converted automatically when loading old single-file plugins; text that plugins pass to `sendMsg`, `eventMsg`, the JSON encoder or adapters is also normalized to valid UTF-8. Unrecoverable invalid bytes are shown as replacement characters, and JSON serialization exceptions no longer propagate and make the process exit.

## Complete Lua API Signatures and Object Methods

This section lists all Lua plugin APIs registered directly by the current runtime. A `?` in a parameter name means optional; unless stated otherwise, write functions return nothing.

### Data, Messages and Platforms

| API | Parameters and returns | Description |
| --- | --- | --- |
| `getUserConf(uid, key, default?)` | value / `default` / `nil` | User persistent configuration. When uid is `nil`, returns a `{[uid]=value}` table, usable for rankings. |
| `setUserConf(uid, key, value)` | — | Deletes when value is `nil`. |
| `getGroupConf(gid, key, default?)` / `setGroupConf(gid, key, value)` | value / — | Group persistent configuration; deletes when value is `nil`. |
| `getUserToday(uid, key, default?)` / `setUserToday(uid, key, value)` | value / — | Isolated by the current date; returns 0 by default when missing. |
| `getFavor(uid, platform?)` | number / `nil` | Reads the built-in affection; inherits the current platform automatically in a message call stack. |
| `setFavor(uid, value, platform?)` | number / `nil` | Overwrites the built-in affection and returns the new value. |
| `addFavor(uid, delta, platform?)` | number / `nil` | Increases or decreases the built-in affection and returns the new value. |
| `growFavor(uid, platform?)` | `success, delta, value` | Judges growth with the built-in affection rules and writes it back. |
| `sendMsg(text, gid?, uid?)` | — | Sends to the group when gid is non-empty; privately to uid when gid is empty. |
| `eventMsg(text, gid?, uid?)` | — | Feeds the text back into the full command / reply pipeline as a message from that user. `{fromMsg=, gid=, uid=}` can also be passed. |
| `drawDeck(gid, uid, deckName)` | string | The three-argument form uses the current group Session's private deck first, without falling back to the public deck of the same name when it runs out; the one-argument `drawDeck(deckName)` still draws from the public deck. gid / uid of 0 are treated as unspecified. |
| `askExtra({action=..., params=...})` | table / string / `nil` | Passes native platform actions through. Currently only the OneBot adapter responds; QQ Official, Discord and KOOK return `nil`. |
| `getDiceQQ()` / `getDiceDir()` | string | The currently triggering account's own ID / the absolute path of the `data` directory; another account isn't borrowed when the account can't be determined. |
| `mkDirs(path)` | boolean | Create a directory. |
| `loadLua(name)` | the script's return value | Directory mods run `script/<name>.lua` first; old `data/plugin/*.lua` also falls back to paths next to the entry, for example `loadLua("求签/月老灵签")` reads `data/plugin/求签/月老灵签.lua`. `a.b` still maps to `a/b.lua`. |
| `sleepTime(ms)` | — | Waits without blocking in suspendable message processing call chains and resumes from the same place; in other call environments it returns immediately. |

When `key` starts with `&`, the current mod's speech entries are resolved first; this is a common field alias idiom in old mods.

### Character Sheets and Actor

```lua
-- Sheet bound in the current group: getPlayerCard works for numeric QQ groups; cross-platform, use Actor and pass false explicitly.
local pc = Actor(msg.uid, msg.gid, false)
local hp = pc:get('hp') or 0
pc:set('hp', hp - 1)
pc.san = 60                 -- field assignment is equivalent to set

-- Read by sheet name (the second argument is a string sheet name, or pass byName=true explicitly)
local named = getPlayerCardAttr(msg.uid, '备用卡', 'hp', 0, true)
```

| Actor API | Parameters and returns | Description |
| --- | --- | --- |
| `Actor(uid, scope, byName?)` | Actor | Creates a character sheet proxy; for cross-platform group IDs pass `false` explicitly so scope is treated as a group. |
| `getPlayerCard(uid, scope)` | Actor | Old compatibility entry: numeric scope is treated as a group, string scope as a sheet name. |
| `pc:get(key)` / `pc[key]` | value or `nil` | Reads numbers, text or the original text of linked attributes. |
| `pc:set(key, value)` / `pc:set({key=value,...})` / `pc[key]=value` | Single field returns 1; bulk returns the number written | Writes the real character sheet; value `nil` deletes. |
| `pc:rollDice(exp?)` | `{expr,sum,expansion}` or `{expr,error}` | Uses the sheet's `__DefaultDiceExp` / `__DefaultDice`; `1D` / d100 when unset. |
| `pc:lock(key)` / `pc:unlock(key)` / `pc:locked(key)` | boolean | Operates field locks on the real character sheet. |

### Built-in Objects and Encoding Libraries

| API | Parameters and returns | Description |
| --- | --- | --- |
| `getSelfData(name)` | SelfData proxy | Persisted automatically to `data/self_data/<name>.json`; supports `obj[key]`, `obj:get(key, default)`, `obj:set(key,value)`, `obj:__totable()`. |
| `Set.new()` | Set object | `:add(value)`, `:remove(value)`, `:in(value)`, `:totable()`; `#set` returns the number of elements. |
| `GameTable(gid)` / `msg.game` | Game table proxy | `obj[key]` and `obj:set(key,value)` read and write the current game's shared data, and `:message(text)` sends a message to the current group. `msg.game` is `nil` when no game is running. |
| `msg.user` / `msg.grp` | User / group configuration proxy | `obj[key]` reads, `obj[key]=value` writes; `msg.user.nick/name/nn` is the nickname, `msg.user.trust` the trust level. |
| `json.encode(value)` / `json.decode(text)` | string / Lua value or `nil` | `require('json')` is also supported. |
| `yaml.parse(text)` / `yaml.dump(value)` | Lua value or `nil` / string | `require('yaml')` is also supported. |
| `http.get(url)` | `ok, body` | HTTP GET; public HTTP(S) is allowed by default, and non-HTTP(S), private network / loopback and dangerous URLs are always refused; strict mode additionally requires the external API switch and allowlist. |
| `http.post(url, body, headers?)` | `ok, body` | A table body is JSON-encoded automatically; headers can be a table or a string. |
| `http.urlEncode(text)` / `http.urlDecode(text)` | string | URL encoding and decoding. |

> Strict mode uses the historical configuration key `dice/js_fetch_strict` and applies to both SealDice JS `fetch` and old Dice! Lua `http`. Turning strict mode off doesn't turn off SSRF, protocol and dangerous character checks.

::: warning Internal `__dnx_*` functions
`__dnx_roll`, `__dnx_fmt`, `__dnx_conf`, `__dnx_sd_load` and `__dnx_sd_save` are internal bridge functions of the object layer. They change with the implementation; plugins should use the public APIs on this page such as `Actor`, `msg:format`, `GameTable` and `getSelfData`.
:::

## Template Entries (speech)

### Safe Text Functions

Ordinary texts, native custom replies, file decks and Lua speech share the safe text functions: `sample`, `case`, `grade`, `ran`, `len`, `expired`, `var`, `at`, `print`, `wait`. JS / Python inside templates isn't executed, and templates can't read or write host configuration or files; `wait` waits asynchronously without putting the message thread to sleep. The fields each entry point can read still depend on its message context, and previews don't wait or send messages.

```text
{var:本次={ran:1~100}}This time it's {本次}, and showing it again is still {本次}
{case:user.trust?0=user&else=trusted user}
{grade:user.favor?0=normal&100=close&else=unknown}
```

`{var:name?value}` assigns and displays, and `{var:name=value&other=value}` only assigns; it's only valid for this render, and dotted paths can't modify character sheets, user data or permissions. `ran` accepts ordered integer bounds (inclusive), and `expired` judges whether the integer Unix time in a field has passed (missing or invalid counts as expired). Random text is independent of game dice rolls.

`len` returns the UTF-8 byte count for strings; for Set / ordinary tables in Lua messages it returns the number of elements without calling `__len` / `__pairs`, and numbers and booleans return 0. Ordinary command texts and decks can also use `{len:game.pls}` / `{len:game.gms}` to see the current game's player / GM counts; local variables are still strings. Collection length checks have a work limit, which doesn't amount to opening arbitrary object serialization.

`{print:uid}` / `{print:gid}` show the current user's or group's name and ID, and `{print:master}` / `{print:self}` show the dice master or bot of the current platform and account; `{print:uid=12345}` / `{print:gid=12345}` specify an ID, with `gid=0` meaning private chat. Only the cache of the current message or source account is used: no live network lookup of names, and no borrowing names from other accounts; when there's no name a recognizable ID is kept, and when there's no matching dice master `[无主]` (no master) is shown. Forged CQ actions or control characters in cached names are neutralized.

`{wait:1000}` outputs no text and only asks to delay the reply; the wait times of several selected branches add up, each item requires `0 < milliseconds < 600000`, and one reply waits at most 10 minutes. The final reply of ordinary messages is queued asynchronously, at most 256 items / 16 MiB; before sending, the source account being online, blacklists and disabled state are checked again, and changing accounts, changes in related group plugin / reply / rule permissions, plugin reloads or program restarts cancel old waits. Variables, random results and dice rolls are fixed before queuing and aren't recomputed when the time comes; it doesn't delay admin operations already executed, and isn't for decisions such as approvals that must return immediately.

When `msg:format('text{wait:1000}')` or `msg:echo('text{wait:1000}')` is used inside suspendable Lua message processing, the `sleepTime` coroutine mechanism is reused, and execution continues from the call site when the time is up; reloading cancels old coroutines. Previews and synchronous calls that can't be suspended only format the text without waiting.

`msg:format()` / `msg:echo()` bring in the scalar fields of this message table and the dotted paths allowed to be read; `msg:get('temp.count')` and `msg:get('user.trust')` can read nested fields, and boolean false is no longer lost. Internal `__*` fields and functions are refused, and there's no implicit pass-through to `_G`, arbitrary SelfData or host configuration. `msg:inc()` is still a local variable increment for this message and doesn't add persistent write permission.

Nicknames, captured text, user data and plugin fields are inserted as plain data and no longer parsed as templates. Escaped forms such as `\{ran:1~100}` keep the original text; loop, size, depth and work limits still apply.

### Automatic Catalogs

`{list_all_deck}` lists public decks and the group's temporary decks; `{list_extern_deck}` only lists public decks provided by user files. Hidden items with underscores aren't shown. `{list_extern_order}` / `{list_reply_deck}` list native custom replies and Lua extension trigger words within the current account, group and user scope; the former also lists enabled SealDice JS plugin commands and uses the currently configured command prefix.

The JS catalog reads an immutable command snapshot, updated after loading, running or reloading; listing doesn't enter the JS runtime, read getters / Proxies or call `solve`. Static user, group and self configuration conditions in Lua can be checked read-only; entries that would need to run dynamic speech keys, read SelfData files or whose permission can't be confirmed are conservatively omitted. Listing doesn't execute replies, draw probabilities or consume cooldowns / daily counts.

`{list_dice_sister}` only lists bots recognized in the member cache of the current account in this group, without exposing the global account list of the whole instance. The catalog shows at most 200 items / 32 KiB, with an ellipsis when truncated; queries don't trigger cross-account lookups.

`{key}` in reply text is resolved in this order: message variables → speech entries (`speech/*.yaml` of each mod merged with the descriptor's `speech{}`; values starting with `&` are aliases) → built-in `{self}` (the bot's self-reference). Recursive expansion is supported.

speech keys ignore ASCII case; for example `{reply_spells_list}` can reference `Reply_Spells_List`. Message variables first take an exact item with the same name, then fall back to an ASCII case-insensitive compatibility lookup; Chinese keys aren't rewritten.

Both YAML and JSON descriptors support text arrays; each reference draws one uniformly at random and then expands the variables / sample in it, instead of only showing the first. An empty array returns empty text, and aliases can still point to arrays:

```yaml
Roll_Reply:
  - "{nick}: {sample:Well done|Super effective}"
  - "It's {nick}'s turn!"
roll_alias: "&ROLL_REPLY"
```

These changes belong to the local compatibility wrap-up of 2026-10-16; check the actual source version to see whether they're in the installer you use. Copy-based acceptance was done for ResourceSearchEngine, 求签 (fortune drawing) / DailyNews, PC_Inventory and PC_Slots; the tests used network and message-sending stand-ins, so external services and delivery on real accounts aren't guaranteed, and source errors in plugins themselves aren't secretly rewritten by the host.

### Help Entries and References

`helpdoc` uses a case-insensitive namespace merged across all active mods, and topics with the same name override by load order. The help list matches `{help:topic}`, and `&topic` aliases can redirect across mods and through several levels; circular aliases don't hang the list. Ordinary `.help` keeps Next's existing built-in / JS help priority and search scope filtering, and only renders the finally selected mod entry.

References in help content are resolved in the order "message variables → mod help topics → speech → built-in variables" and can contain samples. For example:

```json
{"helpdoc":{"dice usage":"{nick}, just type .r d100.","roll help":"&dice usage","index":"{roll help}"}}
```

Both `.help index` and `{help:index}` in Lua replies bring in the current nickname. `{topic}` in ordinary replies doesn't automatically become a help lookup; write `{help:topic}` explicitly when you need help.

Template expansion goes at most 24 levels deep with 10,000 variable / reference resolutions; a single result is at most 4 MiB, and intermediate text at most 32 MiB in total. Exceeding size or work limits returns empty text, and no arbitrary script is executed. Image URLs / CQ references aren't counted by image file size, while Base64 embedded directly in templates counts as text.

## Compatibility with the Original

Common global APIs and the `Set/Context/SelfData/Actor/GameTable/http` object layer are connected, including `getUserConf(nil, field)` enumeration, `&key` fallback, three-argument `drawDeck`, single-file `task_call` and `sleepTime`. `require('Set')`, `Actor`, `GameTable` and `SelfData` can use public aliases. The following boundaries remain, and we can't promise lossless reproduction of any old pack:

| Unsupported | Description |
| --- | --- |
| Old JS / Python actions and arbitrary XML scripts | Not executed; the SealDice JS engine isn't the old Dice! JS API, and XML only converts safe numeric formulas |
| Old remote installation and safety policy overrides | The `.mod get/update/reinstall` downloader isn't restored, and bypassing disabling, blacklists, content blocking and request approval isn't allowed |
| Historical behavior of multiple replies / comparisons | One message selects one reply; several comparison operations must all be met, and loose partial matching or consecutive flooding isn't copied |
| External Lua bytecode | Not loaded; only text Lua is accepted; resource discovery and queues have depth / count limits |
| Binary C extensions (`.dll`) | Follow the existing runtime library search policy; they must match the platform and Lua ABI, and strict mode further restricts search directories. No new native library loading permission is added in this round |
| Objects specific to the old host | Old games in private chats / channels still aren't enabled automatically; `LogEnd` fills in common fields, but full field-by-field equivalence with old log / Session objects isn't guaranteed |

If you run into problems while migrating, feel free to send feedback with the mod files.

Although configuration is stored in string columns underneath, Lua values are type-encoded to distinguish text, booleans, numbers, empty strings and collections; unencoded historical values are still read under compatibility rules. The regex engine isn't guaranteed to be equivalent to the original C++ locale / POSIX extensions, and the 400-byte limit isn't a substitute for an execution time limit. For the complete implementation status, remaining differences and test scope, see the [compatibility notes in the main repository](https://github.com/DiceZone/Dice-Next/blob/main/docs/legacy-mod-compatibility.md).
