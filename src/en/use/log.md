# Session Logs

Dice!Next can record your sessions in a group. When you finish, it organizes the log, uploads it to the log site and sends it as a group file, so it's easy to look back at and archive.

## Command Overview

| Command | Description |
|------|------|
| `.log new [name]` | Create a log and start recording |
| `.log on` / `.log off` | Resume / pause recording |
| `.log end` | Stop recording, upload to get a link and send a group file |
| `.log halt` | Force-stop this recording (no upload) |
| `.log list [page]` | List the group's logs (paged) |
| `.log get [name]` | Upload a log again and get its replay link |
| `.log del <name>` | Delete a log |
| `.log stat [name]` | Statistics (messages / participants / time span / most active speaker) |
| `.log export [name]` | Only send the log as a group file (no log site upload) |
| `.log type txt/html` | Set the group file format (group admin or above) |
| `.log time` / `.log timer` | Session timer |
| `.log masterget <group ID> [name]` | The dice master gets the link of a log from another group |
| `.log` | Show the current recording state |

Subcommands without a name act on the group's most recent log.

## Workflow

```
.log new 第一章     → start recording (第一章 = chapter 1)
…play as usual…
.log off            → pause in the middle (break)
.log on             → resume (the reply quotes the message where you paused, so it's easy to find)
.log end            → stop, upload and send the group file
```

A group can only have one log in progress at a time; if a session goes wrong and you don't want to keep it, stop it with `.log halt`.

## What Gets Recorded

Whether recording happens is decided together by **the group master switch, the log feature switch and the log session state**. `.bot off` or `.bot log off` stop recording and the timer while keeping the session; after turning them back on, a log that was in progress continues recording, but a log paused by hand with `.log off` doesn't resume automatically. Messages sent while it was off are never added afterwards, and full disabling and blacklist restrictions still apply.

- Messages, dice results and image addresses are kept. With [log image saving](/en/manage/settings#image-settings) turned on, images can be cached locally and embedded when exporting HTML.
- When you stop, the log is uploaded to the log site automatically and a shareable replay link is returned; the log is also sent as a **group file**.
- The group file format is set by `.log type`: `txt` plain text (the default) or `html` a self-contained web page (with embedded images, which can be opened offline directly).

### QQ Official SN status line

The `.sn` status line at the top of QQ Official replies is only a stand-in for card names and repeats in every reply, so it is **not written to session logs**; the log only records the body of the reply. The chat window and `.link` forwarding still show the full reply.

### QQ Official stickers

- Custom stickers are recorded as images with the official attachment address. Image references in TXT, CSV and log site uploads use standard CQ codes, such as `[CQ:image,file=https://…]`.
- QQ's built-in emoji appear as `[表情]` (emoji) in text records; their names aren't inferred from emoji IDs yet.
- Old `<faceType=…>` markers in earlier records are converted when exporting; custom stickers can only be restored as images if the record kept the image address, and those without an address are shown as `[图片]` (image).
- When the log site's "sticker image filter" is on, old `<faceType=…>` markers and their HTML-escaped forms are filtered too; with the filter off, the original text is kept.

## Recording Logs Only

A group admin sets the feature switches, then starts recording with the usual log permissions:

```text
.bot on
.bot log on
.bot roll off
.bot reply off
.bot plugin off
.log new 第一章
```

After that, use `.log off/on` to pause or resume and `.log end` to stop. To go back to normal use, turn `roll`, `reply` and `plugin` on again as needed. AI, welcome messages, forwarding and automation have their own switches; turn them off too if you don't need them. This setup does not disable all admin or fun commands.

## Session Timer

```
.log timer on/off   → turn the group's session timer on / off
.log time           → show the accumulated time of the current log
```

When on, `.log new/on/off/end` automatically start / pause / add up the session time.

## Log Site Upload

- Logs are uploaded to the official log site `log-api.dice.zone` by default, using the **DiceNext zstd JSON protocol** by default; existing installations keep the protocol they saved before.
- Change the address and protocol in [System settings → Cloud services → Log site](/en/manage/cloud-services#log-site). `dice/logsite_format` can be `dicenext` (default), `seal` (SealDice V1), `seal_v105` (Parquet) or `legacy` (the old multi-part txt POST); when connecting to a self-hosted site, choose the protocol that site supports.
- When the upload target is **not the official site**, the reply link carries the note "The configured log site is not the official site; please check the link's safety yourself."

## Web Management

### Differences in sending files between platforms

`.log export` only exports the file and doesn't upload to the log site. Group file support on OneBot / Milky depends on the connected protocol client. The QQ Official Bot uses the rich media file channel, but sending files is still subject to account permissions, platform limits and the upload result, so a successful local export doesn't mean the platform received the file.

If the platform refuses or the file doesn't arrive, use `.log get` to upload and get the replay link, or download it from the web management below. Having the QQ Official APIs connected is not the same as end-to-end verification with real credentials; see [Adapter Configuration](/en/config/adapter#limits-of-the-qq-official-bot).

### Downloading and managing in the panel

In the web panel under **Data → Session logs → Log management** you can:

- See the history of all groups (name / creator / start and end time / message count / space used) and sort by any column
- The space used includes the content actually stored in the log database plus that log's local images in `data/logs/images`; image size is shown separately
- Export TXT or Excel (CSV), and download the HTML web version
- Upload to the log site manually to get a link, or delete a record after a styled confirmation; deleting also removes the log messages and locally cached images

The panel's group management also offers **group file viewing and downloading**, so you can get log files sent during sessions back from there directly.
