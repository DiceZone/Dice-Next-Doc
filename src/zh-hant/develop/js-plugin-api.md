<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# JS 插件 API 參考

本頁是 Dice!Next JS 插件的完整 API 參考。快速上手示例見[插件開發快速上手](/zh-hant/develop/plugin-quickstart)。

Dice!Next 內嵌 quickjs-ng 引擎（支援現代 ES 語法與 `async/await`），以海豹（SealDice）的 `seal.ext` 插件模型為相容目標——多數海豹插件可直接執行，本頁同時標註了與海豹的差異和當前未實現的佔位項。

## 執行環境與載入規則

- **目錄**：主目錄 `data/plugins/js/`；規則類插件（呼叫過 `seal.gameSystem` 的）自動遷移到 `data/mod/`；規則包內的 `js/` 目錄隨包載入（並受按群啟用控制）。
- **包裝**：每個插件在獨立的 IIFE 中求值，頂層 `let/const` 互不衝突；提供假的 `module`/`exports` 以相容打包產物，但**沒有** `require`/`import`——插件必須是自包含單檔案。
- **去重**：按後設資料 `@name`（不是檔名）去重，多個同名檔案保留 `@version` 最高的一個，其餘標記為「已被取代」不載入。
- **停用**：檔案改名為 `*.js.disabled`（管理面板開關即此操作）。
- **執行模型**：所有插件共享一個 JS 執行時，**單執行緒序列**執行。死迴圈或緩慢的同步操作會卡住整條訊息處理管線——耗時邏輯請儘量放進定時器回呼。
- **載入生命週期**：擴展註冊時 `ext.isLoaded=false`；全部指令碼完成註冊後，宿主統一設為 `true` 並呼叫各擴展的 `ext.onLoad()`，因此 `onLoad` 中可以安全使用 `seal.ext.find` 查詢其他插件。

### 後設資料（UserScript 頭）

檔案前 40 行內的 `// @key value` 註釋會被解析：

| 鍵 | 說明 |
| --- | --- |
| `@name` | 插件名（去重與顯示依據；預設用檔名） |
| `@author` / `@version` / `@description` / `@license` | 展示用後設資料 |
| `@homepageURL`（或 `@homepage`） | 主頁連結 |
| `@updateUrl`（或 `@updateURL`） | 指向插件原始碼的直鏈；管理面板「檢查更新」會拉取該地址比較 `@version`，一鍵更新 |

## 擴展與指令註冊（seal.ext）

| API | 說明 |
| --- | --- |
| `seal.ext.new(name, author, version)` | 建立擴展物件 `ext`（含 `cmdMap`、`storageSet/storageGet`） |
| `seal.ext.register(ext)` | 註冊擴展；註冊後再往 `cmdMap` 加指令同樣生效 |
| `seal.ext.find(name)` | 按名查詢已註冊擴展（跨插件協作） |
| `seal.ext.newCmdItemInfo()` | 建立指令物件 `cmd` |
| `seal.ext.newCmdExecuteResult(solved)` | 建立 `solve` 的返回值 `{solved, showHelp:false}`；`showHelp=true` 時宿主自動把 `cmd.help` 附進回覆 |

`cmd` 的欄位：

| 欄位 | 預設 | 說明 |
| --- | --- | --- |
| `name` | `""` | 指令名 |
| `help` | `""` | 幫助文本（會聚合進 `.help` 系統與管理面板） |
| `solve(ctx, msg, cmdArgs)` | — | 指令處理函式，返回 `newCmdExecuteResult(true)` 表示已處理 |
| `allowDelegate` | `false` | 相容欄位（代骰請直接用 `seal.getCtxProxyFirst`） |
| `disabledInPrivate` | `false` | 私聊停用 |
| `enableExecuteTimesParse` | `false` | 允許解析 `3#指令` 連續執行字首（次數在 `cmdArgs.specialExecuteTimes`） |
| `raw` / `checkCurrentBotOn` / `checkMentionOthers` | — | 相容欄位 |

指令匹配為**首詞精確匹配**（`.hello world` 匹配 `cmdMap['hello']`）。派發前會先過「按群啟停」開關（管理面板群詳情 → 插件），被關掉的群不會觸發。

## 事件鉤子

正式訊息的主要順序與 `sealdice-core` 對齊：

```text
onMessageReceived → 内置指令或 cmd.solve → 清空异步任务 → onCommandReceived → 实际发送 → onMessageSend
```

| 鉤子 | 觸發時機 |
| --- | --- |
| `ext.onLoad()` | 全部指令碼註冊完畢、`ext.isLoaded` 設為 `true` 後呼叫一次 |
| `ext.onMessageReceived(ctx, msg)` | 每條被接收的訊息進入指令處理前呼叫；它是觀察鉤子，不會壓掉後續內建 / 插件指令 |
| `ext.onCommandReceived(ctx, msg, cmdArgs)` | 指令求解與其中的 Promise 任務完成後呼叫；內建指令、JS 指令和已解析但未知的指令都會觸發 |
| `ext.onNotCommandReceived(ctx, msg)` | 訊息未產生指令、Lua / 因果 / 自訂回覆時，作為非指令兜底呼叫 |
| `ext.onMessageSend(ctx, msg, flag)` | Dice!Next 的最終回覆實際投遞後呼叫；`msg` 是已傳送訊息 |
| `ext.onGroupJoined(ctx, msg)` | 骰子自身加入普通群 |
| `ext.onGroupMemberJoined(ctx, msg)` | 普通成員加入群 |
| `ext.onGuildJoined(ctx, msg)` | 骰子自身加入帶 guild 標識的頻道 / 伺服器 |
| `ext.onBecomeFriend(ctx, msg)` | 好友新增完成 |
| `ext.onMessageDeleted(ctx, msg)` | 收到訊息撤回事件；`msg.rawId` 為被撤回訊息 ID（適配器提供時） |
| `ext.onPoke(ctx, event)` | 戳一戳；`event={groupId,senderId,targetId,isPrivate}` |
| `ext.onGroupLeave(ctx, event)` | 群成員退出 / 被移出；`event={groupId,userId,operatorId}` |

即使註冊的指令物件沒有 `solve`，或指令詞未在任何 `cmdMap` 中命中，已解析的指令訊息仍會進入 `onCommandReceived`。事件類鉤子是否觸發取決於適配器是否上報對應 `BotEvent`。

QQ 官方適配器另外提供互動、訂閱授權與其他官方事件的原生鉤子；其簽名、配置和邊界見 [QQ 官方 API v2 能力](./qq-official-api.md)。它們是 Dice!Next 擴展，不改變上述海豹風格鉤子的簽名。

::: warning 與 SealDice 邊界
`onMessageEdit` 暫不可用，因為 Dice!Next 當前的 `BotEvent` 傳輸層沒有訊息編輯事件。`onCommandOverride` 在 `sealdice-core` 本身沒有 JS 繫結，因此不屬於 JS 插件相容目標。
:::

## ctx / msg / cmdArgs

### ctx

| 欄位 | 說明 |
| --- | --- |
| `ctx.player.userId` | 傳送者 ID |
| `ctx.player.name` | 顯示名（群名片優先，回退平臺暱稱） |
| `ctx.player.card` | 群名片 |
| `ctx.group.groupId` | 群號（私聊為空） |
| `ctx.group.logOn` / `ctx.group.logCurName` | 當前群跑團日誌狀態 / 日誌名 |
| `ctx.isPrivate` | 是否私聊 |
| `ctx.privilegeLevel` | 許可權等級（數值越高許可權越大；骰主遠大於群管） |
| `ctx.endPoint` | 骰娘自身端點 `{platform,id,userId,nickname,state,enable}` |
| `ctx.isCurGroupBotOn` | 佔位，恆 `true`（能進 solve 就說明群是開的） |

### msg

| 欄位 | 說明 |
| --- | --- |
| `msg.message` | 原始訊息全文（優先 `rawContent`） |
| `msg.platform` | 適配器平臺標識 |
| `msg.messageType` | `"group"` 或 `"private"` |
| `msg.groupId` | 群號；私聊嚴格為空字串 |
| `msg.time` | 適配器訊息時間（Unix 秒；缺失時取當前時間） |
| `msg.sender` | `{userId, nickname, card}` |
| `msg.segment` | 適配器提供的富媒體分段；優先讀取 `segments`、OneBot `raw.message` 或 `msg_elements`，沒有時為空陣列 |
| `msg.rawId` / `msg.guildId` / `msg.channelId` | 原訊息 ID、伺服器 ID、頻道 ID；適配器未提供的欄位為空字串 |

### cmdArgs

欄位：

| 欄位 | 說明 |
| --- | --- |
| `command` | 指令詞（首詞） |
| `args` | 引數陣列（空白切分） |
| `cleanArgs` / `rawArgs` | 去掉指令詞後的剩餘文本 |
| `rawText` | 整條命令原文 |
| `at` | `[{userId}, ...]` 訊息中真實 @ 的人 |
| `kwargs` | `[{name, value, valueExists}, ...]`（解析 `--key` / `--key=value`） |
| `specialExecuteTimes` | `N#指令` 的 N（1–99，預設 1，需 `cmd.enableExecuteTimesParse`） |
| `amIBeMentioned` / `amIBeMentionedFirst` | 是否 @ 到當前骰子 / 是否第一個 @ 的就是當前骰子，依據真實 `atList` 計算 |

方法：

| 方法 | 說明 |
| --- | --- |
| `getArgN(n)` | 第 n 個引數（1 起），越界返回 `""` |
| `getRestArgsFrom(n)` | 第 n 個引數起的剩餘文本（空格連線） |
| `isArgEqual(n, ...vals)` | 第 n 個引數是否等於任一候選 |
| `chopPrefixToArgsWith(...prefixes)` | 首參命中字首則移除並返回 `true` |
| `eatPrefixWith(...prefixes)` | 同上但返回被吃掉的字首 |
| `getKwarg(name)` / `getKwargs(name)` | 取 `--key` 引數，無則 `null` |

## 回覆

| API | 行為 |
| --- | --- |
| `seal.replyToSender(ctx, msg, text)` | 回覆到訊息來處。指令處理期間多次呼叫會按行合併成一條；在定時器等非同步回呼裡呼叫則立即直髮 |
| `seal.replyGroup(ctx, msg, text)` | 同 `replyToSender` |
| `seal.replyPerson(ctx, msg, text)` | 恆私聊直髮給傳送者（如暗骰結果） |

文本中可以內嵌圖片碼 `[CQ:image,file=URL]`（QQ 平臺）。目前沒有獨立的「傳送圖片/語音」API。

`onMessageSend` 觀察的是經過模板、潤色 / 翻譯並實際投遞的最終回覆。鉤子、定時器或事件回呼裡呼叫回覆 API 的直髮訊息不會再次遞迴觸發 `onMessageSend`，以避免插件製造無限訊息迴圈。

## 變數與人物卡（seal.vars）

| API | 說明 |
| --- | --- |
| `seal.vars.intGet(ctx, name)` → `[value, ok]` | 讀整數變數 |
| `seal.vars.intSet(ctx, name, value)` | 寫整數變數 |
| `seal.vars.strGet(ctx, name)` → `[value, ok]` | 讀字串變數 |
| `seal.vars.strSet(ctx, name, value)` | 寫字串變數 |

變數名字首決定歸屬：

| 字首 | 作用域 | 儲存位置 |
| --- | --- | --- |
| `$m名字` | 當前使用者個人 | 插件 KV 庫（跨插件共享） |
| `$g名字` | 當前群 | 同上 |
| `$名字` | 全域性 | 同上 |
| **無字首** | **人物卡屬性** | 與 `.st` 同一份卡 |

無字首名字直達人物卡，是海豹 `gameSystem` 規則插件能讀寫 `.st` 卡的原因；`strGet` 還能讀到「表示式屬性」的原文（如 `.st 物防='dex+1'` 存的表示式）。特例：`$t玩家` 返回 `ctx.player.name`。

`seal.format(ctx, s)` / `seal.formatTmpl`：對字串做模板求值——`{$变量}` 查變數、`{骰点表达式}` 走擲骰引擎（如 `{1d100}`）。

## 好感度系統（seal.favor）

這些介面與內建 `.favor` / `好感` 指令直接讀寫同一份 `player_profiles.favor`，不會生成插件私有副本。平臺從 `ctx.endPoint.platform` 自動取得；省略 `userId` 時操作 `ctx.player.userId`。

| API | 返回值 | 說明 |
| --- | --- | --- |
| `seal.favor.get(ctx, userId?)` | `number` 或 `null` | 讀取當前好感度；尚無記錄時為 `0`。 |
| `seal.favor.set(ctx, value, userId?)` | `number` 或 `null` | 覆寫好感度，並返回寫入後的值。 |
| `seal.favor.add(ctx, delta, userId?)` | `number` 或 `null` | 增減好感度，並返回變更後的值。 |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` 或 `null` | 執行與 `.favor grow` 相同的機率成長；未成長時 `success=false`、`delta=0`。 |

```javascript
const before = seal.favor.get(ctx);
const after = seal.favor.add(ctx, 5);
const growth = seal.favor.grow(ctx);
seal.replyToSender(ctx, msg,
  `好感：${before} → ${after}\n成长：${growth.success ? `+${growth.delta}` : '未成长'}`);
```

傳入第三方平臺的使用者 ID 時必須使用該平臺原始字串 ID，不能假定所有賬號都是數字 QQ。目標 `userId` 或上下文平臺缺失時返回 `null`，且不會寫入資料。

## 插件儲存（ext.storage）

```javascript
ext.storageSet('key', '值必须是字符串');   // 对象请 JSON.stringify
const v = ext.storageGet('key');          // 无值返回 undefined
```

資料持久化在 `data/plugins.db`，按插件名隔離；管理面板「插件管理」可以檢視、匯出、清空每個插件的儲存。玩家管理頁也能看到 `$m` 變數。

## 配置項（WebUI 視覺化）

註冊後用戶可在管理面板插件詳情裡直接編輯，無需改程式碼：

| API | 表單形態 |
| --- | --- |
| `seal.ext.registerStringConfig(ext, key, default, desc?)` | 文本框 |
| `seal.ext.registerIntConfig / registerFloatConfig(ext, key, default, desc?)` | 數字框 |
| `seal.ext.registerBoolConfig(ext, key, default, desc?)` | 開關 |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | 多行模板（陣列） |
| `seal.ext.registerOptionConfig(ext, key, default, options, desc?)` | 下拉選擇 |

讀取：`getStringConfig` / `getIntConfig` / `getFloatConfig` / `getBoolConfig` / `getTemplateConfig`（返回陣列）/ `getOptionConfig`。也有批次式 `newConfigItem` + `registerConfig`（海豹寫法相容）。

## 定時

| API | 說明 |
| --- | --- |
| `setTimeout(fn, ms)` / `clearTimeout(id)` | 真定時器（不是訊息觸發的假定時） |
| `setInterval(fn, ms)` / `clearInterval(id)` | 間隔下限 200ms，活躍定時器上限 256 個 |
| `seal.ext.registerTask(ext, 'daily', 'HH:MM', fn, key?, desc?)` | 每日定點任務；`taskType='cron'` 僅支援每日等價的 `M H * * *` 表示式 |

定時回呼裡的 `replyToSender` 會立即直髮。每週/任意 cron 暫不支援。

## 網路（fetch）

```javascript
const resp = await fetch(url, { method: 'POST', headers: {...}, body: {...} });
// resp.ok / resp.status / await resp.text() / await resp.json()
```

受安全門控：需要在管理面板「系統設定」開啟**外接 API 開關**並把目標域名加入白名單，否則請求會被拒絕（Promise reject）。`body` 傳物件會自動 JSON 序列化。另有 `btoa`/`atob` 全域性函式。

::: warning 同步實現
`fetch` 底層是同步阻塞的，慢介面會拖住訊息處理——對時效不敏感的請求放進定時器回呼更穩妥。
:::

## 群管理與名單

| API | 說明 |
| --- | --- |
| `seal.memberBan(ctx, groupId, userId, duration)` | 禁言（秒） |
| `seal.memberKick(ctx, groupId, userId)` | 踢人 |
| `seal.setPlayerGroupCard(ctx, template)` | 設傳送者群名片 |
| `seal.ban.addBan(ctx, id, place, reason)` | 加黑名單（接骰孃的黑白名單系統） |
| `seal.ban.addTrust(ctx, id, place, reason)` | 加白名單 |
| `seal.ban.remove(ctx, id)` | 移出名單 |
| `seal.ban.getList()` / `seal.ban.getUser(id)` | 查詢名單 |

## 代骰

```javascript
const mctx = seal.getCtxProxyFirst(ctx, cmdArgs) || ctx;  // 有 @ 目标则代表 TA
```

`getCtxProxyFirst` / `getCtxProxyAtPos(ctx, cmdArgs, pos)` 用訊息裡第 pos 個被 @ 的人構造代理 ctx——之後 `seal.vars` 的人物卡讀寫都指向被 @ 者的卡。

## 牌堆與擲骰

| API | 說明 |
| --- | --- |
| `seal.deck.draw(ctx, name, isShuffle)` | 抽牌堆，返回 `{exists, err, result}` |
| `seal.format(ctx, '{1d100}')` | 借模板求值走真實擲骰引擎 |

## 規則模板（gameSystem）

`seal.gameSystem.newTemplate(jsonStr)` / `newTemplateByYaml(yamlStr)`：註冊整套規則模板（屬性別名、衍生屬性等），接入內建 `.st`/`.ra`。呼叫過它的插件被視為「規則類」，自動遷入 `data/mod/` 並出現在規則管理頁。實戰教程：[轉化海豹規則插件](/zh-hant/develop/rulepack-example-fu)。

`seal.coc.registerRule` 目前僅把插件標記為規則類，**自訂檢定判定不會真正接管** `.ra` 核心。

## 其它全域性

| API | 說明 |
| --- | --- |
| `console.log/info/warn/error/debug/trace(...)` | 寫入 `[插件]` 日誌並標明實際指令碼來源；log/info=INFO、warn=WARN、error=ERROR、debug=DEBUG、trace=TRACE |
| `seal.getVersion()` | `{version, versionSimple, versionCode, ...}` |
| `seal.getEndPoints()` | 佔位，恆空陣列 |

## 完整 JS API 清單與簽名

下面是當前執行時匯出的完整公開 API。標為“相容佔位”的專案可以安全呼叫，但不具備海豹原版的完整行為；不要把它們當作功能已實現。

### `seal.ext`、擴展與配置

| API | 引數 / 返回值 | 狀態與說明 |
| --- | --- | --- |
| `seal.ext.new(name, author, version)` | `ext` | 新建擴展物件，內含 `name`、`author`、`version`、`cmdMap`、`storageGet/Set`。 |
| `seal.ext.register(ext)` | — | 註冊擴展。 |
| `seal.ext.find(name)` | `ext` 或 `null` | 查詢已註冊擴展。 |
| `seal.ext.newCmdItemInfo()` | `cmd` | 新建指令物件。 |
| `seal.ext.newCmdExecuteResult(solved?)` | `{solved, showHelp}` | solve 的標準返回值。 |
| `seal.ext.registerTask(ext, type, value, fn, key?, desc?, group?)` | — | `daily` + `HH:MM`，或每日等價 `cron`：`M H * * *`。key/desc/group 當前僅為相容引數。 |
| `seal.ext.newConfigItem(key?, defaultValue?, desc?)` | ConfigItem | 批次配置入口；物件欄位含 `key`、`defaultValue`、`type`、`description`。 |
| `seal.ext.registerConfig(ext, ...items)` | — | 批次註冊 ConfigItem。 |
| `seal.ext.getConfig(ext, key)` | `{key, value}` | 返回配置物件；讀取值使用 `.value`。 |
| `seal.ext.registerStringConfig / registerIntConfig / registerFloatConfig / registerBoolConfig(ext, key, defaultValue, desc?)` | — | 註冊對應型別配置。 |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | — | 註冊字串陣列模板配置。 |
| `seal.ext.registerOptionConfig(ext, key, defaultValue, options, desc?)` | — | 註冊下拉配置；options 為陣列。 |
| `seal.ext.getStringConfig / getIntConfig / getFloatConfig / getBoolConfig / getTemplateConfig / getOptionConfig(ext, key)` | 值 | 分別返回 string / number / number / boolean / string[] / string。 |
| `seal.ext.unregisterConfig(ext)` | `0` | **相容佔位**，當前不移除已註冊配置。 |

### 訊息、上下文與回覆

| API | 引數 / 返回值 | 說明 |
| --- | --- | --- |
| `seal.replyToSender(ctx, msg, text)` | — | 回到原訊息視窗。 |
| `seal.replyGroup(ctx, msg, text)` | — | 當前與 `replyToSender` 行為相同。 |
| `seal.replyPerson(ctx, msg, text)` | — | 始終私聊傳送者；臨時 msg 沒有 sender 時用 `ctx.player.userId`。 |
| `seal.newMessage()` | `{}` | 新建空訊息物件；按需補 `platform`、`messageType`、`groupId`、`sender` 後可配合回覆 API 使用。 |
| `seal.createTempCtx()` | `{player:{userId,name}, group:{groupId}}` | 新建最小上下文；需自行補齊 userId / groupId。 |
| `seal.getCtxProxyFirst(ctx, msgOrArgs)` | `ctx` | 有 @ 目標時返回以第一個目標為 `ctx.player` 的代理；無目標時返回原 ctx。 |
| `seal.getCtxProxyAtPos(ctx, msgOrArgs, pos)` | `ctx` | 同上，pos 從 0 開始。 |
| `seal.setPlayerGroupCard(ctx, template)` | — | 設定當前傳送者的群名片；需要平臺具備該能力與足夠許可權。 |
| `seal.applyPlayerGroupCardByTemplate(ctx, template)` | `0` | **相容佔位**，當前不執行設定。 |
| `seal.memberBan(ctx, groupId, userId, durationSec?)` | — | 禁言；平臺不支援或許可權不足時不會生效。 |
| `seal.memberKick(ctx, groupId, userId)` | — | 踢人；平臺不支援或許可權不足時不會生效。 |

`ctx.player` 公開欄位為 `userId`、`name`、`card`；`ctx.group` 為 `groupId`、`logOn`、`logCurName`。`msg.sender` 為 `userId`、`nickname`、`card`。跨平臺 ID 均為字串，不能假定為 QQ 數字。

### 變數、人物卡、牌堆與規則

| API | 引數 / 返回值 | 說明 |
| --- | --- | --- |
| `seal.setVarInt(ctx, name, value)` / `seal.vars.intSet(...)` | — | 寫整數變數；無 `$` 字首時寫當前人物卡屬性。 |
| `seal.setVarStr(ctx, name, value)` / `seal.vars.strSet(...)` | — | 寫字串變數；無 `$` 字首時寫人物卡文本/表示式屬性。 |
| `seal.vars.intGet(ctx, name)` | `[number, ok]` | 讀整數變數或人物卡數值。 |
| `seal.vars.strGet(ctx, name)` | `[string, ok]` | 讀字串變數、人物卡表示式屬性；`$t玩家` / `$t玩家_RAW` 返回顯示名。 |
| `seal.vars.computedGet / computedSet(ctx, name, value?)` | 同 `strGet/strSet` | **相容近似**：目前等價於字串讀寫，不執行完整 RollVM 計算。 |
| `seal.format(ctx, text)` / `seal.formatTmpl(ctx, text)` | string | `{$变量}` 求值，`{1d100}` 等骰式由真實擲骰引擎處理。 |
| `seal.favor.get(ctx, userId?)` | number / `null` | 讀取內建好感度。 |
| `seal.favor.set(ctx, value, userId?)` | number / `null` | 覆寫內建好感度並返回新值。 |
| `seal.favor.add(ctx, delta, userId?)` | number / `null` | 增減內建好感度並返回新值。 |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` / `null` | 按內建好感度成長規則判定並寫回。 |
| `seal.deck.draw(ctx, name, shuffle?)` | `{exists, err, result}` | 抽公共牌堆；shuffle 引數當前保留相容。 |
| `seal.deck.reload()` | `0` | **相容佔位**，牌堆由管理面板或檔案過載。 |
| `seal.gameSystem.newTemplate(jsonText)` / `newTemplateByYaml(yamlText)` | `{}` | 標記規則類插件，並登記屬性模板供 `.st/.ra` 使用。 |
| `seal.coc.newRule()` / `newRuleCheckResult()` | `{}` | **相容佔位**，只返回空物件。 |
| `seal.coc.registerRule(rule)` | `0` | 標記規則類插件；不會接管內建 `.ra` 判定核心。 |

### 名單、工具與標準全域性

| API | 引數 / 返回值 | 說明 |
| --- | --- | --- |
| `seal.ban.addBan(ctx, id, place?, reason?)` | — | 加入黑名單；place 當前僅相容引數。 |
| `seal.ban.addTrust(ctx, id, place?, reason?)` | — | 加入信任/白名單。 |
| `seal.ban.remove(ctx, id)` | — | 移出名單。 |
| `seal.ban.getList()` | array | 返回全部名單記錄。 |
| `seal.ban.getUser(id)` | object 或 `null` | 返回單條名單記錄。 |
| `seal.getVersion()` | object | 返回 `version`、`versionSimple`、`versionCode`、`versionDetail`。 |
| `seal.getEndPoints()` | `[]` | **相容佔位**，當前不會列出端點。 |
| `setTimeout(fn, ms)` / `setInterval(fn, ms)` | timerId | 真定時器；間隔最小 200ms，最多 256 個活動計時器。 |
| `clearTimeout(id)` / `clearInterval(id)` | — | 取消計時器。 |
| `fetch(url, options?)` | `Promise<Response>` | Response 含 `ok`、`status`、`statusText`、非同步 `text()` / `json()`；底層請求仍會同步阻塞。 |
| `btoa(text)` / `atob(text)` | string | Base64 編解碼；`atob` 接受 `data:*;base64,` 字首。 |
| `console.log/info/warn/error/debug/trace(...values)` | — | 按對應級別寫入執行日誌，預設 INFO 不展示 DEBUG/TRACE；定時和非同步續跑保留來源。 |

## 最小可執行示例：讀取群名片與人物卡

```javascript
const ext = seal.ext.new('api-example', 'Dice!Next', '1.0.0');
const cmd = seal.ext.newCmdItemInfo();
cmd.name = '卡片示例';
cmd.help = '读取群名片和侦查值';
cmd.solve = (ctx, msg) => {
  const card = ctx.player.card || '未设群名片';
  const [spot, exists] = seal.vars.intGet(ctx, '侦查');
  seal.replyToSender(ctx, msg, `${ctx.player.name}（${card}）\n侦查：${exists ? spot : '未记录'}`);
  return seal.ext.newCmdExecuteResult(true);
};
ext.cmdMap['卡片示例'] = cmd;
seal.ext.register(ext);
```

## 當前限制一覽

寫插件前值得知道的邊界（也是我們的改進路線）：

1. `onMessageEdit` 暫不可用；其他平臺事件也只有在適配器上報對應 `BotEvent` 時才觸發。
2. `msg.segment` 是適配器原生分段、並非跨平臺統一結構；未上報時為空，也沒有專用的發圖 API（可發 `[CQ:image]` 碼）。
3. 沒有 `require`/`import` 與檔案系統 API，插件必須單檔案自包含。
4. 單執行緒序列執行，無超時與資源配額——請避免死迴圈與慢同步操作。
5. `registerTask` 只支援每日任務；`seal.coc` 自訂判定與 `seal.getEndPoints` 等仍為佔位。
6. `fetch` 受外接 API 開關與白名單門控（這是刻意的安全設計，不是 bug）。
