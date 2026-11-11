# Plugins

Lua mod details show compatibility notes: skipped conditions, old Dice! JS actions, unsupported events / numeric formulas and file loading errors are listed, so "the directory was found" is never presented as "every feature works". JS follows the SealDice ecosystem; old Dice! JS has no compatible runtime, and Python is not planned for now.

**Web panel → Extensions → Plugins** manages two kinds of extensions in two tabs:

- **JS plugins**: JavaScript plugins compatible with SealDice (the `seal.*` API).
- **Lua mods**: Lua mods compatible with the original Dice! (directory-style msg_reply modules and single-file msg_order plugins).

## Uploading and Loading

Click "Upload plugin" and choose a file; it is routed automatically by extension:

| File | Goes to |
|------|------|
| `.js` | JS plugin |
| `.lua` | Lua single-file plugin |
| `.json` | Lua mod descriptor (pure lookup mods, such as skill / spell lookups) |
| `.zip` | Lua mod package: supports the original "`<name>.json` + directory" pairs, archives of a whole library with several mods, and rule-type packages containing only `model/`/`rulebook/` |

You can also put files directly into the data directory (Lua mods in `data/mod`, single-file plugins in `data/plugin`) and click "Reload"; reloading refreshes both JS and Lua without a restart. The disable and delete buttons handle a mod's descriptor and resource directory **as a pair**, so nothing is left behind.

::: tip Want to write your own plugin?
Start with the [Plugin Quick Start](/en/develop/plugin-quickstart); for the full API, see the [JS Plugin API](/en/develop/js-plugin-api) and the [Lua Mod Reference](/en/develop/lua-mod).
:::

## Plugin Cards

Each plugin shows its name, version, author, description and registered commands, with actions on the right:

- **On/off switch**: enable / disable a single plugin immediately.
- **Configure**: appears when a JS plugin has registered settings; the dialog renders a form by type (switch / dropdown / multi-line template / number / text), and changes take effect immediately after saving.
- **Details**: version, language, license, file name, home page, full description and registered commands. Lua mods additionally distinguish trigger types (command / keyword / triggers when the message contains the word) and help entries (looked up with `.help <entry>`). You can also expand "Stored data" to see the key-value data the plugin persists, with JSON export and clearing.
- **Delete**: removes the plugin together with its files from disk (with a confirmation dialog).

Special labels:

- **JS-compatible rules**: JS plugins that provide a rule system through `seal.gameSystem` / `coc.registerRule` are filed automatically under `data/mod`, separate from native JSON rule packs.
- **Old version (superseded)**: after you upload a new version of a plugin with the same name, the old version is grayed out and disabled automatically.

## Update Checks

JS plugins that declare an update URL can be checked individually with "Check for updates", or in bulk with "Check for updates" in the page header; when a new version is found, "Update" replaces it in one click.

## Per-Group On/Off

Plugins apply globally by default; in groups, the following commands control them per group (group owner / admins only):

```
.plugin list            list plugins and their state in this group
.plugin on|off <name>   turn a plugin on / off
.plugin all on|off      turn all on / off
```

The original Dice!'s `.mod` has been restored as **global mod management**, which is different from `.plugin`'s per-group switches. It requires the dice master or trust level 4 or above; ordinary group admins / inviters can't change global mods:

```
.mod / .mod list        list global mods and their state
.mod on|off <name>      turn a mod on / off globally
.mod <name> on|off      the original argument order
.mod info <name>        show mod information
.mod detail <name>      show resource statistics
.mod reload <name>      reload a specific mod
.mod del <name>         delete a specific mod's files
```

`.mod get/update/reinstall` only point you to the WebUI; the old remote downloader isn't restored. Enabling, disabling, reloading, deleting and importing all refresh XML templates; disabled mods no longer contribute templates. Deleting removes files, so back up first.

## Compatibility

On the Lua side, the original Dice! mod ecosystem is supported; on the JS side, the compatibility target is the **SealDice plugin API**, not the old Dice! JS system (including the `seal.vars` character sheet bridge and `commands.disable` to override built-in commands). SealDice rule plugins can also be converted and packaged as rule packs for distribution; see [Example: Converting a SealDice Plugin](/en/develop/rulepack-example-fu) and [Writing Rule Packs](/en/develop/rulepack).

The local implementation from 2026-10-15 extends full TOML parsing, probability / lists / shared limits / locks, clocks and safe events, nested mods, rulebooks / tapes and safe XML numeric formulas; it hasn't shipped in an installation package yet. Nested entries keep their parent's disabled state, and directory and single-file plugins with the same name get separate management IDs, so check the target before deleting. Old JS / Python, arbitrary XML scripts and security policy overrides are not executed, so arbitrary old packages are not guaranteed to work as-is; see [Lua compatibility limits](/en/develop/lua-mod#compatibility-with-the-original).

### Group card names and display names

In group chats, the group card name carried by incoming messages is used first; the QQ nickname is only used when there is no card name. Private chats have no group card name.

| Field | Value |
| --- | --- |
| `ctx.player.name` | Unified display name: the group card name first, otherwise the QQ nickname |
| `ctx.player.card` / `msg.sender.card` | The current group card name; an empty string when not set or in private chats |
| `msg.sender.nickname` | The QQ nickname (unaffected by the group card name) |

```js
cmd.solve = (ctx, msg) => {
  const displayName = ctx.player.name;
  const groupCard = ctx.player.card; // use this when you strictly need the group card name
  seal.replyToSender(ctx, msg, `${displayName} / ${groupCard || 'no group card name'}`);
  return seal.ext.newCmdExecuteResult(true);
};
```

In Lua mod templates, `{nick}` is the QQ nickname and `{card}` is the current group card name (empty when not set).
