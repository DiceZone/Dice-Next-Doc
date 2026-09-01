# 安装部署

当前为公测（Beta）阶段。Release 提供 Windows（amd64 / arm64）、Linux（amd64 / arm64）与 macOS（arm64）发行包；容器化部署请参阅 Docker 项目说明。

## 下载与运行（Windows）

1. 在 [GitHub Releases](https://github.com/DiceZone/Dice-Next/releases) 获取与你的平台和架构相符的最新公测包。
2. 解压到任意文件夹（路径建议不含特殊字符）。
3. Windows 请双击 **`dice-next.exe`** 启动；Linux/macOS 请执行包内启动脚本或核心程序。首次启动会自动生成 `config/` 与数据目录。
4. 程序默认**不显示窗口，直接最小化到系统托盘**（右下角弹气泡提示）。右键托盘图标可「打开网页面板 / 显示控制台 / 打开应用目录 / 退出」。
5. 打开管理面板：托盘右键 →「打开网页面板」，或浏览器访问 **`http://localhost:18088`**。

压缩包内已附带常见运行库（VC++ 运行时），一般无需额外安装；仅支持 64 位 Windows 10 / 11。

::: tip 端口说明
默认端口 `18088`（可在 `config/server.json` 的 `port` 修改）。若端口被占用，启动时会**自动顺延到下一个可用端口并写回配置**——此时用托盘的「打开网页面板」总能打开正确地址。
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

### 管理面板自动更新

打开**管理面板 → 关于项目 → 检测与自动更新**：

1. 点“立即检查”，程序从 GitHub Release 的 `update-manifest.json` 获取最新版本与当前平台安装包。
2. 默认“自动选择”会并行探测 GitHub 直连和内置镜像；中国大陆网络不稳定时会自动采用先成功的镜像，也可强制仅镜像或填写可信的自定义 HTTPS 镜像。
3. 点“下载更新”后，程序核对清单仓库、平台、架构、文件名、文件大小与 SHA-256。Windows 还会在解压前检查路径穿越和包结构。
4. Windows 使用 `dice-next.exe` 启动时，可点“安装并重启”。管理器事务式替换程序、运行库、WebUI、文档与内置资源；任一步失败都会按相反顺序恢复旧版。

自动检查默认开启、间隔 6 小时、发现更新后仅通知。你可以改为自动下载；“自动安装并重启”只有 Windows 管理器模式可选。Linux、macOS 或直接运行核心时，可自动检查 / 下载，但暂不原地安装。容器部署只检查并通知，不下载或安装程序更新；请拉取新镜像并重新创建容器。

::: tip 容器升级
官方镜像带有明确的容器标记，程序也会用 Docker / Podman 标记、Kubernetes 环境变量和 cgroup 信息兜底识别。检测到容器后，WebUI 会禁用手动与自动下载 / 安装，但版本检查仍可使用。Compose 部署可执行 `docker compose pull dice-next`，再执行 `docker compose up -d --force-recreate dice-next`；挂载的 `config/` 与 `data/` 会保留。
:::

::: warning 镜像信任边界
SHA-256 可以发现下载中断、损坏或清单与安装包不一致，但不是独立的发行签名。选择内置或自定义镜像代表信任该来源；对供应链要求较高时，请使用“仅 GitHub”，并在 Release 页面核对版本。
:::

### 手动升级

也可以从 [GitHub Releases](https://github.com/DiceZone/Dice-Next/releases) 下载对应平台的新包，停服后**完整覆盖程序文件**——exe、运行库、`i18n/`、`web/dist/`、`docs/` 与包内内置资源都需要更新。

个人数据不会被安装包清空：

- 配置目录 `config/` 不在发行包内；
- `data/` 下的数据库、跑团日志、媒体与用户自建资源会保留；
- 内置 `data/helpdoc` 会随版本刷新，`data/plugins` 采用覆盖内置文件但保留其他文件的方式更新。

升级前仍建议从管理面板制作备份，或手工备份 `config/` 与 `data/`。

## 从源码构建

需要自行编译（CMake + vcpkg + MSVC）请参考[从源码构建](/develop/build)。

## 下一步

- [快速开始](/guide/quickstart) — 接入第一个 OneBot 连接
- [数据迁移](/guide/migration) — 从旧版 Dice! 迁移数据
- [故障排查](/guide/troubleshooting) — 打不开 / 连不上 / 闪退怎么办
