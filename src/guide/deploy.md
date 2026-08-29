# 部署与运维

本页面向把 Dice!Next 长期跑起来的场景（个人 / 小团体自部署）。基础启动见[安装部署](/guide/install)。

## 目录结构

首次启动后，运行目录大致如下：

```
DiceNext/
├── dice-next.exe       # Windows 启动管理器
├── app/                # 服务核心（Windows 为 dice-next-core.exe）
├── lib/                # Windows 运行依赖
├── config/             # 配置（按功能区拆分的 JSON，首次启动自动生成）
├── data/              # 你的数据都在这里
│   ├── dice.db        #   主数据库（另有 cards.db / logs.db / chat.db 等）
│   ├── decks/         #   牌堆
│   ├── rules/         #   规则速查库
│   ├── rulepacks/     #   规则包
│   ├── helpdoc/       #   自定义帮助文档
│   ├── mod/  plugins/ #   Lua 模组 / JS 插件
│   ├── logs/          #   跑团记录、crash 报告；运行日志在 logs/app/
│   └── audit/         #   通知审计流水
├── i18n/              # 多语言文案（可放自定义语言包）
├── web/dist/          # 管理面板前端
└── docs/              # 开发计划 / 指令表（面板页面数据源）
```

**`config/` 与 `data/` 是你的命脉**——备份与迁移只要带上这两个目录即可。

## 接入 OneBot 客户端

Dice!Next 不自带 QQ 登录，需要搭配一个 OneBot v11 客户端（如 NapCat、Lagrange、LLOneBot）：

1. 在 OneBot 客户端中开启正向 WS 服务端（记下地址，如 `ws://127.0.0.1:3001/`）。
2. 在 Dice!Next [适配器管理](/manage/adapter-manager)新建连接，传输模式选「正向 WS」，端点填上面的地址，Token 两端保持一致。
3. 保存并启用，状态显示「已连接」即成功。

断线后会自动重连（先每 5 秒、后每 60 秒退避，连续 20 次失败后暂停并显示「连接超时」，可手动重连）。

## 后台常驻

Dice!Next 是单个可执行程序，默认启动即最小化到系统托盘常驻：

- **开机自启**：管理面板 → 系统设置里开启「开机自启动」即可（随 Windows 登录自动启动）。
- 需要崩溃自动重启等更强守护时，可用任意进程守护工具（如 nssm 注册为 Windows 服务）。

::: tip 工作目录
Dice!Next 启动时会自动切换到 exe 所在目录（发行包），所以开机自启 / 双击 / 从别处运行都能找到 `config/`、`i18n/`。用第三方守护工具时仍建议把「工作目录」设为程序目录。
:::

## 安全建议

- **设置 WebUI 登录密码**：管理面板的 WebUI 设置页里设置。设置后所有后台页面与 `/api/*` 都需要登录（Cookie 会话）。勾选「信任此设备 30 天」后，登录态会跨浏览器与 Dice!Next 重启保留；受信会话保存在 `config/webui_sessions.json`，请勿共享该文件。
- **不要把管理面板直接暴露到公网**。如确需远程访问，建议放在反向代理（nginx 等）之后，并加上 HTTPS 与额外鉴权 / IP 限制。
- **保管好 OneBot Token**：它等同于你 QQ 机器人的控制权。
- **`{api:URL}` 默认关闭**：仅在需要时开启（`dice.api_enabled`），并配置域名白名单（`dice.api_whitelist`）。

::: warning AGPLv3 网络服务条款
Dice!Next 基于 AGPLv3。如果你**修改**了源码并**对外提供服务**（哪怕只是网络服务、未分发软件本体），需要向使用者提供对应的源代码。详见[开源协议](/other/license)。
:::

## 反向代理（可选）

如需用域名 + HTTPS 访问管理面板，可用 nginx 把请求转发到本地 `18088`（示例）：

```nginx
location / {
    proxy_pass http://127.0.0.1:18088;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;   # 面板有 WebSocket
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## 备份与升级

- **备份**：定期复制 `config/` 与 `data/` 两个目录即可。
- **升级**：停止服务 → 解压新包完整覆盖 → 重新启动。配置文件与数据库不在压缩包内、不会被覆盖，详见[安装部署](/guide/install#升级)。
- 升级前建议先备份 `data/`。

## 故障排查

| 现象 | 排查方向 |
|------|----------|
| 面板打不开 | 端口被占已自动顺延 / 进程未启动 / 防火墙；看 `data/logs/app/` |
| 程序闪退 | 看 `data/logs/crash_*.txt`（崩溃报告） |
| 适配器连不上 | 端点地址 / 端口 / Token；OneBot 客户端是否在线；「连接超时」需手动重连 |
| 指令不回 | 群是否被 `.bot off` 停用 / 全局静默；看[群管与系统](/use/admin) |
| 想不连 QQ 调试 | 用[测试台](/manage/dashboard) |

更完整的排查流程见[故障排查](/guide/troubleshooting)。
