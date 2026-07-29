# 基础配置

Dice!Next 使用 `config/` 目录保存 **JSON 格式**配置；首次启动会生成各功能区的文件。

绝大多数配置都能在 [Web 管理面板](/manage/dashboard) 里修改，通常无需手动改文件。首次生成的文件只含少量键，**很多键在你通过面板设置后才会出现在文件里**（缺省时使用内置默认值）。

## 配置文件结构

每个功能区单独保存，面板保存和通过热重载校验的手工修改都会回写对应文件：

| 文件 | 内容 |
| --- | --- |
| `server.json` | WebUI/API 监听、数据库路径与日志级别 |
| `webui.json` | WebUI 登录设置 |
| `adapters.json` | 适配器连接配置 |
| `dice.json` | 骰子行为、骰主、规则与 AI 设置 |
| `events.json` | 好友、群邀请与事件策略 |
| `i18n.json` | 默认语言与平台语言偏好 |
| `backup.json` | 手动与自动备份设置 |
| `hot_reload.json` | 配置与资源热重载设置 |

以下示例按文件展示（实际以启动后生成的内容为准）：

```json
// config/server.json
{
  "host": "0.0.0.0",
  "port": 18088,
  "api_key": "",
  "db_path": "./data/dice.db",
  "log_level": "info"
}
```

## 主要配置项

### server

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `host` | 服务监听地址 | `0.0.0.0` |
| `port` | 管理面板 / API 端口。被占用时启动会自动顺延并写回此键 | `18088` |
| `api_key` | 后端 API 访问密钥（首次自动生成，面板请求以 `X-API-Key` 头携带） | 自动 |
| `db_path` | 主数据库路径（人物卡 / 日志 / 聊天等另有独立 db 文件） | `./data/dice.db` |
| `log_level` | 日志级别 trace/debug/info/warn/error | `info` |

::: tip WebUI 登录密码与 api_key 的关系
管理面板的**访问控制以「WebUI 登录密码」为准**：在面板的 WebUI 设置页设置后，所有 `/api/*` 请求都需要先登录（`webui.password` 键，留空 = 关闭鉴权）。登录时可选择“信任此设备 30 天”，可信会话仅保存在本机 `config/webui_sessions.json`。`server.api_key` 是面板请求随附的 API 密钥，供对接场景使用，不能代替登录密码。
:::

### dice

骰子行为主开关，常用键（多数在面板系统设置里可视化修改）：

| 字段 | 说明 |
|------|------|
| `command_prefixes` | 指令前缀数组，默认 `.` `。` `!` `！` |
| `masters` | 骰主列表（`{platform, id}`，可多个） |
| `summon_word` | 召唤词（留空关闭） |
| `whitelist_only` | 白名单模式：仅白名单群响应 |
| `silent_global` / `disabled_global` | 全局静默 / 全局停用的指令列表 |
| `disabled_jrrp` | 全局停用 `.jrrp` |
| `respond_self` | 是否响应骰娘账号自己发的消息（自控，默认关） |
| `console_start_hidden` | 启动即隐藏控制台最小化到托盘（默认 `true`） |
| `api_enabled` / `api_whitelist` / `api_timeout` | 回复中 `{api:URL}` 外部请求开关、域名白名单与超时 |
| `image_send` | 图片发送方式（`base64` 或经 `host` 中转） |
| `save_log_images` | 跑团日志是否落地消息内图片 |
| `logsite_url` / `logsite_format` | 日志站上传地址（留空 = 官方站）与协议格式 |
| `aliases` | 账号别名（`{platform, alias, main}`，`.alias` 指令维护） |
| `notice` | 骰主通知窗口与事件订阅（建议用通知设置页管理） |
| `ai` | AI 子系统全部配置（模型 / 润色 / 翻译 / 对话 / 记忆 / 工具…，建议用 AI 页管理） |
| `rules.default_dice_sides` | `.r` 无参数时的默认骰面 |
| `rules.coc_enabled` 等 | 各规则系统开关与 COC 大成功 / 大失败区间 |

### events

事件与审批策略（面板权限 / 系统设置里可改）：

| 字段 | 说明 |
|------|------|
| `friend_policy` / `auto_approve_friend` / `friend_keyword` | 加好友审批策略 / 自动同意 / 验证关键词 |
| `friend_welcome` | 新好友欢迎语（空 = 内置文案） |
| `group_invite_policy` / `auto_approve_group` / `group_keyword` | 加群邀请审批策略 |
| `group_invite_reject_blacklist` / `group_invite_reject_nonfriend` | 拒绝黑名单群 / 非好友的邀请 |
| `poke_enabled` / `poke_command` | 戳一戳回复开关 / 戳一戳映射为指令 |

### i18n

| 字段 | 说明 |
|------|------|
| `default_locale` | 默认回复语言（`zh-Hans` / `zh-Hant` / `en` / `ja`） |
| `platform_defaults` | 各平台的默认语言 |
| `resource_dir` | 语言包目录（默认 `i18n`，放入 `<语言码>.json` 可自动加载自定义语言） |

### log

| 字段 | 说明 |
|------|------|
| `raw_events` | 是否在日志中记录适配器原始事件（调试用） |

### hot_reload

| 字段 | 说明 |
|------|------|
| `enabled` | 开启后修改 `config/`、`data/` 下的文件自动检测生效 |
| `debounce_ms` / `watch_paths` | 去抖间隔与监视目录 |

### adapters

适配器配置保存在 `config/adapters.json`。以[适配器管理](/manage/adapter-manager)页保存后的内容为准；手工修改时也请保持该文件为有效 JSON。字段说明见[适配器配置](/config/adapter)。

## 热加载与重启

`hot_reload.enabled` 开启后，手改配置文件会被自动检测并生效；通过管理面板修改的设置也会即时保存生效。

::: warning 需要重启的项
`server.port` / `server.host` 修改后需要重启才能生效——推荐在面板的 **WebUI 设置**页在线修改，页面会提示并提供「立即重启」按钮。
:::

## 升级提示

升级时解压新包完整覆盖即可；`config/` 目录不在发行包内，不会被覆盖，详见[安装部署](/guide/install#升级)。
