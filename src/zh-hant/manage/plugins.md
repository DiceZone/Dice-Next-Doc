<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 插件管理

Lua 模組詳情顯示相容性提示：列出跳過的條件、舊 Dice! JS 動作、不支援的事件 / 數值公式及檔案載入錯誤，不把“發現了目錄”當成“所有功能都能執行”。JS 使用海豹體系，舊 Dice! JS 不提供相容執行，Python 暫不納入計劃。

**管理面板 → 擴展管理 → 插件**，統一管理兩類擴展，分兩個選項卡：

- **JS 插件**：相容海豹 SealDice 的 JavaScript 插件（`seal.*` API）。
- **Lua 模組**：相容原版 Dice! 的 Lua mod（目錄型 msg_reply 模組與單檔案 msg_order 插件）。

## 上傳與載入

點「上傳插件」選擇檔案，按副檔名自動分流：

| 檔案 | 去向 |
|------|------|
| `.js` | JS 插件 |
| `.lua` | Lua 單檔案插件 |
| `.json` | Lua mod 描述檔（純查詢類 mod，如技能/法術查詢） |
| `.zip` | Lua mod 包——支援原版「`<名>.json` + 目錄」成對包、一包多個 mod 的整庫壓縮包、僅含 `model/`/`rulebook/` 的規則類包 |

也可以直接把檔案放進資料目錄（Lua mod 放 `data/mod`，單檔案插件放 `data/plugin`）再點「重新載入」——過載會同時重新整理 JS 與 Lua 兩側，無需重啟。停用與刪除按鈕會把 mod 的描述檔與資源目錄**成對**處理，不會留下殘件。

::: tip 想自己寫插件？
從[插件開發快速上手](/zh-hant/develop/plugin-quickstart)開始；完整 API 見 [JS 插件 API 參考](/zh-hant/develop/js-plugin-api)與 [Lua mod 參考](/zh-hant/develop/lua-mod)。
:::

## 插件卡片

每個插件顯示名稱、版本、作者、簡介與註冊的指令列表，右側操作：

- **啟停開關**：單個插件即時啟用 / 停用。
- **配置**：JS 插件註冊過配置項時出現，彈窗按型別渲染表單（開關 / 下拉選項 / 多行模板 / 數字 / 文本），儲存後立即生效。
- **檢視詳情**：版本、語言、許可、檔名、主頁、完整簡介、註冊的指令；Lua 模組額外區分指令觸發詞型別（指令 / 關鍵詞 / 含此詞即觸發）與幫助詞條（用 `.help <词条>` 查詢）；還可展開「儲存的資料」檢視插件持久化的鍵值，支援匯出 JSON 與清空。
- **刪除**：連檔案一起從磁碟刪除（有確認彈窗）。

特殊標記：

- **JS相容規則**：以 `seal.gameSystem` / `coc.registerRule` 形式提供規則系統的 JS 插件，自動歸入 `data/mod`，與原生 JSON 規則包區分。
- **舊版（已被頂替）**：同名插件上傳新版後舊版自動置灰停用。

## 更新檢測

聲明瞭更新地址的 JS 插件可單個「檢查更新」或頁頭「檢查更新」批次檢查；發現新版本後一鍵「更新」替換。

## 分群啟停

插件預設全域性生效，群內可用指令按群控制（僅群主 / 管理員）：

```
.plugin list            列出插件与本群状态
.plugin on|off <名称>   启停某插件
.plugin all on|off      批量启停
```

原版 Dice! 的 `.mod` 已恢復為**全域性模組管理**，與 `.plugin` 分群啟停不同。要求骰主或信任等級至少 4；普通群管理員 / 邀請人不能修改全域性模組：

```
.mod / .mod list        列出全局模组与状态
.mod on|off <名称>      全局启停模组
.mod <名称> on|off      原版参数顺序
.mod info <名称>        查看模组信息
.mod detail <名称>      查看资源统计
.mod reload <名称>      重新加载指定模组
.mod del <名称>         删除指定模组文件
```

`.mod get/update/reinstall` 僅提示轉到 WebUI，不恢復舊遠端下載器。啟停、過載、刪除及匯入會同步重新整理 XML 模板；停用的 Mod 不再繼續貢獻模板。刪除會移除檔案，應先備份。

## 相容性

Lua 側相容原版 Dice! mod 生態；JS 側的相容目標是 **SealDice（海豹）插件 API**，不是舊 Dice! 的 JS 體系（含 `seal.vars` 人物卡橋接、`commands.disable` 覆蓋內建指令等）。海豹規則類插件還可以轉換打包成規則包分發，實戰示例見[海豹插件轉規則包](/zh-hant/develop/rulepack-example-fu)與[規則包開發](/zh-hant/develop/rulepack)。

2026-10-15 的本地實現已擴展完整 TOML 解析、機率 / 名單 / 共享限次 / 鎖、clock 與安全事件、巢狀模組、規則書 / tape 及 XML 安全數值公式，尚未隨本輪安裝包釋出。巢狀條目保留父級停用；同名目錄與單檔案插件用獨立管理 ID，刪除前請核對目標。舊 JS / Python、任意 XML 指令碼與安全策略覆蓋不執行，不能保證任意舊包直接可用；詳見 [Lua 相容邊界](/zh-hant/develop/lua-mod#與原版的相容性說明)。

### 群名片與顯示名

群聊中，入站訊息攜帶的群名片會優先使用；沒有群名片時才回退 QQ 暱稱。私聊沒有群名片。

| 欄位 | 值 |
| --- | --- |
| `ctx.player.name` | 統一顯示名：群名片優先，否則 QQ 暱稱 |
| `ctx.player.card` / `msg.sender.card` | 當前群名片；未設定或私聊時為空字串 |
| `msg.sender.nickname` | QQ 暱稱（不受群名片影響） |

```js
cmd.solve = (ctx, msg) => {
  const displayName = ctx.player.name;
  const groupCard = ctx.player.card; // 需要严格读取群名片时使用
  seal.replyToSender(ctx, msg, `${displayName} / ${groupCard || '未设群名片'}`);
  return seal.ext.newCmdExecuteResult(true);
};
```

Lua 模組模板中，`{nick}` 是 QQ 暱稱，`{card}` 是當前群名片（未設定時為空）。
