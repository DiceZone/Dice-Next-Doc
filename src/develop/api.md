# API 参考

Dice!Next 后端提供 REST API，管理面板即基于此构建。本页按功能分组列出当前可用的接口；路由较多，只列路径与用途，具体请求 / 响应字段以实际版本为准（可在管理面板的网络请求中对照）。

## 基础信息

| 项目 | 说明 |
|------|------|
| 基础地址 | `http://localhost:18088`（端口见 `server.port`，可在网页设置中在线修改） |
| 数据格式 | JSON，UTF-8 |
| 认证 | 管理面板访问密钥（`server.api_key`）；另可启用 WebUI 登录密码（Cookie 会话，见「认证」一节） |

## 统一响应格式

除特别说明外，接口均返回统一信封：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code`：`0` 成功，非 `0` 失败
- `message`：提示信息
- `data`：响应数据（失败时为 `null` 或缺省）

少数接口不走信封：`/api/test/message` 直接返回结果对象，`/api/logs/{id}/export`、`/api/assets/{name}`、图片类接口直接返回文件内容。

## 认证与运行控制

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/status` | 是否启用登录密码 / 当前会话状态 |
| POST | `/api/auth/login` · `/api/auth/logout` | 登录 / 登出（Cookie 会话） |
| GET / PUT | `/api/system/webui-auth` | 登录密码设置 |
| GET / PUT | `/api/system/server-config` | 运行 IP / 端口（改后需重启生效） |
| POST | `/api/system/restart` | 重启后端 |
| GET / PUT | `/api/system/autostart` | 开机自启（Windows） |
| GET / PUT | `/api/system/update` | 读取 / 保存自动检查间隔、发现后动作与下载来源 |
| POST | `/api/system/update/check` | 立即在后台检查最新 GitHub Release |
| POST | `/api/system/update/download` | 下载并校验当前平台安装包 |
| POST | `/api/system/update/install` | 安装已暂存更新并重启（仅 Windows 管理器模式） |

WebUI 会话 Cookie 按安装实例稳定命名，而不是按主机或端口共用：同一主机不同安装目录可同时登录，同一实例改端口或重启仍可恢复 30 天受信会话。`GET /api/auth/status` 会兼容并迁移旧版 `dice_session`；`POST /api/auth/logout` 只撤销当前实例的会话。

## 系统状态与设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/system/status` | 运行状态 |
| GET | `/api/system/settings` | 基础设置（host / port / 日志级别等） |
| GET | `/api/dashboard/stats` | 仪表盘统计 |
| GET / PUT | `/api/system/global` | 原版全局设置（响应开关 / 外部请求等） |
| GET / PUT | `/api/system/events` | 事件策略（审批 / 退群 / 自动清理等） |
| GET / PUT | `/api/system/prefixes` | 指令前缀 |
| GET / PUT / POST | `/api/system/censor` | 读取/整体保存敏感词规则；POST 用同一服务端匹配器测试文本 |
| GET / PUT | `/api/system/log-mode` | 原始事件日志开关 |
| GET / PUT | `/api/system/respond-self` | 自控开关（响应骰娘账号自身消息） |
| GET / PUT | `/api/system/logsite` | 日志站上传地址（logsite_url） |
| GET / PUT | `/api/system/save-log-images` | 日志图片落地开关 |
| GET / PUT | `/api/system/nick-wrap` | 用户名包裹符号 |
| GET / PUT | `/api/system/reply-segment` | 分段发送 |
| GET / PUT | `/api/system/quote-reply` | 引用气泡回复 |
| GET / PUT | `/api/system/forward-long` | 长消息合并转发 |
| GET / PUT | `/api/system/auto-card` | 自动卡面（COC 自动算 HP/SAN/MP） |
| GET / PUT | `/api/system/image-host` · `/api/system/image-send` | 图床 / 发图方式 |
| GET / PUT | `/api/system/user-group` | 用户群强制 |
| GET / PUT | `/api/system/friend-clean` | 好友自动清理 |
| GET / PUT | `/api/system/chat-config` | 聊天持久化（保留期等） |
| GET | `/api/roadmap` | 开发计划数据（读 `docs/roadmap.md`） |

### 更新接口

更新操作异步执行；POST 接口只负责排队并立即返回一次状态，前端应继续轮询 `GET /api/system/update`。主要字段：

- `current` / `latest`：当前版本与 Release 清单；`latest.asset` 是当前 OS / 架构精确匹配的安装包。
- `phase`：`idle`、`checking`、`available`、`downloading`、`staged`、`downloaded`、`installing`、`error` 或 `up_to_date`。
- `source`、`downloadedBytes`、`totalBytes`、`checkedAt`、`error`：本次来源、进度、时间与错误。
- `downloadSupported` / `installSupported` / `pending`：能否由程序下载、能否一键安装，以及是否已有通过校验的暂存包。
- `runtime.container`、`runtime.containerType`、`runtime.containerDetection`：容器识别结果、运行时类型与命中信号；`selfUpdateBlockedReason=container` 表示容器内只允许检查，不允许下载或安装。
- `settings`：`autoCheck`、`intervalHours`（1–168）、`autoAction`（`notify` / `download` / `install`）、`source`（`auto` / `direct` / `mirror` / `custom`）与 `customMirror`。

自定义镜像必须是 HTTPS 地址前缀。服务端只接受 `DiceZone/Dice-Next`、安全版本字段、已知平台架构、受限文件名、准确大小和 64 位十六进制 SHA-256 的 schema 1 清单。SHA-256 只校验下载内容与清单一致；它不构成独立代码签名。

容器限制由服务端执行，不依赖前端按钮。`POST /download`、`POST /install` 以及 `PUT` 中的自动下载 / 自动安装策略都会被拒绝；已有旧配置在容器运行期间按 `notify` 生效。版本清单仍写入容器临时目录并正常检查。

## 通知与审计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / PUT | `/api/system/notice` | 通知设置（事件逐项勾选、通知窗口、SMTP / Webhook） |
| POST | `/api/system/notice/test` | 发送测试通知 |
| GET | `/api/system/audit` | 审计日志（`data/audit/*.jsonl`） |

## 适配器

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/adapters` | 列表 / 新建 |
| PUT / DELETE / PATCH | `/api/adapters/{id}` | 更新 / 删除 / 局部修改 |
| POST | `/api/adapters/{id}/test` | 测试连接 |
| POST | `/api/adapters/{id}/reconnect` | 手动重连（重置退避） |

新建示例：

```json
POST /api/adapters
{
  "name": "MyQQBot",
  "type": "onebot_v11",
  "connection_mode": "forward_ws",
  "endpoint": "ws://127.0.0.1:3001/",
  "access_token": "",
  "enabled": true
}
```

## 骰子规则与掷骰

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / PUT | `/api/dice/rules` | 规则开关与默认骰面 |
| POST | `/api/dice/roll` | 服务端掷骰（调试用） |

## 指令、文案与 i18n

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/commands` | 指令目录（分类 / 示例 / 回复键） |
| GET | `/api/i18n/locales` | 可用语言列表（含自定义语言包） |
| GET | `/api/i18n/all` | 全部文案键（含覆盖值与原版键） |
| PUT | `/api/templates` | 设置某文案覆盖 |
| DELETE | `/api/templates/{locale}/{key}` | 重置某文案 |
| GET | `/api/templates/export` · POST `/api/templates/import` | 导出 / 导入文案覆盖 |

## 自定义回复与因果规则

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/replies` | 关键词回复列表 / 新建 |
| PUT / DELETE / PATCH | `/api/replies/{id}` | 更新 / 删除 / 启停 |
| GET / POST | `/api/causal/rules` | 因果规则（条件 + 动作 + 计数器）列表 / 新建 |
| PUT / DELETE | `/api/causal/rules/{id}` · POST `/api/causal/rules/{id}/toggle` | 更新 / 删除 / 启停 |
| POST | `/api/causal/rules/test` | 因果规则试跑 |
| GET | `/api/counters` · PUT / DELETE `/api/counters/{key}` | 计数器查改删 |
| POST | `/api/causal/cooldowns/clear` | 清空因果冷却 |

## 骰娘人格

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/personas` | 人格列表 / 新建 |
| GET / PUT / DELETE | `/api/personas/{id}` | 详情 / 更新 / 删除 |
| POST | `/api/personas/{id}/copy` · `/api/personas/{id}/activate` | 复制 / 激活 |
| GET / PUT / DELETE | `/api/personas/{id}/entries` | 人格回复文案条目 |
| GET | `/api/personas/{id}/export` · POST `/api/personas/import` | 导出 / 导入 |
| GET | `/api/personas/active` | 当前激活人格 |

## 牌堆

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/decks` | 牌堆列表 / 操作 |
| PUT / DELETE | `/api/decks/{id}` | 更新 / 删除记录 |
| GET / PUT | `/api/decks/file` | 读取 / 写入牌堆文件 |
| DELETE | `/api/decks/file/{name}` | 删除牌堆文件 |
| POST | `/api/decks/upload` | 上传牌堆（.json） |
| POST | `/api/decks/reload` | 重载牌堆目录 |

## 规则与规则包

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/rules` | 已加载规则系统列表 |
| GET | `/api/rules/file` | 读取规则文件 |
| POST | `/api/rules/upload` · `/api/rules/delete` · `/api/rules/toggle` | 规则文件上传 / 删除 / 启停 |
| PUT | `/api/rules/save` | 保存规则文件（规则编辑器） |
| POST | `/api/rules/test` | 规则自定义指令试跑 |
| GET | `/api/rulepacks` | 规则包（bundle）列表 |
| POST | `/api/rulepacks/upload` · `/api/rulepacks/toggle` · `/api/rulepacks/delete` | 规则包 zip 上传 / 启停 / 删除 |

## 帮助文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/help` | 统一帮助注册表查询（内置 / 规则包 / 插件三源，分页） |
| GET | `/api/help/groups` | 帮助分组 |
| GET | `/api/help/files` | 自定义帮助文档（helpdoc）文件列表 |
| GET / POST | `/api/help/file` | 读取 / 保存 helpdoc 文件 |
| DELETE | `/api/help/file/{name}` | 删除 helpdoc 文件 |

## 群组

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/groups` | 群列表 / 操作 |
| PUT / DELETE | `/api/groups/{platform}/{group}` | 更新 / 移除群记录 |
| POST | `/api/groups/{platform}/{group}/action` | 群操作（退群 / 发消息 / 上传日志等） |
| GET | `/api/groups/{platform}/{group}/members` | 成员列表 |
| POST | `/api/groups/{platform}/{group}/member-action` | 成员操作（禁言 / 踢 / 改名片等） |
| GET / POST | `/api/groups/{platform}/{group}/messages` | 模拟聊天窗口（读记录 / 发消息） |
| POST | `/api/groups/{platform}/{group}/poke` | 戳一戳 |
| POST | `/api/groups/{platform}/{group}/fetch-history` | 拉取历史消息（NapCat） |
| GET | `/api/groups/{platform}/{group}/files` | 群文件列表 |
| GET | `/api/groups/{platform}/{group}/file-url` · `/file-download` | 群文件直链 / 代理下载 |
| POST | `/api/groups/{platform}/{group}/file-upload` | 上传群文件 |
| GET | `/api/groups/plugins` · POST `/api/groups/plugins/toggle` | 插件分群启停 |

## 玩家与好友

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/players` | 玩家档案列表 |
| PUT / DELETE | `/api/players/{platform}/{user}` | 更新 / 删除档案 |
| GET | `/api/players/{platform}/{user}/detail` | 玩家详情（人物卡 / 设置 / 插件变量全量） |
| POST | `…/card-attr` · `…/card-del` | 人物卡属性改 / 删 |
| POST | `…/setting` | 玩家设置项 |
| POST | `…/luavar` · `…/luacard` | Lua 插件变量 / 卡片数据改删 |
| POST | `…/delete-friend` | 删除好友 |
| GET | `/api/friends` | 好友列表（各适配器汇总） |

## 黑白名单与骰主

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/banlist` | 黑白名单列表 / 添加 |
| DELETE | `/api/banlist/{rowId}` | 移除 |
| GET / PUT | `/api/banlist/whitelist-only` | 白名单模式开关 |
| GET / POST | `/api/masters` · DELETE `/api/masters/{platform}/{id}` | 骰主管理 |

## 定时任务与广播

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/schedules` | 定时任务列表 / 新建（含 condition / action） |
| PUT / DELETE | `/api/schedules/{id}` | 更新 / 删除 |
| GET / POST / DELETE | `/api/broadcast` | 触发式广播 |

## 跑团日志

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / POST | `/api/logs` | 记录列表 / 操作 |
| DELETE | `/api/logs/{id}` | 删除记录（同步清理缓存图片） |
| GET | `/api/logs/{id}/export?format=txt\|csv\|html` | 导出（txt 与日志站上传内容一致；html 自包含带图） |
| POST | `/api/logs/{id}/upload` | 上传日志站（SealDice V1 协议） |
| GET | `/api/logs/images/{file}` · `/api/chat/images/{file}` | 日志 / 聊天缓存图片 |

## 扩展：Lua 模组

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/mod/lua` | 模组列表（含指令触发词） |
| POST | `/api/mod/lua/upload` | 上传（zip 目录型 mod 或单文件 `.lua`） |
| POST | `/api/mod/lua/toggle` · `/api/mod/lua/delete` · `/api/mod/lua/reload` | 启停 / 删除 / 重载 |
| POST | `/api/mods/upload` | Lua mod 上传（另一入口，行为同上） |

## 扩展：JS 插件

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plugins/js` | 插件列表（元数据 / 启用状态 / 同名去重信息） |
| POST | `/api/plugins/js/upload` · `/toggle` · `/delete` · `/reload` | 上传 / 启停 / 删除 / 重载 |
| POST | `/api/plugins/js/config` | 插件配置项表单读写 |
| POST | `/api/plugins/js/check-update` · `/update` | 按 `@updateUrl` 检测 / 执行更新 |
| GET | `/api/plugins/js/storage` · POST `/storage/clear` | 插件持久化存储查看 / 清空 |

## AI

| 方法 | 路径 | 说明 |
|------|------|------|
| GET / PUT | `/api/system/ai` | AI 全套设置（网关 / 模型 / 润色 / 翻译 / 对话 / 记忆 / 工具 / NPC / 视觉） |
| GET / POST / DELETE | `/api/system/ai/memory` | AI 记忆（摘要 / 长期事实）查看与管理 |
| POST | `/api/system/ai/test` | 模型连通性测试 |

## 资源与数据迁移

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/assets/upload` · GET `/api/assets/{name}` | 图片资源 |
| POST | `/api/legacy/import` | 原版 V2 数据迁移（请求体 `{ "dir": "路径" }`，导入前自动备份数据库） |

## 测试接口

```
POST /api/test/message
{ "text": ".r 3d6", "platform": "onebot_v11", "messageType": "group",
  "nickname": "希亚", "userId": "123", "groupId": "456", "locale": "zh-Hans" }
```

该接口是「测试台」页的后端，**直接返回** `{ "reply": "...", "matched": true, "segments": [...] }`（不走统一信封），走与真实消息一致的完整管线（内置指令 → JS 插件 → Lua 模组 → 因果规则 → 自定义回复 → AI），可不连接平台直接测试。可选字段：`rawContent`（带 CQ 码测识图）、`selfId` / `atList`（多骰娘定向）、`role` / `card`（群名片注入）。

::: tip
以上为接口概览；字段细节以实际版本为准。所有 `/api/*` 请求都需要携带访问密钥（或已登录的 Cookie 会话）。
:::
