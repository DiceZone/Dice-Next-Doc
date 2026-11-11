# Data Migration

Migrate convertible data from the original Dice! (V2) to Dice!Next. The migrator keeps the old directory and never copies login credentials or WebUI passwords.

::: warning Current scope
This is not a feature that moves the old data directory into the new version as-is. The original Dice! and Dice!Next differ in storage structure, campaign model and plugin runtime. After importing, keep the old directory and verify character sheets, campaigns, logs and plugins in a test group.
:::

## What Can Be Migrated

The importer parses the raw files of an original Dice! data directory directly (including the binary `.dat` / `.RDconf` formats), converts them and writes them into Dice!Next:

| Old data | File | Migrated to |
|---------|------|--------|
| Character sheets | `user/PlayerCards.RDconf` and valid backups | The unified character sheet store: attributes, original names, sheet types, expressions, locks and sheet bindings; old attribute names are supported and global scopes are converted automatically |
| User data | `user/UserConf.dat` | Player profiles (nickname / trust level / affection) and Lua-compatible user settings; group nicknames are kept separately |
| Group settings | `user/ChatConf.dat` / `ChatConf.RDconf` and valid backups | For the selected account: group off/ignore states, reply/command switches, COC house rules and welcome messages; plugin variables keep their types |
| Blacklist | `conf/BlackList.json` | Valid local user bans; revoked or invalid records are not revived, and unknown cloud sources and group / associated-person policies are listed in the confirmation report |
| Custom replies | `conf/CustomMsgReply.json` | Keyword replies (random among results / text); restrictions that cannot be converted exactly are disabled by default, and content that fails runtime validation is kept only as the original text |
| Custom texts | `conf/CustomMsg.json` | Reply text overrides (written to the Simplified Chinese layer); `strBotMsg` / `strBotHeader` become the [.bot additional info](/en/manage/settings#botmsg-additional-info), keeping the original text and appending the default feedback information to BotMsg |
| Custom help | `conf/CustomHelp.json` | Written as Simplified Chinese help entries that can be edited and deleted under "User-defined" in [Help Documents](/en/manage/help-docs); the original content is kept and not treated as invalid text |
| Masters | `conf/console.yaml` / `Console.xml` | The Master list and supported runtime settings of the selected account; YAML takes priority, and outdated XML permissions are not used when YAML is damaged |
| External decks | `PublicDeck/` | Moved into `data/decks/` after validating the JSON content; nested files with the same name get unique, safe names, and local media dependencies that can be located are migrated too |
| Lua mods | `mod/` | `data/mod/` (copied as a whole tree and recognized by the Lua mod subsystem) |
| Lua plugins | `plugin/` | `data/plugin/` (single-file and directory plugins are copied separately) |
| Cross-group links | `conf/LinkList.json` | The new `.link` message forwarding: `with/to/from` links between ordinary QQ groups and their paused state |
| Notification windows | `conf/NoticeList.json` | QQ private / group notifications of the selected account with the original level masks; old shared windows can be managed with `.notice status/off` |
| Custom sensitive words | `conf/CustomCensor.json` | Sensitive word filtering in System settings: the numeric levels from Ignore to Critical are kept; filtering is turned on automatically when there are rules |
| Campaign sessions | `user/session/*.json` | A random 16-character campaign ID is generated and the source is recorded; re-importing the same source reuses it, early records or directory copies need confirmation before linking, and roulette only restores the remaining pool |
| Session logs | `user/log/*.txt` and the log state inside sessions | The new log store: text records are migrated and the in-progress / paused / ended state is restored |

::: tip Notes
- Custom texts and help are only written to the **Simplified Chinese** layer; other languages keep the texts built into Dice!Next.
- Old text keys (`strXXX`) that have a verified counterpart in the new version with compatible runtime parameters are mapped automatically, for example dice results, success levels, decks, campaigns, observers and welcome messages. **Keys without a counterpart or with incompatible parameters are not lost**: they are kept as "invalid text" that you can view in the web panel and port by hand.
- Scalar custom settings of users and groups are kept in the Lua-compatible settings space. This does not mean every original built-in feature behaves the same in the new version, but old Lua rules can still read these values.
- Booleans, decimals, empty strings and serializable structures in user and group variables keep their types. Old functions are not executed, and fields that cannot be connected equivalently are listed in the report.
- Decks are validated by content, not just by file extension; non-deck files are still skipped with a reason.
- Native skill values on character sheets follow the new rule system; keeping boolean / nested originals does not mean they will be treated as integer skills.
- Old binary files are fully validated against both the 64-bit and 32-bit `size_t` layouts before anything is written to the database, and a failed attempt leaves no partial records. Old functions are not executed, nested functions are also listed in the pending report, and the original bytes stay in the old file.
- Old Lua Set variables get their set methods back, and set changes in user, group, campaign settings and character sheets are written back; ordinary JSON arrays are never treated as Sets on a guess.
:::

### Reading, writing and exporting character sheets

Registered aliases such as `STR` and `HP` can read the original fields on old sheets, without rewriting the sheets in bulk first. If the original name and the standard name hold different values, both are kept and the migration report flags the conflict. Decide according to your rule system; the migrator never picks one value to overwrite the other.

Expressions use the unified character sheet data, so native commands, Lua and JS read the same values. Editing, deleting, clearing and switching sheets no longer make old expressions reappear from a compatibility copy. Clearing removes text, decimal and structured attributes, but keeps metadata such as the name, type and lock.

- When a sheet only has plain integer attributes, `.st export` still uses the original `.st 力量50 …` form (力量 = STR).
- When it has expressions, text, decimals or structured attributes, it outputs `json {...}`, which you can import again with `.st json {...}`. This replaces the editable attributes of the current sheet and respects the write lock; reading the export respects the read lock.
- Command JSON is limited to 256 fields and 64 KiB; for very large sheets, use the full JSON sheet export. Raw JSON sheet exports and cloud sheet data never drop conflicting fields.

### Early campaigns and directory copies

When the migrator finds an existing campaign that was imported earlier with the same name in the same group, or a directory copy of the same original, it pauses migrating that campaign and its related logs, and the report is not shown as fully complete. The panel lists the candidates:

1. If it is the same campaign, choose the existing campaign and apply the link, keeping the original campaign ID and current variables.
2. When data overwriting is off, existing variables are not overwritten; to replace them with the old values, turn overwriting on explicitly and confirm.
3. If it really is a different campaign, you can explicitly create a new, separate campaign. By default the migrator never guesses a merge and never quietly adds a new one.

Each time you confirm and continue, a new restore backup is created first. Character sheets and old campaigns still use the shared compatibility space, so choosing an account does not mean all data is isolated per account.

### Backups of migrated images

Full backups, and partial backups with "Resource images" checked, include the root `image/` directory and the media migrated with decks. The new backup format is version 4, and restoring it also restores these resources. Formats 1–3 are still supported; restoring an old package does not wipe root images it doesn't contain. Backup and restore never follow symbolic links or Windows reparse points.

## Limits and Data Not Yet Migrated Automatically

The following items are on the migration improvement plan. Until the corresponding version is released, the importer keeps the original files in the old directory and never deletes them:

| Old location / data | Current handling | Reason and next steps |
|---|---|---|
| `user/GameTable.toml` | Not migrated separately | It only stores the old auto-increment counter; new campaign IDs use unpredictable random codes, so it can't be reused. |
| Private chat, discussion group and channel links in `conf/LinkList.json` | Not migrated | The new `.link` only forwards between ordinary groups; QQ group links that map safely are migrated automatically. |
| Observers, decks and tables inside old sessions | Original kept, needs confirmation | The full session original and these fields are stored as compatibility information; parts with no equivalent live state are not enabled automatically. The report clearly separates "kept only" from "connected". |
| Directories created by plugins, arbitrary custom files | Not yet migrated | The `plugin/` contents are copied; arbitrary locations written by plugins at runtime cannot be interpreted safely. |
| `CustomReply.json`, `CustomRegexReply.json` | Supported | When the newer `CustomMsgReply.json` is missing or empty, they are converted into new keyword / regex reply rules. |
| Inviter, activity time, license / ban-exempt / ignore and other group states | Not yet migrated | Only settings with a clear and safe counterpart in the new version can be migrated. Old cached group names are kept as compatibility information and never directly overwrite the group name read by the current adapter. |
| Group entries, associated persons and external / cloud blacklist sources | Kept and reported | Valid local user records such as `local/ban/kick` can be migrated; records whose source can't be proven, or that involve old ban-exempt / trust policies, never become local penalties. |
| Tasks, Git/WebUI credentials and outdated cloud settings in the console | Not migrated | Runtime switches with a clear counterpart can be imported; executable tasks and sensitive credentials must be set up again rather than carried over from the old environment. |
| `selfdata/` | JSON connected, other formats kept as originals | Top-level JSON archives move into `data/self_data/`; other formats and nested paths are not presented as active and are listed in the confirmation report. |
| `CardTemp/`, external word lists in `conf/censor/` | Original files kept | Stored in `data/legacy-import-preserved/`; old scripts are not executed and unconfirmed word lists are not enabled. |
| Root `image/` | Media migrated | Local media keep their relative paths; deck references that can't be located safely keep their original text and are reported. Files outside the chosen directory are never read, and links are never followed. |
| Daily statistics and historical usage counts | Not connected to the statistics system | The old statistics are measured differently and can't be treated as new measurements. Keep the old directory for reference. |

## Custom Texts and Help

The original Dice!'s custom texts and help are mostly in Simplified Chinese, so the importer **only writes `zh-Hans`**; this is intended. Traditional Chinese and English keep using the built-in Dice!Next texts.

- `strXXX` texts with a one-to-one slot in the new version are connected to that template; level replies and native command templates you have already set still apply in their existing priority.
- Verified old placeholders (such as `{pc}`, `{deck_name}`, `{game.log_name}`) are converted into new placeholders during migration. Old templates whose required parameters no longer exist in the new version (such as the log name and file name templates of the old `.log off/end`) are not forced in.
- Texts with no equivalent slot, or whose placeholders can't be converted safely, are stored under "Invalid text" in the web panel. They are not lost and are not presented as active.
- Whenever new text slots are added, this invalid text is checked again; keys with a clear semantic counterpart are added to the mapping, and the rest stay for the dice master to handle by hand.

The new [replies by check result](/en/manage/commands#full-replies-by-check-result) inherit the existing texts by default. They never write overrides automatically, clear migrated texts or require re-importing. Compatible full templates and success-level phrases keep working; the new inheritance chain is only used when you actively configure new level replies.

The following check text gaps have been filled, so you don't need to rewrite old short phrases into full replies for the new levels:

| Old text | Compatible handling in the new version |
| --- | --- |
| `strRollCriticalSuccess/strRollExtremeSuccess/strRollHardSuccess/strRollRegularSuccess/strRollFailure/strRollFumble` | Six separate level phrases for single-round checks, not mixed with multi-round phrases |
| `strCriticalSuccess/strExtremeSuccess/strHardSuccess/strSuccess/strFailure/strFumble` | Still used as level phrases for multi-round checks and SAN |
| `strRollSkill/strRollSkillReason` | Check prefix; consecutive multi-round checks add the prefix only once |
| `strRollSkillHidden` | Group receipt for hidden checks, without revealing the detailed result sent privately |
| `strSanityRoll` | Keeps the full SAN template and the old meanings of the `rank/loss/change/final` variables |
| `strEnRoll/strEnRollNotChange/strEnRollFailure/strEnRollSuccess` | The base growth text, no change, change on failure and change on success are kept separately, and references update when the base text changes |
| `strEnDefaultName` | Default skill name for growth checks |

Nested `sample`, `case` and `grade`, as well as references to mapped old texts (such as `{strEnRoll}`), are supported. Executable macros such as JavaScript, Python and waits are never executed. When condition fields or variables have no counterpart, the report marks the text as "partially compatible"; unsupported macros, incomplete syntax and circular self-references keep the original text for manual migration. **This is not a claim of full coverage of every old template macro.**

Newly imported compatible texts keep the `legacy.strXXX` original and never overwrite an existing target with different content. "Backup & Import" in the web panel lets you view and download an item-by-item report that separates connected, partially compatible, kept only and skipped due to conflicts. "Connected" means the text was mapped to a text slot successfully; it does not mean it replaced a newer reply with higher priority.

On the first start after upgrading, existing databases automatically restore historical orphaned slots that can be matched safely, and fix the early single-round phrase mapping of `dice.crit/dice.fumble`. Both global and persona records are kept, and existing targets are never overwritten (including targets deliberately set to empty). The repair record is stored permanently, so after you restore defaults, the next start does not bring back the cleared old texts. Gaps with no reliable old original still need to be re-imported, and the repair record is not a live audit of the current configuration.

## Compatibility Limits of Old Commands

Dice!Next implements the old syntax directly on top of the new storage, permissions and plugin management; it does not run a parallel copy of the old core. The migration points verified so far:

| Original syntax | Dice!Next behavior |
|---|---|
| `.h` / `.H`, `.rh`, `.rs` | The short hidden-roll aliases and the final-value-only output are kept; `.help` is not captured by `.h` |
| `.coc/.coc7`, `.coc6`, `.cocd/.coc7d/.coc6d` | Generate 7th edition, 6th edition and detailed character results respectively; the old layout flag `s` is accepted |
| `.help on/off`, `.jrrp on/off`, `.reply on/off` | Saved per group, using the existing group admin / trust permissions |
| `.drawh` | Sends the draw result in a private chat and leaves only a hidden-draw receipt in the group |
| `.pc nn/stat/cpy/copy/grp/tojson/type/temp` | Connected to the unified character sheets and rule system; the copy order is `target=source` |
| `.rule set <book>`, `.ruleset clear` | Connected to the unified rulebook setting; both setting and clearing check group admin permission |
| `.mod list/on/off/info` | Connected to the unified plugin list and per-group switches; updating, reloading, deleting and reinstalling are only confirmed in the WebUI |
| `.user state/trust/tojson/diss` | Connected to the unified player profiles, permissions and lists; `diss` does not delete profiles or sheets |
| `.strXXX <text/show/reset/NULL>` | Only audited one-to-one text keys are written to the unified override table; unknown `str…` commands are not swallowed |
| `.cloud update/black` | Not reproduced. In the original these two only reported status and pointed to a web page. Use `.bot` without arguments for the version number, and the cloud blacklist switch is in "System settings" on the web panel. `.cloud` is now the entry for account center authorization and [cloud character sheets](/en/use/cloud) |

::: danger Deliberately not reproduced
- `.system cmd`: the old remote shell, as risky as remote code execution.
- `.user kill/clr`: irreversible deletion of players or sheets from chat; confirm it twice in the web panel instead.
- `.mod update/reload/del/reinstall`: plugin files are never replaced or deleted from chat.
:::

JS plugins are compatible with **SealDice (`sealdice-core`)**, not the old Dice! JS. For hooks, fields and limits, see the [JS Plugin API](/en/develop/js-plugin-api).

## Migration Steps (Web Panel)

1. Put the original Dice! data directory (**the level that contains `conf/` and `user/`**) on the machine that runs Dice!Next.
2. Open Web panel → **System settings → Backup & restore → Import legacy data**.
3. Enter the **full path** of that data directory and choose the OneBot / Milky account to migrate into. The shared compatibility layer only writes the OneBot shared settings; identities such as QQ Official OpenIDs can't be derived from old QQ numbers.
4. Existing Next data is kept by default. Overwriting resource files and overwriting the database / configuration are two separate options; turning on data overwriting asks for confirmation again, and texts in other languages are never deleted.
5. Click "Start import". The server creates a restore backup first; if the backup fails, the migration does not start.
6. Review the failed, disabled, conflicting and "kept only" items in the report. Migrated Lua plugins are not executed by the importer; reload them in Plugins after you have checked them.

The REST endpoint is `POST /api/legacy/import` with the parameters `{ "dir": "path", "overwrite": false, "overwrite_data": false, "target_adapter_id": "account ID" }`. Without a target account, the OneBot shared compatibility layer is used.

A successful API response does not mean the migration fully succeeded: check `data.ok`, `data.complete`, `data.errors` and `data.diagnostics`. A partially failed report is still returned so that the results of completed stages are not lost. The BDC migration marker can only be removed after a fully successful migration.

## Migration Report

### Normalizing reply references

The importer first imports decks, help and global texts, then processes references in replies and in cooldown / daily-limit messages based on the resources that actually exist. Unambiguous references are converted automatically:

- `{deck}` / `{%deck}` → `{deck:deck}` / `{deck:%deck}`, keeping the draw-without / with-replacement rule within the current reply and referring only to file decks.
- Help entries → `{help:entry}`; old global texts → `{text:text name}`.
- Context variables such as `{nick}` and existing explicit prefixes stay unchanged, escaped content is not rewritten, and every branch of nested `sample:` is processed. No cards are drawn and no dice are rolled during import.

When a variable and a resource share a name, a reference matches several types, or no resource is found, the original text is kept and the reason is reported. Only old replies that still have references awaiting confirmation keep the bare deck lookup for compatibility. New replies use explicit prefixes so that adding a deck later can't unexpectedly override an existing expression or help reference.

Text that looks like a dice expression is also listed for confirmation: when an old bare expression fails to evaluate, the original text is kept, whereas an explicit `roll:` that fails shows `?`, so these can't be replaced automatically based on characters alone. Once you know the intended meaning, add `roll:` by hand.

`replyReferences` in the import result contains the numbers of conversions, ambiguities and missing resources, plus the rule, location, original text, target and reason for each reference. The web page can expand the details or download a JSON report. Keep the report and fix the pending items according to their actual purpose.

Rules that were already imported can be imported again from the original data: rules with an identical complete definition are upgraded in place instead of being duplicated, and the on/off state and priority set by the dice master are kept. After you add the missing resources later, importing again also tries to normalize old references that were still pending.

When the import finishes, it returns the counts for each item, including:

- Character sheets (and the users involved), player profiles, blacklist entries, custom replies, help entries, texts (with a separate count of "invalid text") and Masters
- **Succeeded / failed / skipped** details for decks, mods and plugins (with a reason for each file)
- Group settings: the number of imported settings and the groups involved; the numbers of cross-group links, notification windows, sensitive word rules, campaign sessions, logs and log messages

The page shows the result of each item, a campaign / log summary, and where the restore backup and report are stored. Large numbers of records are truncated on screen, and the full report can be downloaded. The report is also saved on the server in `data/legacy-import-reports/` and may contain the originals of old rules, so don't publish it directly.

## Things to Note

- **Before migrating**: back up the entire old data directory, and make sure the machine running Dice!Next can access it.
- **Repeatable imports**: new migration records use a stable source identity, so campaigns from the same source are not added twice. Existing data is kept by default. Logs only get complete appended messages added automatically; if the original body was rewritten or a message was edited in the new version, the current state is kept and reported. Old import records without source information need manual confirmation; they are never deleted on a guess.
- **Damaged files**: binary files for character sheets, users and groups are fully validated before that kind of data is written. If the main file is damaged, valid backups are tried; if all are damaged, an error is reported and truncated content is never treated as a success.
- **Partial failures**: the import is not one atomic transaction over the whole directory, so some stages may already have been written. Check the report and, if necessary, restore the backup made before migrating. The old source directory and the originals awaiting confirmation are all kept.
- **After migrating**: in the [Playground](/en/manage/dashboard) or a test group, check that dice rolls, checks and custom replies behave as expected.
- Some command syntax has been normalized in Dice!Next; see [Dice & Checks](/en/use/dice) for the differences.

## Migrating Cleanup Settings

The original Dice!'s `InactiveUserLine` / `InactiveGroupLine` are **local record retention periods**. They are imported into `dice/user_record_days` / `dice/group_record_days` respectively, and can be found under "Local record retention" in Settings. They never turn on deleting friends or leaving groups. For what gets cleaned from user profiles and the group list, see [Settings](/en/manage/settings#automatic-cleanup-of-friends-groups-and-local-records).

`GroupClearLimit` maps to the per-round limit on groups left. In old group settings, "免清" (cleanup-exempt) maps to cleanup exemption, "忽略" (ignore) stays fully disabled and cleanup-exempt, and "免黑" (ban-exempt) maps to ban exemption. The applicable `GroupInvalidSize`, `LeaveBlackQQ`, `ListenGroupKick`, `ListenGroupBan`, `KickedBanInviter` and `BannedBanInviter` settings are imported the existing compatible way. Items not written in the console file keep the Dice!Next defaults (automatic banning on kick / mute is off by default). When data overwriting is not allowed, existing settings take priority.

Early versions of Dice!Next mistakenly mapped `InactiveUserLine` to the number of days before deleting friends. Newer versions fix this for future imports, but never guess and reset friend deletion settings that are already saved. If you migrated from the original Dice!, check "Friend command inactivity period" and set it to 0 if you don't want friends deleted. Existing "auto leave group" scheduled tasks are never reconfigured, disabled or deleted by the migrator.
