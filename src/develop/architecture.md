# 系统架构

Dice!Next 3.0 采用前后端分离的分层架构：C++ 后端负责协议接入、指令处理与数据存储，React 前端是纯 REST API 客户端。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 构建系统 | CMake ≥ 3.20（C++20） | 跨平台 C++ 构建 |
| 包管理 | vcpkg | Microsoft 官方 C++ 包管理 |
| HTTP/WS | drogon | 异步非阻塞 C++ Web 框架 |
| JSON / YAML | nlohmann/json · yaml-cpp | 配置 / 旧格式解析 |
| 数据库 | SQLite3 + sqlite_orm | 轻量零配置持久化 |
| 日志 | spdlog | 高性能异步日志 |
| JS 引擎 | quickjs-ng | JS 插件子系统（海豹 SealDice 兼容） |
| Lua 引擎 | Lua 5.4 | Lua 模组子系统（原版 Dice! mod 兼容） |
| 掷骰 | 自研引擎 + onedice-cpp-lib | OneDice V1 标准表达式回退 |
| 压缩 | zlib · zstd | 日志站上传 / DiceNext 日志格式 |
| 前端 | Vite + React + shadcn/ui + Tailwind CSS | SPA 管理面板 |

## 架构分层

```
┌────────────────────────────────────────────────┐
│                Web 管理面板 (web/)               │
│    React SPA —— HTTP REST API + WebSocket 推送   │
└───────────────────────┬────────────────────────┘
                        │
┌───────────────────────▼────────────────────────┐
│               C++ 后端 (server/src)              │
│                                                  │
│  服务层 service/   REST 路由 · 日志整理 · 通知    │
│                    AI 网关（润色/翻译/对话/记忆/   │
│                    工具/NPC/视觉/后台线程）        │
│  核心层 core/      指令路由 · 掷骰引擎 · 人物卡   │
│                    牌堆 · 自定义回复 · 因果规则    │
│                    人格 · Lua/JS 插件管理器        │
│  存储层 storage/   SQLite（六库拆分）· 数据迁移    │
│  平台层 platform/  托盘 · 自启 · 崩溃诊断(Win)     │
│  适配器层 adapter/ OneBot v11（可插拔多平台）      │
└─────────────────────────────────────────────────┘
```

## 项目结构（后端 `server/src`）

```
server/src/
├── main.cpp                 # 入口：装配各组件、消息管线、注册路由、启动 drogon
├── adapter/                 # 适配器层
│   ├── adapter_interface.h  # IAdapter 抽象 + Message/BotEvent 事件模型
│   ├── adapter_manager.h    # 适配器管理 / 消息·事件统一分发
│   ├── onebot_v11_adapter.h # OneBot v11 实现（正向/反向 WS）
│   └── self_echo_filter.h   # 自回声去重（骰娘自己的消息不进管线）
├── core/                    # 核心层
│   ├── command_router.h     # 指令路由 / 内置指令实现（核心调度）
│   ├── dice/                # 掷骰引擎（表达式 / 房规 / 疯狂症状表）
│   ├── character/           # 人物卡存储
│   ├── deck/                # 牌堆
│   ├── reply/               # 自定义回复
│   ├── causal/              # 因果规则 / 冷却 / 计数器
│   ├── persona/             # 骰娘人格
│   ├── mod/                 # 插件子系统
│   │   ├── lua_plugin_manager.*  # Lua 模组（原版 Dice! mod 兼容）
│   │   └── js_plugin_manager.*   # JS 插件（海豹 SealDice 兼容）
│   └── rules_lock.h         # 规则数据读写锁
├── service/                 # 服务层
│   ├── api_service.h        # REST API 路由（主体）
│   ├── log_service.h        # 跑团日志整理 / 渲染 / 上传
│   ├── notice_manager.h     # 通知系统（窗口推送 / SMTP / Webhook / 审计）
│   ├── broadcast_manager.h  # 触发式广播
│   ├── ai_gateway.h         # AI 网关（OpenAI 兼容 API）
│   ├── ai_polish.h / ai_translate.h / ai_chat.h / ai_memory.h
│   ├── ai_tools.h / ai_npc.h / ai_vision.h / ai_worker.h
│   ├── chat_image.h / image_host.h / image_send.h   # 图片链路
│   ├── group_chat_buffer.h  # 群聊上下文缓冲
│   ├── web_auth.h           # WebUI 登录密码（Cookie）
│   └── parquet_writer.h     # 日志导出格式
├── storage/
│   ├── database.{h,cpp}     # SQLite + sqlite_orm（六库拆分）
│   ├── legacy_importer.*    # 原版 V2 数据迁移
│   ├── legacy_import_v2.h / legacy_dice2.h  # 原版文件格式解码
│   └── migration.{h,cpp}    # schema 迁移
├── platform/                # 平台特定（Windows 托盘 / 自启 / 崩溃诊断 / 单实例）
├── i18n/                    # 多语言引擎 + 语言解析
├── message/                 # CQ 码解析 / 消息格式化
├── config/                  # 配置管理（config/*.json，按功能区拆分）
└── common/                  # 日志 / 热重载 / 工具 / 版本
```

前端是独立仓库 `Dice-Next-WebUI`（Vite + React，`src/pages`、`src/components`、`src/i18n`），文档站是独立仓库 `Dice-Next-Doc`（VitePress）；后端主仓 `Dice-Next` 只含 `server/` 与打包脚本，编译另需同级的 `onedice-cpp-lib` 仓。

## 数据库拆分

数据按用途拆成六个 SQLite 库（默认在 `data/` 下），可独立备份 / 删除：

| 库 | 内容 |
|----|------|
| `dice.db` | 主库：群 / 玩家 / 黑白名单 / 定时任务 / 文案覆盖等 |
| `cards.db` | 人物卡 |
| `logs.db` | 跑团日志 |
| `chat.db` | 聊天持久化（模拟聊天 / AI 记忆） |
| `lua_mod.db` | Lua 模组的变量与卡片数据 |
| `plugins.db` | JS 插件的持久化 KV 存储 |

## 消息处理管线

一条消息从适配器进来后，按以下顺序流经处理（`main.cpp` 的 `onMessage`，前一环命中即停止）：

```
适配器收到消息（自回声去重已在适配器层完成）
 1. 多骰娘静默 —— @ 了别的骰娘且非本骰指令 → 忽略
 2. 黑白名单 —— 黑名单用户/群（白名单模式下非白名单）→ 忽略
 3. 群自动化 —— 命中「自动踢出/禁言」关键字 → 执行并结束
 4. 内置指令 —— CommandRouter.handleMessage（含规则包自定义指令）
 5. JS 插件指令 —— 海豹兼容插件的注册指令
 6. Lua 模组因果回复 —— 原版 mod 的 msg_reply / msg_order
 7. 因果规则 —— WebUI 配置的条件+动作规则
 8. 自定义回复 —— 关键词/正则回复
 9. JS 非指令钩子 —— onNotCommandReceived / onMessageReceived
10. AI 对话 / NPC —— 开启时按 @/关键词/待机概率触发（后台线程）
最后统一投递：{self} 解析 → AI 润色 → AI 翻译 → .link 转发
             → 日志记录 → 分段/合并转发 → 适配器发送
```

需要 AI 后处理的回复整段投给 AI 后台工作线程（`ai_worker`）执行，AI 请求超时不会阻塞后续指令。

## 热加载机制

配置热加载通过 **文件监听** 实现：`HotReloadMonitor` 监听 `config/`（及 `data/`）目录变更（Windows 上为 ReadDirectoryChangesW），变更后自动重新加载，无需重启。通过管理面板修改的设置也会即时保存并生效。牌堆 / 规则包 / 插件另有各自的重载接口（面板一键重载）。
