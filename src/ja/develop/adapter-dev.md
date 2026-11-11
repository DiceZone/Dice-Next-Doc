# アダプター開発

Dice!Next はプラグイン式のアダプター構成を採用しています。新しいプロトコルやプラットフォームに対応するには、`IAdapter` のインターフェースを実装して `AdapterManager` に登録します。

## インターフェースの定義

`IAdapter` は `server/src/adapter/adapter_interface.h` にあります。いくつかの純粋仮想関数を除き、ほとんどのプラットフォームの操作には **何もしない既定の実装** があるため、新しいプラットフォームでは対応する機能だけを上書きしてもコンパイルできます。機能ごとに分けると次のとおりです。

### 身元とライフサイクル（実装が必須）

```cpp
std::string id() const;         // アダプターの一意な id
std::string name() const;       // 表示名
std::string platform() const;   // プラットフォームの識別子（"onebot_v11" など）
std::string version() const;

bool configure(const json& config);   // 設定（endpoint / token など）
bool start();                         // プラットフォームに接続
void stop();                          // 切断してリソースを解放
bool isConnected() const;
std::string lastError() const;
std::string getLoginId() const;       // ログイン中のアカウント
std::string getLoginName() const;
```

ほかに上書きできるものとして、`connectionStatus()`（細かい状態。再接続の待ち時間の延長が一時停止した `"timeout"` の状態を含む）と `resumeConnection()`（手動での再開。WebUI の「再接続」ボタンから呼ばれる）があります。

### メッセージの送受信

```cpp
void sendMessage(const Message& msg);                       // 実装が必須
void sendReply(const Message& original, const std::string& replyText);
void onMessage(MessageCallback cb);                          // メッセージのコールバックの登録
void onEvent(EventCallback cb);                              // 通知 / リクエストのイベント（既定は何もしない）

// 以下は既定で何もしない / 代わりの処理。プラットフォームの機能に応じて上書きする：
void sendGroupMessage(groupId, text);        // Web の管理画面からグループにメッセージを送る
void sendGroupMessageCQ(groupId, cqText);    // CQ コード（[CQ:at,..]/[CQ:image,..]）を含む文章。既定では通常の文章として送る
void sendPrivateMessage(userId, text);
bool sendGroupForwardMsg(groupId, nodes);    // まとめた転送。false = 非対応（呼び出し側は分割して送る）
void sendGroupPoke(groupId, userId);         // つつく
```

### 承認とグループ管理

```cpp
void setFriendRequest(flag, approve, remark);        // 友だち申請の承認
void setGroupRequest(flag, subType, approve, reason);// グループ参加 / 招待の承認
void setGroupKick(groupId, userId);                  // 実装が必須
void setGroupBan(groupId, userId, durationSec);      // 実装が必須
void leaveGroup(groupId);
void setGroupCard(groupId, userId, card);            // グループ内の名前を変更（ボット自身は getLoginId() を渡す）
void setGroupName(groupId, name);
void setGroupSpecialTitle(groupId, userId, title);   // 専用の肩書き（グループのオーナーが必要）
```

### キャッシュの照会と更新

```cpp
std::string getGroupName(groupId) const;                       // 実装が必須
std::vector<std::string> getGroupMemberList(groupId) const;    // 実装が必須
bool isGroupAdmin(groupId, userId) const;                      // 実装が必須
bool isGroupOwner(groupId, userId) const;                      // 実装が必須

// 既定は空 / 不明。必要に応じて上書きする：
std::vector<std::pair<std::string,std::string>> getGroupList() const;  // (id, 名前)
int getGroupMemberCount(groupId) const;
std::string getSelfRole(groupId) const;      // ボット自身の役割 "owner"|"admin"|"member"
json getMembers(groupId) const;              // メンバー一覧のキャッシュ（プラットフォームのネイティブなオブジェクト）
int getFriendCount() const;                  // -1 = 不明
std::vector<std::string> getFriendList() const;
void deleteFriend(userId);
void refreshGroupList() / refreshSelfRole(groupId) / refreshMembers(groupId);  // 非同期での更新
void requestGroupHistory(groupId, count);    // 履歴のメッセージ（結果は kGroupHistory のイベントとして上げる）
```

### ファイルと同期の呼び出し

```cpp
// グループファイルをアップロード（.log end でログの txt を送る）。content = 元のバイト列で、リモート / コンテナのプロトコルクライアントにも対応。
void uploadGroupFile(groupId, name, content, localPath = "");

// プラットフォームの API を同期で呼び出し、応答を待つ（グループファイルの一覧 / ダウンロードのリンクなど、リクエストと応答の形式の API）。
// 注意：アダプターの受信スレッドで呼び出してはいけません（デッドロックします）。WebUI の drogon の処理スレッドから使うためのものです。
json invokeAction(action, params, timeoutMs = 8000);
```

## メッセージとイベントのモデル

```cpp
enum class MessageType { kPrivate, kGroup, kChannel };

struct Message {
    std::string id;             // メッセージの一意な ID
    std::string platform;       // 出所のプラットフォーム（i18n の言語の解決に使う）
    std::string content;        // 文章だけ（CQ コードを除いたもの。コマンドの解析に使う）
    std::string rawContent;     // 元のメッセージ（CQ コードそのまま）
    std::string displayContent; // 読みやすい形（文字/@xxx/[画像]…）。ログ / チャットのシミュレーターに使う
    std::string senderId, senderName;
    std::string targetId;       // グループ番号（個人チャットでは相手の id）
    std::string selfId;         // このメッセージを受け取ったボットのアカウント（複数のボットの宛先の指定）
    std::string adapterId;      // 受信したアダプターの id（返信 / プラットフォームの操作の特定に使う）
    std::vector<std::string> atList;  // @ されたアカウント（"all" = 全員への @）
    MessageType type;
    int64_t timestamp;
    bool fromSelf;              // ボットのアカウント自身が送ったもの（セルフコントロールのスイッチ）
    json extra;                 // プラットフォームの追加のデータ
};

enum class EventType {
    kGroupIncrease, kGroupDecrease,   // 参加 / 退出・キック
    kFriendAdd, kFriendRequest, kGroupRequest,
    kPoke,                            // つつく
    kGroupRecall,                     // グループのメッセージの取り消し
    kGroupHistory,                    // 履歴のメッセージの取得結果
    kGroupUpload,                     // グループファイルのアップロード
    kOther,
};
```

イベントは `BotEvent`（`flag` / `subType` / `operatorId` などの項目を含む）として `onEvent` のコールバックで上げられ、承認のポリシー、カスタム返信、通知の仕組みで使われます。

## アダプターの登録

アダプターは `AdapterManager` でまとめて管理します。

```cpp
auto adapter = std::make_shared<MyAdapter>(/* id */);
adapter->configure({ {"name", "MyBot"}, {"endpoint", "..."} });
adapterMgr.registerAdapter(adapter);
// AdapterManager は各アダプターのメッセージ / イベントを上の層にまとめて振り分ける
```

## OneBot v11 の参考実装

内蔵の実装 `server/src/adapter/onebot_v11_adapter.h` は 2 つの通信方式に対応しています。

| `connection_mode` | 意味 |
|-------------------|------|
| `forward_ws` | Dice!Next が **WS クライアント** として OneBot のエンドポイントに接続しに行く |
| `reverse_ws` | Dice!Next が **WS サーバー** として、OneBot からの逆方向の接続を待つ |

HTTP での送信のモードは **実装していません**（このモードを設定するとエラーで知らせます）。切断時には指数関数的に待ち時間を延ばしながら再接続します（5 秒→60 秒。何度も失敗すると「接続タイムアウト」の状態になり、パネルから手動で再接続できます）。ほかのプラットフォームのアダプターを開発するときの最良の参考です。

## アダプターの設定

アダプターの設定（`config/adapters.json` に書き込むか、パネルで新規作成）：

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

## デバッグ

- [管理パネル → アダプター管理](/ja/manage/adapter-manager)で接続を新規作成 / オン・オフし、接続の状態とログを確認します。
- [テスト台](/ja/manage/dashboard)では、プラットフォームに接続せずにコマンドの処理を直接確認できます。

## ベストプラクティス

1. **スレッドの安全性**：メッセージ / イベントのコールバックはネットワークのスレッドで呼ばれる場合があるため、メインの処理との同期に注意してください。
2. **再接続**：切断と再接続を適切に扱ってください（OneBot の実装の待ち時間を延ばす再接続とフレームの組み立て直しを参考に）。
3. **自分の発言の反響**：ボット自身が送ったメッセージの反響は取り除いてください（`self_echo_filter.h` を参考に）。そうしないと返信のループが起きます。
4. **リソースの解放**：`stop()` では必ず接続を正しく閉じ、リソースを解放してください。
5. **ログ**：`spdlog` で接続 / 送受信の重要なイベントを記録してください。
