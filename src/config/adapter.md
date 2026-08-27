# 适配器配置

Dice!Next 采用插件式适配器架构。请在 [管理面板 → 适配器管理](/manage/adapter-manager) 里添加和管理适配器；配置会保存到 `config/adapters.json`，并在下次启动时直接加载。

## OneBot v11 适配器

支持两种传输模式，对应配置里的 `connection_mode`：

| 模式 | `connection_mode` | 含义 | 端点填法 |
|------|-------------------|------|----------|
| 正向 WebSocket | `forward_ws` | Dice!Next 主动连接 OneBot 客户端 | 完整 WS 地址，如 `ws://127.0.0.1:3001/` |
| 反向 WebSocket | `reverse_ws` | OneBot 客户端反连 Dice!Next | 一个**端口号**（如 `6700`），Dice!Next 在该端口监听 |

反向模式下，在 OneBot 客户端把反向 WS 上报地址指向 `ws://<Dice!Next 所在 IP>:<端口>/`；该端口只接受一个 OneBot 连接，多余连接会被直接关闭。

::: tip 断线重连（正向 WS）
断线后自动重连采用退避策略：前 10 次每 5 秒、第 11~20 次每 60 秒；连续 20 次失败后暂停自动重连，状态显示「连接超时」，在面板点手动重连即可恢复（连接稳定 30 秒后失败计数自动清零）。
:::

## 配置文件字段

适配器数组写在 `config/adapters.json`：

```json
{
  "adapters": [
    {
      "name": "MyQQBot",
      "type": "onebot_v11",
      "connection_mode": "forward_ws",
      "endpoint": "ws://127.0.0.1:3001/",
      "access_token": "",
      "enabled": true
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `name` | 适配器显示名 |
| `type` | 协议类型；OneBot v11 使用 `onebot_v11` |
| `connection_mode` | `forward_ws` / `reverse_ws` |
| `endpoint` | 正向：OneBot 端的 WS 地址；反向：监听端口号 |
| `access_token` | 连接令牌，留空则不携带（正向连接时以 `Authorization: Bearer` 头发送，与 OneBot 端保持一致） |
| `enabled` | 是否启用 |

## 通过管理面板配置

进入 **管理面板 → 适配器管理**，新建连接并按平台填写连接信息，保存并启用即可。面板修改即时生效，无需重启。

## 多适配器

可以添加多个适配器，连接不同账号或作为备用连接。

## 富消息与卡片模式

在 **系统设置 → 回复与显示 → 回复展示形式** 使用“启用 Markdown / 富消息”开关。全局开关关闭后，所有平台、账号和已标记为 Markdown 的回复模板都会强制降级为可读的传统文本；开启全局开关后，仍可在“分适配器 / 分账号”作用域里单独关闭富消息。

| 平台 | 卡片模式表现 | 说明 |
| --- | --- | --- |
| OneBot v11 | 传统文本 | OneBot 标准没有统一的跨实现卡片协议。 |
| Discord | Embed | 超过 Embed 长度限制的消息自动保持传统文本。 |
| KOOK | CardMessage | 使用官方卡片消息格式；过长内容自动保持传统文本。 |
| QQ 官方机器人 2.0 | Markdown | 平台需要为机器人开通 Markdown 能力；若接口拒绝，Dice!Next 会自动重试传统文本。 |

全局开关是最高优先级：账号或适配器的局部“开启”不能绕过已关闭的全局开关。这样即使 QQ 官方机器人具备 Markdown 权限，骰主也能一键让全部回复保持普通文字。

卡片上的可点击按钮需要对应平台的交互事件与具体业务授权。Dice!Next 只会在某个功能确实需要用户选择、且该平台能力可用时提供按钮，不会把管理或敏感操作做成通用按钮。

## QQ 官方机器人 2.0

在适配器管理页选择 **QQ 官方机器人 2.0**。可填写 AppID 与 AppSecret，或使用面板中的扫码绑定完成授权；连接建立后会通过官方 Gateway WebSocket 收发官方群和私聊消息。

自 [2026-08-10 的 QQ 机器人 2.0 能力更新](https://bot.q.qq.com/wiki/develop/api-v2/changelog.html#_20260810)起，OpenAPI 请求统一使用 `https://api.bot.qq.com`。Dice!Next 已统一鉴权、Gateway、资料、分享链接、消息和富媒体等请求域名；旧域名不再用于接口调用。

在“卡片消息”模式下，适配器会发送 Markdown。适配器编辑页可开启 **Markdown 图片资源强校验**：开启后，如果 QQ 平台无法转存 Markdown 中的图片，整条消息会失败并回退传统文本；默认关闭，以保持平台原有兼容行为。对应 `config/adapters.json` 字段为 `force_verify_image_resource`。

QQ 官方平台以 OpenID 标识用户和群聊，而不是直接提供真实 QQ 号。Dice!Next 可将已验证的 OneBot QQ 身份与官方 OpenID 关联，使人物卡、群设置和日志沿用同一记录；使用 `.info` 可查看当前窗口的身份和绑定指引。

::: warning 群权限说明
QQ 官方 API 仍未向消息事件提供可供 Dice!Next 验证的发言者群角色，因此 `.bot on/off` 等基础指令在官方群内继续按当前兼容策略处理。新增的禁言、入群审批和自动审批策略接口则要求**机器人自身是群管理员**；若权限不足，QQ 平台会拒绝请求并在面板显示错误。
:::

### 官方群管理

在 **群组管理 → 选择 QQ 官方机器人账号 → 官方群管** 中可使用以下能力：

- 查询当前全员禁言模式和仍在生效的成员禁言，并按成员 OpenID 设置或解除禁言；
- 拉取当前群的待处理入群申请，查看验证消息、问答、来源与风险提示，并人工通过或拒绝；
- 创建、启停、修改备注、执行或删除入群自动审批策略，并批量增删白名单 QQ 号。

Gateway 的 `GROUP_JOIN_REQUEST` 事件也已接入统一事件管线。它会通知骰主，并复用 `.group auto pass` 及全局加群申请策略；事件中的 `join_request_id` 会随审批请求原样回传。官方自动审批策略由 QQ 平台执行，和 Dice!Next 的本地关键词自动审批可以并存。

::: tip 接口限制
入群申请事件要求机器人为群管理员，并使用 `GROUP_AND_C2C_EVENT (1<<25)` Intent。接口频率、白名单资格和具体错误码由 QQ 官方平台控制。
:::

## Discord

在适配器管理页选择 **Discord**，填入 Discord Developer Portal 创建的 Bot Token 即可。适配器通过 Discord Gateway 接收服务器频道和私聊消息，支持 `@机器人 指令`、频道消息和私聊消息。

请在 Discord Developer Portal 的 Bot 设置中开启 **Message Content Intent**，否则 Discord 不会向机器人提供普通消息正文。

## KOOK

在适配器管理页选择 **KOOK**，填入机器人 Token。适配器通过 KOOK Gateway 与 REST API 连接，支持服务器频道、私聊、文本与 KMarkdown 消息，以及 `@机器人 指令`。

## 适配器开发

适配器按统一接口接入，便于继续扩展其他平台。开发方式详见[适配器开发](/develop/adapter-dev)。

## 常见问题

- **连接不上**：检查端点地址与端口、防火墙、Access Token 是否匹配；在仪表盘日志查看详细错误。
- **状态「连接超时」**：自动重连已暂停（连续 20 次失败），修好 OneBot 端后手动重连。
- **消息丢失**：确认适配器状态为「已连接」，且 OneBot 客户端正常上报消息事件。

更多排查见[故障排查](/guide/troubleshooting)。
