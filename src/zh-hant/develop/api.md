<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# API 參考

Dice!Next 後端提供 REST API，管理面板即基於此構建。本頁按功能分組列出當前可用的介面；路由較多，只列路徑與用途，具體請求 / 響應欄位以實際版本為準（可在管理面板的網路請求中對照）。

## 基礎資訊

| 專案 | 說明 |
|------|------|
| 基礎地址 | `http://localhost:18088`（埠見 `server.port`，可在網頁設定中線上修改） |
| 資料格式 | JSON，UTF-8 |
| 認證 | 管理面板訪問金鑰（`server.api_key`）；另可啟用 WebUI 登入密碼（Cookie 會話，見「認證」一節） |

## 統一響應格式

除特別說明外，介面均返回統一信封：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code`：`0` 成功，非 `0` 失敗
- `message`：提示資訊
- `data`：響應資料（失敗時為 `null` 或預設）

少數介面不走信封：`/api/test/message` 直接返回結果物件，`/api/logs/{id}/export`、`/api/assets/{name}`、圖片類介面直接返回檔案內容。

## 認證與執行控制

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/auth/status` | 是否啟用登入密碼 / 當前會話狀態 |
| POST | `/api/auth/login` · `/api/auth/logout` | 登入 / 登出（Cookie 會話） |
| GET / PUT | `/api/system/webui-auth` | 登入密碼設定 |
| GET / PUT | `/api/system/server-config` | 執行 IP / 埠（改後需重啟生效） |
| POST | `/api/system/restart` | 重啟後端 |
| GET / PUT | `/api/system/autostart` | 開機自啟（Windows） |
| GET / PUT | `/api/system/update` | 讀取 / 儲存自動檢查間隔、發現後動作與下載來源 |
| POST | `/api/system/update/check` | 立即在後臺檢查最新 GitHub Release |
| POST | `/api/system/update/download` | 下載並校驗當前平臺安裝包 |
| POST | `/api/system/update/install` | 安裝已暫存更新並重啟（Windows 或新版 Linux/macOS 管理器模式） |

WebUI 會話 Cookie 按安裝實例穩定命名，而不是按主機或埠共用：同一主機不同安裝目錄可同時登入，同一實例改埠或重啟仍可恢復 30 天受信會話。`GET /api/auth/status` 會相容並遷移舊版 `dice_session`；`POST /api/auth/logout` 只撤銷當前實例的會話。

## 系統狀態與設定

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/system/status` | 執行狀態 |
| GET | `/api/system/settings` | 基礎設定（host / port / 日誌級別等） |
| GET | `/api/dashboard/stats` | 儀表盤統計 |
| GET / PUT | `/api/system/global` | 分作用域設定（響應開關 / 外部請求 / BotMsg 等） |
| GET / PUT | `/api/system/events` | 事件策略（審批 / 退群 / 自動清理等） |
| GET / PUT | `/api/system/prefixes` | 指令字首 |
| GET / PUT | `/api/system/random-source` | 全域性擲骰隨機源。PUT 請求為 `{ "source": "system" \| "openssl" \| "hardware" }`（CPU 不支援 RDSEED 時拒絕 `hardware`），預設 system，儲存立即生效，修改需完整管理許可權。響應 data 另含 `active`（最近一次擲骰實際來源，可為 `pseudo`）、`fallbacks`（回退次數）與 `hardware_available` |
| GET / PUT / POST | `/api/system/censor` | 讀取/整體儲存敏感詞規則；POST 用同一服務端匹配器測試文本 |
| GET / PUT | `/api/system/log-mode` | 原始事件日誌開關 |
| GET / PUT | `/api/system/respond-self` | 自控開關（響應骰娘賬號自身訊息） |
| GET / PUT | `/api/system/logsite` | 日誌站上傳地址（logsite_url） |
| GET / PUT | `/api/system/save-log-images` | 日誌圖片落地開關 |
| GET / PUT | `/api/system/nick-wrap` | 使用者名稱包裹符號 |
| GET / PUT | `/api/system/reply-segment` | 分段傳送 |
| GET / PUT | `/api/system/quote-reply` | 引用氣泡回覆 |
| GET / PUT | `/api/system/forward-long` | 長訊息合併轉發 |
| GET / PUT | `/api/system/auto-card` | 自動卡面（COC 自動算 HP/SAN/MP） |
| GET / PUT | `/api/system/image-host` · `/api/system/image-send` | 圖床 / 發圖方式 |
| GET / PUT | `/api/system/user-group` | 使用者群強制 |
| GET / PUT | `/api/system/friend-clean` | 好友、群聊與本地記錄清理；`days` / `groupDays` / `userRecordDays` / `groupRecordDays`（0–3650 天）、`groupLimit`（0–10000）、`maxGroupSize`（0–1000000）；全部引數校驗通過後原子儲存 |
| GET / PUT | `/api/system/chat-config` | 聊天持久化（保留期等） |
| GET | `/api/roadmap` | 開發計劃資料（讀 `docs/roadmap.md`） |
| POST | `/api/system/update/cancel` | 請求取消正在連線、下載、校驗或準備的更新；非同步停止，不取消正式安裝 |

### BotMsg 附加說明

通過 `/api/system/global` 的 `values.bot_msg` 編輯 `.bot` 固定資訊之後的文本；`values.bot_header` 保留舊版頁首，但同樣顯示在固定資訊之後。兩項僅接受字串，各不超過 65536 個 UTF-8 位元組；空字串表示不顯示。

GET 使用 `scope=global|adapter|account`、`target` 與 `platform` 查詢，PUT 使用同名作用域欄位及 `values`。非全域性作用域可通過 `clear: ["bot_msg", "bot_header"]` 恢復繼承。響應頂層 `default_locale` 是後端持久化的全域性預設回覆語言，只供讀取；此介面不提供固定版本、編譯資訊和相容引擎的編輯欄位。

### 更新介面

更新操作非同步執行；POST 介面只負責排隊並立即返回一次狀態，前端應繼續輪詢 `GET /api/system/update`。主要欄位：

- `current` / `latest`：當前版本與 Release 清單；`latest.asset` 是當前 OS / 架構精確匹配的安裝包。`current.prerelease` 表示本次構建是否為 Beta；`GET /api/system/status` 同樣返回 `prerelease`，不能僅憑語義版本判斷渠道。
- `phase`：`idle`、`checking`、`available`、`connecting`、`downloading`、`verifying`、`preparing`、`cancelling`、`cancelled`、`staged`、`scheduled`（等待定時安裝）、`downloaded`、`installing`、`error` 或 `up_to_date`。
- `source`、`downloadedBytes`、`totalBytes`、`checkedAt`、`error`：本次來源、進度、時間與錯誤。
- `downloadSupported` / `installSupported` / `pending`：能否由程式下載、能否一鍵安裝，以及是否已有通過校驗的暫存包。
- `cancelSupported` / `canCancel`：服務端是否支援取消、當前是否可接受取消請求。請求成功後通常先進入 `cancelling`，輪詢到 `cancelled` 才表示後臺傳輸已停止；不提供強制中斷安裝。
- `runtime.container`、`runtime.containerType`、`runtime.containerDetection`：容器識別結果、執行時型別與命中訊號；`selfUpdateBlockedReason=container` 表示容器內只允許檢查，不允許下載或安裝。
- `settings`：`autoCheck`、`intervalHours`（1–168）、`autoAction`（`notify` / `download` / `install`）、`source`（`auto` / `direct` / `mirror` / `custom`）與 `customMirror`。
- `settings.scheduledInstall`：可選布林值，預設 `false`，只在 `autoAction=install` 時安排安裝；`settings.installTime` 預設 `04:00`，嚴格使用 `HH:MM`（`00:00`–`23:59`）。開啟定時安裝需要完整包管理器支援：Windows 為 `dice-next.exe`，新版 Linux/macOS 為 `start.sh` / `dice-next`；容器及直接核心模式不能開啟。
- `scheduledInstallSupported`、`scheduledInstallAt`、`pendingTag`、`timezoneMinutes`：功能能力、有效計劃的 UTC epoch 秒（無計劃為 `0`）、暫存包版本與伺服器實際時區偏移。前端應按能力欄位開放設定，並用偏移顯示時間，不使用客戶端時區。

定時安裝安排在下載完成後的下一次指定時間，計劃隨暫存包持久化；定時只限製程序主動發起的重啟。`autoAction=install` 且包已就緒時，管理器會在**任何下一次啟動**時應用更新（包括手動重啟、退出後啟動、系統重啟和守護程序拉起）。`POST /api/system/restart` 也會協調安裝並重啟；僅下載 / 通知模式保留暫存包，不安裝。

Linux/macOS 安裝能力要求包含 POSIX 管理器的新包，beta.928 不具備此功能。後端還會核對管理器父程序、執行檔及目錄寫許可權；前端必須按實際 `installSupported` / `scheduledInstallSupported` 判斷，不僅憑作業系統名開放。直接核心模式的普通重啟使用原 PID、工作目錄和引數重新執行，不等於安裝支援。

修改時間或時區會重新安排；關閉定時只取消主動重啟計劃，切換為 `download` / `notify` 才同時撤銷啟動時自動安裝授權。手動 `POST /api/system/update/install` 可立即安裝。`autoCheck=false` 不取消已有計劃。後臺每分鐘檢查主動重啟計劃；重複檢查同一已暫存 Release 不會重新下載或重置計劃。取消或中斷準備的包既不自動排期，也不獲得啟動時安裝授權。授權由核心在完成下載 / 校驗 / 準備後生成，不採信安裝包中攜帶的授權檔案。

自訂映像必須是 HTTPS 地址字首。服務端只接受 `DiceZone/Dice-Next`、安全版本欄位、已知平臺架構、受限檔名、準確大小和 64 位十六進位制 SHA-256 的 schema 1 清單。SHA-256 只校驗下載內容與清單一致；它不構成獨立程式碼簽名。

下載源連續 60 秒無新增檔案資料，或單源嘗試達到 20 分鐘，會協作取消實際傳輸並等待退出，然後才按配置換源。HTTP 請求超時不等於後臺更新任務取消，客戶端須重新查詢狀態，防止重複排隊及舊狀態覆蓋新任務。

容器限制由服務端執行，不依賴前端按鈕。`POST /download`、`POST /install` 以及 `PUT` 中的自動下載 / 自動安裝策略都會被拒絕；已有舊配置在容器執行期間按 `notify` 生效。版本清單仍寫入容器臨時目錄並正常檢查。

## 通知與審計

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / PUT | `/api/system/notice` | 通知設定（事件逐項勾選、通知視窗、SMTP / Webhook） |
| POST | `/api/system/notice/test` | 傳送測試通知 |
| GET | `/api/system/audit` | 審計日誌（`data/audit/*.jsonl`） |

## 適配器

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/adapters` | 列表 / 新建 |
| PUT / DELETE / PATCH | `/api/adapters/{id}` | 更新 / 刪除 / 區域性修改 |
| POST | `/api/adapters/{id}/test` | 測試連線 |
| POST | `/api/adapters/{id}/reconnect` | 手動重連（重置退避） |
| GET / POST | `/api/adapters/{id}/qq-official-actions` | QQ 官方能力列表 / 呼叫受限動作；見 [QQ 官方 API v2 能力](./qq-official-api.md) |

新建示例：

```json
POST /api/adapters
{
  "name": "MyQQBot",
  "type": "onebot_v11",
  "connection_mode": "forward_ws",
  "endpoint": "ws://127.0.0.1:3001/",
  "access_token": "",
  "enabled": true
}
```

## 骰子規則與擲骰

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / PUT | `/api/dice/rules` | 舊版佔位規則開關，僅為相容保留；擲骰引擎不讀取這些值，WebUI 已不再提供入口 |
| POST | `/api/dice/roll` | 服務端擲骰（除錯用） |

## 指令、文案與 i18n

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/commands` | 指令目錄（分類 / 示例 / 回覆鍵） |
| GET | `/api/i18n/locales` | 可用語言列表（含自訂語言包） |
| GET | `/api/i18n/all` | 全部文案鍵（含覆蓋值與原版鍵） |
| PUT | `/api/templates` | 設定某文案覆蓋 |
| POST | `/api/templates/preview` | 只讀文本/卡片序列化預覽，不傳送訊息 |
| POST | `/api/templates/markdown-source` | 把純文本文案轉為顯示效果相同的 Markdown 原稿（`{value}` 或 `{variants}`），只返回結果不儲存 |
| POST | `/api/templates/convert-markdown` | 把全域性或某人格（`personaId`）的純文本覆蓋批次轉為 Markdown，可限定 `locale`；`dryRun: true` 只返回 `total` 與需要轉義的 `escaped` 數量 |
| DELETE | `/api/templates/{locale}/{key}` | 重置某文案 |
| GET | `/api/templates/export` · POST `/api/templates/import` | 匯出 / 匯入文案覆蓋 |

指令目錄的回覆條目與全部文案條目提供 `presets: {traditional, standard, visual}`，每項包含原始 `value` 與 `format`；`presetStyle` 是全域性顯示方案，`default` / `defaultFormat` 與該方案一致。預設不會包含已有覆蓋值。儲存後的自訂文本仍按原有全域性 / 人格繼承規則生效，載入預設不會改變顯示方案設定。

模板內可以儲存 `[[action:标题|指令]]`、`[[bar:名称|当前值|上限]]`。指令和人格模板還支援 `[[math:TeX|普通文本替代文字]]`，公式變數使用 `{{变量名}}`，替代文字使用普通 `{变量名}`。QQ 群聊 / C2C Markdown 使用公式，其他平臺、傳統方案及強制純文本使用替代文字。

預覽請求：`{ text, format: "plain"|"markdown", platform: "qq_group"|"qq_private"|"qq_channel"|"kook"|"discord"|"plain", style: "traditional"|"standard"|"visual", forcePlain: false }`。文本最大 64 KiB。返回 `data.preview` 的 `text`、`plain`、`markdown`、`actions` 和 `payload`；純文本適配器的 payload 為 null，不偽造 CQ/媒體最終分段。舊版 `markdown` / `onebot` 欄位仍保留。

模板包含 `{FormFeed}` 顯式分頁時，額外返回 `data.preview.messages` 陣列，每項具有上述五個欄位，表示一個獨立訊息的預覽；先分頁，再分別轉換 Markdown / 純文本和生成 payload。彙總層 payload 為 null，不能把彙總文本當作單個傳送請求。連續分頁產生的空訊息不進入陣列；只有分頁符時陣列為空。沒有顯式分頁時沿用原來的單訊息結構。

QQ/KOOK/Discord 的文本與卡片結構共用實際傳送序列化器，但這不是客戶端截圖，不執行網路訊息傳送、媒體上傳、身份對映或平臺許可權判斷。真實賬號傳送與平臺拒絕回退須另行驗收。

原生機率文案（build 926 起）：模板和人格條目的 PUT 可用 variants 陣列替代單條 value，同時提供 locale、key、format。陣列元素為 {text, weight}；權重為 0～999999 的整數，至少一條正權重，1～256 條，正文總量最多 64 KiB。匯出以 variants 保留全部候選；舊 value 欄位仍提供一條可用文本。普通字串及舊版 sample 保留。

預覽亦支援 variants，並接受 args 物件（如 {nick: "測試玩家", res: "1D100=42"}）。先抽取候選與巢狀 sample，再替換 args，變數值中的 sample 不會被執行。返回 data.templateVersion 為 1 表示支援原生機率文案；各預覽欄位共享一次抽取。

## 自訂回覆與因果規則

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/replies` | 關鍵詞回覆列表 / 新建 |
| PUT / DELETE / PATCH | `/api/replies/{id}` | 更新 / 刪除 / 啟停 |
| GET / POST | `/api/causal/rules` | 因果規則（條件 + 動作 + 計數器）列表 / 新建 |
| PUT / DELETE | `/api/causal/rules/{id}` · POST `/api/causal/rules/{id}/toggle` | 更新 / 刪除 / 啟停 |
| POST | `/api/causal/rules/test` | 因果規則試跑 |
| GET | `/api/counters` · PUT / DELETE `/api/counters/{key}` | 計數器查改刪 |
| POST | `/api/causal/cooldowns/clear` | 清空因果冷卻 |

`GET /api/replies` 不帶篩選時保留返回全部規則的舊介面契約。WebUI 的編輯集合使用 `?scope=global`、`?scope=adapter&target=onebot_v11` 或 `?scope=account&target=<适配器ID>`；全域性不能帶 target，區域性範圍必須有 target。篩選返回該範圍自己的規則，而非合併繼承檢視。

新增 / 修改規則使用 `channelScope`（`global` / `adapter` / `account`）及 `channelTarget`；舊規則預設為全域性。執行時按訊息平臺及適配器 ID 過濾，非法範圍不能放寬為全域性。相同優先順序下賬號規則優先於平臺與全域性。戳一戳配置和關鍵詞規則的繼承 / 候選語義不同，見[高階回覆](/zh-hant/manage/replies#全域性、平臺與賬號範圍)。

## 骰娘人格

全域性隨機人格池（build 926 起）：GET /api/personas/pool 查詢；PUT 同一路徑，正文為 {pool: [{id, weight}]}。id 為 0 代表基礎回覆，其他 ID 必須存在且不能重複；最多 256 項。非空池須至少一項正權重，權重範圍同文案；空池 [] 恢復全域性單人格。/api/personas/active 的 pool 返回全域性池，查詢不會隨機抽取。群、私聊及賬號固定選擇繼續優先；全域性啟用單人格會清空池，群啟用不會。

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/personas` | 人格列表 / 新建 |
| GET / PUT / DELETE | `/api/personas/{id}` | 詳情 / 更新 / 刪除 |
| POST | `/api/personas/{id}/copy` · `/api/personas/{id}/activate` | 複製 / 啟用 |
| GET / PUT / DELETE | `/api/personas/{id}/entries` | 人格回覆文案條目 |
| GET | `/api/personas/{id}/export` · POST `/api/personas/import` | 匯出 / 匯入 |
| GET | `/api/personas/active` | 當前啟用人格 |

## 牌堆

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/decks` | 牌堆列表 / 操作 |
| PUT / DELETE | `/api/decks/{id}` | 更新 / 刪除記錄 |
| GET / PUT | `/api/decks/file` | 讀取 / 寫入牌堆檔案 |
| DELETE | `/api/decks/file/{name}` | 刪除牌堆檔案 |
| POST | `/api/decks/upload` | 上傳牌堆（.json） |
| POST | `/api/decks/reload` | 過載牌堆目錄 |
| POST | `/api/decks/copy` | 把內建公開非空單牌堆複製為新的使用者檔案 |

讀取 `/api/decks/file?name=<文件名>&source=builtin` 或 `source=user` 明確來源；同名使用者檔案不應使內建條目讀取錯位。內建檔案只讀，服務端同樣拒絕覆蓋和刪除。複製請求為 `{"filename":"内置合集.json","entry":"条目名","targetFilename":"我的牌堆.json"}`；目標不能已存在，也不能與源合集同名。只複製該條目的原始陣列，不自動複製全部引用依賴或合集後設資料。

## 規則與規則包

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/rules` | 已載入規則系統列表 |
| GET | `/api/rules/file` | 讀取規則檔案 |
| POST | `/api/rules/upload` · `/api/rules/delete` · `/api/rules/toggle` | 規則檔案上傳 / 刪除 / 啟停 |
| PUT | `/api/rules/save` | 儲存規則檔案（規則編輯器） |
| POST | `/api/rules/test` | 規則自訂指令試跑 |
| GET | `/api/rulepacks` | 規則包（bundle）列表 |
| POST | `/api/rulepacks/upload` · `/api/rulepacks/toggle` · `/api/rulepacks/delete` | 規則包 zip 上傳 / 啟停 / 刪除 |

## 幫助文件

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/help` | 統一幫助查詢，支援搜尋、來源型別、具體來源與分頁 |
| GET | `/api/help/groups` | 同條件下各具體來源的條目數 |
| GET | `/api/help/files` | 自訂 Markdown 檔案列表（`data/help/*.md`） |
| GET / POST | `/api/help/file` | 讀取 / 儲存自訂 Markdown 檔案 |
| DELETE | `/api/help/file/{name}` | 刪除自訂 Markdown 檔案 |

`/api/help` 引數：`lang`、`q`、`kind`、`source`、`page`、`size`（最多 200）、`management=1`。`kind` 可選 `custom`、`builtin`、`plugin`（JS / Lua）、`rule`、`helpdoc`、`other`，留空不限。搜尋和來源篩選先於分頁；`/api/help/groups` 接受 `lang`、`q`、`kind`、`management`。

條目帶 `source`、`kind`、`editable`、`customized`、`format`；管理模式返回未渲染的原始內容，並保留空條目與帶 `shadowed` 的同名條目。內建和歷史自訂詞條還帶 `i18nKey`、`locale`、`contentLocale`，編輯 / 刪除使用該實際語言的 `/api/templates`，不要按瀏覽器語言覆蓋另一份翻譯。來源分別為 `builtin`、`custom`、`plugin:<名>`、`lua:<名>`、`rule:<包>`、`file:<名>`、`helpdoc:<包>`。

規則包附帶文件的 `source` 為相容保留 `helpdoc:<规则包>/<文档包>`，但 `kind` 為 `rule`；客戶端應優先使用響應中的 `kind`，不要僅按來源字串猜測。

## 群組

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/groups` | 群列表 / 操作 |
| PUT / DELETE | `/api/groups/{platform}/{group}` | 更新 / 移除群記錄 |
| POST | `/api/groups/{platform}/{group}/action` | 群操作（退群 / 發訊息 / 上傳日誌等） |
| GET | `/api/groups/{platform}/{group}/members` | 成員列表 |
| POST | `/api/groups/{platform}/{group}/member-action` | 成員操作（禁言 / 踢 / 改名片等） |
| GET / POST | `/api/groups/{platform}/{group}/messages` | 模擬聊天視窗（讀記錄 / 發訊息） |
| POST | `/api/groups/{platform}/{group}/poke` | 戳一戳 |
| POST | `/api/groups/{platform}/{group}/fetch-history` | 拉取歷史訊息（NapCat） |
| GET | `/api/groups/{platform}/{group}/files` | 群檔案列表 |
| GET | `/api/groups/{platform}/{group}/file-url` · `/file-download` | 群檔案直鏈 / 代理下載 |
| POST | `/api/groups/{platform}/{group}/file-upload` | 上傳群檔案 |
| GET | `/api/groups/plugins` · POST `/api/groups/plugins/toggle` | 插件分群啟停 |

## 玩家與好友

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/players` | 玩家檔案列表 |
| PUT / DELETE | `/api/players/{platform}/{user}` | 更新 / 刪除檔案 |
| GET | `/api/players/{platform}/{user}/detail` | 玩家詳情（人物卡 / 設定 / 插件變數全量） |
| POST | `…/card-attr` · `…/card-del` | 人物卡屬性改 / 刪 |
| POST | `…/setting` | 玩家設定項 |
| POST | `…/luavar` · `…/luacard` | Lua 插件變數 / 卡片資料改刪 |
| POST | `…/delete-friend` | 刪除好友 |
| GET | `/api/friends` | 好友列表（各適配器彙總） |

## 黑白名單與骰主

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/banlist` | 黑白名單列表 / 新增 |
| DELETE | `/api/banlist/{rowId}` | 移除 |
| GET / PUT | `/api/banlist/whitelist-only` | 白名單模式開關 |
| GET / POST | `/api/masters` · DELETE `/api/masters/{platform}/{id}` | 骰主管理 |

## 定時任務與廣播

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/schedules` | 定時任務列表 / 新建（含 condition / action） |
| PUT / DELETE | `/api/schedules/{id}` | 更新 / 刪除 |
| GET / POST / DELETE | `/api/broadcast` | 觸發式廣播 |

## 跑團日誌

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / POST | `/api/logs` | 記錄列表 / 操作 |
| DELETE | `/api/logs/{id}` | 刪除記錄（同步清理快取圖片） |
| GET | `/api/logs/{id}/export?format=txt\|csv\|html` | 匯出（txt 與日誌站上傳內容一致；html 自包含帶圖） |
| POST | `/api/logs/{id}/upload` | 上傳日誌站（SealDice V1 協議） |
| GET | `/api/logs/images/{file}` · `/api/chat/images/{file}` | 日誌 / 聊天快取圖片 |

## 擴展：Lua 模組

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/mod/lua` | 模組列表（含指令觸發詞） |
| POST | `/api/mod/lua/upload` | 上傳（zip 目錄型 mod 或單檔案 `.lua`） |
| POST | `/api/mod/lua/toggle` · `/api/mod/lua/delete` · `/api/mod/lua/reload` | 啟停 / 刪除 / 過載 |
| POST | `/api/mods/upload` | Lua mod 上傳（另一入口，行為同上） |

## 擴展：JS 插件

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/plugins/js` | 插件列表（後設資料 / 啟用狀態 / 同名去重資訊） |
| POST | `/api/plugins/js/upload` · `/toggle` · `/delete` · `/reload` | 上傳 / 啟停 / 刪除 / 過載 |
| POST | `/api/plugins/js/config` | 插件配置項表單讀寫 |
| POST | `/api/plugins/js/check-update` · `/update` | 按 `@updateUrl` 檢測 / 執行更新 |
| GET | `/api/plugins/js/storage` · POST `/storage/clear` | 插件持久化儲存檢視 / 清空 |

## AI

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET / PUT | `/api/system/ai` | AI 全套設定（提供商 `providers` / 模型 `models` / 用途分配 `usages` / 潤色 / 翻譯 / 對話 / 記憶 / 工具 / NPC / 視覺 / 語音 `speech`） |
| GET / POST / DELETE | `/api/system/ai/memory` | AI 記憶（摘要 / 長期事實）檢視與管理 |
| POST | `/api/system/ai/test` | 模型連通性測試：`{model, provider?}` 可測未儲存的設定；嵌入模型返回向量維度 |
| GET / PUT | `/api/knowledge/settings` | 知識庫設定（只讀寫 `dice/ai.knowledge`） |
| GET | `/api/knowledge/status` | 各來源條目數、是否已分配嵌入模型 |
| POST | `/api/knowledge/search` | 檢索測試：`{query, settings?}`，返回命中、相關度、FAQ 直答與將注入的文字 |
| GET / POST / DELETE | `/api/knowledge/entries` | 自訂條目列表 / 新增或更新 `{entry}` / 刪除 `?id=` |
| POST | `/api/knowledge/import` | 批次匯入 `{entries: [...]}` |

## 資源與資料遷移

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/assets/upload` · GET `/api/assets/{name}` | 圖片資源 |
| POST | `/api/legacy/import` | 原版 V2 資料遷移（請求體 `{ "dir": "路径" }`，匯入前自動備份資料庫） |

## 測試介面

```
POST /api/test/message
{ "text": ".r 3d6", "platform": "onebot_v11", "messageType": "group",
  "nickname": "希亚", "userId": "123", "groupId": "456", "locale": "zh-Hans" }
```

該介面是「測試臺」頁的後端，**直接返回** `{ "reply": "...", "matched": true, "segments": [...] }`（不走統一信封），走與真實訊息一致的完整管線（內建指令 → JS 插件 → Lua 模組 → 因果規則 → 自訂回覆 → AI），可不連線平臺直接測試。可選欄位：`rawContent`（帶 CQ 碼測識圖）、`selfId` / `atList`（多骰娘定向）、`role` / `card`（群名片注入）。

::: tip
以上為介面概覽；欄位細節以實際版本為準。所有 `/api/*` 請求都需要攜帶訪問金鑰（或已登入的 Cookie 會話）。
:::
