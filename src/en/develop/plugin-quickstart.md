# Plugin Quick Start

This page walks you through writing, installing and running your first Dice!Next plugin in five minutes. By the end you'll know which kind of extension to choose and where to find the full API.

## Choose the Right Kind of Extension

Dice!Next has four kinds of extensions; choose by what you want to do:

| What you want | What to use | Code needed? | Reference |
| --- | --- | --- | --- |
| Keyword auto-replies, conditional triggers, counters | "Advanced replies" (causal rules) in the web panel | No | [Advanced Replies](/en/manage/replies) |
| Card draws, random text | Deck JSON | No | [Decks & Randomness](/en/use/deck) |
| Entry lookups, rules reference | Help documents / rule packs | No | [Help Documents](/en/manage/help-docs), [Writing Rule Packs](/en/develop/rulepack) |
| **Custom commands, logic, networking, scheduled tasks** | **JS plugins (recommended)** | JavaScript | This page + [JS Plugin API](/en/develop/js-plugin-api) |
| Keep using original Dice! mods / Lua scripts | Lua mods | Lua | [Lua Mod Reference](/en/develop/lua-mod) |
| Package a whole rule set (attributes, commands, help, scripts) | Rule pack bundle | Optional | [Writing Rule Packs](/en/develop/rulepack) |

::: tip In one sentence
Write **logic** in JS plugins; ship **content** as rule packs or decks; migrate **old mods** with Lua. A rule pack is essentially a "container" that can also hold JS and Lua.
:::

## Five Minutes: Your First JS Plugin

Dice!Next's JS plugins are compatible with SealDice's `seal.ext` model, so SealDice plugins usually work as-is and SealDice development experience mostly carries over.

### 1. Write the code

Create `hello.js`:

```javascript
// ==UserScript==
// @name         打招呼
// @author       希亚
// @version      1.0.0
// @description  示例插件：.hello 会回复问候
// ==/UserScript==

const ext = seal.ext.new('hello', '希亚', '1.0.0');

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'hello';
cmd.help = '.hello // the bot says hello';
cmd.solve = (ctx, msg, cmdArgs) => {
  seal.replyToSender(ctx, msg, `Hello, ${ctx.player.name}! Have a great session today.`);
  return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['hello'] = cmd;
seal.ext.register(ext);
```

The UserScript comments at the top such as `// @name` are plugin metadata (shown in the web panel; for plugins with the same name, the highest `@version` is used).

### 2. Install it

Either way works:

- **Web panel** (recommended): "Plugins" → "Upload plugin", choose `hello.js`.
- **By hand**: put the file in `data/plugins/js/`, then click "Reload" on the Plugins page.

### 3. Run it

Open the "Playground" in the panel's sidebar and type `.hello`; you can verify it without connecting QQ. Sending `.hello` in a real group works the same way.

After changing the code, upload again (or click "Reload") and it takes effect without a restart.

## Common Capabilities at a Glance

Each snippet below is complete and ready to copy; for details see the [JS Plugin API](/en/develop/js-plugin-api).

**Read and write persistent data** (survives restarts, stored in `data/plugins.db`):

```javascript
ext.storageSet('count', String(Number(ext.storageGet('count') || '0') + 1));
```

**Read and write a player's character sheet** (the same sheet as `.st`):

```javascript
const [hp, ok] = seal.vars.intGet(ctx, 'hp');   // no $ prefix = character sheet attribute
seal.vars.intSet(ctx, 'hp', hp - 1);
const [note] = seal.vars.strGet(ctx, '$m备注');  // $m = personal, $g = group, $ = global variable
```

**Argument parsing**:

```javascript
cmd.solve = (ctx, msg, cmdArgs) => {
  const who = cmdArgs.getArgN(1);            // argument 1
  const rest = cmdArgs.getRestArgsFrom(2);   // the remaining text from argument 2
  const at = cmdArgs.at[0];                  // the person @mentioned in the message {userId}
  // ...
};
```

**Scheduled tasks** (run at a fixed time every day):

```javascript
seal.ext.registerTask(ext, 'daily', '08:30', () => {
  // replyToSender here needs a ctx/msg you saved yourself, or send directly with a group ID
}, 'morning', 'Good-morning reminder');
```

**Networking** (requires turning on the external API switch in "System settings" of the web panel and configuring the allowlist):

```javascript
const resp = await fetch('https://api.example.com/data');
const data = await resp.json();
```

**Add WebUI settings to a plugin** (so users can adjust parameters without editing code):

```javascript
seal.ext.registerStringConfig(ext, 'greeting', 'Have a great session today', 'The second half of the greeting');
// read it in solve:
const greeting = seal.ext.getStringConfig(ext, 'greeting');
```

## Listening to Non-Command Messages

To make a plugin respond to ordinary chat (without a `.` prefix), implement `ext.onNotCommandReceived`:

```javascript
ext.onNotCommandReceived = (ctx, msg) => {
  if (msg.message.includes('good night, bot')) {
    seal.replyToSender(ctx, msg, 'Good night, sweet dreams~');
  }
};
```

## Next Steps

- The full API (every field of `ctx`/`msg`/`cmdArgs`, all `seal.*` functions, the current list of limitations): [JS Plugin API](/en/develop/js-plugin-api)
- Using or extending old Dice! mods directly: [Lua Mod Reference](/en/develop/lua-mod)
- Publishing attribute templates, help and scripts as one package: [Writing Rule Packs](/en/develop/rulepack)
- Controlling the bot over HTTP (for external tools): [API Reference](/en/develop/api)
