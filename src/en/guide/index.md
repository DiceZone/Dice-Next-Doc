# Getting Started Overview

Welcome to **Dice!Next 3.0**, a next-generation TRPG dice bot.

## What is Dice!Next?

Dice!Next is a complete rewrite of Dice!. The original single-DLL CoolQ plugin has been rebuilt as a modern application with a separate backend and frontend:

- **Backend (C++)**: built on the drogon framework, providing an HTTP REST API and WebSocket push
- **Frontend (React)**: a single-page management panel built with Vite, shadcn/ui and Tailwind CSS
- **Protocol layer**: OneBot v11 works out of the box (forward / reverse WS), and the pluggable adapter architecture lets you add more protocols

## Key Features

| Feature | Description |
|------|------|
| <Icon name="dices" />Full dice support | COC7 / DND / BRP checks and house rules, Fate dice, hidden rolls, bonus and penalty dice, compatible with the original commands |
| <Icon name="languages" />Multiple languages | Replies in Simplified Chinese, Traditional Chinese, English and Japanese, with custom language packs |
| <Icon name="layout-dashboard" />Web panel | Groups, players, decks, rules, logs, scheduled tasks, notifications and more, all managed in the browser |
| <Icon name="puzzle" />Extension ecosystem | Compatible with original Dice! Lua mods and SealDice JS plugins; rule packs import in one step |
| <Icon name="bot" />AI enhancements | Optionally connect a large language model for reply polishing, translation, conversation, NPC role-play and tool calling |
| <Icon name="package" />Unzip and run | The Windows package ships its runtime libraries: double-click to start, stays in the system tray, can start with Windows |
| <Icon name="zap" />Hot reload | Configuration changes take effect automatically; settings changed in the panel are saved immediately |

## Quick Links

- [Installation](/en/guide/install): download, run and upgrade
- [Quick Start](/en/guide/quickstart): get going with Dice!Next in 5 minutes
- [Data Migration](/en/guide/migration): migrate data from the original Dice!
- [Deployment & Operations](/en/guide/deploy): long-term operation, backups and security
- [Troubleshooting](/en/guide/troubleshooting): what to do when the bot won't open, won't connect or crashes

## System Requirements

| Scenario | Requirements |
|------|------|
| Running a release package | 64-bit Windows 10 / 11 (common runtime libraries are included in the archive) |
| Linux / Docker | Linux amd64 / arm64 release packages and Docker images; see the release notes for deployment details |
| Building from source | Visual Studio 2019+ / cmake ≥ 3.20 / vcpkg; see [Building from Source](/en/develop/build) |

## About This Version

Dice!Next 3.0 is currently in **public beta** and is open source under the AGPLv3 license. Please report problems through [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues).
