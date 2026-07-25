# 从源码构建

面向开发者，说明如何从源码编译 Dice!Next 后端。后端为 C++20（CMake + vcpkg），目前在 **Windows + MSVC** 上验证。

## 依赖

vcpkg 依赖清单见 `server/vcpkg.json`（manifest 模式，配置时自动安装）：

```
drogon · nlohmann-json · sqlite-orm · spdlog · yaml-cpp
quickjs-ng · lua (5.4.x) · zstd
```

::: warning 同级依赖 onedice-cpp-lib
`server/CMakeLists.txt` 通过 `add_subdirectory(../../onedice-cpp-lib)` 引入 OneDice 掷骰库，它需要与 `dice-next` **并列放在同一个父目录**下：

```
你的工作目录/
├── dice-next/          ← 本仓库
└── onedice-cpp-lib/    ← OneDice V1 表达式引擎（配套项目）
```

缺少该目录时 CMake 配置会直接失败。
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

CMake 工程位于仓库的 `server/` 目录：

```powershell
cd dice-next

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

启动后访问 `http://localhost:18088`（首次运行自动生成 `config/default_config.json`）。

## Linux

::: warning 未正式验证
Linux 构建在理论上可行（drogon / vcpkg 跨平台），但目前主要在 Windows 验证，未做正式测试。仓库根另有 `cross-compile*` 交叉编译脚本可参考。
:::

```bash
git clone https://github.com/Microsoft/vcpkg.git ~/vcpkg && ~/vcpkg/bootstrap-vcpkg.sh
# dice-next 与 onedice-cpp-lib 需在同一父目录下
cd dice-next
cmake -B server/build -S server \
  -DCMAKE_TOOLCHAIN_FILE=$HOME/vcpkg/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Release
cmake --build server/build -j$(nproc)
```

## 前端与文档

前端管理面板与文档站用 npm 构建：

```bash
# 管理面板（构建产物 web/dist 由后端托管）
cd web && npm install && npm run build      # 或 npm run dev 本地开发

# 文档站（启用死链检查，改动后建议本地过一遍 build）
cd docs && npm install
npm run docs:dev      # 本地预览
npm run docs:build    # 构建（含死链检查）
```

## 打包

仓库根的 `package.ps1` 一键打包 Windows release zip（输出到 `release/`，文件名含版本号 / 构建号 / 时间戳）：

```powershell
powershell -ExecutionPolicy Bypass -File package.ps1
```

打包内容：

- `dice-next-server.exe` + 依赖 DLL + MSVC 运行库（免装 VC++ 运行库）
- `i18n/` 语言包
- `data/`：`decks/`、`rules/`、`helpdoc/`、`card-templates/`、`rulepacks/`、自带示例 JS 插件
- `docs/roadmap.md`、`docs/commands.json`（开发计划页 / 指令表页数据源）
- `web/dist` 前端产物

打包前需先完成后端编译与前端构建（缺一脚本会报错退出）。**不打包**配置文件——首次运行自动生成，避免升级覆盖用户配置。
