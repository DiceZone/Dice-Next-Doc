# 从源码构建

面向开发者，说明如何从源码编译 Dice!Next 后端、构建 WebUI 与生成本地测试包。后端为 C++20（CMake + vcpkg）；日常本地开发推荐 Windows + MSVC，Release 工作流会构建 Windows、Linux 与 macOS 发行包。

## 依赖

vcpkg 依赖清单见 `server/vcpkg.json`（manifest 模式，配置时自动安装）：

```
drogon · nlohmann-json · sqlite-orm · spdlog · yaml-cpp
quickjs-ng · lua (5.4.x) · zstd
```

::: warning 多仓布局：并列放在同一个父目录下
Dice!Next 拆分为多个仓库，构建/打包脚本按**同级目录**互相寻找，请这样摆放：

```
你的工作目录/
├── Dice-Next/          ← 后端主仓（server/ CMake 工程、package.ps1）
├── Dice-Next-WebUI/    ← Web 管理面板（Vite + React）
├── Dice-Next-Doc/      ← 本文档站（VitePress）
├── Dice-Next-Docker/   ← 容器化部署（可选）
├── onedice-cpp-lib/    ← OneDice V1 表达式引擎（CMake 必需）
└── dicescript-c-lib/   ← DiceScript C99 兼容引擎（CMake 必需）
```

`server/CMakeLists.txt` 通过 `add_subdirectory` 引入同级的 `onedice-cpp-lib` 与 `dicescript-c-lib`，缺少任一仓库都会使 CMake 配置直接失败；打包脚本默认在同级找 `Dice-Next-WebUI/dist` 与 `Dice-Next-Doc`（也可用环境变量 `DICENEXT_WEB_ROOT` / `DICENEXT_DOC_ROOT` 指定别处）。
:::

## Windows（推荐 / 已验证）

### 环境准备

```powershell
# 1. Visual Studio 2022 Build Tools，勾选「使用 C++ 的桌面开发」
# 2. CMake >= 3.20
winget install Kitware.CMake
# 3. vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:/dev/vcpkg
cd C:/dev/vcpkg
.\bootstrap-vcpkg.bat
```

### 构建

CMake 工程位于主仓的 `server/` 目录：

```powershell
cd Dice-Next

cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release -j
```

首次配置时 vcpkg 会拉取并编译全部依赖，耗时较长属正常。`server/build.bat` 是一键脚本参考（路径按机器调整）。

### 运行

```powershell
# 工作目录需为 server/（或打包后的包根），以便找到 config/ 与 i18n/
cd server
.\build\Release\dice-next-server.exe
```

启动后访问 `http://localhost:18088`。首次运行会生成 `config/` 目录和 `data/` 目录；管理端口在 `config/server.json` 的 `port` 修改。

## Linux

::: info 构建验证不等于平台实机验收
Release CI 已构建 Linux x64 / ARM64、macOS ARM64 和 Windows x64 / ARM64，独立 Linux / Windows 后端测试为发布门禁。这里的构建成功不表示全部适配器已用真实账号验收；仓库根另有 `cross-compile*` 脚本可参考。
:::

```bash
git clone https://github.com/Microsoft/vcpkg.git ~/vcpkg && ~/vcpkg/bootstrap-vcpkg.sh
# Dice-Next、onedice-cpp-lib 与 dicescript-c-lib 需在同一父目录下
cd Dice-Next
cmake -B server/build -S server \
  -DCMAKE_TOOLCHAIN_FILE=$HOME/vcpkg/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Release
cmake --build server/build -j$(nproc)
```

## 前端与文档

前端管理面板与文档站是**独立仓库**，各自用 npm 构建：

```bash
# 管理面板（Dice-Next-WebUI 仓；构建产物 dist/ 由后端托管、被打包脚本收集）
cd Dice-Next-WebUI && npm install && npm run build   # 或 npm run dev 本地开发

# 文档站（Dice-Next-Doc 仓；启用死链检查，改动后建议本地过一遍 build）
cd Dice-Next-Doc && npm install
npm run docs:dev      # 本地预览
npm run docs:build    # 构建（含死链检查）
```

前端改动还应执行 `npm test` 与 `npm run lint`，不要只根据开发服务器能打开判断成功。安装为应用仅增加前端清单与图标，不引入 Service Worker 或 API 离线缓存。

## Release 缓存与测试门禁

- 发布目标显式设置 `BUILD_TESTING=OFF`，不把测试程序编进各平台包；Windows x64 / Linux x64 另设 `BUILD_TESTING=ON` 任务执行 CTest，全部通过才发布。
- 依赖按固定 vcpkg baseline 安装，使用完整 Git 历史获取锁定版本端口。缓存只保存 ABI 二进制包，按平台、triplet、runner 环境和依赖族区分，新增包后刷新快照；不禁用兼容性校验。
- Windows 测试构建使用受控 `/MP2` 文件并行，避免项目并行叠加导致内存暴涨；本地可用 `DICENEXT_MSVC_COMPILE_PROCESSES` 调整。
- 冷缓存仍需预热，不承诺每轮固定分钟数。最近 beta.925 的 Release 工作流成功；详细实现与验证见[主仓构建记录](https://github.com/DiceZone/Dice-Next/blob/main/docs/ci-release-build.md)。

### Beta 与正式版标识

默认构建使用 Beta 标识，界面显示 `beta-3.0.0(123)`。正式版维护者在 CMake 配置时加 `-DDICENEXT_PRERELEASE=OFF`，界面显示 `v3.0.0(123)`；该选项不改变语义版本与构建号计数规则，也不会自动创建 GitHub Release。当前发布工作流仍为 Beta。

## 生成 Windows 本地测试包

主仓 `Dice-Next` 根目录的 `package.ps1` 一键打包 Windows release zip（输出到 `release/`，文件名含版本号 / 构建号 / 时间戳；前端 dist 与文档数据默认从同级仓库收集）：

```powershell
$env:DICENEXT_WEB_ROOT = "..\Dice-Next-WebUI"
$env:DICENEXT_DOC_ROOT = "..\Dice-Next-Doc"
powershell -ExecutionPolicy Bypass -File package.ps1
```

默认输出到主仓的 `release/`。可通过 `DICENEXT_RELEASE_ROOT` 指定输出目录。脚本会检查后端构建产物与 WebUI 的 `dist/`，缺少任一项时会停止，避免生成不完整的测试包。

打包内容：

- `dice-next.exe` 启动管理器、`app/dice-next-core.exe` 服务核心，以及 `lib/` 中集中收纳的依赖与 MSVC 运行库
- `i18n/` 语言包
- `data/`：`decks/`、`rules/`、`helpdoc/`、`card-templates/`、`rulepacks/`、自带示例 JS 插件
- `docs/roadmap.md`、`docs/commands.json`（开发计划页 / 指令表页数据源）
- `web/dist` 前端产物

打包前需先完成后端编译与前端构建（缺一脚本会报错退出）。**不打包**配置文件——首次运行自动生成，避免升级覆盖用户配置。
