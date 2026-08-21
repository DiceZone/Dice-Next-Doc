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

::: warning 未正式验证
Linux 构建在理论上可行（drogon / vcpkg 跨平台），但目前主要在 Windows 验证，未做正式测试。仓库根另有 `cross-compile*` 交叉编译脚本可参考。
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
