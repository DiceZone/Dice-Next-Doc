# 适配器配置

Dice!Next 采用插件式适配器架构。请在 [管理面板 → 适配器管理](/manage/adapter-manager) 里添加和管理适配器——**适配器保存在数据库中**，配置文件里的 `adapters` 数组仅在首次启动（数据库为空）时用于播种初始适配器。

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

首次启动播种用的 `adapters` 数组写在 `config/default_config.json`：

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
| `type` | 协议类型，目前为 `onebot_v11` |
| `connection_mode` | `forward_ws` / `reverse_ws` |
| `endpoint` | 正向：OneBot 端的 WS 地址；反向：监听端口号 |
| `access_token` | 连接令牌，留空则不携带（正向连接时以 `Authorization: Bearer` 头发送，与 OneBot 端保持一致） |
| `enabled` | 是否启用 |

## 通过管理面板配置

进入 **管理面板 → 适配器管理**，新建连接，选择正向 / 反向 WS，填入端点与 Token，保存并启用即可。面板修改即时生效，无需重启。

## 多适配器

可以添加多个适配器，连接不同账号或作为备用连接。

## 协议扩展

适配器架构便于未来扩展新协议（如 Discord，已在开发计划中），只需实现 `IAdapter` 接口。详见[适配器开发](/develop/adapter-dev)。

## 常见问题

- **连接不上**：检查端点地址与端口、防火墙、Access Token 是否匹配；在仪表盘日志查看详细错误。
- **状态「连接超时」**：自动重连已暂停（连续 20 次失败），修好 OneBot 端后手动重连。
- **消息丢失**：确认适配器状态为「已连接」，且 OneBot 客户端正常上报消息事件。

更多排查见[故障排查](/guide/troubleshooting)。
