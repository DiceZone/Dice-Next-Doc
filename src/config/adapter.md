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

## QQ 官方机器人 2.0

在适配器管理页选择 **QQ 官方机器人 2.0**。可填写 AppID 与 AppSecret，或使用面板中的扫码绑定完成授权；连接建立后会通过官方 Gateway WebSocket 收发官方群和私聊消息。

QQ 官方平台以 OpenID 标识用户和群聊，而不是直接提供真实 QQ 号。Dice!Next 可将已验证的 OneBot QQ 身份与官方 OpenID 关联，使人物卡、群设置和日志沿用同一记录；使用 `.info` 可查看当前窗口的身份和绑定指引。

::: warning 群权限说明
当前 QQ 官方 API 尚未提供可供验证的群成员角色字段。因此基础群管理指令暂可由官方群成员执行；骰主与信任级权限不会由官方 OpenID 获得。待平台开放角色鉴权后会恢复真实校验。
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
