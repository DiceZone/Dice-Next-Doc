# QQ 官方 API v2 能力

本文依据 [QQ 官方 API v2 文档](https://bot.q.qq.com/wiki/develop/api-v2/)，涵盖 Dice!Next 当前官方适配器的接口与事件入口。文档中的接口存在，不代表所有机器人账号都已获得调用权限；群成员、群信息等能力仍可能要求内邀或白名单，群管理操作还可能要求机器人是群管理员。

## 后台调用入口

### 可视化编辑

在 **高级回复 → 卡片与按钮** 打开编辑页，也可从单个 QQ 官方适配器卡片的「更多 → 卡片与按钮」进入。选择机器人账号后，设置仅发布到对应 AppID。原 `/qq-official` 页面地址继续有效。

- **全局菜单**：读取现有配置，增删改与调整顺序；支持填入消息、HTTPS 链接、二级菜单和开关。布局与请求预览不会执行指令。
- **指令面板**：按单聊、群聊、文字子频道和频道私信筛选，分页读取；支持创建、修改、删除、管理员限制和备注。已有面板的场景与范围不随内容修改而改变。
- **指定对象**：单聊使用用户 OpenID，群聊使用群 OpenID。新建时最多填写 20 个，之后通过「管理关联」逐批添加或移除；不会拿本次输入替换已有完整关联名单。

编辑中的内容在切换选项卡时保留；离开页面或切换账号会提示放弃未发布草稿。发布前先读取平台版本，发现其他修改时停止覆盖；这不是平台级原子锁，仍应避免多人同时发布。菜单发布会完整覆盖旧菜单，清空条目后发布即清除菜单，操作前会确认。

平台拒绝或网络失败时保留草稿；超时后应重新读取状态确认，避免重复创建。字符长度、条目数量与 HTTPS 地址会在前端校验，真实权限和最终校验仍由 QQ 决定。未知字段保留；无法识别的条目类型会阻止发布，需明确修改或删除。

### REST 动作

使用已登录的后台会话，或后台配置的 `X-API-Key`，访问：

```http
GET /api/adapters/{adapterId}/qq-official-actions
POST /api/adapters/{adapterId}/qq-official-actions
```

GET 返回当前账号支持的 `actions` 和 `capabilities`。POST 请求固定为以下结构；这是后台接口密钥，不是 QQ AppSecret 或 AccessToken：

```json
{
  "action": "qq_generate_share_url",
  "params": { "callbackData": "my-dice" }
}
```

成功响应的 `data` 保留平台返回的数据。分享链接位于平台响应的 `data.url`；因此在后台接口的成功响应中为 `data.data.url`。调用失败时返回可读错误；未授权、限流和业务错误不会被当成成功。该入口仅允许列出的动作，不提供任意 URL 或 HTTP 方法代理。

群／用户标识可使用当前机器人账号的 OpenID，或已经关联的裸公共群号／用户号。不同机器人 AppID 的端点不能混用。涉及成员批量操作时每次最多 20 人；入群申请分页每页最多 50，群黑名单分页每页最多 100。

## 动作分类

| 能力 | 动作 |
| --- | --- |
| 群信息、成员与机器人角色 | `qq_group_info`、`qq_bot_state`、`qq_group_members`、`qq_group_member` |
| 禁言 | `qq_get_mute`、`qq_set_mute` |
| 入群审批 | `qq_join_requests`、`qq_approve_join` |
| 自动审批策略 | `qq_list_join_strategies`、`qq_create_join_strategy`、`qq_update_join_strategy`、`qq_delete_join_strategy`、`qq_execute_join_strategy`、`qq_update_join_whitelist` |
| 成员移除与群黑名单 | `qq_remove_members`、`qq_blacklist`、`qq_set_blacklist` |
| 消息与撤回 | `qq_send_message`、`qq_recall`、`qq_stream_message` |
| 私聊输入状态与互动召回 | `qq_input_notify`、`qq_wakeup_message` |
| 分享链接 | `qq_generate_share_url` |
| 全局菜单 | `qq_get_menu`、`qq_set_menu` |
| 指令面板 | `qq_list_panels`、`qq_create_panel`、`qq_get_panel`、`qq_update_panel`、`qq_delete_panel`、`qq_panel_target` |
| 富媒体与分片上传 | `qq_media_files`、`qq_upload_prepare`、`qq_upload_part_finish` |
| 频道与机器人资料 | `qq_me`、`qq_my_guilds`、`qq_guild`、`qq_guild_channels`、`qq_create_channel`、`qq_channel`、`qq_update_channel`、`qq_delete_channel`、`qq_gateway` |
| 互动回应 | `qq_interaction` |

基础参数使用 `groupId`、`userOpenId`、`memberOpenId`、`strategyId`、`panelId`、`guildId`、`channelId`、`interactionId`、`messageId` 等字段。需要提交完整平台配置的动作（菜单、面板、策略、流式消息、消息和上传）通过 `params.body` 提交官方文档中的对象。平台范围、权限、频控及字段限制仍然有效。

### 全局菜单与面板

`qq_set_menu` 的 `body` 是完整的 `{ "menu": { "items": [...] } }` 配置，会覆盖原有菜单。单聊菜单支持发送消息、HTTPS 链接、二级菜单和 `switch` 类型；开关的 `switch_id` 状态可从后续消息场景扩展中读取，不会自动改变 Dice!Next 的全局 AI 配置。

面板列表使用 `scope`、`cursor`、`limit`；创建和修改使用官方面板 `body`。关联对象使用 `panelId`、`op: "add" | "del"` 和 `userOpenIds`／`groupOpenIds`，每次最多 20 个。全局面板或不支持关联对象的场景由平台拒绝，不会在本地偷偷转换。

### 输入中状态

```json
{
  "action": "qq_input_notify",
  "params": { "userOpenId": "用户OpenID", "seconds": 30, "msg_id": "收到的消息ID" }
}
```

仅适用于私聊，持续时间为 1–60 秒。普通消息的 `msg_id` 与事件回复的 `event_id` 二选一。

### 互动召回与流式消息

`qq_wakeup_message` 使用 `userOpenId` 和消息 `body`，自动加入 `is_wakeup: true`。不能同时提供 `msg_id`／`event_id`。召回额度由 QQ 控制，该入口不会主动群发或替用户自动发送召回消息。

`qq_stream_message` 仅用于私聊，`body` 保留 `input_mode`、`input_state`、`index`、`content_type`、`content_raw`、`stream_msg_id` 等官方字段。首片返回的 `id` 用于后续分片；调用方负责维护顺序和内容前缀。这是接口能力，不表示现有 AI 聊天默认改为流式发送。

## JS 原生事件钩子

以下是 **Dice!Next 新增的原生钩子**，不是对 SealDice 标准接口的声明。原有海豹风格事件接口保持原有签名。

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

`event.groupId`、`userId`、`operatorId` 使用统一后的公共身份；`event.data` 保留平台事件体。互动、授权通知不提升操作者权限，钩子仍遵守原有的插件启停和群开关。

自动回应开启时，`event.interaction_ack_automatic` 为真，插件不要再提交回应。如果需要手动回应，关闭适配器的“自动回应互动事件”，再调用 `qq_interaction`，传入 `interactionId` 和 `body: { "code": 0 }`。回应码为 0–5，同一个互动只能回应一次。其他互动类型通常不需要回应；按钮数据不会自动作为骰子指令执行。

普通官方消息的 `msg.qqOfficial` 提供 `message_type`、`message_scene`、`ark_data`、附件和引用索引。消息场景中的 `auth_token` 不暴露到该对象；菜单开关等非凭据扩展保留。已有 `msg.segment` 仍可访问引用消息元素。卡片、语音识别及引用中的文字不会被额外拼成新指令。

引用当前消息时使用平台提供的 `msg_idx`，它与被动回复的 `msg_id` 分开处理。旧消息或历史定向引用缺少索引时，正文仍正常发送，不用逻辑消息 ID 冒充引用索引；多段回复不反复引用。

## 边界与验证

接口与事件有离线请求映射、重复推送、参数限制、时间戳及插件回调回归测试。尚未获授权的真实账号不能据此视为已完成线上验收。

参考：[群成员加入事件](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/group_member_add.html)、[互动事件](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/interaction_create.html)、[互动回应](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/interactions_interaction_id.put.html)、[订阅授权状态](https://bot.q.qq.com/wiki/develop/api-v2/autogen/event/subscribe_message_status.html)、[全局菜单](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_menu.put.html)、[生成分享链接](https://bot.q.qq.com/wiki/develop/api-v2/autogen/api/v2_generate_url_link.post.html)。
