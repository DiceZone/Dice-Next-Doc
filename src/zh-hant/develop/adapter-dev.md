<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 適配器開發

Dice!Next 採用插件式適配器架構。要支援新協議平臺，實現 `IAdapter` 介面並註冊到 `AdapterManager` 即可。

## 介面定義

`IAdapter` 位於 `server/src/adapter/adapter_interface.h`。除少數純虛方法外，大部分平臺操作都有**預設空實現**——新平臺按能力選擇性覆寫即可編譯通過。按功能分組：

### 身份與生命週期（必須實現）

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

另有可覆寫的 `connectionStatus()`（細粒度狀態，含 `"timeout"` 重連退避暫停態）與 `resumeConnection()`（手動恢復，WebUI「重連」按鈕呼叫）。

### 收發訊息

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

### 審批與群管理

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

### 快取查詢與重新整理

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

### 檔案與同步呼叫

```cpp
// 上传群文件（.log end 传日志 txt）。content = 原始字节，兼容远程/容器化协议端。
void uploadGroupFile(groupId, name, content, localPath = "");

// 同步调用平台 API 并等待响应（群文件列表/下载链等请求-响应式接口）。
// 注意：不得在适配器接收线程上调用（会死锁）；供 WebUI 的 drogon 处理线程使用。
json invokeAction(action, params, timeoutMs = 8000);
```

## 訊息與事件模型

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

事件通過 `BotEvent`（含 `flag` / `subType` / `operatorId` 等欄位）經 `onEvent` 回呼上拋，供審批策略、自訂回覆與通知系統消費。

## 註冊適配器

適配器由 `AdapterManager` 統一管理：

```cpp
auto adapter = std::make_shared<MyAdapter>(/* id */);
adapter->configure({ {"name", "MyBot"}, {"endpoint", "..."} });
adapterMgr.registerAdapter(adapter);
// AdapterManager 会把各适配器的消息 / 事件统一分发给上层处理
```

## OneBot v11 參考實現

內建實現 `server/src/adapter/onebot_v11_adapter.h` 支援兩種傳輸模式：

| `connection_mode` | 含義 |
|-------------------|------|
| `forward_ws` | Dice!Next 作為 **WS 客戶端**主動連線 OneBot 端點 |
| `reverse_ws` | Dice!Next 作為 **WS 服務端**，等待 OneBot 反向連線 |

HTTP 上報模式**未實現**（配置該模式會報錯提示）。斷線自帶指數退避重連（5s→60s，多次失敗進入「連線超時」態，可在面板手動重連）。它是開發其他平臺適配器的最佳參考。

## 適配器配置

適配器配置（寫入 `config/adapters.json`，或通過面板新建）：

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

## 除錯

- 在[管理面板 → 適配器管理](/zh-hant/manage/adapter-manager)新建 / 啟停連線，檢視連線狀態與日誌。
- 在[測試臺](/zh-hant/manage/dashboard)可不連平臺直接驗證指令處理邏輯。

## 最佳實踐

1. **執行緒安全**：訊息 / 事件回呼可能在網路執行緒觸發，注意與主邏輯的同步。
2. **重連**：妥善處理斷線重連（參考 OneBot 實現的退避重連與幀重組）。
3. **自回聲**：骰娘自己發出的訊息回聲要過濾（參考 `self_echo_filter.h`），否則會形成回覆迴圈。
4. **資源釋放**：`stop()` 必須正確關閉連線、釋放資源。
5. **日誌**：使用 `spdlog` 記錄關鍵連線 / 收發事件。
