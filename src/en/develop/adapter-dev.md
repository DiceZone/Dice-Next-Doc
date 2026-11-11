# Adapter Development

Dice!Next uses a pluggable adapter architecture. To support a new protocol or platform, implement the `IAdapter` interface and register it with `AdapterManager`.

## Interface Definition

`IAdapter` lives in `server/src/adapter/adapter_interface.h`. Apart from a few pure virtual methods, most platform operations have **empty default implementations**, so a new platform can override only what it supports and still compile. Grouped by function:

### Identity and lifecycle (required)

```cpp
std::string id() const;         // unique adapter id
std::string name() const;       // display name
std::string platform() const;   // platform identifier, such as "onebot_v11"
std::string version() const;

bool configure(const json& config);   // configuration (endpoint / token and so on)
bool start();                         // connect to the platform
void stop();                          // disconnect and release resources
bool isConnected() const;
std::string lastError() const;
std::string getLoginId() const;       // logged-in account
std::string getLoginName() const;
```

There are also overridable `connectionStatus()` (fine-grained status, including the `"timeout"` state when reconnect back-off is paused) and `resumeConnection()` (manual resume, called by the WebUI "Reconnect" button).

### Sending and receiving messages

```cpp
void sendMessage(const Message& msg);                       // required
void sendReply(const Message& original, const std::string& replyText);
void onMessage(MessageCallback cb);                          // register the message callback
void onEvent(EventCallback cb);                              // notice / request events (empty by default)

// The following have empty / fallback defaults; override according to platform capability:
void sendGroupMessage(groupId, text);        // send a group message from the web panel
void sendGroupMessageCQ(groupId, cqText);    // text containing CQ codes ([CQ:at,..]/[CQ:image,..]); falls back to plain text by default
void sendPrivateMessage(userId, text);
bool sendGroupForwardMsg(groupId, nodes);    // merged forward; false = unsupported (the caller falls back to splitting)
void sendGroupPoke(groupId, userId);         // poke
```

### Approval and group management

```cpp
void setFriendRequest(flag, approve, remark);        // friend request approval
void setGroupRequest(flag, subType, approve, reason);// join / invitation approval
void setGroupKick(groupId, userId);                  // required
void setGroupBan(groupId, userId, durationSec);      // required
void leaveGroup(groupId);
void setGroupCard(groupId, userId, card);            // change the group card name (pass getLoginId() for the bot itself)
void setGroupName(groupId, name);
void setGroupSpecialTitle(groupId, userId, title);   // special title (requires group owner)
```

### Cache queries and refreshes

```cpp
std::string getGroupName(groupId) const;                       // required
std::vector<std::string> getGroupMemberList(groupId) const;    // required
bool isGroupAdmin(groupId, userId) const;                      // required
bool isGroupOwner(groupId, userId) const;                      // required

// Empty / unknown by default; override as needed:
std::vector<std::pair<std::string,std::string>> getGroupList() const;  // (id, name)
int getGroupMemberCount(groupId) const;
std::string getSelfRole(groupId) const;      // the bot's own role "owner"|"admin"|"member"
json getMembers(groupId) const;              // member list cache (native platform objects)
int getFriendCount() const;                  // -1 = unknown
std::vector<std::string> getFriendList() const;
void deleteFriend(userId);
void refreshGroupList() / refreshSelfRole(groupId) / refreshMembers(groupId);  // asynchronous refreshes
void requestGroupHistory(groupId, count);    // message history (results are raised as kGroupHistory events)
```

### Files and synchronous calls

```cpp
// Upload a group file (.log end uploads the log txt). content = raw bytes, compatible with remote / containerized protocol clients.
void uploadGroupFile(groupId, name, content, localPath = "");

// Call a platform API synchronously and wait for the response (request-response APIs such as group file lists / download links).
// Note: must not be called on the adapter's receiving thread (it would deadlock); intended for the WebUI's drogon handler threads.
json invokeAction(action, params, timeoutMs = 8000);
```

## Message and Event Model

```cpp
enum class MessageType { kPrivate, kGroup, kChannel };

struct Message {
    std::string id;             // unique message ID
    std::string platform;       // source platform (used for i18n language resolution)
    std::string content;        // plain text (CQ codes removed, used for command parsing)
    std::string rawContent;     // raw message (CQ codes as-is)
    std::string displayContent; // readable form (text/@xxx/[image]…), used for logs / the chat simulator
    std::string senderId, senderName;
    std::string targetId;       // group ID (the other party's id in private chats)
    std::string selfId;         // the bot account that received this message (for targeting among several bots)
    std::string adapterId;      // the receiving adapter id (for receipts / locating platform operations)
    std::vector<std::string> atList;  // @mentioned accounts ("all" = @everyone)
    MessageType type;
    int64_t timestamp;
    bool fromSelf;              // sent by the bot account itself (self-control switch)
    json extra;                 // extra platform data
};

enum class EventType {
    kGroupIncrease, kGroupDecrease,   // join / leave or kicked
    kFriendAdd, kFriendRequest, kGroupRequest,
    kPoke,                            // poke
    kGroupRecall,                     // group message recall
    kGroupHistory,                    // message history fetch result
    kGroupUpload,                     // group file upload
    kOther,
};
```

Events are raised through the `onEvent` callback as a `BotEvent` (with fields such as `flag` / `subType` / `operatorId`), consumed by approval policies, custom replies and the notification system.

## Registering an Adapter

Adapters are managed centrally by `AdapterManager`:

```cpp
auto adapter = std::make_shared<MyAdapter>(/* id */);
adapter->configure({ {"name", "MyBot"}, {"endpoint", "..."} });
adapterMgr.registerAdapter(adapter);
// AdapterManager dispatches messages / events from all adapters uniformly to the upper layers
```

## The OneBot v11 Reference Implementation

The built-in implementation `server/src/adapter/onebot_v11_adapter.h` supports two transport modes:

| `connection_mode` | Meaning |
|-------------------|------|
| `forward_ws` | Dice!Next acts as the **WS client** and connects to the OneBot endpoint |
| `reverse_ws` | Dice!Next acts as the **WS server** and waits for OneBot to connect back |

HTTP reporting mode is **not implemented** (configuring it reports an error). Disconnects come with exponential back-off reconnection (5s→60s; after repeated failures it enters the "Connection timed out" state, and you can reconnect manually in the panel). It is the best reference for developing adapters for other platforms.

## Adapter Configuration

Adapter configuration (written to `config/adapters.json`, or created in the panel):

```json
{
  "name": "MyBot",
  "type": "onebot_v11",
  "connection_mode": "forward_ws",
  "endpoint": "ws://127.0.0.1:3001/",
  "access_token": "",
  "enabled": true
}
```

## Debugging

- Create / enable / disable connections and see their status and logs in [Web panel → Adapters](/en/manage/adapter-manager).
- Verify command handling logic without connecting a platform in the [Playground](/en/manage/dashboard).

## Best Practices

1. **Thread safety**: message / event callbacks may fire on network threads; synchronize properly with the main logic.
2. **Reconnecting**: handle disconnects and reconnects carefully (see the OneBot implementation's back-off reconnection and frame reassembly).
3. **Self-echo**: filter out echoes of messages the bot sent itself (see `self_echo_filter.h`), or you'll get reply loops.
4. **Releasing resources**: `stop()` must close connections and release resources correctly.
5. **Logging**: use `spdlog` to record key connection / messaging events.
