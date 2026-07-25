# 适配器开发

Dice!Next 采用插件式适配器架构。要支持新协议平台，实现 `IAdapter` 接口并注册到 `AdapterManager` 即可。

## 接口定义

`IAdapter` 位于 `server/src/adapter/adapter_interface.h`。除少数纯虚方法外，大部分平台操作都有**默认空实现**——新平台按能力选择性覆写即可编译通过。按功能分组：

### 身份与生命周期（必须实现）

```cpp
std::string id() const;         // 适配器唯一 id
std::string name() const;       // 显示名
std::string platform() const;   // 平台标识，如 "onebot_v11"
std::string version() const;

bool configure(const json& config);   // 配置（endpoint / token 等）
bool start();                         // 连接平台
void stop();                          // 断开并释放资源
bool isConnected() const;
std::string lastError() const;
std::string getLoginId() const;       // 登录账号
std::string getLoginName() const;
```

另有可覆写的 `connectionStatus()`（细粒度状态，含 `"timeout"` 重连退避暂停态）与 `resumeConnection()`（手动恢复，WebUI「重连」按钮调用）。

### 收发消息

```cpp
void sendMessage(const Message& msg);                       // 必须实现
void sendReply(const Message& original, const std::string& replyText);
void onMessage(MessageCallback cb);                          // 消息回调注册
void onEvent(EventCallback cb);                              // 通知/请求事件（默认空）

// 以下默认空实现 / 回退，按平台能力覆写：
void sendGroupMessage(groupId, text);        // 网页后台发群消息
void sendGroupMessageCQ(groupId, cqText);    // 文本含 CQ 码（[CQ:at,..]/[CQ:image,..]），默认回退纯文本
void sendPrivateMessage(userId, text);
bool sendGroupForwardMsg(groupId, nodes);    // 合并转发，false = 不支持（调用方回退分段）
void sendGroupPoke(groupId, userId);         // 戳一戳
```

### 审批与群管理

```cpp
void setFriendRequest(flag, approve, remark);        // 好友请求审批
void setGroupRequest(flag, subType, approve, reason);// 加群/邀请审批
void setGroupKick(groupId, userId);                  // 必须实现
void setGroupBan(groupId, userId, durationSec);      // 必须实现
void leaveGroup(groupId);
void setGroupCard(groupId, userId, card);            // 改群名片（骰娘自己传 getLoginId()）
void setGroupName(groupId, name);
void setGroupSpecialTitle(groupId, userId, title);   // 专属头衔（需群主）
```

### 缓存查询与刷新

```cpp
std::string getGroupName(groupId) const;                       // 必须实现
std::vector<std::string> getGroupMemberList(groupId) const;    // 必须实现
bool isGroupAdmin(groupId, userId) const;                      // 必须实现
bool isGroupOwner(groupId, userId) const;                      // 必须实现

// 默认空/未知，按需覆写：
std::vector<std::pair<std::string,std::string>> getGroupList() const;  // (id, 名称)
int getGroupMemberCount(groupId) const;
std::string getSelfRole(groupId) const;      // 骰娘自身角色 "owner"|"admin"|"member"
json getMembers(groupId) const;              // 成员列表缓存（平台原生对象）
int getFriendCount() const;                  // -1 = 未知
std::vector<std::string> getFriendList() const;
void deleteFriend(userId);
void refreshGroupList() / refreshSelfRole(groupId) / refreshMembers(groupId);  // 异步刷新
void requestGroupHistory(groupId, count);    // 历史消息（结果以 kGroupHistory 事件上抛）
```

### 文件与同步调用

```cpp
// 上传群文件（.log end 传日志 txt）。content = 原始字节，兼容远程/容器化协议端。
void uploadGroupFile(groupId, name, content, localPath = "");

// 同步调用平台 API 并等待响应（群文件列表/下载链等请求-响应式接口）。
// ⚠️ 不得在适配器接收线程上调用（会死锁）；供 WebUI 的 drogon 处理线程使用。
json invokeAction(action, params, timeoutMs = 8000);
```

## 消息与事件模型

```cpp
enum class MessageType { kPrivate, kGroup, kChannel };

struct Message {
    std::string id;             // 消息唯一 ID
    std::string platform;       // 来源平台（用于 i18n 语言解析）
    std::string content;        // 纯文本（已去 CQ 码，用于指令解析）
    std::string rawContent;     // 原始消息（CQ 码原样）
    std::string displayContent; // 可读形式（文字/@xxx/[图片]…），用于日志/模拟聊天
    std::string senderId, senderName;
    std::string targetId;       // 群号（私聊为对方 id）
    std::string selfId;         // 收到此消息的机器人账号（多骰娘定向）
    std::string adapterId;      // 接收适配器 id（回执/平台操作定位用）
    std::vector<std::string> atList;  // 被 @ 的账号（"all" = @全体）
    MessageType type;
    int64_t timestamp;
    bool fromSelf;              // 骰娘账号自身发出（自控开关）
    json extra;                 // 平台附加数据
};

enum class EventType {
    kGroupIncrease, kGroupDecrease,   // 入群 / 退群·被踢
    kFriendAdd, kFriendRequest, kGroupRequest,
    kPoke,                            // 戳一戳
    kGroupRecall,                     // 群消息撤回
    kGroupHistory,                    // 历史消息拉取结果
    kGroupUpload,                     // 群文件上传
    kOther,
};
```

事件通过 `BotEvent`（含 `flag` / `subType` / `operatorId` 等字段）经 `onEvent` 回调上抛，供审批策略、自定义回复与通知系统消费。

## 注册适配器

适配器由 `AdapterManager` 统一管理：

```cpp
auto adapter = std::make_shared<MyAdapter>(/* id */);
adapter->configure({ {"name", "MyBot"}, {"endpoint", "..."} });
adapterMgr.registerAdapter(adapter);
// AdapterManager 会把各适配器的消息 / 事件统一分发给上层处理
```

## OneBot v11 参考实现

内置实现 `server/src/adapter/onebot_v11_adapter.h` 支持两种传输模式：

| `connection_mode` | 含义 |
|-------------------|------|
| `forward_ws` | Dice!Next 作为 **WS 客户端**主动连接 OneBot 端点 |
| `reverse_ws` | Dice!Next 作为 **WS 服务端**，等待 OneBot 反向连接 |

HTTP 上报模式**未实现**（配置该模式会报错提示）。断线自带指数退避重连（5s→60s，多次失败进入「连接超时」态，可在面板手动重连）。它是开发其他平台适配器的最佳参考。

## 适配器配置

适配器配置（写入 `config/default_config.json` 的 `adapters`，或通过面板新建）：

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

## 调试

- 在[管理面板 → 适配器管理](/manage/adapter-manager)新建 / 启停连接，查看连接状态与日志。
- 在[测试台](/manage/dashboard)可不连平台直接验证指令处理逻辑。

## 最佳实践

1. **线程安全**：消息 / 事件回调可能在网络线程触发，注意与主逻辑的同步。
2. **重连**：妥善处理断线重连（参考 OneBot 实现的退避重连与帧重组）。
3. **自回声**：骰娘自己发出的消息回声要过滤（参考 `self_echo_filter.h`），否则会形成回复循环。
4. **资源释放**：`stop()` 必须正确关闭连接、释放资源。
5. **日志**：使用 `spdlog` 记录关键连接 / 收发事件。
