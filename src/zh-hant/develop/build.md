<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 從原始碼構建

面向開發者，說明如何從原始碼編譯 Dice!Next 後端、構建 WebUI 與生成本地測試包。後端為 C++20（CMake + vcpkg）；日常本地開發推薦 Windows + MSVC，Release 工作流會構建 Windows、Linux 與 macOS 發行包。

## 依賴

vcpkg 依賴清單見 `server/vcpkg.json`（manifest 模式，配置時自動安裝）：

```
drogon · brotli · nlohmann-json · sqlite-orm · spdlog · yaml-cpp
quickjs-ng · lua (5.4.x) · zstd
```

Brotli 必須包含 CVE-2026-111497 的上游修復。專案通過
`server/vcpkg-configuration.json` 載入 `server/vcpkg-overlays/brotli`，保留其餘
依賴的固定版本。經典模式安裝時同樣需要傳入 `--overlay-ports=server/vcpkg-overlays`；
不要繞過 CMake 的安全補丁檢查。

::: warning 多倉佈局：並列放在同一個父目錄下
Dice!Next 拆分為多個倉庫，構建/打包指令碼按**同級目錄**互相尋找，請這樣擺放：

```
你的工作目录/
├── Dice-Next/          ← 后端主仓（server/ CMake 工程、package.ps1）
├── Dice-Next-WebUI/    ← Web 管理面板（Vite + React）
├── Dice-Next-Doc/      ← 本文档站（VitePress）
├── Dice-Next-Docker/   ← 容器化部署（可选）
├── onedice-cpp-lib/    ← OneDice V1 表达式引擎（CMake 必需）
└── dicescript-c-lib/   ← DiceScript C99 兼容引擎（CMake 必需）
```

`server/CMakeLists.txt` 通過 `add_subdirectory` 引入同級的 `onedice-cpp-lib` 與 `dicescript-c-lib`，缺少任一倉庫都會使 CMake 配置直接失敗；打包指令碼預設在同級找 `Dice-Next-WebUI/dist` 與 `Dice-Next-Doc`（也可用環境變數 `DICENEXT_WEB_ROOT` / `DICENEXT_DOC_ROOT` 指定別處）。
:::

## Windows（推薦 / 已驗證）

### 環境準備

```powershell
# 1. Visual Studio 2022 Build Tools，勾选「使用 C++ 的桌面开发」
# 2. CMake >= 3.20
winget install Kitware.CMake
# 3. vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:/dev/vcpkg
cd C:/dev/vcpkg
.\bootstrap-vcpkg.bat
```

### 構建

CMake 工程位於主倉的 `server/` 目錄：

```powershell
cd Dice-Next

cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release -j
```

首次配置時 vcpkg 會拉取並編譯全部依賴，耗時較長屬正常。`server/build.bat` 是一鍵指令碼參考（路徑按機器調整）。

### 執行

```powershell
# 工作目录需为 server/（或打包后的包根），以便找到 config/ 与 i18n/
cd server
.\build\Release\dice-next-server.exe
```

啟動後訪問 `http://localhost:18088`。首次執行會生成 `config/` 目錄和 `data/` 目錄；管理埠在 `config/server.json` 的 `port` 修改。

## Linux

::: info 構建驗證不等於平臺實機驗收
Release CI 已構建 Linux x64 / ARM64、macOS ARM64 和 Windows x64 / ARM64，獨立 Linux / Windows 後端測試為釋出門禁。這裡的構建成功不表示全部適配器已用真實賬號驗收；倉庫根另有 `cross-compile*` 指令碼可參考。
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

## 前端與文件

前端管理面板與文件站是**獨立倉庫**，各自用 npm 構建：

使用 Node.js **26.12.1 或更新的 26.x 安全版本**。CI 跟隨 `26.x` 並開啟
`check-latest: true`，構建前檢查最低安全版本、記錄實際版本；不會自動跨到 27。
文件站另外接受 Node.js **24.18.0 或更新的 24.x**，以便在只提供 Node 24 的託管平臺上部署。

```bash
# 管理面板（Dice-Next-WebUI 仓；构建产物 dist/ 由后端托管、被打包脚本收集）
cd Dice-Next-WebUI && npm install && npm run build   # 或 npm run dev 本地开发

# 文档站（Dice-Next-Doc 仓；启用死链检查，改动后建议本地过一遍 build）
cd Dice-Next-Doc && npm install
npm run docs:dev      # 本地预览
npm run docs:build    # 构建（含死链检查）
```

前端改動還應執行 `npm test` 與 `npm run lint`，不要只根據開發伺服器能開啟判斷成功。安裝為應用使用相對地址的清單、圖示，以及只處理頁面導航、不快取任何內容的 `public/sw.js`（僅在 HTTPS / localhost 的生產構建中註冊）；不要在其中加入 API 或資源快取。

## Release 快取與測試門禁

- 釋出目標顯式設定 `BUILD_TESTING=OFF`，不把測試程式編進各平臺包；Windows x64 / Linux x64 另設 `BUILD_TESTING=ON` 任務執行 CTest，全部通過才釋出。
- 依賴按固定 vcpkg baseline 安裝，使用完整 Git 歷史獲取鎖定版本埠。快取只儲存 ABI 二進位制包，按平臺、triplet、runner 環境和依賴族區分，新增包後重新整理快照；不停用相容性校驗。
- Windows 測試構建使用受控 `/MP2` 檔案並行，避免專案並行疊加導致記憶體暴漲；本地可用 `DICENEXT_MSVC_COMPILE_PROCESSES` 調整。
- 冷快取仍需預熱，不承諾每輪固定分鐘數。最近 beta.925 的 Release 工作流成功；詳細實現與驗證見[主倉構建記錄](https://github.com/DiceZone/Dice-Next/blob/main/docs/ci-release-build.md)。

### Beta 與正式版標識

預設構建使用 Beta 標識，介面顯示 `beta-3.0.0(123)`。正式版維護者在 CMake 配置時加 `-DDICENEXT_PRERELEASE=OFF`，介面顯示 `v3.0.0(123)`；該選項不改變語義版本與構建號計數規則，也不會自動建立 GitHub Release。當前釋出工作流仍為 Beta。

## 生成 Windows 本地測試包

主倉 `Dice-Next` 根目錄的 `package.ps1` 一鍵打包 Windows release zip（輸出到 `release/`，檔名含版本號 / 構建號 / 時間戳；前端 dist 與文件資料預設從同級倉庫收集）：

```powershell
$env:DICENEXT_WEB_ROOT = "..\Dice-Next-WebUI"
$env:DICENEXT_DOC_ROOT = "..\Dice-Next-Doc"
powershell -ExecutionPolicy Bypass -File package.ps1
```

預設輸出到主倉的 `release/`。可通過 `DICENEXT_RELEASE_ROOT` 指定輸出目錄。指令碼會檢查後端構建產物與 WebUI 的 `dist/`，缺少任一項時會停止，避免生成不完整的測試包。

打包內容：

- `dice-next.exe` 啟動管理器、`app/dice-next-core.exe` 服務核心，以及 `lib/` 中集中收納的依賴與 MSVC 執行庫
- `i18n/` 語言包
- `data/`：`decks/`、`rules/`、`helpdoc/`、`card-templates/`、`rulepacks/`、自帶示例 JS 插件
- `docs/roadmap.md`、`docs/commands.json`（開發計劃頁 / 指令表頁資料來源）
- `web/dist` 前端產物

打包前需先完成後端編譯與前端構建（缺一指令碼會報錯退出）。**不打包**配置檔案——首次執行自動生成，避免升級覆蓋使用者配置。
