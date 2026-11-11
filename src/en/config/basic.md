# Basic Configuration

Dice!Next stores its configuration as **JSON** in the `config/` directory; the first launch creates one file per area.

Almost everything can be changed in the [web panel](/en/manage/dashboard), so you rarely need to edit files by hand. The files created at first launch contain only a few keys; **many keys only appear in the file after you set them in the panel** (built-in defaults apply while they are missing).

## Configuration Files

Each area is saved separately. Changes saved in the panel, and manual edits that pass hot-reload validation, are written back to the matching file:

| File | Content |
| --- | --- |
| `server.json` | WebUI/API listening address, database path and log level |
| `webui.json` | WebUI login settings |
| `adapters.json` | Adapter connections |
| `dice.json` | Dice behavior, masters, rules and AI settings |
| `events.json` | Friend and group invitation handling and event policies |
| `i18n.json` | Default language and per-platform language preferences |
| `backup.json` | Manual and automatic backup settings |
| `hot_reload.json` | Hot reload of configuration and resources |

The example below shows one file (what you actually get after startup is authoritative):

```json
// config/server.json
{
  "host": "0.0.0.0",
  "port": 18088,
  "api_key": "",
  "db_path": "./data/dice.db",
  "log_level": "info"
}
```

## Main Settings

### server

| Field | Description | Default |
|------|------|--------|
| `host` | Address the service listens on | `0.0.0.0` |
| `port` | Web panel / API port. If it is in use at startup, the next free port is used and written back here | `18088` |
| `api_key` | Backend API access key (generated on first launch; panel requests send it in the `X-API-Key` header) | Automatic |
| `db_path` | Main database path (character sheets / logs / chat and others have their own db files) | `./data/dice.db` |
| `log_level` | Minimum recorded level: trace/debug/info/success/warn/error. Affects new log entries immediately; old warning/critical values are still accepted | `info` |

::: tip WebUI login password vs. api_key
**Access to the web panel is controlled by the WebUI login password.** Once you set it on the panel's WebUI Settings page, every `/api/*` request requires login first (the `webui.password` key; empty = no authentication). When logging in you can choose "Trust this device for 30 days"; trusted sessions are stored only on this machine in `config/webui_sessions.json`. `server.api_key` is the API key that panel requests carry, intended for integrations; it does not replace the login password.
:::

### dice

The main switches for dice behavior. Common keys (most can be changed visually in the panel's system settings):

| Field | Description |
|------|------|
| `command_prefixes` | Array of command prefixes, default `.` `。` `!` `！` |
| `masters` | List of dice masters (`{platform, id}`, multiple allowed) |
| `summon_word` | Summon word (empty = off) |
| `whitelist_only` | Allowlist mode: only allowlisted groups get responses |
| `silent_global` / `disabled_global` | Global silence / list of globally disabled commands |
| `disabled_jrrp` | Disable `.jrrp` globally |
| `respond_self` | Whether to respond to messages sent by the bot account itself (self-control, off by default) |
| `console_start_hidden` | Hide the console and minimize to the tray at startup (default `true`) |
| `api_enabled` / `api_whitelist` / `api_timeout` | Switch, domain allowlist and timeout for `{api:URL}` external requests in replies |
| `image_send` | How images are sent (`base64` or relayed through `host`) |
| `message_format` | Outgoing display style: `traditional`, `standard` or `visual` (advanced visual); the old value `card` is treated as `standard`. See [Adapter Configuration](/en/config/adapter#reply-texts-and-visual-styles) |
| `save_log_images` | Whether session logs save images in messages locally |
| `logsite_url` / `logsite_format` | Log site upload address (empty = official site) and protocol format |
| `aliases` | Old account permission links (`{platform, alias, main}`, maintained by the dice master with `.admin account-alias`; not the `.alias` shortcuts) |
| `notice` | Dice master notification windows and event subscriptions (best managed on the Notifications page) |
| `ai` | All AI subsystem settings (models / polishing / translation / conversation / memory / tools…, best managed on the AI pages) |
| `rules.default_dice_sides` | Default number of sides when `.r` has no argument |
| `rules.coc_enabled` and others | Switches for each rule system and the COC critical success / fumble ranges |

### events

Event and approval policies (can be changed in the panel's permission / system settings):

| Field | Description |
|------|------|
| `friend_policy` / `auto_approve_friend` / `friend_keyword` | Friend request approval policy / automatic approval / verification keyword |
| `friend_welcome` | Welcome message for new friends (empty = built-in text) |
| `group_invite_policy` / `auto_approve_group` / `group_keyword` | Group invitation approval policy |
| `group_invite_reject_blacklist` / `group_invite_reject_nonfriend` | Reject invitations from blacklisted groups / non-friends |
| `poke_enabled` / `poke_command` | Poke reply switch / map pokes to a command |

### i18n

| Field | Description |
|------|------|
| `default_locale` | Default reply language (`zh-Hans` / `zh-Hant` / `en` / `ja`) |
| `platform_defaults` | Default language per platform |
| `resource_dir` | Language pack directory (default `i18n`; a `<language code>.json` placed here is loaded automatically as a custom language) |

### log

| Field | Description |
|------|------|
| `raw_events` | Whether to record raw adapter events in the log (for debugging) |

### hot_reload

| Field | Description |
|------|------|
| `enabled` | When on, changes to files under `config/` and `data/` are detected and applied automatically |
| `debounce_ms` / `watch_paths` | Debounce interval and watched directories |

### adapters

Adapter settings are stored in `config/adapters.json`. What the [Adapters](/en/manage/adapter-manager) page saves is authoritative; if you edit it by hand, keep the file valid JSON. For the fields, see [Adapter Configuration](/en/config/adapter).

## Hot Reload and Restarts

With `hot_reload.enabled` on, manual changes to configuration files are detected and applied automatically; settings changed in the web panel are also saved and applied immediately.

::: warning Settings that need a restart
Changes to `server.port` / `server.host` only take effect after a restart. We recommend changing them on the panel's **WebUI Settings** page, which tells you this and offers a "Restart now" button.
:::

## Upgrade Notes

To upgrade, extract the new package over the old files completely. The `config/` directory is not in the release package and won't be overwritten; see [Installation](/en/guide/install#upgrading).
