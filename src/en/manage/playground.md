# Command Playground

**Web panel → Command playground** is a chat-style test bench: try commands and see how the bot replies right in the browser, without opening QQ / Discord.

## How to Use It

Choose the environment at the top, then type commands as if chatting (or click the quick buttons `.r`, `.ra 侦查 60`, `.coc` and so on):

| Option | Description |
|------|------|
| Scene | Group chat / private chat |
| Platform | QQ (OneBot v11) / Discord |
| Reply language | Follow the interface language (default; follows when you switch the panel language) / Default (follow the platform) / 简体中文 / 繁體中文 / English / 日本語 |
| Nickname | Nickname of the simulated sender (default "测试员", tester) |

## Same Pipeline as Real Messages

The playground reuses the command and reply processing chain, but it isn't the platform's real message delivery or renderer: looking fine in the web page doesn't mean the actual payload, permissions and attachment sending on QQ Official / Discord / KOOK have been verified. The main processing steps are:

1. Built-in commands
2. JS plugins
3. Lua mods
4. Custom replies
5. AI conversation / NPC (when enabled; group summaries and long-term memory are injected so you can preview them)

Finally replies also go through AI polishing and AI translation (when enabled), so you can preview the effect right after configuring AI. When no handler matches a command, a "no response" notice is shown.

## Doesn't Affect Real Data

Test messages use a virtual identity (user `10001`, group `100001`); they are never sent to any real group and don't consume trigger-based broadcasts (which only apply to real group messages). Data written by commands such as `.st` is recorded under this virtual identity.

::: tip
The playground is the first stop for troubleshooting: after changing custom replies, installing a new plugin or adjusting AI settings, try a message here first, then verify in a real group.
:::
