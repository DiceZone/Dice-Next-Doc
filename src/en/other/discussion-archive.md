# Discussion Archive

> This page only keeps design discussions that haven't been confirmed yet, and **doesn't mean anything is scheduled, promised or in development**. Features that enter the Roadmap are governed by the Roadmap page's "Changelog" or explicit in-progress entries.
## 2026-08-11 · Webhook receiving mode for QQ Official Bot 2.0 (low priority)

### Conclusion

Webhook can be compatible with the existing QQ Official Bot 2.0 adapter, and the implementation is a medium amount of work, but the deployment barrier for users is clearly higher than with the Gateway WebSocket. Most current Dice!Next users don't have a public HTTPS callback address, so this item is kept only as a low-priority option and doesn't enter the near-term development schedule; the default receiving method stays the Gateway WebSocket.

### Gateway WebSocket vs. Webhook

| Aspect | Gateway WebSocket (current) | Webhook (candidate) |
| --- | --- | --- |
| Public entry point | Not needed; Dice!Next connects to the QQ Gateway actively | A public HTTPS address reachable by the QQ platform is required |
| Deployment difficulty | Low; works on home networks, dynamic public IPs and private networks | Medium to high; usually needs a domain, certificate, reverse proxy or cloud relay |
| Connection maintenance | The client handles heartbeats, reconnection and session resumption | No long connection, but callback verification, platform retries and request timeouts must be handled |
| Event structure | QQ 2.0 standard events `op/t/d/id/s` | The same event structure as WebSocket; the existing event dispatch can be reused |
| Multiple accounts | Each adapter maintains its own Gateway session | The HTTP entry must route to the right adapter by the verified application identity |
| Duplicate events | Mainly duplicates pushed during reconnection | Must deduplicate by event ID so platform retries don't execute commands twice |
| Security focus | Token, Gateway session and connection state | Signature verification of the raw body, time window, replay protection, rate limiting and body size limits |
| Suitable for | Ordinary users, local deployment, Docker, environments without a public address | Deployments that already have public HTTPS services, a unified gateway, or restrictions on long connections |

### Future Implementation Scope

- Add a separate Webhook HTTP receiving layer without duplicating the QQ adapter's business logic.
- Complete the official callback address verification, and verify the raw request body according to the official rules before parsing JSON.
- Normalize Webhook and Gateway events into one form and hand them to the existing `dispatch()`, identity resolution, commands, logs and reply flow.
- Support safe routing for several QQ Official Bot accounts, without trusting an unverified AppID in the request body alone.
- Keep deduplication records with an expiry by event ID; respond to callbacks quickly and process potentially slow commands asynchronously.
- Add the "Gateway WebSocket / Webhook" receiving method and its required configuration to the WebUI, plus documentation on HTTPS, reverse proxies and troubleshooting.
- One adapter enables only one receiving method by default; if dual-channel failover is allowed in the future, both must share the event deduplication mechanism.

### Effort Estimate

- Minimum viable version: about 1–2 development days, covering single-account callbacks, verification, signature checking and reuse of the existing event dispatch.
- A complete version for public testing: about 3–5 development days, adding multiple accounts, retry deduplication, WebUI, tests and deployment docs.
- Automatically applying for domains, certificates or tunnels isn't recommended for the main program; building such infrastructure in would take an estimated extra 1–2 weeks and bring ongoing operating costs.

### Start Conditions

There is clear user demand and the target users have stable public HTTPS callback capability; or Dice!Next later provides a separate, sustainably maintained cloud event relay service. Implementation doesn't start until these are met.

## 2026-08-02 · Cross-platform identity and group data linking (draft, not decided)

### Goal

Let QQ Official Bot, Discord, KOOK and other platform accounts, after verifying control of a real QQ account, link to existing historical data under `QQ:<real QQ>` and `QQGroup:<real group number>`, while keeping compatibility with old plugins that use QQ / group numbers as keys.

### Current Direction

- The dice master logs in to the original OneBot bot account at least once, saving the visible group list, member QQ numbers, owner / admin roles and collection time as a historical verification snapshot.
- When a user starts binding on a new platform, they first declare the numeric QQ number to link. If OneBot is online, a short-lived, one-time verification code is sent to that QQ in a private chat; if OneBot is offline, it's sent to the `QQnumber@qq.com` mailbox. A successful code only proves the user controls that QQ identity.
- After verification, the new platform's "adapter + original user ID" is linked as an alias to `QQ:<real QQ>`, and unified identity resolution reads the existing personal data instead of copying, concatenating or overwriting old records.
- A verified historical group owner can link their new-platform group to the historical `QQGroup:<real group number>`: the system first checks that this QQ was the owner in the OneBot historical snapshot, then generates a one-time group binding code that must be confirmed in the target group on the target platform. When OneBot is online, the role snapshot should be refreshed first; when offline, only time-stamped historical verification results can be used.
- Group linking only inherits data entry points such as character sheets, games, log links and rule / business settings; it **doesn't inherit** kicking, leaving groups, admin lists or old group management permissions. Management operations on the new platform always follow the current roles readable on the new platform; when the QQ Official Bot has no role API, group admin permissions aren't granted.
- Scenarios with no OneBot at all can still use virtual QQ / group keys and two-sided one-time codes to create a logical link, but can't claim that the logical group has been verified as a real QQ group.

### Still to Decide

- The sending service, rate limits and failure messages for QQ mailbox codes, and whether the QQ mailbox must be activated.
- When the target platform can't read group roles, whether a verified historical owner may complete data linking directly, or the dice master must also confirm in the WebUI.
- Conflict handling and a reversible merge flow when both sides already have personal / group data.
- The validity period and refresh frequency of the historical owner snapshot, and handling after permissions change.
