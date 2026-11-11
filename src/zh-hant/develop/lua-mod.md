<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# Lua mod 參考

Dice!Next 持續相容原版 Dice! 的 Lua mod 與單檔案插件。2026-10-15 的本地實現擴展了 TOML、條件、事件、巢狀模組和安全數值模板；尚未隨本輪安裝包釋出。已有部分社群語料驗證，但不能由此推斷任意舊 mod 完整可用；移植前請核對文末邊界與所用版本。

::: tip 新插件建議用 JS
Lua 體系的定位是**承接原版生態**。從零寫新插件建議用 [JS 插件](/zh-hant/develop/plugin-quickstart)——API 更現代，配置項、儲存管理等與面板的整合也更完整。
:::

## mod 的三種形態

| 形態 | 位置 | 說明 |
| --- | --- | --- |
| 描述檔 + 目錄（原版標準形態） | `data/mod/<名>.json` + `data/mod/<名>/` | 成對出現；`<名>.json` 是登記檔（後設資料 + helpdoc + speech），目錄放資源 |
| 純描述檔 | `data/mod/<名>.json` | 查詢類 mod（COC 技能查詢這類純 helpdoc 包）只有一個 json |
| 單檔案插件 | `data/plugin/<名>.lua` | `msg_order` 字首指令插件 |

**上傳**：管理面板「插件管理」→「上傳插件」，支援 `.lua`、`.json`、`.zip`。zip 會自動解壓歸位——json+目錄成對包、一包多 mod 的整庫壓縮包、只含 `model/`/`rulebook/` 的規則類包都能識別。**停用/刪除**由面板管理：停用是改名加 `.disabled` 字尾（json 與目錄會成對處理），刪除會把描述檔和目錄一起清掉。

## 描述檔（`<名>.json` / `descriptor.json`）

```json
{
  "mod": "好感度",
  "author": "作者",
  "ver": "1.0",
  "brief": "一句话简介",
  "helpdoc": { "好感": "查看当前好感度……", "好感排行": "&好感" },
  "speech": { "自称": "骰娘" }
}
```

| 欄位 | 說明 |
| --- | --- |
| `mod` 或 `title` | 顯示名 |
| `author` / `ver`（或 `version`）/ `brief` | 後設資料 |
| `helpdoc` | 詞條表，主題忽略 ASCII 大小寫；接入 `.help` 查詢，`&主题` 可跨 Mod 多級轉向 |
| `speech` | 模板詞條（`{key}` 展開用）；文本或均勻隨機文本陣列，鍵忽略 ASCII 大小寫 |

解析容忍尾逗號與註釋（真實社群 mod 常見）。

## 資源目錄語義

| 子目錄 | 內容 | 說明 |
| --- | --- | --- |
| `reply/*.lua` / `reply/*.toml` | `msg_reply` / TOML 回覆規則 | 關鍵詞觸發的回覆邏輯（見下）；TOML 支援多行、引號鍵、內聯表等語法，但動作仍受安全邊界限制 |
| `script/*.lua` | 函式指令碼 | 供 `loadLua()` 與 `echo={lua=...}` 呼叫 |
| `speech/*.yaml` | 模板詞條 | 平鋪文本或文本陣列，合併進全域性模板，鍵忽略 ASCII 大小寫 |
| `model/*.xml` | 屬性模板 | COC7.xml 等；含此目錄的 mod 視為「規則類」，在規則管理頁展示 |
| `rulebook/*.yaml` | 規則手冊 | 當前規則優先、父規則繼承、主題查詢與受控 tape |
| `event/*.lua` | 定時 / 事件宣告 | cycle、伺服器時區 clock 及安全生命週期 / 訊息鉤子 |

資源可以分層放置。巢狀模組使用 `父.子` 管理 ID，父級停用時子級也不會執行；同名目錄與單檔案插件使用獨立 ID，防止管理操作指向錯誤檔案。載入保留 `mod_order.json` 順序，指令碼按名稱空間登記、後加載覆蓋；僅登記資源，不把資源目錄裡的 Lua 全部自動執行。符號連結、Windows 聯接和路徑穿越不允許。

指令碼名忽略 ASCII 大小寫，例如 `loadLua('Tools.Ping')` 與 `loadLua('tools.ping')` 查同一個全域性指令碼，後加載的 Mod 優先。`script/Tools/init.lua` 可用 `loadLua('Tools')` 呼叫，也保留 Next 的顯式 `Tools.init` 寫法；不會因此允許絕對路徑或 `..`。

## msg_reply 因果規則（reply/*.lua）

每個檔案在乾淨的全域性 `msg_reply` 表裡執行，之後列舉其中的規則：

```lua
msg_reply['好感'] = {
  keyword = { match = { '{自称}好感' } },   -- 也可用 prefix / search
  limit = { cd = 10, user_var = { trust = { at_least = 0 } } },
  echo = function(msg)
    local favor = getUserConf(msg.uid, '&favor', 0)
    return '当前好感度：' .. favor
  end,
}
```

| 欄位 | 說明 |
| --- | --- |
| `keyword.match` | 精確等於才觸發（字串或陣列；先做 `{模板}` 展開，所以 `{自称}好感` 可用） |
| `keyword.prefix` | 字首命中，剩餘文本放進 `msg.suffix` |
| `keyword.search` | 包含即命中 |
| `keyword.regex` | 有執行時限的 ECMAScript `i` 整條匹配，保留舊版 400 位元組輸入上限；非 `u` 模式按 UTF-16 單元計數 |
| `limit.cd` | 冷卻秒數；`{user=10, grp=30}` 可分設 |
| `limit.user_var.trust.at_least` | 信任等級門檻 |
| `limit.grp_id` / `limit.user_id` | ID / ID 列表；`{nor={...}}` 排除指定 ID；群 ID `0` 表示私聊，空列表不限制 |
| `limit.prob` | 百分比觸發機率；0 沿用舊版“不額外限制”語義 |
| `limit.today` | 每日限次，伺服器時區換日；支援共享名稱與 user / chat / global 範圍 |
| `limit.lock` | 有界、非阻塞同步鎖；支援共享名稱及範圍，Lua 暫停期間仍持鎖 |
| `limit.self_var` / `limit.user_var` / `limit.grp_var` | 骰娘自身、使用者、群變數的真值或比較條件 |
| `limit.dicemaid` | ignore / only / off，由宿主的骰娘名單判斷，不相信訊息偽造的身份 |
| `echo` | 函式、靜態文本、文本候選陣列或 `{lua="脚本名 / 内联 Lua"}`；不執行舊 JS / Python |

規則必須有 `echo` 且至少一種 `keyword` 才會被收錄。回覆文本會再做一次模板展開——`echo` 裡寫進 `msg` 表的欄位（如 `msg.favor = 5`）可在回覆裡用 `{favor}` 引用。

### TOML、條件與優先順序

`reply/*.toml` 通過 toml++ 解析，支援多行字串、引號鍵、複雜表、內聯表與陣列。回覆支援 Match / Prefix / Search / Regex、`rule` / `type="Game"`、靜態文本、Lua 與文本候選；候選可用 `::权重::`，並繼續巢狀 `{sample:甲|乙}`。空回覆、僅副作用和暫停等待也算已處理，不會再觸發 AI 等兜底回覆。

條件支援真值、equal、neq、at_least、at_most、more、less，以及上表的名單 / 機率 / 計數 / 鎖。多個比較條件須全部滿足。標量冷卻按聊天視窗計算，共享計數可顯式指定範圍與名稱。兼容表宣告與舊式 `limit="prob:50;grp_id:!0;cd:10"` 文本。未知或無效的條件會記錄診斷並跳過整條規則，不會變成無條件允許。

目錄模組按“活動團規則 → Match → 最長 Prefix → Search → Regex”選擇；同級目錄按載入順序覆蓋。關鍵詞的 ASCII 大小寫相容舊版；單檔案插件仍保留原有匹配習慣。一次訊息選一條回覆，不復制舊版多個 Regex 同時連續發言的行為。

### 定時與安全事件

`event/*.lua` 的 `trigger.cycle` 支援 1 秒至 7 天，單位為 second / minute / hour / day；所有模組載入後立即執行一次並重排。`trigger.clock` 支援 `{hour=4, minute=0}` 或這類表的列表，使用伺服器時區，不補跑錯過的日期。

可用 hook：`StartUp`、`DayEnd`、`DayNew`、`Message`、`FriendRequest`、`FriendAdd`、`GroupRequest`、`GroupAdd`、`GroupWelcome`、`GroupDecrease`、`GroupRecall`、`GroupUpload`、`Poke`、`LogEnd`。具體通知仍取決於適配器是否提供該入站事件。`StartUp` 僅在宿主啟動時觸發，過載不觸發；日界事件按伺服器日期變化執行。

請求鉤子可拒絕但不能越過宿主策略批准；鉤子失敗會留下待處理請求。訊息與 tape 遵守黑名單、停用、內容攔截及分群插件開關，憑據 / 恢復管理指令不會被吞掉。`LogEnd` 只提供受控日誌路徑和預設上傳控制，不恢復任意檔案釋出。授權、審查和雲黑名單策略覆蓋鉤子不執行。

`LogEnd` 在 `.log end` 或 `.game over` 完成日誌關閉與結算後呼叫。可讀取 `log_file`（實際匯出檔名）、`log_path`（絕對路徑）、`log_id`、`log_name`、`log_count`，以及 uid / gid / fromUser / fromQQ / fromGroup / platform / adapterId / selfId / msgid / time；檔名不是使用者可輸入的顯示標題，預設匯出不釋出本地圖片。團務結束鉤子執行時原團務已清理，不保留可修改的舊 Session 物件。

cycle、clock、啟動 / 日界動作可以用 `sleepTime` 暫停續跑；需要即時處理結果的訊息、審批、通知及 tape 鉤子同步執行，不能靠 `sleepTime` 延遲宿主決策。不可掛起的呼叫中它立即返回，不阻塞訊息執行緒。

事件動作可用 Lua 函式、指令碼名或內聯 Lua；不支援的混合動作 / 觸發條件會整體報告，不能只執行支援的一半。回呼與鎖佇列有數量上限，過載 / 銷燬會取消舊任務。觸發平臺和帳號在延時後保留，原帳號離線時不會改用另一個帳號傳送。

目錄檔案 / 內聯文本指令碼的臨時全域性變數按每次執行隔離，延時續跑保留當次環境；`loadLua` 的子指令碼與入口共享當次變數。`eventMsg` 巢狀觸發其他指令後會恢復外層訊息，外層回覆不借用內層暱稱、使用者 ID 或變數。需要跨訊息儲存的資料請用配置或人物卡 API，不依賴上次指令碼遺留的全域性變數。已登記的 Lua 函式保留 Next 原有閉包能力；這不是為任意程式碼建立完整獨立 LuaState 或安全沙箱。

### XML 模型與規則書

XML 支援屬性別名、CDATA、基本實體及只讀數值公式，包括算術、比較、短路、三元、屬性預設值和 floor / ceil / round / min / max 等白名單函式。例如 `Math.floor(this.力量/2)` 可轉換，但指令碼塊、賦值、動態呼叫和任意 JavaScript 不會執行。無法轉換的屬性會顯示相容性診斷；模組順序、啟停與過載會同步重新整理模板，原生規則包的優先順序不變。

規則書支援當前規則優先、父規則繼承和命名主題查詢；tape 只在活動團務、參與者及分群開關允許時執行。

## msg_order 單檔案插件（data/plugin/*.lua）

```lua
msg_order['选择'] = 'choose'

function choose(msg)
  local opts = {}
  for w in msg.suffix:gmatch('[^%s]+') do opts[#opts+1] = w end
  return '就决定是：' .. opts[ranint(1, #opts)]
end
```

`msg_order[触发词] = "全局函数名"`；觸發詞按長度降序匹配（長詞優先）。函式收到 `msg` 表，返回值第一項作為回覆。

插件裡呼叫 `sleepTime(ms)` 時，Dice!Next 會暫停當前 Lua 處理並交還訊息執行緒，時間到後從原位置繼續執行；因此舊插件的分段延時回覆不會再阻塞收訊息。插件過載會取消尚未恢復的舊協程，避免執行已解除安裝程式碼。

舊單檔案插件可繼續通過 io.open 讀取入口指令碼同級資源。若插件附帶的生成快取仍儲存作者電腦上的舊絕對路徑，Dice!Next 會在首次開啟失敗後，僅把無路徑穿越的 plugin/… 尾部重對映到當前 data/plugin 目錄；檔案審計日誌也會自動整理 UTF-8 / CP936 混合路徑，非法編碼不會再令宿主程序退出。

### task_call 定時入口

舊式單檔案插件可登記由骰主定時觸發的全域性函式：

```lua
task_call = task_call or {}
task_call['dailynews'] = 'sendDailyNews'

function sendDailyNews()
  -- 获取新闻、整理内容并主动 sendMsg(...)
end
```

登記後由骰主在聊天中管理每日執行時間：

```text
.admin clock + dailynews 07:30
.admin clock list
.admin clock - dailynews
```

任務會複用系統定時器持久化並顯示在管理面板的「定時任務」列表中；可以停用、立即執行或刪除。時間相容舊插件文件常見的 `7:30` 和標準 `07:30`，儲存時統一為兩位小時。`task_call` 任務沒有固定群 / 使用者目標，應由插件函式自行通過 `sendMsg` 決定傳送位置。

原版無空格寫法 `.admin clock+dailynews=7:30` 同樣相容。若要在當前群 / 私聊定時呼叫普通插件指令，可使用 `.admin clock + 本群早报 07:30 .dailynews`；這會建立帶當前帳號和視窗作用域的標準「執行插件指令」任務，並可在 WebUI 中完整編輯。

DailyNews 一類插件使用的 `eventMsg(".admin notice group/QQ … +8")` 與 `eventMsg(".send notice 8 …")` 會對映到 Dice!Next 的統一通知視窗；這條內部橋只識別上述兩類舊通知命令，不會授予 Lua `eventMsg` 其他骰主管理許可權。

### 輪盤插件的舊版自禁言呼叫

舊輪盤等插件常使用下面的寫法（`分钟` 是整數，不是秒）：

```lua
eventMsg(".group " .. msg.fromGroup .. " ban " .. msg.fromQQ .. " 1", 0, getDiceQQ())
```

Next 為這類呼叫提供受控相容：只允許當前來源賬號、當前群、當前觸發使用者的自禁言，時長為 0～43200 分鐘（0 為解除禁言）。機器人須已確認具有本群管理許可權；群主和群管理員不能被禁言。群停用、黑名單、全域性靜默及分群插件開關仍生效，許可權快取未就緒時只請求重新整理並記錄原因。

不會恢復舊版任意虛擬訊息的最高信任等級：跨群、更換目標使用者，或通過虛擬訊息及其延時續跑繼續借權都會被拒絕；WebUI 測試臺和定時任務的虛擬指令同樣不能借權。此相容橋不是通用 `.group ban` 管理入口，也不支援時長表示式。其他 `eventMsg` 仍走正常指令許可權。

虛擬私聊機器人自己只執行、不傳送回執；普通群聊 / 使用者私聊仍正常回復。OneBot 從有效事件的 `self_id` 補充當前賬號身份，缺失 / 零值不覆蓋已知身份，無效目標不會提交平臺。已有插件無需修改這行程式碼。

## msg 物件

`echo` 函式與 `msg_order` 函式收到的 `msg`：

| 成員 | 說明 |
| --- | --- |
| `msg.uid` / `msg.gid` | 傳送者 / 群 ID；QQ 通常為數字，其他平臺可能是字串；私聊 gid 為 0 |
| `msg.platform` | 當前訊息平臺（如 `onebot_v11`、`qq_official`、`discord`、`kook`） |
| `msg.nick` | 傳送者的 QQ 暱稱（群名片不覆蓋它） |
| `msg.card` | **當前群名片**；未設定或私聊時為 `""` |
| `msg.fromMsg` | 訊息全文；`msg.suffix` 為字首觸發的剩餘文本 |
| `msg:echo(text)` | 模板展開後主動發訊息 |
| `msg:format(text)` | 只做模板展開 |
| `msg:get(key, def)` / `msg:inc(key, n)` | 讀 / 自增本條訊息的變數 |
| `msg.char` / `msg.pc` | 傳送者人物卡（Actor 物件） |
| `msg.user` / `msg.grp` | 使用者 / 群配置代理（讀寫即存檔） |
| `msg.game` | 團務物件（`.game new` 開團後可用，`msg.game:message(text)` 群發） |
| `msg.at` | `[CQ:at,qq=发送者]` 文本 |

```lua
-- 当前消息发送者的群名片；没有时回退 QQ 昵称
local displayName = msg.card ~= '' and msg.card or msg.nick

-- 当前群绑定人物卡上的属性。第五个参数 false 可强制把 gid 当群作用域，
-- 对 Discord、KOOK、QQ 官方机器人等非数字群 ID 必须带上。
local skill = getPlayerCardAttr(msg.uid, msg.gid, '侦查', -1, false)
```

## 全域性函式參考

**基礎**

| 函式 | 說明 |
| --- | --- |
| `log(...)` / `print(...)` | 按 INFO 寫入 `[插件]` 日誌，標明當前插件來源；舊用法保持相容 |
| `logTrace/logDebug/logInfo/logSuccess/logWarn/logError(...)` | 按指定級別寫執行日誌；預設 INFO 隱藏 TRACE/DEBUG，延時和定時入口保留來源 |
| `ranint(a?, b?)` | 閉區間隨機整數；預設 `ranint()` 為 1–100，a>b 時自動交換 |
| `getDiceDir()` | 資料目錄絕對路徑（`data`） |
| `getDiceQQ()` | 當前觸發帳號；延時 / 事件續跑保留帳號。已知帳號身份缺失時為空，不借用另一帳號；僅無帳號上下文時用全域性配置 |
| `mkDirs(path)` | 建目錄 |
| `sleepTime(ms)` | 在 `msg_order` 訊息處理中非阻塞等待；協程到時恢復，不佔住訊息執行緒 |

**配置存取**（持久化在 `data/lua_mod.db`）

| 函式 | 說明 |
| --- | --- |
| `getUserConf(uid, key, default)` / `setUserConf(uid, key, val)` | 使用者級；`uid` 傳 `nil` 返回所有使用者的 `{uid→值}` 表（做排行）；`val=nil` 刪除 |
| `getGroupConf(gid, key, default)` / `setGroupConf(gid, key, val)` | 群級 |
| `getUserToday(uid, key, default)` / `setUserToday(uid, key, val)` | 今日資料（按天隔離，未命中返回 0） |

鍵以 `&` 開頭會先經 speech 詞條解析成實際欄位名（原版慣用法）。

**好感度**（與內建 `.favor` 是同一份資料）

| 函式 | 說明 |
| --- | --- |
| `getFavor(uid, platform?)` | 讀取好感度；尚無記錄時返回 `0`。訊息處理期間可省略 platform。 |
| `setFavor(uid, value, platform?)` | 覆寫好感度並返回寫入後的值。 |
| `addFavor(uid, delta, platform?)` | 增減好感度並返回變更後的值。 |
| `growFavor(uid, platform?)` | 按內建機率規則成長，返回 `success, delta, value`；未成長時 delta 為 `0`。 |

```lua
local before = getFavor(msg.uid)
local after = addFavor(msg.uid, 5)
local success, delta, value = growFavor(msg.uid)
```

`msg_order`、`reply echo` 及其 `loadLua()` 呼叫鏈會自動繼承 `msg.platform`。若在插件載入階段或其他脫離訊息的程式碼中呼叫，必須顯式傳入 platform；平臺或 uid 缺失時返回 `nil`（`growFavor` 返回 `false, 0, 0`），且不會寫入資料。

**人物卡**（與 `.st` 是同一份卡）

| 函式 | 說明 |
| --- | --- |
| `getPlayerCard(uid, scope)` | 返回 Actor 物件：`pc.hp` 直接讀寫、`pc:set{...}` 批次、`pc:rollDice(exp)`、`pc:lock('w'/'r')` / `pc:unlock` |
| `getPlayerCardAttr(uid, scope, attr, default?, byName?)` | 讀屬性；缺失時返回 default（未給則 `nil`）。`scope` 為數字/`nil` 時是群作用域，為字串時預設視為卡名；`byName=false` 可強制按群讀取，適合非數字群 ID |
| `setPlayerCardAttr(uid, scope, attr, val, byName?)` | 寫屬性；val 為 `nil` 時刪除屬性 |
| `lockPlayerCard(uid, scope, key, byName?)` / `unlockPlayerCard(...)` | 鎖定/解鎖卡片屬性；`key='w'` 鎖 `.st` 寫入，`key='r'` 鎖 `.st show` 讀取 |
| `isPlayerCardLocked(uid, scope, key, byName?)` | 返回布林值 |

**動作**

| 函式 | 說明 |
| --- | --- |
| `sendMsg(text, gid, uid)` | 主動發訊息（gid 空 = 私聊） |
| `eventMsg(text, gid, uid)` | 把文本當作某人發的訊息跑完整指令管線（如 `eventMsg('.rd100', msg.gid, msg.uid)`） |
| `drawDeck(gid, uid, 牌堆名)` | 優先抽當前群 Session 私有牌堆（不放回），無同名私有牌堆時才抽公共牌堆 |
| `loadLua(名字)` | 目錄型 mod 優先執行 `script/<名字>.lua`；舊式單檔案插件也支援入口指令碼同級子目錄（支援 `a.b` 點分路徑） |
| `askExtra(table)` | 平臺擴展查詢（透傳到適配器，如 OneBot 動作） |

OneBot v11 下，`sendMsg` 傳送的文本或事件鉤子直接返回的文本可以包含 CQ 音樂碼；Dice!Next 會將其轉換為音樂卡片訊息段，而不是顯示 CQ 碼原文。支援平臺曲目和自訂音樂卡片，例如：

```lua
sendMsg('[CQ:music,type=qq,id=歌曲ID]', msg.gid, msg.uid)
sendMsg('[CQ:music,type=custom,url=跳转链接,audio=音频链接,title=标题,content=简介,image=封面链接]', msg.gid, msg.uid)
```

**內建庫**

| 庫 | 說明 |
| --- | --- |
| `http.get(url)` → `ok, body`；`http.post(url, body, headers)` | 預設允許公網 HTTP(S)，始終攔截內網 / 環回 / 危險 URL；嚴格模式再要求外接 API 開關與白名單；`http.urlEncode/urlDecode` |
| `json.encode/decode`、`yaml.parse/dump` | 也可 `require("json")` / `require("yaml")` |
| `Set`、`getSelfData(名)`、`Actor`、`GameTable` | 原版物件層：SelfData 落盤 `data/self_data/<名>.json`；GameTable 對接 `.game` 團務 |

`package.path` 已包含 mod 目錄與 `data/plugin`，跨插件 `require` 可用（如社群常見的 `lua_useful_extensions`）。

Windows 下會在載入舊單檔案插件時自動識別並轉換 GBK / CP936 原始碼；插件傳給 `sendMsg`、`eventMsg`、JSON 編碼器或適配器的文本也會統一整理為有效 UTF-8。無法恢復的非法位元組以替代字元顯示，不再讓 JSON 序列化異常穿透並導致程序退出。

## 完整 Lua API 簽名與物件方法

本節列出當前執行時直接註冊的全部 Lua 插件 API。引數名中的 `?` 表示可選；除特別說明外，寫入函式沒有返回值。

### 資料、訊息與平臺

| API | 引數與返回值 | 說明 |
| --- | --- | --- |
| `getUserConf(uid, key, default?)` | 值 / `default` / `nil` | 使用者持久化配置。uid 為 `nil` 時返回 `{[uid]=value}` 表，可用於排行。 |
| `setUserConf(uid, key, value)` | — | value 為 `nil` 時刪除。 |
| `getGroupConf(gid, key, default?)` / `setGroupConf(gid, key, value)` | 值 / — | 群持久化配置；value 為 `nil` 時刪除。 |
| `getUserToday(uid, key, default?)` / `setUserToday(uid, key, value)` | 值 / — | 按當前日期隔離；未命中預設返回 0。 |
| `getFavor(uid, platform?)` | number / `nil` | 讀取內建好感度；訊息呼叫棧中自動繼承當前平臺。 |
| `setFavor(uid, value, platform?)` | number / `nil` | 覆寫內建好感度並返回新值。 |
| `addFavor(uid, delta, platform?)` | number / `nil` | 增減內建好感度並返回新值。 |
| `growFavor(uid, platform?)` | `success, delta, value` | 按內建好感度成長規則判定並寫回。 |
| `sendMsg(text, gid?, uid?)` | — | gid 非空時向群發；gid 為空時向 uid 私聊。 |
| `eventMsg(text, gid?, uid?)` | — | 將文本作為該使用者發出的訊息重新進入完整指令/回覆管線。也可傳 `{fromMsg=, gid=, uid=}`。 |
| `drawDeck(gid, uid, deckName)` | 字串 | 三參優先使用當前群 Session 的私有牌堆，抽空不回退同名公共牌堆；一參 `drawDeck(deckName)` 仍抽公共牌堆。gid / uid 為 0 按未指定處理。 |
| `askExtra({action=..., params=...})` | 表 / 字串 / `nil` | 透傳原生平臺動作。當前只有 OneBot 適配器可響應；QQ 官方、Discord、KOOK 返回 `nil`。 |
| `getDiceQQ()` / `getDiceDir()` | 字串 | 當前觸發帳號的自身 ID / `data` 目錄絕對路徑；帳號無法確定時不借用其他帳號。 |
| `mkDirs(path)` | boolean | 建立目錄。 |
| `loadLua(name)` | 指令碼返回值 | 目錄型 mod 優先執行 `script/<name>.lua`；舊式 `data/plugin/*.lua` 也會回退到入口同級路徑，例如 `loadLua("求签/月老灵签")` 讀取 `data/plugin/求签/月老灵签.lua`。`a.b` 仍對映為 `a/b.lua`。 |
| `sleepTime(ms)` | — | 在可掛起的訊息處理呼叫鏈中非阻塞等待並從原位置恢復；其他呼叫環境保持立即返回。 |

`key` 以 `&` 開頭時，會先解析當前 mod 的 speech 詞條；這是舊版 mod 常見的欄位別名寫法。

### 人物卡與 Actor

```lua
-- 当前群绑定卡：QQ 数字群可用 getPlayerCard；跨平台请用 Actor 明确传 false。
local pc = Actor(msg.uid, msg.gid, false)
local hp = pc:get('hp') or 0
pc:set('hp', hp - 1)
pc.san = 60                 -- 字段赋值等价于 set

-- 按卡名读取（第二参是字符串卡名，或显式 byName=true）
local named = getPlayerCardAttr(msg.uid, '备用卡', 'hp', 0, true)
```

| Actor API | 引數與返回值 | 說明 |
| --- | --- | --- |
| `Actor(uid, scope, byName?)` | Actor | 建立人物卡代理；跨平臺群 ID 請顯式傳 `false`，使 scope 按群處理。 |
| `getPlayerCard(uid, scope)` | Actor | 舊版相容入口：數字 scope 按群處理，字串 scope 按卡名處理。 |
| `pc:get(key)` / `pc[key]` | 值或 `nil` | 讀數值、文本或關聯屬性原文。 |
| `pc:set(key, value)` / `pc:set({key=value,...})` / `pc[key]=value` | 單欄位返回 1；批次返回寫入數 | 寫入真實人物卡；value 為 `nil` 刪除。 |
| `pc:rollDice(exp?)` | `{expr,sum,expansion}` 或 `{expr,error}` | 使用人物卡 `__DefaultDiceExp` / `__DefaultDice`；未設定時為 `1D` / d100。 |
| `pc:lock(key)` / `pc:unlock(key)` / `pc:locked(key)` | boolean | 操作真實人物卡的欄位鎖。 |

### 內建物件與編碼庫

| API | 引數與返回值 | 說明 |
| --- | --- | --- |
| `getSelfData(name)` | SelfData 代理 | 自動持久化到 `data/self_data/<name>.json`；支援 `obj[key]`、`obj:get(key, default)`、`obj:set(key,value)`、`obj:__totable()`。 |
| `Set.new()` | Set 物件 | `:add(value)`、`:remove(value)`、`:in(value)`、`:totable()`；`#set` 返回元素數量。 |
| `GameTable(gid)` / `msg.game` | 團務表代理 | `obj[key]` 與 `obj:set(key,value)` 讀寫當前團共享資料，`:message(text)` 向當前群發訊息。未開團時 `msg.game` 為 `nil`。 |
| `msg.user` / `msg.grp` | 使用者/群配置代理 | `obj[key]` 讀，`obj[key]=value` 寫；`msg.user.nick/name/nn` 為暱稱，`msg.user.trust` 為信任等級。 |
| `json.encode(value)` / `json.decode(text)` | string / Lua 值或 `nil` | 同時支援 `require('json')`。 |
| `yaml.parse(text)` / `yaml.dump(value)` | Lua 值或 `nil` / string | 同時支援 `require('yaml')`。 |
| `http.get(url)` | `ok, body` | HTTP GET；預設允許公網 HTTP(S)，始終拒絕非 HTTP(S)、內網 / 環回及危險 URL；嚴格模式下再要求外接 API 開關與白名單。 |
| `http.post(url, body, headers?)` | `ok, body` | body 為 table 時自動 JSON 編碼；headers 可為 table 或字串。 |
| `http.urlEncode(text)` / `http.urlDecode(text)` | string | URL 編解碼。 |

> 嚴格模式沿用歷史配置鍵 `dice/js_fetch_strict`，同時作用於 SealDice JS `fetch` 與舊 Dice! Lua `http`。關閉嚴格模式不會關閉 SSRF、協議和危險字元檢查。

::: warning 內部 `__dnx_*` 函式
`__dnx_roll`、`__dnx_fmt`、`__dnx_conf`、`__dnx_sd_load`、`__dnx_sd_save` 是物件層的內部橋接函式。它們會隨實現調整，插件應使用本頁的 `Actor`、`msg:format`、`GameTable`、`getSelfData` 等公開 API。
:::

## 模板詞條（speech）

### 安全文本函式

普通文案、原生自訂回覆、檔案牌堆與 Lua speech 共用安全文本函式：`sample`、`case`、`grade`、`ran`、`len`、`expired`、`var`、`at`、`print`、`wait`。不執行模板內的 JS / Python，不通過模板讀寫宿主配置或檔案；`wait` 走非同步等待，不讓訊息執行緒休眠。各入口可讀欄位仍取決於它的訊息上下文，預覽不會等待或傳送訊息。

```text
{var:本次={ran:1~100}}本次是 {本次}，再显示仍是 {本次}
{case:user.trust?0=用户&else=受信用户}
{grade:user.favor?0=普通&100=亲密&else=未知}
```

`{var:名?值}` 賦值並顯示，`{var:名=值&另一名=值}` 只賦值；僅本次渲染有效，不能用點路徑修改人物卡、使用者資料或許可權。`ran` 接受有序整數上下界（含端點），`expired` 判斷欄位中的整數 Unix 時間是否已經過去（缺失或無效視為過期）。隨機文本與遊戲骰點獨立。

`len` 對字串返回 UTF-8 位元組數；Lua 訊息中的 Set / 普通表返回元素數，不呼叫 `__len` / `__pairs`，數值、布林值返回 0。普通指令文案和牌堆也可用 `{len:game.pls}` / `{len:game.gms}` 檢視當前團的玩家 / GM 人數；區域性變數依然是字串。集合長度檢查有工作量上限，不等於開放任意物件序列化。

`{print:uid}` / `{print:gid}` 顯示當前使用者或群的名字和 ID，`{print:master}` / `{print:self}` 顯示當前平臺、賬號下的骰主或骰娘；`{print:uid=12345}` / `{print:gid=12345}` 可指定 ID，`gid=0` 表示私聊。只用當前訊息或來源賬號的快取，不臨時聯網查名、不從其他賬號借名字；沒有名稱時保留可辨認的 ID，沒有匹配骰主時顯示 `[无主]`。快取名稱中的偽造 CQ 動作或控制字元會中和。

`{wait:1000}` 不輸出文字，只請求延後回覆；多個被選中分支的等待時間累加，單項要求 `0 < 毫秒 < 600000`，一條回覆最多等待 10 分鐘。普通訊息的最終回覆非同步入隊，最多 256 條 / 16 MiB；傳送前複查來源賬號線上、黑名單和停用狀態，更換賬號、相關群插件 / 回覆 / 規則許可權變化、插件過載或程式重啟會取消舊等待。變數、隨機結果與骰點在入隊前確定，不到時重算；它不延後已執行的管理操作，也不用於審批等必須即時返回的決策。

Lua 可掛起的訊息處理內使用 `msg:format('文字{wait:1000}')` 或 `msg:echo('文字{wait:1000}')` 時，複用 `sleepTime` 協程機制，時間到後從呼叫處續跑；過載取消舊協程。預覽和不可掛起的同步呼叫只格式化文本，不執行等待。

`msg:format()` / `msg:echo()` 帶入這張訊息表的標量欄位和允許讀取的點路徑，`msg:get('temp.count')`、`msg:get('user.trust')` 可讀取巢狀欄位；布林 false 不再丟失。拒絕內部 `__*` 欄位和函式，不隱式穿透到 `_G`、任意 SelfData 或宿主配置。`msg:inc()` 仍是本條訊息的區域性變數自增，不借此增加持久化寫許可權。

暱稱、捕獲文本、使用者資料與插件欄位按普通資料插入，不再作為模板解析。`\{ran:1~100}` 等轉義寫法保留原文；迴圈、大小、層數與工作量限制繼續生效。

### 自動目錄

`{list_all_deck}` 列出公開牌堆及本群臨時牌堆；`{list_extern_deck}` 只列使用者檔案提供的公開牌堆。下劃線隱藏項不顯示。`{list_extern_order}` / `{list_reply_deck}` 列出當前賬號、群和使用者範圍內的原生自訂回覆與 Lua 擴展觸發詞；前者也列出啟用的 SealDice JS 插件指令，並使用當前配置的指令字首。

JS 目錄只讀不可變命令快照，載入、執行或過載後更新；列目錄不進入 JS 執行時、不讀取 getter / Proxy、不呼叫 `solve`。Lua 的靜態使用者、群及自身配置條件可只讀檢查；需要執行 speech 動態鍵、讀取 SelfData 檔案或無法確認許可權的條目保守省略。列目錄不執行回覆、抽機率或消耗冷卻 / 每日次數。

`{list_dice_sister}` 僅在本群當前賬號的成員快取中列出已識別骰娘，不公開整臺實例的全域性賬號清單。目錄最多顯示 200 項 / 32 KiB，截斷時帶省略號；查詢不觸發跨賬號補查。

回覆文本中 `{key}` 按此順序解析：訊息變數 → speech 詞條（各 mod 的 `speech/*.yaml` 與描述檔 `speech{}` 合併；值以 `&` 開頭為別名）→ 內建 `{self}`（骰娘自稱）。支援遞迴展開。

speech 鍵忽略 ASCII 大小寫，例如 `{reply_spells_list}` 可引用 `Reply_Spells_List`。訊息變數先取同名精確項，再作 ASCII 不區分大小寫的相容查詢，中文鍵不被改寫。

YAML 和 JSON 描述檔都支援文本陣列，每次引用均勻隨機抽取一條，再展開其中的變數 / sample；不是隻顯示第一條。空陣列返回空文本，別名仍可指向陣列：

```yaml
Roll_Reply:
  - "{nick}：{sample:干得漂亮|效果拔群}"
  - "轮到 {nick} 了！"
roll_alias: "&ROLL_REPLY"
```

這些改動屬於 2026-10-16 的本地相容收尾，是否進入所用安裝包請核對實際原始碼版本。已對 ResourceSearchEngine、求籤 / DailyNews、PC_Inventory 與 PC_Slots 做過副本驗收；測試使用網路與發訊息替身，不保證外部服務或真實帳號投遞，插件自身原始碼錯誤也不會由宿主偷偷改寫。

### 幫助詞條與引用

`helpdoc` 使用各活動 Mod 合併後的大小寫不敏感名稱空間，同名主題按載入順序覆蓋。幫助列表與 `{help:主题}` 一致，`&主题` 別名可跨 Mod、多級轉向；迴圈別名不會卡住列表。普通 `.help` 保留 Next 原有內建 / JS 幫助優先順序與搜尋域過濾，僅渲染最終選中的 Mod 條目。

幫助內容中的引用按「訊息變數 → Mod 幫助主題 → speech → 內建變數」解析，可包含 sample。例如：

```json
{"helpdoc":{"骰子用法":"{nick}，输入 .r d100 即可。","掷骰帮助":"&骰子用法","索引":"{掷骰帮助}"}}
```

`.help 索引` 和 Lua 回覆中的 `{help:索引}` 都會帶入當前暱稱。普通回覆的 `{主题}` 不會因此自動改成幫助查詢；需要幫助時請顯式寫 `{help:主题}`。

模板展開最多 24 層、10,000 次變數 / 引用解析；單個結果最多 4 MiB，中間文本累計最多 32 MiB。超出大小或工作量限制返回空文本，不執行任意指令碼。圖片 URL / CQ 引用不會按圖片檔案體積計數，直接嵌入模板的 Base64 則屬於文本。

## 與原版的相容性說明

常見全域性 API 與 `Set/Context/SelfData/Actor/GameTable/http` 物件層已接入，包含 `getUserConf(nil, field)` 列舉、`&key` 兜底、`drawDeck` 三參、單檔案 `task_call` 與 `sleepTime`。`require('Set')`、`Actor`、`GameTable`、`SelfData` 可用公開別名。以下邊界仍保留，不能承諾任意舊包無損復刻：

| 未支援項 | 說明 |
| --- | --- |
| 舊 JS / Python 動作與任意 XML 指令碼 | 不執行；SealDice JS 引擎不等於舊 Dice! JS API，XML 僅轉換安全數值公式 |
| 舊遠端安裝與安全策略覆蓋 | 不恢復 `.mod get/update/reinstall` 下載器，不允許繞過停用、黑名單、內容攔截與請求審批 |
| 多重回復 / 比較的歷史行為 | 一次訊息選一條回覆；多個比較操作全部滿足，不復制寬鬆的部分匹配或連續刷屏 |
| 外部 Lua 位元組碼 | 不載入，僅接受文本 Lua；資源發現與佇列有深度 / 數量上限 |
| 二進位制 C 擴展（`.dll`） | 沿用已有執行庫搜尋策略；需匹配平臺與 Lua ABI，嚴格模式另限制搜尋目錄。本輪不新增原生庫載入許可權 |
| 舊宿主特有物件 | 私聊 / 頻道舊團務仍不自動啟用；`LogEnd` 補齊常用欄位，但不保證完整舊日誌 / Session 物件逐欄位等價 |

遷移遇到問題歡迎帶上 mod 檔案反饋。

配置底層雖然使用字串列，但 Lua 值通過型別編碼區分文本、布林、數字、空串與集合；未編碼的歷史值仍按相容規則讀取。正則引擎與原版 C++ locale / POSIX 擴展不保證等價，400 位元組上限也不是執行時限的替代。完整實現狀態、保留差異與測試範圍見[主倉相容記錄](https://github.com/DiceZone/Dice-Next/blob/main/docs/legacy-mod-compatibility.md)。
