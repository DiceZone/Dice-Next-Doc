<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 貢獻指南

感謝你對 Dice!Next 的關注！本頁說明如何參與，以及貢獻時**特別需要注意的事項**。

## 行為準則

- 尊重所有貢獻者，建設性地討論與審查
- 專注技術，對事不對人

## 貢獻方式

### 報告 Bug

在 GitHub Issues 提交，請儘量包含：版本號（`.bot` 可查）、作業系統、復現步驟、期望 vs 實際、相關日誌。

### 功能建議

說明功能描述、使用場景、與現有功能的相容性。涉及指令的，請優先參考**原版 Dice! 的行為**（見下方注意事項）。

### 提交程式碼

```bash
git checkout -b feature/my-feature
# 编写代码…
git commit -m "feat: 新功能描述"
git push origin feature/my-feature
# 在 GitHub 发起 Pull Request
```

## 開發環境

專案拆分為多個倉庫，按貢獻內容選擇要 clone 的倉：

| 倉庫 | 內容 |
| --- | --- |
| `Dice-Next` | 後端主倉（C++，CMake 工程在 `server/`） |
| `Dice-Next-WebUI` | Web 管理面板（Vite + React + TS） |
| `Dice-Next-Doc` | 本文件站（VitePress） |
| `Dice-Next-Docker` | 容器化部署 |
| `onedice-cpp-lib` | OneDice 表示式引擎（編譯後端必需，與主倉放同級目錄） |
| `dicescript-c-lib` | DiceScript C99 相容引擎（編譯後端必需，與主倉放同級目錄） |

完整步驟與目錄擺放見[從原始碼構建](/zh-hant/develop/build)，簡要：

```bash
# 后端（Dice-Next 仓；两个表达式引擎库需在同级目录）
cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=<vcpkg>/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release
# 前端（Dice-Next-WebUI 仓）
npm install && npm run build
```

## 注意事項（重要）

這些是本專案特有的約定，**動手前請務必瞭解**：

### 1. 忠實復刻優先，先查原版

Dice!Next 的核心目標是讓老 Dice! 使用者**無痛遷移**。新增 / 改動任何**指令、規則、文案、鍵值**之前，先查原版 Dice! 的實際行為（`DiceEvent.cpp` / `GlobalVar.cpp` 等），**不要自己發明**語法或措辭。參考專案（海豹 / 青果）也可對照。

### 2. 文案一律走 i18n，不要硬編碼

所有面向用戶的文本都通過 i18n 系統輸出，**不要在程式碼裡寫死中文**。新增文案鍵時，**四種語言（zh-Hans / zh-Hant / en / ja）都要補**，否則切換語言會缺字。另外注意：`.help` 幫助文本的首行統一為「描述詞 + 指令」的句式，且預設回覆文案**不得以指令字首開頭**（`tools/audit_i18n_texts.py` 會做迴歸檢查）。

### 3. 改資料庫表結構要改兩處

資料庫 schema 在兩個地方各宣告一次，**必須同步修改**：
- `server/src/storage/database.h` 的 `Storage` `decltype(make_storage(...))`
- `server/src/storage/database.cpp` 的 `make_storage(...)`

只改一處會導致一大段模板報錯。新增列由 `sync_schema` 自動 ALTER，不會丟資料。

### 4. 絕不提交金鑰 / Token

OneBot Access Token、API Key 等**不得**寫進提交。`config/` 是執行時自動生成的本地目錄，注意不要把含真實 Token 的本地配置提交上去。

### 5. Windows 平臺坑

- `windows.h` 的 `max`/`min` 宏會和 `std::max`/`std::min` 衝突（C2589）；用 `(a < b ? b : a)` 或定義 `NOMINMAX`。
- 跨程序外部呼叫走 `curl`（drogon 的非同步 DNS 在 Windows 上有問題），參考既有日誌上傳 / `{api:}` 實現。

### 6. 文件改動要過構建

文件站啟用了死鏈檢查，新增 / 改連結後請本地跑一遍 `npm run docs:build`（在 `docs/`），通過再提交。

### 7. 前端一律用網頁樣式元件，停用瀏覽器原生控制元件

下拉框、彈窗、確認框等**不要用瀏覽器自帶的原生控制元件**，統一用專案內的樣式元件，保證三端外觀一致、可主題化：

- **下拉框**：用 `@/components/ui/select` 的 `Select`（`SelectTrigger` / `SelectContent` / `SelectItem` / `SelectValue`），**不要寫原生 `<select>`**。
- **確認 / 輸入彈窗**：用 `@/hooks/use-dialogs` 的 `useDialogs()` —— `await dlg.confirm({ title, description, destructive })`、`await dlg.prompt({ title, defaultValue })`，並把 `dlg.node` 渲染進元件樹。**不要用 `window.confirm` / `alert` / `prompt`**。
- **對話方塊 / 抽屜**：用 `@/components/ui/dialog`，不要自己堆原生 `<dialog>` 或裸 `position:fixed` 遮罩。

參考既有用法：下拉看 `components/adapter/adapter-form.tsx`，彈窗看 `pages/groups-page.tsx`。

## Commit 規範

採用 [Conventional Commits](https://www.conventionalcommits.org/)：

| 型別 | 說明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修復 |
| `docs` | 文件 |
| `refactor` | 重構 |
| `perf` | 效能 |
| `chore` | 構建 / 工具鏈 |

## 程式碼風格

- **C++20**；4 空格縮排；型別 / 函式駝峰（`DiceEngine` / `rollDice`），變數蛇形（`max_count`）；不可變引用加 `const`。儘量與周圍既有程式碼風格保持一致。
- **TypeScript / React**：遵循專案 ESLint；函式式元件；Props 用 `interface`。下拉 / 彈窗等互動一律用網頁樣式元件，不用瀏覽器原生控制元件（見上方注意事項第 7 條）。

## 許可證

Dice!Next 基於 **AGPLv3**（沿用原版 Dice! 的協議）。提交貢獻即表示你同意在該許可證下發布。
