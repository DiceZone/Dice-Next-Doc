# Cloud Services

**Web panel → System settings → Cloud services** manages the bot's cloud service connections, authorization and sync.

## Bot Key

1. Verify ownership of the bot in the [account center](https://account.dice.zone/dashboard/bindings) and generate a formal API key.
2. In "Bot key configuration", choose the matching adapter, enter the key and save.
3. Configure the heartbeat, cloud blacklist or cloud character sheet features below as needed.

Each adapter stores its key separately. The key entry on the platform connection page still works, and both places edit the same configuration; existing settings don't need to be entered again. Existing keys only show their last four characters; leaving the field empty changes nothing, and the key is only deleted when you explicitly choose to clear it and save.

The bot API key is different from the WebUI management API key and the platform connection Access Token; don't mix them up. An automatically obtained, unverified heartbeat key can't replace the formal key required for cloud character sheets.

## Heartbeat Reporting

Turn on the heartbeat service, save, then click "Test now" to see the most recent report time and result. The default service is [heart.dice.zone](https://heart.dice.zone); you can also enter a self-hosted address.

- **Dice master info**: nickname and QQ are optional. When both are empty, the automatic reading rules from the dice master list and player profiles apply; once filled in, the manual information is used.
- **Public listing**: controls whether the bot appears on the heartbeat plaza and in search; it isn't the same as turning the heartbeat service off.
- **Report interval**: 180–480 seconds, default 240; reports immediately on going online, then keeps alive periodically.
- **Offline status**: a normal exit reports offline; crashes or network loss are detected by the server's timeout.

## Cloud Blacklist

Configure the sync switch, service address, separate token, automatic reporting of local bans, minimum danger level and sync interval; you can see the latest result and sync immediately.

When the separate token is empty, the old heartbeat token is used for compatibility, then the bot key configured for the adapter; you don't have to turn on the public heartbeat listing just for the cloud blacklist.

- Reported records first wait for cloud verification and only take part in distribution after passing.
- Valid records that meet the danger level threshold are merged into the local blacklist and show a cloud blacklist label.
- Revoking in the cloud only removes the corresponding cloud source record and never deletes local blacklist entries the dice master added independently.

[Permissions](/en/manage/permissions#cloud-blacklist) keeps local blacklist management and the cloud labels; cloud connection and sync settings are managed on this page.

## Cloud Character Sheets

After the dice master configures a formal bot key, players authorize with `.cloud auth` in a **private chat with the bot**; it is read-only by default, and writing requires `.cloud auth write` plus confirmation in the account center.

The panel never authorizes on behalf of players and never shows player tokens. Pulling, uploading, syncing and revoking are all done by players with `.cloud` commands; see [Cloud Services & Identity](/en/use/cloud).

Sync is currently manual: the local sheet is still the data used during play, authorization must be repeated after a token expires or the bot restarts, and conflicts never force-overwrite either side.

## Log Site

Configure the target address and protocol for logs uploaded by `.log end` / `.log get`, and restore the defaults if needed.

The default official address is `log-api.dice.zone`, and the default protocol is the DiceNext zstd JSON protocol (`dicenext`). You can also choose SealDice V1 (`seal`, zlib JSON), SealDice V105 (Parquet) or the old multi-part txt protocol (`legacy`); match it to what the target site supports. Existing installations keep their saved protocol choice.

Unofficial addresses show a third-party site notice. Before configuring one, make sure you trust the service, since uploads send session records to the chosen site. For usage, see [Session Logs](/en/use/log).

## Where Other Settings Are

- Image hosting, image sending and log image saving are still in [Settings](/en/manage/settings#image-settings), with the same configuration scopes as before.
- Notification windows and delivery are in [Notifications](/en/manage/notice); AI and program updates still have their own entries.
- Old panel links such as `#/settings?tab=cloud` still redirect; you can also search "cloud services", "heartbeat" or "cloud character sheets" in the top bar to go straight to the relevant cards.
