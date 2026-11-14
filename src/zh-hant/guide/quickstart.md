<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 快速開始

忘記密碼、手動修改配置、備份和升級等日常問題，先看[常見問題 FAQ](/zh-hant/guide/faq)。

5 分鐘上手 Dice!Next 3.0，從啟動到擲出第一個骰子。

## 1. 下載並啟動 Dice!Next

下載對應平臺的公測包；Windows 解壓後雙擊 `dice-next.exe`。

首次啟動會自動生成 `config/` 配置目錄與 SQLite 資料庫（`data/dice.db` 等）。Windows 程式預設最小化到**系統托盤**執行，右下角有氣泡提示。

詳細說明請參考[安裝部署](/zh-hant/guide/install)。

## 2. 開啟管理面板

托盤圖示右鍵 →「開啟網頁面板」，或瀏覽器訪問 `http://localhost:18088`。

::: tip 設定登入密碼
建議在管理面板的 **WebUI 設定**頁設定登入密碼：設定後所有後臺頁面與 API 都需要先登入。普通登入會話隨瀏覽器或 Dice!Next 會話結束；勾選“信任此裝置 30 天”後，登入態可跨瀏覽器與程式重啟保留。同一頁還可以修改執行 IP / 埠（改後需重啟，頁面提供一鍵重啟按鈕）。
:::

## 3. 配置 OneBot 適配器

使用內建登入、Milky、QQ 官方機器人、Discord 或 KOOK，請直接按[對應平臺的接入教程](/zh-hant/manage/adapter-manager)操作。

進入 **管理面板 → 適配器管理**，點選「新增適配器」。

### 正向 WebSocket（推薦）

Dice!Next 主動連線 OneBot 客戶端（NapCat、Lagrange、LLOneBot 等）：

| 引數 | 值 |
|------|-----|
| 協議 | OneBot v11 |
| 傳輸模式 | 正向 WebSocket（`forward_ws`） |
| 端點地址 | `ws://127.0.0.1:3001/` |
| Access Token | 與 OneBot 客戶端一致（可留空） |

確保 OneBot 客戶端已開啟正向 WS 服務端。斷線後 Dice!Next 會自動重連（先每 5 秒、後每 60 秒，連續 20 次失敗後暫停，可在面板手動重連）。

### 反向 WebSocket

OneBot 客戶端反向連線 Dice!Next：

| 引數 | 值 |
|------|-----|
| 協議 | OneBot v11 |
| 傳輸模式 | 反向 WebSocket（`reverse_ws`） |
| 端點地址 | 填一個**埠號**（如 `6700`），Dice!Next 在該埠監聽 |

然後在 OneBot 客戶端把反向 WS 上報地址指向 `ws://<Dice!Next 所在 IP>:<该端口>/` 即可。

## 4. 測試擲骰

在已連線的 QQ 群聊或私聊中傳送指令：

```
.help                 # 帮助
.r                    # 默认 d100
.r 3d6+2              # 3 个 6 面骰 + 2
.coc                  # COC 规则车卡
.ra 侦查              # COC 检定（读人物卡）
.jrrp                 # 今日人品
.draw 塔罗            # 抽牌
```

不想連 QQ 也可以先在管理面板的**測試臺**裡直接發指令試回覆。

## 5. 探索功能

| 功能 | 入口 | 說明 |
|------|------|------|
| 擲骰與檢定 | [使用手冊](/zh-hant/use/dice) | 完整擲骰 / COC / DND 語法 |
| 角色卡 | [角色卡管理](/zh-hant/use/card) | 角色卡建立與管理 |
| 牌堆與隨機 | [牌堆與隨機](/zh-hant/use/deck) | 抽牌、臨時牌堆、內聯隨機 |
| 規則速查 | [規則速查](/zh-hant/use/rules) | `.rules` 查 COC / DND 規則 |
| 娛樂與互動 | [娛樂與互動](/zh-hant/use/fun) | 人品、隨機名、好感度 |
| 跑團記錄 | [跑團記錄](/zh-hant/use/log) | 跑團記錄與日誌站 |
| 關鍵詞回覆 | [關鍵詞回覆](/zh-hant/use/reply) | 自訂關鍵詞觸發回覆 |
| 群管與系統 | [群管與系統](/zh-hant/use/admin) | 群開關、許可權、定時任務 |

## 常見問題

### 連線不上 OneBot 客戶端？

檢查防火牆是否放行了對應埠，確認地址與 Access Token 配置正確、OneBot 客戶端對應服務已開啟。狀態顯示「連線超時」說明自動重連已暫停，修好後手動重連。詳見[故障排查](/zh-hant/guide/troubleshooting)。

### 指令無響應？

進入管理面板的 Dashboard 檢視日誌，確認適配器狀態為「已連線」；再檢查群是否被 `.bot off` 停用。

### 如何遷移舊資料？

參考[資料遷移](/zh-hant/guide/migration)：管理面板 → 系統設定 → 舊版資料匯入，填舊版資料目錄一鍵匯入。
