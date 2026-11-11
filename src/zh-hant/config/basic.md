<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 基礎配置

Dice!Next 使用 `config/` 目錄儲存 **JSON 格式**配置；首次啟動會生成各功能區的檔案。

絕大多數配置都能在 [Web 管理面板](/zh-hant/manage/dashboard) 裡修改，通常無需手動改檔案。首次生成的檔案只含少量鍵，**很多鍵在你通過面板設定後才會出現在檔案裡**（預設時使用內建預設值）。

## 配置檔案結構

每個功能區單獨儲存，面板儲存和通過熱過載校驗的手工修改都會回寫對應檔案：

| 檔案 | 內容 |
| --- | --- |
| `server.json` | WebUI/API 監聽、資料庫路徑與日誌級別 |
| `webui.json` | WebUI 登入設定 |
| `adapters.json` | 適配器連線配置 |
| `dice.json` | 骰子行為、骰主、規則與 AI 設定 |
| `events.json` | 好友、群邀請與事件策略 |
| `i18n.json` | 預設語言與平臺語言偏好 |
| `backup.json` | 手動與自動備份設定 |
| `hot_reload.json` | 配置與資源熱過載設定 |

以下示例按檔案展示（實際以啟動後生成的內容為準）：

```json
// config/server.json
{
  "host": "0.0.0.0",
  "port": 18088,
  "api_key": "",
  "db_path": "./data/dice.db",
  "log_level": "info"
}
```

## 主要配置項

### server

| 欄位 | 說明 | 預設值 |
|------|------|--------|
| `host` | 服務監聽地址 | `0.0.0.0` |
| `port` | 管理面板 / API 埠。被佔用時啟動會自動順延並寫回此鍵 | `18088` |
| `api_key` | 後端 API 訪問金鑰（首次自動生成，面板請求以 `X-API-Key` 頭攜帶） | 自動 |
| `db_path` | 主資料庫路徑（人物卡 / 日誌 / 聊天等另有獨立 db 檔案） | `./data/dice.db` |
| `log_level` | 最低記錄級別 trace/debug/info/success/warn/error；立即影響新日誌，舊 warning/critical 配置仍相容 | `info` |

::: tip WebUI 登入密碼與 api_key 的關係
管理面板的**訪問控制以「WebUI 登入密碼」為準**：在面板的 WebUI 設定頁設定後，所有 `/api/*` 請求都需要先登入（`webui.password` 鍵，留空 = 關閉鑑權）。登入時可選擇“信任此裝置 30 天”，可信會話僅儲存在本機 `config/webui_sessions.json`。`server.api_key` 是面板請求隨附的 API 金鑰，供對接場景使用，不能代替登入密碼。
:::

### dice

骰子行為主開關，常用鍵（多數在面板系統設定裡視覺化修改）：

| 欄位 | 說明 |
|------|------|
| `command_prefixes` | 指令字首陣列，預設 `.` `。` `!` `！` |
| `masters` | 骰主列表（`{platform, id}`，可多個） |
| `summon_word` | 召喚詞（留空關閉） |
| `whitelist_only` | 白名單模式：僅白名單群響應 |
| `silent_global` / `disabled_global` | 全域性靜默 / 全域性停用的指令列表 |
| `disabled_jrrp` | 全域性停用 `.jrrp` |
| `respond_self` | 是否響應骰娘賬號自己發的訊息（自控，預設關） |
| `console_start_hidden` | 啟動即隱藏控制台最小化到托盤（預設 `true`） |
| `api_enabled` / `api_whitelist` / `api_timeout` | 回覆中 `{api:URL}` 外部請求開關、域名白名單與超時 |
| `image_send` | 圖片傳送方式（`base64` 或經 `host` 中轉） |
| `message_format` | 出站展示方案：`traditional`（傳統）、`standard`（標準）或 `visual`（高階視覺）；舊值 `card` 自動按 `standard` 相容。詳見[適配器配置](/zh-hant/config/adapter#回覆文案與視覺方案) |
| `save_log_images` | 跑團日誌是否落地訊息內圖片 |
| `logsite_url` / `logsite_format` | 日誌站上傳地址（留空 = 官方站）與協議格式 |
| `aliases` | 舊版賬號許可權關聯（`{platform, alias, main}`，由骰主通過 `.admin account-alias` 維護；不是 `.alias` 快捷指令） |
| `notice` | 骰主通知視窗與事件訂閱（建議用通知設定頁管理） |
| `ai` | AI 子系統全部配置（模型 / 潤色 / 翻譯 / 對話 / 記憶 / 工具…，建議用 AI 頁管理） |
| `rules.default_dice_sides` | `.r` 無引數時的預設骰面 |
| `rules.coc_enabled` 等 | 各規則系統開關與 COC 大成功 / 大失敗區間 |

### events

事件與審批策略（面板許可權 / 系統設定裡可改）：

| 欄位 | 說明 |
|------|------|
| `friend_policy` / `auto_approve_friend` / `friend_keyword` | 加好友審批策略 / 自動同意 / 驗證關鍵詞 |
| `friend_welcome` | 新好友歡迎語（空 = 內建文案） |
| `group_invite_policy` / `auto_approve_group` / `group_keyword` | 加群邀請審批策略 |
| `group_invite_reject_blacklist` / `group_invite_reject_nonfriend` | 拒絕黑名單群 / 非好友的邀請 |
| `poke_enabled` / `poke_command` | 戳一戳回覆開關 / 戳一戳對映為指令 |

### i18n

| 欄位 | 說明 |
|------|------|
| `default_locale` | 預設回覆語言（`zh-Hans` / `zh-Hant` / `en` / `ja`） |
| `platform_defaults` | 各平臺的預設語言 |
| `resource_dir` | 語言包目錄（預設 `i18n`，放入 `<语言码>.json` 可自動載入自訂語言） |

### log

| 欄位 | 說明 |
|------|------|
| `raw_events` | 是否在日誌中記錄適配器原始事件（除錯用） |

### hot_reload

| 欄位 | 說明 |
|------|------|
| `enabled` | 開啟後修改 `config/`、`data/` 下的檔案自動檢測生效 |
| `debounce_ms` / `watch_paths` | 去抖間隔與監視目錄 |

### adapters

適配器配置儲存在 `config/adapters.json`。以[適配器管理](/zh-hant/manage/adapter-manager)頁儲存後的內容為準；手工修改時也請保持該檔案為有效 JSON。欄位說明見[適配器配置](/zh-hant/config/adapter)。

## 熱載入與重啟

`hot_reload.enabled` 開啟後，手改配置檔案會被自動檢測並生效；通過管理面板修改的設定也會即時儲存生效。

::: warning 需要重啟的項
`server.port` / `server.host` 修改後需要重啟才能生效——推薦在面板的 **WebUI 設定**頁線上修改，頁面會提示並提供「立即重啟」按鈕。
:::

## 升級提示

升級時解壓新包完整覆蓋即可；`config/` 目錄不在發行包內，不會被覆蓋，詳見[安裝部署](/zh-hant/guide/install#升級)。
