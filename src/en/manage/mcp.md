# MCP Server

**Web panel → System settings → MCP server**. This is the server that lets external AI clients call Dice!Next's capabilities; it is independent of the bot's own AI conversation and tool calling settings.

::: info Development feature
This page describes the first version of the MCP server. Before using it, make sure both the main program and the WebUI include the feature; installing an older WebUI or main program doesn't give you the API.
:::

## What It Can Do

| Tool | Capability | Limits |
| --- | --- | --- |
| `roll_dice` | Roll dice with the real Dice!Next math parser, returning the result, each die's value and the process | Such as `d100`, `2d6+3`; doesn't run OneDice / DiceScript scripts, plugins or templates |
| `search_help` | Search loaded help documents | Returns the original text, at most 20 items, with long bodies truncated; variables or code in documents are never run |
| `get_status` | Query version and uptime | Never returns keys, accounts, connection addresses or the full configuration |
| `get_character_card` | Read explicitly authorized character sheets | Authorized per specific sheet ID, respects read locks, and doesn't evaluate formulas or change bindings |

The first version **does not offer** tools to send messages, change character sheets, run arbitrary commands / plugins, change settings, or restart or update the program. Text in help and character sheets is data, and the AI shouldn't treat it as new authorization to act.

## Creating an Authorization

1. Log in to the panel as the dice master and open **MCP server**. Restricted admins can't read or change the authorizations on this page.
2. Click **Create credential**, enter a label for the application / user, and choose the allowed tools and the validity period (1–365 days, default 30).
3. To read character sheets, search by sheet name or owner user ID and explicitly check specific sheets. Leaving it empty never grants "all character sheets".
4. After creating, save the credential in the AI client. **The plaintext is shown only once**; it isn't saved in the browser, and the server only persists a SHA-256 digest. If lost, regenerate it, or revoke and create a new one.
5. Turn on **Enable MCP server** and save. Creating a credential doesn't turn the server on by itself.

Changes to the tool / sheet scope, disabling, revoking and expiry checks are all re-evaluated on every request, without relying on the client disconnecting.

- **Editing an authorization** keeps the original expiry by default; only turning on "Recalculate validity" renews it for the entered number of days from the time of saving, and an expired credential is never quietly revived.
- **More actions → Regenerate credential** on a client entry rotates it in place. The old credential stops working immediately and the new plaintext is shown only once; the tool / sheet scope, enabled state and expiry are unchanged. Remember to update the AI client's configuration.
- After a sheet is deleted or read-locked, you can still disable the credential, remove the sheet permission or revoke the authorization. When a sheet's owner changes, the authorization isn't transferred automatically: remove the authorization for that sheet and save first, then choose it again explicitly.

MCP-specific credentials can't replace the WebUI cookie, BDC keys or the management API key, and those credentials can't be used to log in to MCP either.

The authorization list shows expiry status by **server time**, updates periodically while the page is open, and highlights entries expiring within 7 days, unaffected by clock drift on the browser's computer. There is no automatic renewal and no separate expiry notification.

"Successful calls still retained" only counts successful tool calls among the 5,000 audit records currently kept, excluding initialization, self-checks and authorization changes. No records doesn't mean it was never used; when the audit store can't be read, this is stated clearly rather than pretending "never used".

When editing sheet permissions, selected sheets show their name, owner and current read status. Deletion and read locks both show "the character sheet doesn't exist or is read-locked" without guessing the exact reason; a change of owner prompts re-authorization. Only sheet summaries are queried here; attribute contents are never returned.

### Saving, timeouts and recovery

The page waits up to 10 seconds for reads and 20 seconds for changes. A network interruption or timeout **doesn't mean the change failed**: the page pauses further changes and offers "Check operation status", and never repeats creating or rotating credentials automatically.

After checking the status, the configuration and credential list are read from the server again; if that read fails, the operation lock and the original edits are kept, and the old list is never shown as the latest state. You can check again later.

- Still processing: check again later; don't submit again.
- Saved, but the one-time credential wasn't received: find the entry in the list, confirm, then "Regenerate credential" manually; lost plaintext can't be read again.
- Didn't take effect: you can submit again after checking.
- Status unknown: the program may have restarted or the temporary status record may have been cleaned up. Check the current settings and credentials first; don't treat "unknown" as failure. Status records are only kept temporarily, at most 128, and never store credential plaintext.

The configuration is saved atomically as a single file. If you see "The change took effect, but the call record couldn't be saved", the permission change is in effect and a new credential can still be saved normally; check write permission and free space for `data/audit`, and don't repeat the operation you just did.

### After restoring from a backup

When the configuration or main database is restored, **the MCP master switch and old authorizations are disabled, and old keys stop working**, so a backup can't bring back keys that were already revoked. Authorization names, tools and sheet scopes are kept for the dice master to review.

1. Open MCP server and review the retained authorization scopes.
2. For entries you still want to use, choose "Regenerate credential", store the new plaintext safely and update the AI client.
3. Explicitly enable the authorizations you need; expired ones also need their validity recalculated.
4. Turn on and save the MCP master switch. Turning the master switch back on or editing authorizations alone can never make old keys valid again.

Restoring only resources such as decks, images and plugins, without overwriting the configuration or main database, doesn't reset MCP authorizations. On Windows and other platforms alike, the core applies the restore at startup. If writing the configuration or database snapshot fails, startup is aborted and the restore protection marker is kept; retry after fixing the storage, and don't delete the marker by hand to bypass the protection.

## Connecting a Client

The server uses **Streamable HTTP** at the path `/mcp`. A client on the same server can use the `http://127.0.0.1:port/mcp` shown on the page; remote clients should use a reachable HTTPS address. When a reverse proxy has a path prefix, keep the prefix.

The following are generic connection parameters, not a configuration file format every client shares; enter the URL, transport type and headers as your client requires:

```json
{
  "transport": "streamable-http",
  "url": "http://127.0.0.1:18088/mcp",
  "headers": {
    "Authorization": "Bearer <MCP_TOKEN>"
  }
}
```

You don't need to install Node / Python on the bot's machine, and you don't need to enter a model API key on this page. The calling side must support HTTP MCP with a custom bearer credential; clients that only support local stdio can't connect to this entry directly. The first version doesn't offer automatic OAuth login.

The sessionless `2026-07-28` protocol is supported, as well as initialization compatibility with `2025-11-25` and `2025-06-18`; the old HTTP+SSE endpoint and stdio startup aren't provided. Protocol messages and headers are built by the MCP client, so users don't need to write them by hand.

## Local and Remote Access

### Local connection self-check

The connection guide offers a **local connection self-check**. Without a credential, it checks the saved server switch, whether the audit store is writable and whether any usable credential exists. You can enter an existing MCP credential to further verify initialization and the tool list in the local protocol handler, and check whether a particular tool is allowed.

The self-check never creates temporary authorizations, runs tools or connects to arbitrary URLs. The credential you enter is only used for this check and cleared afterwards; it isn't saved in the browser, written to logs or echoed in the result. Invalid, disabled, revoked or expired credentials all show "credential rejected"; rate limiting or a failed panel request is never misreported as an invalid credential.

::: warning Passing the self-check doesn't mean it works from the internet
The self-check only verifies the local protocol logic. It doesn't verify that the listening port is reachable, public DNS, TLS certificates, the reverse proxy or browser origins. You still need to test the real address in an actual AI client; a passed self-check can't replace verifying the remote connection.
:::

### Configuring access scope

Remote access is off by default: only loopback connections are accepted, requests carrying proxy forwarding information are rejected, and `Host` is checked too. This is a per-request restriction and doesn't change the WebUI's existing listening address.

- Remote access must be turned on explicitly, with an exact Host allowlist such as `dice.example.com` or `dice.example.com:8443`. No `*`, protocol or path.
- Public entries should use HTTPS. Direct remote plaintext requests are rejected; when a local reverse proxy terminates TLS, the dice master must make sure the public entry only offers HTTPS and restrict access to the backend's plaintext port. Remote plaintext connections are never trusted because of a forged `X-Forwarded-Proto`.
- Even when a local reverse proxy connects from a loopback address, explicitly restrict `/mcp` in the proxy; don't treat "local mode" as a substitute for public access control.
- Native clients usually don't send `Origin`. If a browser client needs cross-origin access, set an exact origin such as `https://ai.example.com`; no browser origin is allowed by default, `null` and wildcards aren't accepted, and cookies are never used for MCP authentication.

Host names are case-insensitive; browser origins are normalized for case and merge the default HTTP / HTTPS ports (80 / 443). This doesn't relax subdomain or non-default port restrictions; for example, `https://ai.example.com:8443` still needs its own authorization.

The management page's cross-site protection and the MCP client origin allowlist are independent: authorizing an AI web page to access `/mcp` doesn't authorize it to change the bot's MCP settings. Keep the browser's `Origin`, `Sec-Fetch-Site` and `X-Dice-MCP-Request` headers in your reverse proxy, and don't open cross-origin writes to `/api/system/mcp`. Native calls with the management API key can still use JSON requests.

## Call Records and Limits

The page offers server-side paged call records, keeping the most recent **5,000** persistently. You can filter by client and by success / rejected / failed result in combination, and counts and paging are based on the filtered results. Click a client name in the records to see that client's history; records of revoked clients can still be filtered. The authorized client, operation, time and result are recorded; **credentials, request parameters and sheet contents are never stored**.

Each credential is limited to 60 requests per minute, with additional rate limiting per connection source. A single request is at most 32 KiB and a result at most 64 KiB; math expressions are at most 256 bytes, 16 levels of parentheses, 1,000 random values and 1,000,000 sides per die, and integer overflow returns an error instead of continuing. Help search scans at most 10,000 entries / 4 MiB of text per call and explicitly returns `search_truncated` when it hits the limit. When a query fails, is revoked or exceeds permissions, no other tool is run as a fallback.

Tools and management requests use separate background work queues, each with a bounded waiting queue. When busy or queued for more than 5 seconds, `503` is returned instead of piling up and blocking the web server threads. Each credential can only have one tool call queued or running at a time; other concurrent calls return `429` without running the tool, and can be retried after the previous one finishes. Connection initialization and tool list queries don't take this slot.

Tool execution also has a 5-second cooperative cancellation deadline, and queries are notified to cancel when the program exits; results aren't returned after expiry or cancellation. C++ threads are never killed forcibly; system / database calls that can't be interrupted at a low level have to return before the cancellation state is checked. Authorization is checked again after the query finishes, so results that were revoked / disabled or narrowed in the meantime are never returned to the client.

Call records are stored in `data/audit/mcp.db`; when you choose "Audit records" in a backup, an SQLite snapshot includes the current records without stopping the server.

Common errors: `401` check the dedicated credential, its validity and whether it's enabled; `403` check the access source, Host / Origin and tool / sheet authorization; `429` try again later; `503` check whether it's busy and the audit store, and for management changes check the operation status first; `404` confirm the MCP master switch, the endpoint address and the protocol / methods the client supports.
