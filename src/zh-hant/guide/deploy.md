<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 部署與運維

本頁面向把 Dice!Next 長期跑起來的場景（個人 / 小團體自部署）。基礎啟動見[安裝部署](/zh-hant/guide/install)。

## 目錄結構

首次啟動後，執行目錄大致如下：

```
DiceNext/
├── dice-next.exe       # Windows 启动管理器
├── app/                # 服务核心（Windows 为 dice-next-core.exe）
├── lib/                # Windows 运行依赖
├── config/             # 配置（按功能区拆分的 JSON，首次启动自动生成）
├── data/              # 你的数据都在这里
│   ├── dice.db        #   主数据库（另有 cards.db / logs.db / chat.db 等）
│   ├── decks/         #   牌堆
│   ├── rules/         #   规则速查库
│   ├── rulepacks/     #   规则包
│   ├── helpdoc/       #   自定义帮助文档
│   ├── mod/  plugins/ #   Lua 模组 / JS 插件
│   ├── logs/          #   跑团记录、crash 报告；运行日志在 logs/app/
│   └── audit/         #   通知审计流水
├── i18n/              # 多语言文案（可放自定义语言包）
├── web/dist/          # 管理面板前端
└── docs/              # 开发计划 / 指令表（面板页面数据源）
```

**`config/` 與 `data/` 是你的命脈**——備份與遷移只要帶上這兩個目錄即可。

## 接入 OneBot 客戶端

Dice!Next 不自帶 QQ 登入，需要搭配一個 OneBot v11 客戶端（如 NapCat、Lagrange、LLOneBot）：

1. 在 OneBot 客戶端中開啟正向 WS 服務端（記下地址，如 `ws://127.0.0.1:3001/`）。
2. 在 Dice!Next [適配器管理](/zh-hant/manage/adapter-manager)新建連線，傳輸模式選「正向 WS」，端點填上面的地址，Token 兩端保持一致。
3. 儲存並啟用，狀態顯示「已連線」即成功。

斷線後會自動重連（先每 5 秒、後每 60 秒退避，連續 20 次失敗後暫停並顯示「連線超時」，可手動重連）。

## 後臺常駐

Dice!Next 是單個可執行程式，預設啟動即最小化到系統托盤常駐：

- **開機自啟**：管理面板 → 系統設定裡開啟「開機自啟動」即可（隨 Windows 登入自動啟動）。
- 需要崩潰自動重啟等更強守護時，可用任意程序守護工具（如 nssm 註冊為 Windows 服務）。

::: tip 工作目錄
Dice!Next 啟動時會自動切換到 exe 所在目錄（發行包），所以開機自啟 / 雙擊 / 從別處執行都能找到 `config/`、`i18n/`。用第三方守護工具時仍建議把「工作目錄」設為程式目錄。
:::

## 安全建議

- **設定 WebUI 登入密碼**：管理面板的 WebUI 設定頁裡設定。設定後所有後臺頁面與 `/api/*` 都需要登入（Cookie 會話）。勾選「信任此裝置 30 天」後，登入態會跨瀏覽器與 Dice!Next 重啟保留；受信會話儲存在 `config/webui_sessions.json`，請勿共享該檔案。
- **同機多實例互不串號**：同一臺主機執行多套 Dice!Next 時，各安裝目錄會使用獨立的會話 Cookie，即使只靠不同埠區分也不會互相頂掉登入態。同一實例改埠不影響 30 天受信狀態；從舊版本升級後，曾被其他實例覆蓋登入態的面板可能需要重新登入一次。
- **不要把管理面板直接暴露到公網**。如確需遠端訪問，建議放在反向代理（nginx 等）之後，並加上 HTTPS 與額外鑑權 / IP 限制。
- **保管好 OneBot Token**：它等同於你 QQ 機器人的控制權。
- **`{api:URL}` 預設關閉**：僅在需要時開啟（`dice.api_enabled`），並配置域名白名單（`dice.api_whitelist`）。

::: warning AGPLv3 網路服務條款
Dice!Next 基於 AGPLv3。如果你**修改**了原始碼並**對外提供服務**（哪怕只是網路服務、未分發軟體本體），需要向使用者提供對應的原始碼。詳見[開源協議](/zh-hant/other/license)。
:::

## 反向代理（可選）

如需用域名 + HTTPS 訪問管理面板，可用 nginx 把請求轉發到本地 `18088`（示例）：

```nginx
location / {
    proxy_pass http://127.0.0.1:18088;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;   # 面板有 WebSocket
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## 備份與升級

- **備份**：定期複製 `config/` 與 `data/` 兩個目錄即可。
- **原生安裝升級**：停止服務 → 解壓新包完整覆蓋 → 重新啟動。配置檔案與資料庫不在壓縮包內、不會被覆蓋，詳見[安裝部署](/zh-hant/guide/install#升級)。
- **容器部署升級**：容器內只檢查並通知新版本，服務端會拒絕手動 / 自動下載和安裝。請拉取新映像後重新建立容器，不要在執行中的容器層解壓覆蓋程式；已掛載的 `config/` 與 `data/` 會保留。
- 升級前建議先備份 `data/`。

## 故障排查

| 現象 | 排查方向 |
|------|----------|
| 面板打不開 | 埠被佔已自動順延 / 程序未啟動 / 防火牆；看 `data/logs/app/` |
| 程式閃退 | 看 `data/logs/crash_*.txt`（崩潰報告） |
| 適配器連不上 | 端點地址 / 埠 / Token；OneBot 客戶端是否線上；「連線超時」需手動重連 |
| 指令不回 | 群是否被 `.bot off` 停用 / 全域性靜默；看[群管與系統](/zh-hant/use/admin) |
| 想不連 QQ 除錯 | 用[測試臺](/zh-hant/manage/dashboard) |

更完整的排查流程見[故障排查](/zh-hant/guide/troubleshooting)。
