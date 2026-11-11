# Cloud Services & Identity

`.cloud` is the entry point for account center authorization, and `.bind` links chats on different platforms to the same real QQ account. If you only want to bind accounts, `.bind qq <your QQ number>` is enough; the bot chooses the verification method automatically, so you don't need to learn the email or OAuth commands first. Use `.cloud` when you need cloud character sheets: authorizing cloud sheets can also verify your real QQ along the way, whereas a binding-only authorization doesn't grant read or write access to cloud sheets.

## Why Binding Is Needed

The bot sees different identifiers on different platforms: OneBot gives the real QQ number, the QQ Official Bot only gives an isolated OpenID, and Discord and KOOK each have their own user IDs. Without binding, the same person is treated as different people in these chats, with separate character sheets, affection and attributes.

After binding, they all point to the same data: a sheet recorded in an official group also works when you go back to a OneBot chat.

## Binding Quick Start

In a **private chat** with the QQ Official Bot, Discord or KOOK, send:

```text
.bind qq 160703953
```

Replace the example number with your own QQ number. The bot chooses automatically based on **the current client's** configuration:

- **With a formal bot key**: OAuth is preferred. The bot privately sends you the account center authorization URL and code. Log in on the web page, approve the QQ identity verification, then send `.bind confirm` in the original private chat.
- **Without a key, but the dice master enabled SMTP**: a verification code is sent automatically to `yourQQnumber@qq.com`. Send `.bind confirm <8-digit code>` in the original private chat; you don't need to enter your QQ number again.
- **Neither configured**: the bot clearly tells you it is unavailable for now; it sends no email and doesn't complete the binding. Contact the dice master to set it up, or bind in reverse from OneBot / Milky.

With OAuth, the verified QQ of the authorizing account **must match the requested number**. A different number, no identity permission granted, or an account already bound to another QQ can't overwrite a binding. When OAuth fails, the bot never silently switches to email; if the dice master has configured SMTP, you can switch yourself with `.bind qq 160703953 email`. After switching, confirm with the email code; the old OAuth request becomes invalid.

The request and the confirmation must come from the same original platform user, in the same private chat on the same client. After the bot restarts or the request expires, start again.

## Cloud Character Sheets Quick Start

In a **private chat** with the bot, send:

```text
.cloud auth
```

The bot privately sends you a URL and a code. Open the URL, log in with your account center account, check which bot is asking, approve, then go back to the private chat:

```text
.cloud confirm
```

When you see "Authorization ready", you're done. If the reply includes your QQ number, your real QQ has been verified and bound.

::: tip Why authorization proves your QQ number
The account center only accepts all-digit QQ email addresses at registration, verified with an email code. So the prefix of the registered email is a verified real QQ number.
:::

## `.cloud` Commands

All `.cloud` commands only work in private chats.

```text
.cloud auth [write] // request account center authorization; read-only by default, add write to also request write access
.cloud confirm // after entering the code on the web page and approving, confirm here in the private chat
.cloud status // show the current authorization status
.cloud logout // clear the authorization stored on this bot
.cloud list // list your cloud character sheets
.cloud pull <cloud sheet ID> [local sheet name] // pull a cloud sheet into a local sheet
.cloud push <local sheet name> // upload a local sheet for the first time
.cloud sync <local sheet name> // submit changes against the last synced version
.cloud diff <local sheet name> // read-only comparison of base, local and cloud fields; doesn't change the sheet or the sync baseline
```

### Reading and writing

When a sync conflicts, use `.cloud diff <local sheet name>` first. Each item is listed as "base | local | cloud": `local` means changed only locally, `remote` only in the cloud, `same` changed identically on both sides, and `conflict` changed differently on both sides. Up to 30 items are shown; for long values, pull a separate copy with `.cloud pull <cloud sheet ID> <new sheet name>` to compare. This is only for yourself in a private chat; it never bypasses read locks, overwrites the sheet or advances the sync baseline.

Automatic sync and field-by-field conflict editing are still being designed and are not enabled. The current authorization does not mean you agree to automatic uploads, and after a token expires or the bot restarts you still need to authorize again.

By default only read permission is requested. To upload or sync, use `.cloud auth write`, and explicitly check write access on the web page too; it only takes effect when both sides agree. If you already authorized read-only, just run `.cloud auth write` once more.

### Scope and lifetime of authorization

| Item | Description |
| --- | --- |
| Scope | Per "adapter + bot account + platform + you", independent of groups |
| Several adapters | When you use both OneBot and QQ Official, you need to authorize once on each |
| Lifetime | Tokens are only kept in memory; authorize again after the bot restarts or the token expires |
| Local data | Authorizing again doesn't affect sheets already pulled locally or their sync links |

::: warning What the dice master can see after you authorize
Approving lets that bot read the QQ number verified when you registered with the account center. Bots are usually deployed by third parties, and the dice master running the bot can see that number. If you don't want this, revoke the authorization under "Authorized bots" in the account center.
:::

### Verification codes

Authorization codes are sent privately by the bot on their own. They never go through ordinary reply logs, AI processing, plugins, the chat simulator or saved session logs. Don't forward codes, and don't complete an authorization for someone else.

## `.bind` Commands

```text
.bind // show full usage
.bind qq <real QQ number> // start in a QQ Official / Discord / KOOK private chat; chooses OAuth or email automatically
.bind confirm // OAuth: after approving on the web page, confirm in the same private chat as the request
.bind confirm <8-digit code> // email: submit the code in the same private chat as the request, without re-entering the QQ number
.bind qq <real QQ number> email // choose or switch to email verification; requires the dice master to enable SMTP
.bind qq QQ-Official-<bot ID>:<OpenID> // run in a OneBot / Milky chat to link an official user
.bind qqgroup QQ-Official-<bot ID>:<group OpenID> // run in the target OneBot / Milky group; requires group owner or admin
.bind discord <user ID> // run in a OneBot chat
.bind kook <user ID> // run in a OneBot chat
.info [qq|qqgroup] // show the user or group identifier of the current chat and its bound endpoints
```

Before binding an account on a platform, that person must have sent at least one message to the bot on that platform: the bot can only bind identifiers it has seen, and can't write an OpenID out of thin air.

For `.bind confirm`, the verification method is decided by the request stored on the server: an OAuth request doesn't accept email codes, and an email request requires the code. The old forms `.bind email <QQ>` (request email) and `.bind qq <QQ> <code>` (confirm by email) still work for compatibility, but are no longer the main documented usage.

Reverse binding is a separate entry point from the email / OAuth flows:

- An official user first gets `QQ-Official-botID:OpenID` with `.info qq` in a private chat with the official bot, then runs `.bind qq <that identifier>` in **a OneBot / Milky chat of their own real QQ**.
- For an official group, get the group identifier with `.info qqgroup`, then the group owner or an admin runs `.bind qqgroup <that identifier>` **inside the target real QQ group**; group ownership can't be proven in a private chat.
- Discord / KOOK users first send a message to the bot, then run `.bind discord <user ID>` or `.bind kook <user ID>` in a OneBot / Milky chat of their own real QQ.

### Comparing the verification methods

| Method | Where | How it is proven |
| --- | --- | --- |
| Account center authorization | Any chat (authorize in a private chat) | The registered QQ email verified by the account center |
| OneBot session | OneBot / Milky | The protocol client provides the verified real QQ directly |
| Group owner or admin | Inside the target group | The initiator's permission is checked additionally when binding a group identifier |
| QQ email code | QQ Official / Discord / KOOK private chat | Receive the code at targetQQnumber@qq.com and submit it in the same private chat as the request |

Avatar verification has been retired; users are no longer asked to change their avatar. Email verification only applies to user accounts and does not prove group ownership.

### QQ email verification codes

The dice master must first fill in the SMTP server, port, account, password or authorization code and sender address under "System settings → QQ email binding verification", and turn the feature on. This is a global setting, separate from email delivery in "Notifications"; the recipient address is always generated from the target QQ number, and arbitrary addresses are not accepted.

- Usually port 465 uses implicit TLS, while port 587 turns that option off and enforces STARTTLS. The server must have a valid certificate; plaintext authentication is not supported.
- The SMTP password is not shown again after saving; leaving it empty when editing keeps the old password.
- A code is valid for 10 minutes and becomes invalid after 5 wrong attempts; sending a new code invalidates the old one, and after the bot restarts you need to request again.
- Each platform identity and each target QQ can receive at most 5 codes per hour, at least 60 seconds apart; at most 100 per hour globally.
- The code must be submitted in the original private chat and can't be used across users, clients or target QQ numbers. Code commands never reach plugins, AI, the chat simulator or session logs.
- A platform account already bound to another QQ can't overwrite the binding through the email flow.

Email verification never grants a cloud character sheet access token; for cloud services, still use `.cloud auth`. Don't receive or forward codes for others.

OAuth verification in `.bind` also only requests the email identity permission, and the verification token is discarded after success or failure. It is not the same as the cloud sheet authorization of `.cloud auth`.

## Cloud Character Sheets

A pulled cloud sheet is an ordinary local sheet: bind it in your game group with `.pc tag <local sheet name>`, and `.st`, `.ra`, `.sc` and Lua / JS plugins that read sheets all work as usual. Ordinary rolls and sheet edits make no network requests, so losing the network, logging out or cloud problems don't affect local play.

Syncing is manual; there is no automatic background sync.

### Conflicts and safeguards

- Uploads carry the real base version number. When the cloud copy has been changed by someone else, a conflict is returned; the bot doesn't retry or force an overwrite, and both sides' data are kept.
- Pulling never overwrites a local sheet that has been changed. You can save a separate copy for comparison with `.cloud pull <cloud sheet ID> <new name>`.
- After you rename a local sheet, it still writes back to the same cloud sheet; a local alias you chose doesn't overwrite the cloud sheet's name on the first sync.
- Historical duplicate rows with the same name, sheets without a name, unknown schemas and out-of-range values are explicitly rejected; the bot never guesses one to upload.

### Revoking

`.cloud logout` only clears the temporary credentials stored on this bot. To fully revoke the authorization, go to the "Authorized bots" page in the account center.

## What the Dice Master Needs to Set Up

Before players can use cloud sheets, the dice master must verify ownership of the bot in the account center and enter a formal API key for the current adapter under [Cloud Services → Bot key](/en/manage/cloud-services#bot-key). Automatically requested, unverified heartbeat credentials can't be used for cloud sheets. Don't share this key with players.
