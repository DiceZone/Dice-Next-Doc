<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 快速開始概覽

歡迎來到 **Dice!Next 3.0**——新一代 TRPG 骰子機器人。

## 什麼是 Dice!Next？

Dice!Next 是 Dice! 的全新重構版本，從原有的 CoolQ 單體 DLL 架構徹底重構為現代化的前後端分離架構：

- **後端 (C++)**：基於 drogon 框架，提供 HTTP REST API + WebSocket 推送
- **前端 (React)**：基於 Vite + shadcn/ui + Tailwind CSS 的 SPA 管理面板
- **協議層**：OneBot v11 開箱即用（正向 / 反向 WS），插件式適配器架構支援協議擴展

## 核心特性

| 特性 | 說明 |
|------|------|
| <Icon name="dices" />全能擲骰 | COC7 / DND / BRP 檢定與房規、命運骰、暗骰、獎懲骰，相容原版指令 |
| <Icon name="languages" />多語言 | 簡體 / 繁體 / English / 日本語四語回覆，支援自訂語言包 |
| <Icon name="layout-dashboard" />Web 面板 | 群管、玩家、牌堆、規則、日誌、定時任務、通知……全部網頁化 |
| <Icon name="puzzle" />擴展生態 | 相容原版 Dice! Lua mod 與海豹 SealDice JS 插件，規則包一鍵匯入 |
| <Icon name="bot" />AI 增強 | 可選接入大模型：回覆潤色、翻譯、對話、NPC 扮演、工具呼叫 |
| <Icon name="package" />解壓即用 | Windows 包自帶執行庫，雙擊啟動，托盤常駐，開機自啟 |
| <Icon name="zap" />熱載入 | 配置變更自動生效；面板改設定即時儲存 |

## 快速導航

- [安裝部署](/zh-hant/guide/install) — 下載、執行與升級
- [快速開始](/zh-hant/guide/quickstart) — 5 分鐘上手 Dice!Next
- [資料遷移](/zh-hant/guide/migration) — 從舊版 Dice! 遷移資料
- [部署與運維](/zh-hant/guide/deploy) — 長期執行、備份與安全
- [故障排查](/zh-hant/guide/troubleshooting) — 打不開 / 連不上 / 閃退怎麼辦

## 系統要求

| 場景 | 要求 |
|------|------|
| 執行發行包 | 64 位 Windows 10 / 11（壓縮包已附帶常見執行庫） |
| Linux / Docker | Linux amd64 / arm64 發行包與 Docker 映像；具體部署見發行說明 |
| 從原始碼構建 | Visual Studio 2019+ / cmake ≥ 3.20 / vcpkg，見[從原始碼構建](/zh-hant/develop/build) |

## 版本說明

當前為 **Dice!Next 3.0 公測（Beta）** 階段，以 AGPLv3 協議開源。歡迎通過 [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) 反饋問題。
