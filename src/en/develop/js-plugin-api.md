# JS Plugin API

This page is the complete API reference for Dice!Next JS plugins. For a quick start example, see the [Plugin Quick Start](/en/develop/plugin-quickstart).

Dice!Next embeds the quickjs-ng engine (supporting modern ES syntax and `async/await`) and targets compatibility with SealDice's `seal.ext` plugin model, so most SealDice plugins run as-is. This page also notes the differences from SealDice and the placeholders that aren't implemented yet.

## Runtime and Loading Rules

- **Directories**: the main directory is `data/plugins/js/`; rule-type plugins (those that called `seal.gameSystem`) are moved to `data/mod/` automatically; the `js/` directory inside a rule pack loads with the pack (and is subject to per-group activation).
- **Wrapping**: each plugin is evaluated in its own IIFE, so top-level `let/const` don't collide; fake `module`/`exports` are provided for compatibility with bundled output, but there is **no** `require`/`import`: plugins must be self-contained single files.
- **Deduplication**: by the metadata `@name` (not the file name); among several files with the same name, the one with the highest `@version` is kept and the others are marked "superseded" and not loaded.
- **Disabling**: the file is renamed to `*.js.disabled` (this is what the switch in the web panel does).
- **Execution model**: all plugins share one JS runtime and run **serially on a single thread**. Infinite loops or slow synchronous operations block the whole message processing pipeline; put time-consuming logic in timer callbacks where possible.
- **Load lifecycle**: when an extension registers, `ext.isLoaded=false`; after all scripts have registered, the host sets it to `true` and calls each extension's `ext.onLoad()`, so `onLoad` can safely use `seal.ext.find` to look up other plugins.

### Metadata (UserScript header)

`// @key value` comments in the first 40 lines of the file are parsed:

| Key | Description |
| --- | --- |
| `@name` | Plugin name (the basis for deduplication and display; the file name is used when missing) |
| `@author` / `@version` / `@description` / `@license` | Display metadata |
| `@homepageURL` (or `@homepage`) | Home page link |
| `@updateUrl` (or `@updateURL`) | A direct link to the plugin source; "Check for updates" in the web panel fetches it, compares `@version` and updates in one click |

## Extension and Command Registration (seal.ext)

| API | Description |
| --- | --- |
| `seal.ext.new(name, author, version)` | Create an extension object `ext` (with `cmdMap` and `storageSet/storageGet`) |
| `seal.ext.register(ext)` | Register the extension; commands added to `cmdMap` after registration also take effect |
| `seal.ext.find(name)` | Find a registered extension by name (for cooperation between plugins) |
| `seal.ext.newCmdItemInfo()` | Create a command object `cmd` |
| `seal.ext.newCmdExecuteResult(solved)` | Create the return value of `solve`, `{solved, showHelp:false}`; with `showHelp=true` the host attaches `cmd.help` to the reply automatically |

`cmd` fields:

| Field | Default | Description |
| --- | --- | --- |
| `name` | `""` | Command name |
| `help` | `""` | Help text (gathered into the `.help` system and the web panel) |
| `solve(ctx, msg, cmdArgs)` | — | Command handler; return `newCmdExecuteResult(true)` to indicate it was handled |
| `allowDelegate` | `false` | Compatibility field (for rolling on someone's behalf, use `seal.getCtxProxyFirst` directly) |
| `disabledInPrivate` | `false` | Disable in private chats |
| `enableExecuteTimesParse` | `false` | Allow parsing the `3#command` repeat prefix (the count is in `cmdArgs.specialExecuteTimes`) |
| `raw` / `checkCurrentBotOn` / `checkMentionOthers` | — | Compatibility fields |

Commands match **the first word exactly** (`.hello world` matches `cmdMap['hello']`). Before dispatch, the "per-group on/off" switch (group details → Plugins in the web panel) is checked, and groups where it's off don't trigger it.

## Event Hooks

The main order for real messages matches `sealdice-core`:

```text
onMessageReceived → built-in command or cmd.solve → drain async tasks → onCommandReceived → actual send → onMessageSend
```

| Hook | When it fires |
| --- | --- |
| `ext.onLoad()` | Called once after all scripts have registered and `ext.isLoaded` is set to `true` |
| `ext.onMessageReceived(ctx, msg)` | Called for each received message before command processing; it's an observing hook and doesn't suppress later built-in / plugin commands |
| `ext.onCommandReceived(ctx, msg, cmdArgs)` | Called after the command is solved and its Promise tasks complete; triggered for built-in commands, JS commands and parsed but unknown commands |
| `ext.onNotCommandReceived(ctx, msg)` | Called as the non-command fallback when the message produced no command, Lua / causal / custom reply |
| `ext.onMessageSend(ctx, msg, flag)` | Called after Dice!Next's final reply is actually delivered; `msg` is the sent message |
| `ext.onGroupJoined(ctx, msg)` | The bot itself joined an ordinary group |
| `ext.onGroupMemberJoined(ctx, msg)` | An ordinary member joined a group |
| `ext.onGuildJoined(ctx, msg)` | The bot itself joined a channel / server with a guild identifier |
| `ext.onBecomeFriend(ctx, msg)` | Friend added |
| `ext.onMessageDeleted(ctx, msg)` | A message recall event was received; `msg.rawId` is the recalled message's ID (when the adapter provides it) |
| `ext.onPoke(ctx, event)` | Poke; `event={groupId,senderId,targetId,isPrivate}` |
| `ext.onGroupLeave(ctx, event)` | A group member left / was removed; `event={groupId,userId,operatorId}` |

Even if a registered command object has no `solve`, or the command word matches no `cmdMap`, parsed command messages still go into `onCommandReceived`. Whether event hooks fire depends on whether the adapter reports the corresponding `BotEvent`.

The QQ Official adapter also provides native hooks for interactions, subscription authorization and other official events; for their signatures, configuration and limits see [QQ Official API v2](./qq-official-api.md). They are Dice!Next extensions and don't change the signatures of the SealDice-style hooks above.

::: warning Boundaries with SealDice
`onMessageEdit` isn't available yet, because Dice!Next's current `BotEvent` transport has no message edit event. `onCommandOverride` has no JS binding in `sealdice-core` itself, so it isn't a JS plugin compatibility target.
:::

## ctx / msg / cmdArgs

### ctx

| Field | Description |
| --- | --- |
| `ctx.player.userId` | Sender ID |
| `ctx.player.name` | Display name (group card name first, falling back to the platform nickname) |
| `ctx.player.card` | Group card name |
| `ctx.group.groupId` | Group ID (empty in private chats) |
| `ctx.group.logOn` / `ctx.group.logCurName` | The current group's session log state / log name |
| `ctx.isPrivate` | Whether it's a private chat |
| `ctx.privilegeLevel` | Permission level (higher numbers mean more permission; the dice master is far above group admins) |
| `ctx.endPoint` | The bot's own endpoint `{platform,id,userId,nickname,state,enable}` |
| `ctx.isCurGroupBotOn` | Placeholder, always `true` (reaching solve means the group is on) |

### msg

| Field | Description |
| --- | --- |
| `msg.message` | The full original message text (`rawContent` preferred) |
| `msg.platform` | Adapter platform identifier |
| `msg.messageType` | `"group"` or `"private"` |
| `msg.groupId` | Group ID; strictly an empty string in private chats |
| `msg.time` | Adapter message time (Unix seconds; the current time when missing) |
| `msg.sender` | `{userId, nickname, card}` |
| `msg.segment` | Rich media segments provided by the adapter; reads `segments`, OneBot `raw.message` or `msg_elements` first, and is an empty array when none |
| `msg.rawId` / `msg.guildId` / `msg.channelId` | Original message ID, server ID, channel ID; fields the adapter doesn't provide are empty strings |

### cmdArgs

Fields:

| Field | Description |
| --- | --- |
| `command` | The command word (first word) |
| `args` | Argument array (split on whitespace) |
| `cleanArgs` / `rawArgs` | The remaining text after removing the command word |
| `rawText` | The full original command text |
| `at` | `[{userId}, ...]` the people actually @mentioned in the message |
| `kwargs` | `[{name, value, valueExists}, ...]` (parses `--key` / `--key=value`) |
| `specialExecuteTimes` | The N of `N#command` (1–99, default 1; requires `cmd.enableExecuteTimesParse`) |
| `amIBeMentioned` / `amIBeMentionedFirst` | Whether the current bot was @mentioned / whether the first @mention is the current bot, computed from the real `atList` |

Methods:

| Method | Description |
| --- | --- |
| `getArgN(n)` | Argument n (starting from 1); returns `""` when out of range |
| `getRestArgsFrom(n)` | The remaining text from argument n (joined with spaces) |
| `isArgEqual(n, ...vals)` | Whether argument n equals any of the candidates |
| `chopPrefixToArgsWith(...prefixes)` | If the first argument starts with a prefix, removes it and returns `true` |
| `eatPrefixWith(...prefixes)` | Same, but returns the prefix that was removed |
| `getKwarg(name)` / `getKwargs(name)` | Get a `--key` argument, or `null` if absent |

## Replies

| API | Behavior |
| --- | --- |
| `seal.replyToSender(ctx, msg, text)` | Reply where the message came from. Several calls during command processing are merged line by line into one message; calls in asynchronous callbacks such as timers send immediately |
| `seal.replyGroup(ctx, msg, text)` | Same as `replyToSender` |
| `seal.replyPerson(ctx, msg, text)` | Always sends privately to the sender (such as hidden roll results) |

Text can embed image codes `[CQ:image,file=URL]` (QQ platforms). There is currently no separate "send image / voice" API.

`onMessageSend` observes the final reply after templates and polishing / translation, as actually delivered. Messages sent directly by reply APIs in hooks, timers or event callbacks don't trigger `onMessageSend` again recursively, so plugins can't create infinite message loops.

## Variables and Character Sheets (seal.vars)

| API | Description |
| --- | --- |
| `seal.vars.intGet(ctx, name)` → `[value, ok]` | Read an integer variable |
| `seal.vars.intSet(ctx, name, value)` | Write an integer variable |
| `seal.vars.strGet(ctx, name)` → `[value, ok]` | Read a string variable |
| `seal.vars.strSet(ctx, name, value)` | Write a string variable |

The variable name prefix decides where it belongs:

| Prefix | Scope | Storage |
| --- | --- | --- |
| `$mname` | The current user personally | The plugin KV database (shared between plugins) |
| `$gname` | The current group | Same |
| `$name` | Global | Same |
| **No prefix** | **Character sheet attribute** | The same sheet as `.st` |

Names without a prefix go straight to the character sheet, which is why SealDice `gameSystem` rule plugins can read and write `.st` sheets; `strGet` can also read the original text of "expression attributes" (such as the expression stored by `.st 物防='dex+1'`). Special case: `$t玩家` returns `ctx.player.name`.

`seal.format(ctx, s)` / `seal.formatTmpl`: evaluate a template string: `{$variable}` looks up a variable, and `{dice expression}` goes through the dice engine (such as `{1d100}`).

## Affection System (seal.favor)

These APIs read and write the same `player_profiles.favor` as the built-in `.favor` / `好感` commands, without creating a private copy for the plugin. The platform is taken from `ctx.endPoint.platform` automatically; when `userId` is omitted, they act on `ctx.player.userId`.

| API | Returns | Description |
| --- | --- | --- |
| `seal.favor.get(ctx, userId?)` | `number` or `null` | Read the current affection; `0` when there's no record yet. |
| `seal.favor.set(ctx, value, userId?)` | `number` or `null` | Overwrite the affection and return the written value. |
| `seal.favor.add(ctx, delta, userId?)` | `number` or `null` | Increase or decrease the affection and return the new value. |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` or `null` | Run the same probabilistic growth as `.favor grow`; when it doesn't grow, `success=false` and `delta=0`. |

```javascript
const before = seal.favor.get(ctx);
const after = seal.favor.add(ctx, 5);
const growth = seal.favor.grow(ctx);
seal.replyToSender(ctx, msg,
  `Affection: ${before} → ${after}\nGrowth: ${growth.success ? `+${growth.delta}` : 'no growth'}`);
```

When passing a user ID from a third-party platform, you must use that platform's original string ID; don't assume every account is a numeric QQ. When the target `userId` or the context platform is missing, they return `null` and nothing is written.

## Plugin Storage (ext.storage)

```javascript
ext.storageSet('key', 'the value must be a string');   // JSON.stringify objects
const v = ext.storageGet('key');          // returns undefined when there's no value
```

Data is persisted in `data/plugins.db`, isolated by plugin name; "Plugins" in the web panel can view, export and clear each plugin's storage. `$m` variables are also visible on the Players page.

## Settings (Visual in the WebUI)

After registering, users can edit them directly in the plugin details of the web panel, without changing code:

| API | Form control |
| --- | --- |
| `seal.ext.registerStringConfig(ext, key, default, desc?)` | Text box |
| `seal.ext.registerIntConfig / registerFloatConfig(ext, key, default, desc?)` | Number box |
| `seal.ext.registerBoolConfig(ext, key, default, desc?)` | Switch |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | Multi-line template (array) |
| `seal.ext.registerOptionConfig(ext, key, default, options, desc?)` | Dropdown |

Reading: `getStringConfig` / `getIntConfig` / `getFloatConfig` / `getBoolConfig` / `getTemplateConfig` (returns an array) / `getOptionConfig`. The batch style `newConfigItem` + `registerConfig` (SealDice-compatible) is also available.

## Timers

| API | Description |
| --- | --- |
| `setTimeout(fn, ms)` / `clearTimeout(id)` | Real timers (not fake timers triggered by messages) |
| `setInterval(fn, ms)` / `clearInterval(id)` | Minimum interval 200 ms, at most 256 active timers |
| `seal.ext.registerTask(ext, 'daily', 'HH:MM', fn, key?, desc?)` | Daily task at a fixed time; `taskType='cron'` only supports the daily-equivalent `M H * * *` expression |

`replyToSender` in timer callbacks sends immediately. Weekly / arbitrary cron isn't supported yet.

## Networking (fetch)

```javascript
const resp = await fetch(url, { method: 'POST', headers: {...}, body: {...} });
// resp.ok / resp.status / await resp.text() / await resp.json()
```

Subject to a security gate: you must turn on the **external API switch** in "System settings" of the web panel and add the target domain to the allowlist, otherwise the request is refused (the Promise rejects). Passing an object as `body` serializes it to JSON automatically. The global functions `btoa`/`atob` are also available.

::: warning Synchronous implementation
`fetch` is synchronous and blocking underneath, so slow APIs hold up message processing; it's safer to put requests that aren't time-sensitive in timer callbacks.
:::

## Group Management and Lists

| API | Description |
| --- | --- |
| `seal.memberBan(ctx, groupId, userId, duration)` | Mute (seconds) |
| `seal.memberKick(ctx, groupId, userId)` | Kick |
| `seal.setPlayerGroupCard(ctx, template)` | Set the sender's group card name |
| `seal.ban.addBan(ctx, id, place, reason)` | Add to the blacklist (connected to the bot's black / white list system) |
| `seal.ban.addTrust(ctx, id, place, reason)` | Add to the allowlist |
| `seal.ban.remove(ctx, id)` | Remove from the lists |
| `seal.ban.getList()` / `seal.ban.getUser(id)` | Query the lists |

## Rolling on Someone's Behalf

```javascript
const mctx = seal.getCtxProxyFirst(ctx, cmdArgs) || ctx;  // act for the @mentioned person if there is one
```

`getCtxProxyFirst` / `getCtxProxyAtPos(ctx, cmdArgs, pos)` build a proxy ctx from the pos-th person @mentioned in the message; after that, character sheet reads and writes through `seal.vars` point to the mentioned person's sheet.

## Decks and Dice

| API | Description |
| --- | --- |
| `seal.deck.draw(ctx, name, isShuffle)` | Draw from a deck, returning `{exists, err, result}` |
| `seal.format(ctx, '{1d100}')` | Use template evaluation to go through the real dice engine |

## Rule Templates (gameSystem)

`seal.gameSystem.newTemplate(jsonStr)` / `newTemplateByYaml(yamlStr)`: register a complete rule template (attribute aliases, derived attributes and so on), connected to the built-in `.st`/`.ra`. Plugins that call it are treated as "rule-type", moved to `data/mod/` automatically and shown on the Rules page. Hands-on tutorial: [Converting a SealDice rule plugin](/en/develop/rulepack-example-fu).

`seal.coc.registerRule` currently only marks the plugin as rule-type; **custom check judgments don't actually take over** the `.ra` core.

## Other Globals

| API | Description |
| --- | --- |
| `console.log/info/warn/error/debug/trace(...)` | Written to the `[插件]` (plugin) log with the actual script source; log/info=INFO, warn=WARN, error=ERROR, debug=DEBUG, trace=TRACE |
| `seal.getVersion()` | `{version, versionSimple, versionCode, ...}` |
| `seal.getEndPoints()` | Placeholder, always an empty array |

## Complete JS API List and Signatures

Below is the complete public API exported by the current runtime. Items marked "compatibility placeholder" are safe to call but don't have SealDice's full behavior; don't treat them as implemented.

### `seal.ext`, extensions and settings

| API | Parameters / returns | Status and notes |
| --- | --- | --- |
| `seal.ext.new(name, author, version)` | `ext` | Creates an extension object with `name`, `author`, `version`, `cmdMap`, `storageGet/Set`. |
| `seal.ext.register(ext)` | — | Registers the extension. |
| `seal.ext.find(name)` | `ext` or `null` | Finds a registered extension. |
| `seal.ext.newCmdItemInfo()` | `cmd` | Creates a command object. |
| `seal.ext.newCmdExecuteResult(solved?)` | `{solved, showHelp}` | The standard return value of solve. |
| `seal.ext.registerTask(ext, type, value, fn, key?, desc?, group?)` | — | `daily` + `HH:MM`, or daily-equivalent `cron`: `M H * * *`. key/desc/group are currently compatibility parameters only. |
| `seal.ext.newConfigItem(key?, defaultValue?, desc?)` | ConfigItem | Batch configuration entry; the object has `key`, `defaultValue`, `type`, `description`. |
| `seal.ext.registerConfig(ext, ...items)` | — | Registers ConfigItems in bulk. |
| `seal.ext.getConfig(ext, key)` | `{key, value}` | Returns the configuration object; read the value from `.value`. |
| `seal.ext.registerStringConfig / registerIntConfig / registerFloatConfig / registerBoolConfig(ext, key, defaultValue, desc?)` | — | Registers settings of the matching type. |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | — | Registers a string array template setting. |
| `seal.ext.registerOptionConfig(ext, key, defaultValue, options, desc?)` | — | Registers a dropdown setting; options is an array. |
| `seal.ext.getStringConfig / getIntConfig / getFloatConfig / getBoolConfig / getTemplateConfig / getOptionConfig(ext, key)` | value | Return string / number / number / boolean / string[] / string respectively. |
| `seal.ext.unregisterConfig(ext)` | `0` | **Compatibility placeholder**; currently doesn't remove registered settings. |

### Messages, context and replies

| API | Parameters / returns | Notes |
| --- | --- | --- |
| `seal.replyToSender(ctx, msg, text)` | — | Back to the original message's chat. |
| `seal.replyGroup(ctx, msg, text)` | — | Currently behaves the same as `replyToSender`. |
| `seal.replyPerson(ctx, msg, text)` | — | Always sends privately to the sender; when a temporary msg has no sender, uses `ctx.player.userId`. |
| `seal.newMessage()` | `{}` | Creates an empty message object; fill in `platform`, `messageType`, `groupId`, `sender` as needed to use it with the reply APIs. |
| `seal.createTempCtx()` | `{player:{userId,name}, group:{groupId}}` | Creates a minimal context; fill in userId / groupId yourself. |
| `seal.getCtxProxyFirst(ctx, msgOrArgs)` | `ctx` | With an @ target, returns a proxy whose `ctx.player` is the first target; without one, returns the original ctx. |
| `seal.getCtxProxyAtPos(ctx, msgOrArgs, pos)` | `ctx` | Same; pos starts from 0. |
| `seal.setPlayerGroupCard(ctx, template)` | — | Sets the current sender's group card name; requires platform support and enough permission. |
| `seal.applyPlayerGroupCardByTemplate(ctx, template)` | `0` | **Compatibility placeholder**; currently does nothing. |
| `seal.memberBan(ctx, groupId, userId, durationSec?)` | — | Mute; has no effect when the platform doesn't support it or permission is insufficient. |
| `seal.memberKick(ctx, groupId, userId)` | — | Kick; has no effect when the platform doesn't support it or permission is insufficient. |

The public fields of `ctx.player` are `userId`, `name`, `card`; of `ctx.group`, `groupId`, `logOn`, `logCurName`. `msg.sender` has `userId`, `nickname`, `card`. Cross-platform IDs are all strings and can't be assumed to be QQ numbers.

### Variables, character sheets, decks and rules

| API | Parameters / returns | Notes |
| --- | --- | --- |
| `seal.setVarInt(ctx, name, value)` / `seal.vars.intSet(...)` | — | Writes an integer variable; without a `$` prefix, writes the current character sheet attribute. |
| `seal.setVarStr(ctx, name, value)` / `seal.vars.strSet(...)` | — | Writes a string variable; without a `$` prefix, writes a sheet text / expression attribute. |
| `seal.vars.intGet(ctx, name)` | `[number, ok]` | Reads an integer variable or a sheet value. |
| `seal.vars.strGet(ctx, name)` | `[string, ok]` | Reads a string variable or a sheet expression attribute; `$t玩家` / `$t玩家_RAW` return the display name. |
| `seal.vars.computedGet / computedSet(ctx, name, value?)` | Same as `strGet/strSet` | **Compatibility approximation**: currently equivalent to string reads and writes, without full RollVM evaluation. |
| `seal.format(ctx, text)` / `seal.formatTmpl(ctx, text)` | string | Evaluates `{$variable}`; dice expressions such as `{1d100}` are handled by the real dice engine. |
| `seal.favor.get(ctx, userId?)` | number / `null` | Reads the built-in affection. |
| `seal.favor.set(ctx, value, userId?)` | number / `null` | Overwrites the built-in affection and returns the new value. |
| `seal.favor.add(ctx, delta, userId?)` | number / `null` | Increases or decreases the built-in affection and returns the new value. |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` / `null` | Judges growth with the built-in affection rules and writes it back. |
| `seal.deck.draw(ctx, name, shuffle?)` | `{exists, err, result}` | Draws from a public deck; the shuffle parameter is currently kept for compatibility. |
| `seal.deck.reload()` | `0` | **Compatibility placeholder**; decks are reloaded from the web panel or files. |
| `seal.gameSystem.newTemplate(jsonText)` / `newTemplateByYaml(yamlText)` | `{}` | Marks the plugin as rule-type and registers the attribute template for `.st/.ra`. |
| `seal.coc.newRule()` / `newRuleCheckResult()` | `{}` | **Compatibility placeholder**; only returns an empty object. |
| `seal.coc.registerRule(rule)` | `0` | Marks the plugin as rule-type; doesn't take over the built-in `.ra` judgment core. |

### Lists, utilities and standard globals

| API | Parameters / returns | Notes |
| --- | --- | --- |
| `seal.ban.addBan(ctx, id, place?, reason?)` | — | Adds to the blacklist; place is currently a compatibility parameter only. |
| `seal.ban.addTrust(ctx, id, place?, reason?)` | — | Adds to the trusted list / allowlist. |
| `seal.ban.remove(ctx, id)` | — | Removes from the lists. |
| `seal.ban.getList()` | array | Returns all list records. |
| `seal.ban.getUser(id)` | object or `null` | Returns a single list record. |
| `seal.getVersion()` | object | Returns `version`, `versionSimple`, `versionCode`, `versionDetail`. |
| `seal.getEndPoints()` | `[]` | **Compatibility placeholder**; currently lists no endpoints. |
| `setTimeout(fn, ms)` / `setInterval(fn, ms)` | timerId | Real timers; minimum interval 200 ms, at most 256 active timers. |
| `clearTimeout(id)` / `clearInterval(id)` | — | Cancels a timer. |
| `fetch(url, options?)` | `Promise<Response>` | Response has `ok`, `status`, `statusText`, and asynchronous `text()` / `json()`; the underlying request still blocks synchronously. |
| `btoa(text)` / `atob(text)` | string | Base64 encoding and decoding; `atob` accepts a `data:*;base64,` prefix. |
| `console.log/info/warn/error/debug/trace(...values)` | — | Writes to the runtime log at the matching level; the default INFO hides DEBUG/TRACE; timers and asynchronous continuations keep their source. |

## Minimal Runnable Example: Reading the Group Card Name and Character Sheet

```javascript
const ext = seal.ext.new('api-example', 'Dice!Next', '1.0.0');
const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'card-example';
cmd.help = 'Read the group card name and Spot Hidden';
cmd.solve = (ctx, msg) => {
  const card = ctx.player.card || 'no group card name';
  const [spot, exists] = seal.vars.intGet(ctx, '侦查');
  seal.replyToSender(ctx, msg, `${ctx.player.name} (${card})\nSpot Hidden: ${exists ? spot : 'not recorded'}`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['card-example'] = cmd;
seal.ext.register(ext);
```

## Current Limitations at a Glance

Boundaries worth knowing before writing a plugin (which are also our improvement roadmap):

1. `onMessageEdit` isn't available yet; other platform events only fire when the adapter reports the corresponding `BotEvent`.
2. `msg.segment` holds the adapter's native segments, not a unified cross-platform structure; it is empty when not reported, and there's no dedicated image-sending API (you can send `[CQ:image]` codes).
3. There's no `require`/`import` and no file system API; plugins must be self-contained single files.
4. Execution is serial on a single thread, with no timeouts or resource quotas; avoid infinite loops and slow synchronous operations.
5. `registerTask` only supports daily tasks; `seal.coc` custom judgments, `seal.getEndPoints` and others are still placeholders.
6. `fetch` is gated by the external API switch and allowlist (a deliberate security design, not a bug).
