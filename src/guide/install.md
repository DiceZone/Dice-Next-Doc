# 安装部署

当前为盲测（Beta）阶段，发布 **Windows 64 位** 解压即用包。Linux / Docker 在计划中。

## 下载与运行（Windows）

1. 获取最新的盲测包（形如 `DiceNext-beta-3.0.0(NNN)-日期.zip`）。
2. 解压到任意文件夹（路径建议不含特殊字符）。
3. 双击 **`dice-next-server.exe`** 启动。首次启动会自动生成配置文件（`config/default_config.json`）与数据目录。
4. 程序默认**不显示窗口，直接最小化到系统托盘**（右下角弹气泡提示）。右键托盘图标可「打开网页面板 / 显示控制台 / 打开应用目录 / 退出」。
5. 打开管理面板：托盘右键 →「打开网页面板」，或浏览器访问 **`http://localhost:18088`**。

压缩包内已附带常见运行库（VC++ 运行时），一般无需额外安装；仅支持 64 位 Windows 10 / 11。

::: tip 端口说明
默认端口 `18088`（可在 `config/default_config.json` 的 `server.port` 修改）。若端口被占用，启动时会**自动顺延到下一个可用端口并写回配置**——此时用托盘的「打开网页面板」总能打开正确地址。
:::

::: warning 单实例
同一套数据（同一个程序目录）只能运行一个进程，重复启动会自动退出，避免数据冲突。详见[故障排查](/guide/troubleshooting)。
:::

## 验证安装

启动后访问：

- **管理面板**：`http://localhost:18088`
- **状态检查**：`http://localhost:18088/api/system/status`

如果管理面板能打开，说明服务已正常运行。建议先在管理面板的 **WebUI 设置**里设置一个登录密码，然后去[快速开始](/guide/quickstart)接入你的 QQ 机器人。

## 开机自启

管理面板 → 系统设置里可开启**开机自启动**（随 Windows 登录自动启动，仅 Windows）。无需再手动配置任务计划。

## 升级

升级时**解压新包完整覆盖所有文件**即可——exe、DLL、`i18n/`、`web/dist/`、`data/` 下随包分发的内容（牌堆、规则库、帮助文档等）都需要更新。

你的个人数据不会丢失：

- **配置文件** `config/default_config.json` 不在压缩包内，不会被覆盖。
- **数据库**（`data/` 下的 `dice.db`、`cards.db`、`logs.db` 等）与你自己添加的牌堆 / 模组 / 插件文件也不随包分发。

升级前仍建议备份 `config/` 与 `data/` 两个目录。

## 从源码构建

需要自行编译（CMake + vcpkg + MSVC）请参考[从源码构建](/develop/build)。

## 下一步

- [快速开始](/guide/quickstart) — 接入第一个 OneBot 连接
- [数据迁移](/guide/migration) — 从旧版 Dice! 迁移数据
- [故障排查](/guide/troubleshooting) — 打不开 / 连不上 / 闪退怎么办
