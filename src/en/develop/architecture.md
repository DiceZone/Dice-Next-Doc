# Architecture

Dice!Next 3.0 uses a layered architecture with a separate backend and frontend: the C++ backend handles protocol connections, command processing and data storage, and the React frontend is a pure REST API client.

## Tech Stack

| Layer | Technology | Notes |
|------|------|------|
| Build system | CMake ≥ 3.20 (C++20 + C99) | Cross-platform builds of the backend and expression compatibility libraries |
| Package management | vcpkg | Microsoft's official C++ package manager |
| HTTP/WS | drogon | Asynchronous, non-blocking C++ web framework |
| JSON / YAML | nlohmann/json · yaml-cpp | Configuration / old format parsing |
| Database | SQLite3 + sqlite_orm | Lightweight, zero-configuration persistence |
| Logging | spdlog | High-performance asynchronous logging |
| JS engine | quickjs-ng | JS plugin subsystem (SealDice compatible) |
| Lua engine | Lua 5.4 | Lua mod subsystem (original Dice! mod compatible) |
| Dice | In-house engine + onedice-cpp-lib + dicescript-c-lib | Configurable safe fallback chain: native, OneDice, DiceScript C99 |
| Compression | zlib · zstd | Log site uploads / the DiceNext log format |
| Frontend | Vite + React + shadcn/ui + Tailwind CSS | Single-page web panel |

## Layers

```
┌────────────────────────────────────────────────┐
│                Web panel (web/)                  │
│    React SPA: HTTP REST API + WebSocket push     │
└───────────────────────┬────────────────────────┘
                        │
┌───────────────────────▼────────────────────────┐
│               C++ backend (server/src)           │
│                                                  │
│  Service layer service/  REST routes · log       │
│                    processing · notifications     │
│                    AI gateway (polish / translate │
│                    / chat / memory / tools / NPC  │
│                    / vision / background thread)  │
│  Core layer core/  command routing · dice engine │
│                    · character sheets · decks ·  │
│                    custom replies · causal rules │
│                    · personas · Lua/JS plugins    │
│  Storage storage/  SQLite (six databases) · data │
│                    migration                      │
│  Platform platform/ tray · autostart · crash      │
│                    diagnostics (Win)              │
│  Adapters adapter/ OneBot v11 (pluggable,         │
│                    multi-platform)                │
└─────────────────────────────────────────────────┘
```

## Project Structure (Backend `server/src`)

```
server/src/
├── main.cpp                 # entry: assembles components, the message pipeline, registers routes, starts drogon
├── adapter/                 # adapter layer
│   ├── adapter_interface.h  # IAdapter abstraction + Message/BotEvent event model
│   ├── adapter_manager.h    # adapter management / unified message and event dispatch
│   ├── onebot_v11_adapter.h # OneBot v11 implementation (forward / reverse WS)
│   └── self_echo_filter.h   # self-echo deduplication (the bot's own messages don't enter the pipeline)
├── core/                    # core layer
│   ├── command_router.h     # command routing / built-in command implementations (core dispatch)
│   ├── dice/                # dice engine (expressions / house rules / insanity tables)
│   ├── character/           # character sheet storage
│   ├── deck/                # decks
│   ├── reply/               # custom replies
│   ├── causal/              # causal rules / cooldowns / counters
│   ├── persona/             # bot personas
│   ├── mod/                 # plugin subsystem
│   │   ├── lua_plugin_manager.*  # Lua mods (original Dice! mod compatible)
│   │   └── js_plugin_manager.*   # JS plugins (SealDice compatible)
│   └── rules_lock.h         # read-write lock for rule data
├── service/                 # service layer
│   ├── api_service.h        # REST API routes (the bulk of them)
│   ├── log_service.h        # session log processing / rendering / upload
│   ├── notice_manager.h     # notification system (window delivery / SMTP / webhook / audit)
│   ├── broadcast_manager.h  # trigger-based broadcasts
│   ├── ai_gateway.h         # AI gateway (OpenAI-compatible API)
│   ├── ai_polish.h / ai_translate.h / ai_chat.h / ai_memory.h
│   ├── ai_tools.h / ai_npc.h / ai_vision.h / ai_worker.h
│   ├── chat_image.h / image_host.h / image_send.h   # image pipeline
│   ├── group_chat_buffer.h  # group chat context buffer
│   ├── web_auth.h           # WebUI login password (cookie)
│   └── parquet_writer.h     # log export format
├── storage/
│   ├── database.{h,cpp}     # SQLite + sqlite_orm (six databases)
│   ├── legacy_importer.*    # original V2 data migration
│   ├── legacy_import_v2.h / legacy_dice2.h  # original file format decoders
│   └── migration.{h,cpp}    # schema migration
├── platform/                # platform-specific (Windows tray / autostart / crash diagnostics / single instance)
├── i18n/                    # multi-language engine + language resolution
├── message/                 # CQ code parsing / message formatting
├── config/                  # configuration management (config/*.json, split by area)
└── common/                  # logging / hot reload / utilities / version
```

The frontend is the separate repository `Dice-Next-WebUI` (Vite + React, `src/pages`, `src/components`, `src/i18n`), and the documentation site is the separate repository `Dice-Next-Doc` (VitePress). The main backend repository `Dice-Next` only contains `server/` and the packaging scripts; compiling also needs the sibling repositories `onedice-cpp-lib` and `dicescript-c-lib`.

## Database Split

Data is split by purpose into six SQLite databases (in `data/` by default), each of which can be backed up / deleted independently:

| Database | Content |
|----|------|
| `dice.db` | Main database: groups / players / black and white lists / scheduled tasks / text overrides and more |
| `cards.db` | Character sheets |
| `logs.db` | Session logs |
| `chat.db` | Chat persistence (chat simulator / AI memory) |
| `lua_mod.db` | Variables and sheet data of Lua mods |
| `plugins.db` | Persistent KV storage of JS plugins |

## Message Processing Pipeline

After a message comes in from an adapter, it flows through these steps in order (`onMessage` in `main.cpp`; processing stops at the first step that handles it):

```
The adapter receives a message (self-echo deduplication already done in the adapter layer)
 1. Multi-bot silence: another bot was @mentioned and it isn't this bot's command → ignore
 2. Black / white lists: blacklisted user / group (or not allowlisted in allowlist mode) → ignore
 3. Group automation: matches an "auto kick / mute" keyword → act and stop
 4. Built-in commands: CommandRouter.handleMessage (including rule pack custom commands)
 5. JS plugin commands: commands registered by SealDice-compatible plugins
 6. Lua mod causal replies: msg_reply / msg_order of original mods
 7. Causal rules: condition + action rules configured in the WebUI
 8. Custom replies: keyword / regex replies
 9. JS non-command hooks: onNotCommandReceived / onMessageReceived
10. AI conversation / NPC: when on, triggered by @ / keywords / idle probability (background thread)
Unified delivery at the end: {self} resolution → AI polishing → AI translation → .link forwarding
             → logging → splitting / merged forwarding → adapter send
```

Replies that need AI post-processing are handed in full to the AI background worker thread (`ai_worker`), so AI request timeouts never block later commands.

## Hot Reload

Configuration hot reload is implemented by **file watching**: `HotReloadMonitor` watches the `config/` (and `data/`) directories for changes (ReadDirectoryChangesW on Windows) and reloads automatically, with no restart needed. Settings changed in the web panel are also saved and applied immediately. Decks / rule packs / plugins have their own reload interfaces (one-click reload in the panel).
