# AI

**Web panel → AI** configures conversation, NPCs, knowledge, polishing, translation, vision and speech. Switches outside Models save immediately. Save text and parameter changes on the current page; drafts on other pages are not submitted. Knowledge is enabled by default, while explicit opt-outs are preserved and the AI master switch still applies.

::: warning Cost and latency
With AI on, the related features are billed by the models you configure, and replies processed by AI are delayed (depending on the network and model response speed). Set token / cost limits for every model. Every AI feature falls back on failure or timeout: polishing / translation send the original text, and conversation doesn't reply.
:::

## Models

### Master switch

"Enable AI" is the master switch for all AI features; when off, polishing, translation, conversation and everything else stop working (the other subpages are grayed out and tell you to turn it on on the "Models" page first).

### Global request parameters

Parameters shared by all AI calls (polishing / translation use a lower temperature to stay faithful): temperature, top_p, max tokens, frequency penalty and presence penalty.

Model settings are split into three tabs: **Providers → Models → Usage assignment**. Fill in the endpoints and keys first, then list the models you want to use, and finally decide which models each feature uses.

### Providers

Providers and models are added and edited in dialogs. Compact entries offer enable, edit and delete actions. Provider presets include DeepSeek, OpenAI, Claude, Volcengine and SiliconFlow; choose one to fill the endpoint, then enter its API key. Custom endpoints remain available. Claude uses its official OpenAI compatibility API without conflicting sampling options. Changes on Models take effect after saving the page.

A provider is one set of endpoint address and key, shared by all its models, so you don't need to repeat the key for every model from the same service.

| Field | Description |
|------|------|
| Name | A custom name, such as "OpenAI", "DeepSeek" or "Local Ollama" |
| Base URL | The OpenAI-compatible endpoint up to `/v1`, such as `https://api.openai.com/v1` |
| API Key | Can be empty for local models |

After a provider is disabled, none of its models are called any more. A provider still used by models can't be deleted.

### Models

Model presets include `deepseek-flash`, `deepseek-v4-pro` and SiliconFlow embedding model `BAAI/bge-m3`. Choosing a preset fills settings without automatically enabling paid features. Estimates use USD per million tokens. Verified 2026-11-11: DeepSeek peak, cache-miss rates are Flash $0.30 input / $1.20 output and Pro $1.32 input / $3.96 output; standard `BAAI/bge-m3` is free. Prices are editable. Check [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/) and [SiliconFlow](https://siliconflow.cn/pricing) for current billing and availability.

| Field | Description |
|------|------|
| Display name | A custom name, such as "GPT-4o mini" or "Local Qwen" |
| Provider | Chosen from those added on the "Providers" tab |
| Model name | Such as `gpt-4o-mini`, `qwen2.5`, `text-embedding-3-small` |
| Kind | **General model**: conversation, polishing, translation, image and speech recognition and so on; **embedding model**: only turns text into vectors, used for long-term memory retrieval |
| Supports image input | General models only. Must be on to be assigned to "Image recognition" |
| Input / output price | Price per million tokens, used for cost statistics (embedding models only have an input price) |
| Token limit / cost limit | 0 = unlimited; once exceeded, the model stops being called and the next model for the same usage is used automatically |

Each model shows the tokens used and total cost, and has a "Test" button: general models run one real conversation, and embedding models run one real embedding and show the vector dimension.

### Thinking, output budgets and off-peak prices {#model-request-options}

The model editor provides:

- **Thinking mode**: automatic, enabled or disabled. Automatic normally keeps provider defaults. When both model and vision settings are automatic, official DeepSeek vision disables thinking by default. An explicit vision choice overrides the model.
- **Parameter format and effort**: automatic uses `thinking` for official DeepSeek URLs or model names beginning with `deepseek`, and `reasoning_effort` otherwise. Relays can choose explicitly. Low, medium and high effort require provider support; leave thinking automatic if unsupported.
- **Output budget per request**: 0 uses the purpose default. A nonzero value overrides text-request budgets; vision uses the smaller of the model and vision budgets. This differs from cumulative token limits. Thinking and final text may share the budget, so allow enough tokens.
- **Input, output and cached-input rates**: USD per million tokens. Cached rates require upstream-reported cache-hit usage; other input uses the regular rate. Older settings without a cached rate inherit the input rate.
- **Off-peak pricing**: a daily interval, fixed UTC offset and input/cached-input/output rates. Regular rates apply otherwise. Selection uses request start time. Overnight intervals are supported: start is inclusive, end exclusive; equal endpoints mean no interval. The timezone is independent of browser/server time, with no daylight-saving adjustment.

These are local estimates, not changes to provider billing. Existing cumulative costs are not recalculated; the provider invoice is authoritative. Cumulative token/cost limits do not reset daily. Checks happen before a call, so concurrent or current calls can exceed the threshold. Reported usage is counted even for empty or truncated responses.

Save changes on the Models page. Vision thinking selection saves immediately; its budget and timeout save with the current page's parameters.

### Usage assignment

Reply, decision, vision, speech and embedding assignments are shown by default. Polishing, translation, summaries, fact extraction, NPC and mood assignments are under Advanced usage assignments.

Choose which models each feature uses:

| Usage | Description | When unassigned |
|------|------|----------|
| Conversation reply | The bot chatting in groups | The first enabled general model |
| Decision | Deciding whether to chime in before an idle remark (see "Conversation" below) | Uses "Conversation reply" |
| Polishing / translation | Reply polishing, `.lang` translation | Uses "Conversation reply" |
| Memory summary / fact extraction | Group history summaries, long-term memory extraction | Uses "Conversation reply" |
| NPC role-play | NPC replies (an NPC's own model takes priority when set) | Uses "Conversation reply" |
| NPC mood evaluation | Evaluating changes in an NPC's affection | Uses "NPC role-play" |
| Image recognition | Recognizing images in messages; only models with "Supports image input" | Uses the image-capable models of "Conversation reply" |
| Speech recognition | Turning voice into text | Unavailable |
| Embedding | Vectorization for long-term memory; only embedding models | Unavailable |

Each usage can have several models and a **strategy** (load balancing by default):

- **Load balancing**: picks the model with the fewest requests in progress each time, taking turns when tied.
- **Random**: picks one at random each time.
- **Priority order**: uses the first in the list, and only moves to the next on failure or when over its limit (reorder with the up / down arrows).
- **Weighted**: distributes requests in proportion to weights (1–100).

Whatever the strategy, a failed call automatically retries with the next candidate model (at most 3 per call). Conversations with tool calls only switch models when the first round fails, so actions such as rolling dice or changing sheets aren't executed twice.

::: warning Embedding can only use one model
Stored memory vectors and the vectors used at retrieval must come from the same model, so "Embedding" can only have one model. After changing the embedding model, clear long-term memory on the "Conversation" page so the vectors are regenerated.
:::

::: tip Upgrading from an older version
In older versions, each model had its own endpoint and key, and each feature chose models separately. On the first start after upgrading, this is converted automatically: models with the same "address + key" are merged into one provider, the models each feature used become the matching usage assignments, and the long-term memory embedding settings become one embedding model. The original settings before conversion are backed up in `ai_backup_v1` in `dice.json`.
:::

## Conversation

Let the bot chat in groups like a real person (group chats only).

### Triggers (three states)

- **@mentioning the bot**: always replies, regardless of cooldown.
- **Matching a keyword** (comma-separated, such as "骰娘, 在吗"): always replies, regardless of cooldown.
- **Idle probability** (0–100): other messages get a random reply by probability, limited by the "per-group cooldown (seconds)"; don't set it too high or the bot will interrupt often.
- **Decide before idle remarks**: when checked and the idle probability hits, the "Decision" model first judges whether to chime in right now (for example, someone is asking a question or the topic relates to the bot); if it says no, there's no reply. The decision only outputs a very short result, using less than generating a reply directly, so it suits a cheap, fast model for "Decision". @mentions and keyword matches skip this decision.

### Generation parameters

Context rounds (recent chat history read from the group as context), maximum reply length, per-group cooldown seconds, whether to @ the sender when replying, whether to forbid emoji in the output, custom filter words (watermarks / signatures / spam removed from the text before it is sent to the AI), and the persona and system prompt (leave empty for the built-in default, or click "Load default" to edit the template).

### Group history memory (rolling summary)

Open Stored group summaries or Stored facts to view a large memory dialog. Select a group and search its nodes; the relationship graph displays eight nodes per page. Select a node to view, edit or delete it. Fact edits regenerate embeddings and retain the original on failure. Deleting a summary preserves its folding watermark so old messages are not immediately summarized again. Background folding does not overwrite an intervening summary edit or deletion.

Once the conversation goes beyond the recent window, older chat is compressed in batches into a group summary injected as background, so the bot remembers things from further back. Summaries use the "Memory summary" model; you can configure the kept rounds (folding batch size), the summary length limit and the summary prompt, and view / clear each group's stored summary on the page. The model is only called once enough messages have slid out of the window to make a batch (naturally rate-limited and cost-controlled).

### Long-term memory (persistent facts, vector retrieval)

Facts worth remembering long term (character sheets / plot / agreements) are extracted from the conversation, vectorized and stored; while chatting, the most relevant few are retrieved by similarity to the current topic and injected. You first need to add a model with the kind "Embedding model" on the "Models" page (such as `text-embedding-3-small`) and assign it under "Usage assignment → Embedding"; extraction uses the "Fact extraction" model. You can configure the number retrieved (Top-K), the similarity threshold, the per-group fact limit and the extraction prompt, and view / clear stored facts as well.

### Tool calls

When on, the bot uses function calling to call real features instead of making up numbers (the model must support tools):

| Tool | Description |
|------|------|
| `roll_dice` | Roll dice through the real dice engine |
| `draw_deck` | Draw from a deck |
| `get_attr` | Read the sender's character sheet attributes |
| `set_attr` | Write to the sender's character sheet (risky, off by default) |
| `run_command` | Run any command / plugin (with the sender's permissions) |
| `search_help` | Look up entries in the help documents; searches the knowledge base instead when it is on |

"Max tool rounds" limits chained calls, and the last round is forced to output a text reply. Only takes effect when "Conversation" is on.

### AI allowlist (access control)

When on, only allowlisted groups / private chats can use AI conversation and NPCs; non-allowlisted groups are refused even if a group admin sends `.ai on`, preventing unauthorized groups from using up API costs. Add entries by searching and checking them from the group / player lists. The allowlist only controls conversation / NPCs / group memory; reply polishing and translation are global features and unaffected.

### Image recognition (multimodal)

The bot downloads and validates images before uploading Base64 image data. Direct link forwarding is no longer offered. The default per-image limit is **1024 KB**, configurable from 1–8192 KB. Oversized, unavailable or unsupported images are skipped with a logged reason. File size is not a token count; vision charges also depend on resolution and model.

Use an image-capable model assigned to Vision. Cache identity includes image contents, the vision prompt and candidate models. When a decision is required, image recognition runs first and its description is supplied to the decision model. Recognition failures explicitly tell the conversation model that the image was not read.

#### Empty or incorrect image descriptions? {#vision-empty-result}

Vision defaults to **2048 output tokens** and a **60-second timeout**, configurable under AI → Conversation & Memory → Vision, instead of a fixed 300-token budget. Official `deepseek-flash` accepts images. Automatic mode disables its vision thinking; increase the budget and timeout if you enable thinking.

Logs distinguish output-limit exhaustion, reasoning without final text, empty text, refusal and HTTP errors, and identify the model, finish reason and actual request budget. Failures try backup models for that purpose, up to three candidates. If all fail, incomplete descriptions are not cached and reasoning is not used as a description.

Each submitted image records a content fingerprint, size and associated message. Follow that chain through the model result, decision and final reply. Fingerprints are not image URLs; Base64 and keys are not logged. Different fingerprints indicate different inputs, but identical inputs do not guarantee correct recognition. Prompt, model-request or vision-setting changes invalidate cached interpretations. Per-request temporary files are isolated across bot processes sharing an OS temporary directory.

### Speech recognition

When someone sends a voice message in a group, the "Speech recognition" model turns the voice into text, which is then used for trigger checks and replies (for example, a keyword spoken in the voice message can trigger a reply). It needs a model supporting the OpenAI-compatible `/audio/transcriptions` endpoint, such as Whisper or SiliconFlow's SenseVoice; add it as a general model on the "Models" page, then assign it to "Speech recognition".

- **OneBot (NapCat and similar)**: the mp3 is obtained through `get_record`. When the bot and NapCat aren't on the same machine (such as with Docker), turn on NapCat's option to return base64, or the voice file can't be read.
- **Discord**: voice attachments are downloaded directly.
- Each voice message costs one extra request to the speech recognition model; the same voice message is only transcribed once.

## Knowledge Base

**AI → Knowledge Base** lets the bot answer questions like "how do I use…", "is there a feature for…" or "what are the group rules" from real sources, while adding as little model usage as possible:

- **Retrieval happens locally**: keyword scoring (BM25), without calling a model to rewrite the question or decide whether to search. Around ten thousand entries take a few dozen milliseconds per search.
- **Only a few relevant pieces are injected**: only the top passages whose relevance reaches the threshold are added to the prompt, with a total length limit; casual chat with no relevant material adds nothing.
- **FAQ direct answers**: when a custom entry has "Answer directly" checked and the question is similar enough to one of the entry's phrasings, the entry content is sent as-is, **without calling the model at all**.

### Sources

| Source | Content |
|------|------|
| Help entries | Every entry in the help system: built-in commands, rule packs, plugins and custom help documents. Read directly at search time, so help changes take effect immediately |
| DiceNext documentation | The usage guides from this documentation site, installed with the program; no internet connection needed |
| Custom entries | Material you enter on the knowledge base page: group rules, world setting, FAQ and so on |

### Settings

| Setting | Description |
|------|------|
| Max passages injected | The most passages added to the prompt per conversation (1–8, default 3) |
| Relevance threshold | 0–1; material is only injected when it covers this proportion of the question's keywords (default 0.45). Raise it for fewer irrelevant passages, lower it to find more |
| Injection length limit | Total length of injected material per conversation (default 1200), controlling input tokens |
| FAQ direct answer / similarity | Replies directly when the question's similarity to a phrasing reaches this (default 0.6) |
| Semantic search (custom entries) | Also compares vector similarity for custom entries, so differently worded questions are still found. Requires an embedding model assigned under "Usage assignment → Embedding"; each search makes one embedding request |

### Custom entries

Each entry has a title, content, phrasings (one per line), tags and an "Answer directly" switch. Phrasings and the title carry more weight in retrieval, and FAQ direct answers compare against the phrasings. You can import in bulk from a JSON file: an array of entries, or `{"entries": [...]}`, where each entry can contain `title`, `content`, `questions`, `tags` and `direct`. Entries are saved in `data/knowledge/entries.json`.

### Retrieval testing

Enter something a player might ask on the page to see which material it matches, the relevance of each, how much text would be injected, and whether an FAQ direct answer would trigger. It uses the current (unsaved) settings on the page, which makes tuning the thresholds easy.

When the knowledge base is on, the `search_help` tool also searches the knowledge base instead. Questions searched during conversation have the "trigger keywords" (such as the bot's name) removed first.

## NPC Role-play

Define NPCs (name / persona / background knowledge / trigger words). When a group message mentions an NPC's name or matches a trigger word, the bot replies with that NPC's identity, tone and knowledge (reusing memory and tool calls, taking priority over the default bot conversation). Use it to play an innkeeper, a mysterious informant and so on.

Each NPC can have: trigger words (besides the name), its own model (optional), restricted groups (such as `onebot_v11:123456`; empty = all groups), and a persona and background knowledge (information only the character knows). With **mood memory** on, the NPC keeps an affection value (-100 to 100) and mood for each player, and its tone changes with the relationship; after each interaction the model evaluates the change in affection (one extra request).

## Reply Polishing

Before roll / check replies are sent, a large language model polishes them according to the persona and situation. Two modes:

- **Polish wording only**: keeps the numbers / results and only changes the phrasing.
- **Add role-play description for the situation**: adds role-play narration on top of the result.

You can set the persona / style and the system prompt (use "Load default" to edit it). The model must keep the original numbers and success / failure results exactly: the server checks the numbers and falls back to the original text automatically if they were changed, and on failure or timeout the original is sent too.

**Coverage**: polishing and translation both take effect by checked categories: rolls / checks, deck draws, fun commands (today's luck / insanity / random names and so on), custom replies and plugin results.

## Reply Translation

Works with `.lang` to provide custom languages: first define a language on the page (name + switching keywords, such as the name "German" and keywords "de, german, 德语"), then send `.lang <keyword>` in a group / private chat to switch. Replies are generated in the default language first, then translated into the target language by the model before sending (cached, so the same text isn't billed twice). The translation prompt can use the `{lang}` placeholder for the target language name. On failure or timeout the original is sent automatically; switching back to a built-in language or `.lang clr` stops translation.

## Chat Commands

`.ai on/off` turns the group's AI features (conversation / NPC) on or off per group; see [Admin commands](/en/use/admin). With allowlist mode on, `.ai on` is refused in non-allowlisted groups too.

::: tip AI never slows down commands
All model calls run serially in a separate background queue and never occupy the message thread: even if the AI endpoint hangs for 30 seconds, ordinary commands still reply instantly. When too much piles up, new AI tasks are dropped (no conversation reply, polishing falls back to the original).
:::

## Troubleshooting: DEBUG Logs

INFO logs correlate the trigger, chosen model, vision or transcription output, decision and reason, generated reply and outgoing msgID. Text-only messages use the same chain. Direct triggers and disabled decision checks are identified explicitly. Message logs report delivery success or failure. Neither image Base64 nor API keys are logged. DEBUG provides additional request and context detail.

Set the minimum recorded level under "WebUI Settings → Console log" to **DEBUG** to see every step of AI processing:

- Trigger checks: @mentions, which keyword matched, the idle probability roll; the decision model's judgment and reasoning.
- Model selection: the usage, strategy, attempt order, and which model was switched to after a failure.
- The full content of each request (system prompt, context, user message, tool list), the model's reasoning and reply, and the raw response on failure.
- Tool call arguments and results, and image / speech recognition results.
- Knowledge base retrieval: the number of entries scored, time taken, matched material and relevance, and FAQ direct answers.
- Memory upkeep: which messages were folded this time, the updated summary, extracted facts, skipped duplicate facts, and retrieved memories with their similarity.

The model's reasoning (`<think>` sections or the `reasoning_content` field) is only written to the log and never sent to groups.

::: warning DEBUG logs contain chat content
The DEBUG level records the full content of group messages, character sheets and so on (API keys are never written). Set it back to INFO when you're done investigating.
:::

::: tip Preview in the playground first
On the "Command playground" page you can send `.r` or chat messages to preview polishing / translation / conversation directly, without joining a group. See [Command Playground](/en/manage/playground).
:::
