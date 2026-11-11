# Dice!Next Doc

<p>
  <a href="README.md">English</a> · <a href="README.zh-Hans.md">简体中文</a> · <b>繁體中文</b> · <a href="README.ja.md">日本語</a>
</p>

Dice!Next 的使用者文件專案。它包含 VitePress 文件站、當前路線圖、指令資料與版本說明，是使用者瞭解功能和開發進度的統一入口。

## 內容

- `src/`：VitePress 文件站原始碼與主題配置。
- `roadmap.md`：面向測試使用者的功能進度與更新記錄。
- `commands.json`：管理後臺使用的指令分類與說明資料。
- `i18n.md`、`versioning.md`：多語言與版本維護約定。

## 本地預覽

環境要求：Node.js 26.12.1 或更新的 26.x 版本（也可使用 24.18.0 或更新的 24.x），以及隨附的 npm。

```powershell
npm ci
npm run docs:dev
```

構建靜態站點：

```powershell
npm run docs:build
npm run docs:preview
```

## 文件站的多語言

文件站提供簡體中文、繁體中文、English 與日本語四種語言。首次訪問時按瀏覽器語言自動選擇，無法判斷時顯示簡體中文；右上角可切換語言，選擇會記在瀏覽器裡。

| 語言 | 目錄 | 維護方式 |
| --- | --- | --- |
| 簡體中文 | `src/`（根目錄） | 原文，所有修改先改這裡 |
| 繁體中文 | `src/zh-hant/` | 由 `npm run i18n:hant` 從簡體中文自動生成，不要手工修改 |
| English | `src/en/` | 人工翻譯 |
| 日本語 | `src/ja/` | 人工翻譯 |

修改簡體中文頁面後：

1. 執行 `npm run i18n:hant` 重新生成繁體中文（`docs:build` 前也會自動執行）。
2. 同步修改 `src/en/` 與 `src/ja/` 中對應的頁面。
3. 執行 `npm run i18n:check`：檢查缺頁、過期的繁體中文頁面、未加語言字首的站內連結，以及失效的 `#锚点`。英文和日文的標題與中文不同，跨頁錨點要寫目標語言頁面實際的標題；`npm run i18n:anchors` 可自動修正寫法相近的錨點。

需要圖示時使用 `<Icon name="…" />`（Lucide 圖示庫），不要使用 emoji。

## 與發行包的關係

Dice!Next 主程式打包時會讀取本倉庫根目錄的 `roadmap.md` 與 `commands.json`，並將它們寫入安裝包的 `docs/` 目錄。因此修改這兩個檔案後，應重新打包主程式。

完整開發環境還包括 `Dice-Next`、`Dice-Next-WebUI` 和 `onedice-cpp-lib`。將四個專案放在同一工作區，可直接使用主程式的 Release 工作流組裝完整發行包。

## 文件維護

- 已完成的歷史需求使用壓縮表格保留，避免路線圖變成冗長的開發記錄。
- 新功能按日期與構建號追加更新日誌，不覆蓋既有日期條目。
- 面向使用者的文件應說明實際可用行為，避免記錄內部實現細節或臨時工單號。

## 反饋

專案目前處於公測（Beta）階段。問題和功能建議請優先通過 [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) 提交；也歡迎加入 QQ 群 `933145116` 交流與反饋。

## 開源許可證

本專案以 **GNU Affero General Public License v3.0 or later（AGPL-3.0-or-later）** 釋出，與 [Dice-Next](https://github.com/DiceZone/Dice-Next) 主倉庫保持一致。完整條款見 [LICENSE](LICENSE)。
