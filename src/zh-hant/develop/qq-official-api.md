<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# QQ 官方 API v2 能力

本文依據 [QQ 官方 API v2 文件](https://bot.q.qq.com/wiki/develop/api-v2/)，涵蓋 Dice!Next 當前官方適配器的介面與事件入口。文件中的介面存在，不代表所有機器人賬號都已獲得呼叫許可權；群成員、群資訊等能力仍可能要求內邀或白名單，群管理操作還可能要求機器人是群管理員。

## 後臺呼叫入口

### 視覺化編輯

在 **高階回覆 → 卡片與按鈕** 開啟編輯頁，也可從單個 QQ 官方適配器卡片的「更多 → 卡片與按鈕」進入。選擇機器人賬號後，設定僅釋出到對應 AppID。原 `/qq-official` 頁面地址繼續有效。

- **全域性選單**：讀取現有配置，增刪改與調整順序；支援填入訊息、HTTPS 連結、二級選單和開關。佈局與請求預覽不會執行指令。
- **指令面板**：按單聊、群聊、文字子頻道和頻道私信篩選，分頁讀取；支援建立、修改、刪除、管理員限制和備註。已有面板的場景與範圍不隨內容修改而改變。
- **指定物件**：單聊使用使用者 OpenID，群聊使用群 OpenID。新建時最多填寫 20 個，之後通過「管理關聯」逐批新增或移除；不會拿本次輸入替換已有完整關聯名單。

編輯中的內容在切換選項卡時保留；離開頁面或切換賬號會提示放棄未釋出草稿。釋出前先讀取平臺版本，發現其他修改時停止覆蓋；這不是平臺級原子鎖，仍應避免多人同時釋出。選單釋出會完整覆蓋舊選單，清空條目後釋出即清除選單，操作前會確認。

平臺拒絕或網路失敗時保留草稿；超時後應重新讀取狀態確認，避免重複建立。字元長度、條目數量與 HTTPS 地址會在前端校驗，真實許可權和最終校驗仍由 QQ 決定。未知欄位保留；無法識別的條目型別會阻止釋出，需明確修改或刪除。

### REST 動作

使用已登入的後臺會話，或後臺配置的 `X-API-Key`，訪問：

```http
GET /api/adapters/{adapterId}/qq-official-actions
POST /api/adapters/{adapterId}/qq-official-actions
```

GET 返回當前賬號支援的 `actions` 和 `capabilities`。POST 請求固定為以下結構；這是後臺介面金鑰，不是 QQ AppSecret 或 AccessToken：

```json
{
  "action": "qq_generate_share_url",
  "params": { "callbackData": "my-dice" }
}
```

成功響應的 `data` 保留平臺返回的資料。分享連結位於平臺響應的 `data.url`；因此在後臺介面的成功響應中為 `data.data.url`。呼叫失敗時返回可讀錯誤；未授權、限流和業務錯誤不會被當成成功。該入口僅允許列出的動作，不提供任意 URL 或 HTTP 方法代理。

群／使用者標識可使用當前機器人賬號的 OpenID，或已經關聯的裸公共群號／使用者號。不同機器人 AppID 的端點不能混用。涉及成員批次操作時每次最多 20 人；入群申請分頁每頁最多 50，群黑名單分頁每頁最多 100。

## 動作分類

| 能力 | 動作 |
| --- | --- |
| 群資訊、成員與機器人角色 | `qq_group_info`、`qq_bot_state`、`qq_group_members`、`qq_group_member` |
| 禁言 | `qq_get_mute`、`qq_set_mute` |
| 入群審批 | `qq_join_requests`、`qq_approve_join` |
| 自動審批策略 | `qq_list_join_strategies`、`qq_create_join_strategy`、`qq_update_join_strategy`、`qq_delete_join_strategy`、`qq_execute_join_strategy`、`qq_update_join_whitelist` |
| 成員移除與群黑名單 | `qq_remove_members`、`qq_blacklist`、`qq_set_blacklist` |
| 訊息與撤回 | `qq_send_message`、`qq_recall`、`qq_stream_message` |
| 私聊輸入狀態與互動召回 | `qq_input_notify`、`qq_wakeup_message` |
| 分享連結 | `qq_generate_share_url` |
| 全域性選單 | `qq_get_menu`、`qq_set_menu` |
| 指令面板 | `qq_list_panels`、`qq_create_panel`、`qq_get_panel`、`qq_update_panel`、`qq_delete_panel`、`qq_panel_target` |
| 富媒體與分片上傳 | `qq_media_files`、`qq_upload_prepare`、`qq_upload_part_finish` |
| Markdown 圖片素材 | `qq_material_prepare`、`qq_material_complete`、`qq_material_list`、`qq_material_delete` |
| 頻道與機器人資料 | `qq_me`、`qq_my_guilds`、`qq_guild`、`qq_guild_channels`、`qq_create_channel`、`qq_channel`、`qq_update_channel`、`qq_delete_channel`、`qq_gateway` |
| 互動回應 | `qq_interaction` |

基礎引數使用 `groupId`、`userOpenId`、`memberOpenId`、`strategyId`、`panelId`、`guildId`、`channelId`、`interactionId`、`messageId` 等欄位。需要提交完整平臺配置的動作（選單、面板、策略、流式訊息、訊息和上傳）通過 `params.body` 提交官方文件中的物件。平臺範圍、許可權、頻控及欄位限制仍然有效。

### 全域性選單與面板

`qq_set_menu` 的 `body` 是完整的 `{ "menu": { "items": [...] } }` 配置，會覆蓋原有選單。單聊選單支援傳送訊息、HTTPS 連結、二級選單和 `switch` 型別；開關的 `switch_id` 狀態可從後續訊息場景擴展中讀取，不會自動改變 Dice!Next 的全域性 AI 配置。

面板列表使用 `scope`、`cursor`、`limit`；建立和修改使用官方面板 `body`。關聯物件使用 `panelId`、`op: "add" | "del"` 和 `userOpenIds`／`groupOpenIds`，每次最多 20 個。全局面板或不支援關聯物件的場景由平臺拒絕，不會在本地偷偷轉換。

### Markdown 圖片素材

根據 [官方素材管理介面](https://bot.q.qq.com/wiki/develop/api-v2/server-inter/message/material-management.html)，提供以下後臺動作：

| 動作 | `params` | 用途 |
| --- | --- | --- |
| `qq_material_upload` | `fileName`、`base64` | 一次完成申請、圖片直傳、摘要校驗和上傳確認 |
| `qq_material_prepare` | `body: { file_name, file_size, content_type, md5, sha1 }` | 申請上傳，返回 `upload_id` 和 `presigned_url` |
| `qq_material_complete` | `body: { upload_id, md5 }` | 確認上傳，取得素材引用 |
| `qq_material_list` | 可選 `cursor` | 分頁列出本賬號的素材 |
| `qq_material_delete` | `imageId` | 刪除指定素材 |

呼叫方在 prepare 和 complete 之間，把檔案二進位制 PUT 到平臺返回的預簽名地址，使用申請時的 Content-Type；該上傳請求不附帶 QQ AccessToken。`qq_material_upload` 由服務端自動完成這三步，僅接受平臺返回的 HTTPS COS 上傳地址，不接受呼叫方指定任意上傳 URL。

檔案限 PNG、JPEG、GIF、WebP，最多 10 MB；檔名副檔名須與 MIME 型別一致，MD5 為 32 位、SHA-1 為 40 位十六進位制。素材屬於當前機器人賬號，不應跨 AppID 複用。傳送 Markdown 時使用返回的 `qqbot-media://image/v1/...` 引用，臨時 `preview_url` 不適合作為持久圖片地址。在「卡片與按鈕 → 圖片素材」可上傳、分頁檢視、按需預覽、複製圖片程式碼和刪除。列表不自動載入圖片；每個賬號最多 100 張，連續 90 天未使用的素材會過期，實際期限以平臺響應為準。

### 圖文卡片與 @全體成員

`qq_send_message` 可通過 `params.body` 原樣傳送新版圖文卡片：`msg_type: 8`、`card.type: "tuwen"`，卡片內容及連結使用 [官方群訊息介面](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_groups_group_openid_messages.post.html) 定義的欄位。可在「卡片與按鈕 → 訊息與圖文卡片」填寫標題（1–50 字）、描述（1–200 字）、HTTPS 跳轉與圖片地址。指定當前 AppID 下的群或使用者 OpenID 後，確認才實際傳送；回覆已有訊息時可填寫有效訊息 ID，主動傳送仍受平臺額度限制。

在明確使用 Markdown 的回覆或原生訊息請求中，`<qqbot-at-everyone />` 會原樣送到 QQ。機器人須具備群管理員身份，且受平臺每群每天一次的限額約束；普通使用者文本不會自動轉成全體提及。訊息編輯頁切換為 Markdown 後，可用「插入 @全體成員」新增該標籤。Markdown 圖片素材引用也保持原樣。以上能力以 [官方變更記錄](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html) 及賬號實際許可權為準。

### 快捷按鈕

QQ 訊息按鈕標題最多 10 個字元。Next 會從操作說明中去掉逗號後的例子等附加內容；仍然過長的標題會保留省略號，完整指令引數不截斷。「再次檢定」會沿用原來的指令，包括字首、技能加減值、優勢／劣勢及原因，點選後由使用者確認傳送。按鈕本身不會自動再擲一次。

### 輸入中狀態

```json
{
  "action": "qq_input_notify",
  "params": { "userOpenId": "用户OpenID", "seconds": 30, "msg_id": "收到的消息ID" }
}
```

僅適用於私聊，持續時間為 1–60 秒。普通訊息的 `msg_id` 與事件回覆的 `event_id` 二選一。

### 互動召回與流式訊息

`qq_wakeup_message` 使用 `userOpenId` 和訊息 `body`，自動加入 `is_wakeup: true`。不能同時提供 `msg_id`／`event_id`。召回額度由 QQ 控制，該入口不會主動群發或替使用者自動傳送召回訊息。

`qq_stream_message` 僅用於私聊，`body` 保留 `input_mode`、`input_state`、`index`、`content_type`、`content_raw`、`stream_msg_id` 等官方欄位。首片返回的 `id` 用於後續分片；呼叫方負責維護順序和內容字首。這是介面能力，不表示現有 AI 聊天預設改為流式傳送。

## JS 原生事件鉤子

以下是 **Dice!Next 新增的原生鉤子**，不是對 SealDice 標準介面的宣告。原有海豹風格事件介面保持原有簽名。

```javascript
ext.onQQInteraction = (ctx, event, msg) => {
  // event.interaction_id 是互动回应 ID；不要与外层 event_id 混用。
  // event.interaction_data.resolved 保留按钮、菜单、反馈或授权数据。
  if (event.interaction_type === 11) {
    seal.replyToSender(ctx, msg, '已收到按钮操作。');
  }
};

ext.onQQSubscriptionStatus = (ctx, event, msg) => {
  // event.subscription_results 保留模板、允许/拒绝、订阅 ID 和时间。
};

ext.onQQOfficialEvent = (ctx, event, msg) => {
  // 其他官方非消息事件，例如好友删除和频道资料变更。
};
```

`event.groupId`、`userId`、`operatorId` 使用統一後的公共身份；`event.data` 保留平臺事件體。互動、授權通知不提升操作者許可權，鉤子仍遵守原有的插件啟停和群開關。

自動回應開啟時，`event.interaction_ack_automatic` 為真，插件不要再提交回應。如果需要手動回應，關閉適配器的“自動回應互動事件”，再呼叫 `qq_interaction`，傳入 `interactionId` 和 `body: { "code": 0 }`。回應碼為 0–5，同一個互動只能回應一次。其他互動型別通常不需要回應；按鈕資料不會自動作為骰子指令執行。

普通官方訊息的 `msg.qqOfficial` 提供 `message_type`、`message_scene`、`ark_data`、附件和引用索引。訊息場景中的 `auth_token` 不暴露到該物件；選單開關等非憑據擴展保留。已有 `msg.segment` 仍可訪問引用訊息元素。卡片、語音識別及引用中的文字不會被額外拼成新指令。

引用當前訊息時使用平臺提供的 `msg_idx`，它與被動回覆的 `msg_id` 分開處理。舊訊息或歷史定向引用缺少索引時，正文仍正常傳送，不用邏輯訊息 ID 冒充引用索引；多段回覆不反覆引用。

## 邊界與驗證

介面與事件有離線請求對映、重複推送、引數限制、時間戳及插件回調回歸測試。尚未獲授權的真實賬號不能據此視為已完成線上驗收。

參考：[群成員加入事件](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html)、[互動事件](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html)、[互動回應](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/interactions_interaction_id.put.html)、[訂閱授權狀態](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html)、[全域性選單](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_menu.put.html)、[生成分享連結](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html)。
