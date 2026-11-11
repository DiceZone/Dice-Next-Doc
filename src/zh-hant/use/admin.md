<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 群管與系統

群管理員與骰主（Master）用於控制骰子行為的指令。大部分管理操作也可在 [Web 管理面板](/zh-hant/manage/dashboard) 完成。

## 開關骰子

| 指令 | 說明 |
|------|------|
| `.bot` | 檢視版本 / 狀態 |
| `.bot on` / `.bot off` | 在本群開啟 / 關閉骰子（需群管理） |
| `外置开` / `外置关` | 外接模式：停用內建指令，僅保留自訂回覆 |

`.bot` 資訊可配置頁首 / 頁尾（見[系統設定](/zh-hant/manage/settings)）。

### 分群功能開關

```text
.bot log on / off       → 开启 / 关闭日志指令与记录
.bot reply on / off     → 开启 / 关闭自定义回复与因果规则
.bot roll on / off      → 开启 / 关闭内置掷骰、检定、先攻与技能成长
.bot plugin on / off    → 开启 / 关闭插件指令、消息钩子与规则包指令
.bot log                → 查询日志功能开关（其他三类同理）
```

四個功能開關預設開啟，只對當前骰娘賬號在本群生效，修改需群管許可權；也可在[群組管理](/zh-hant/manage/groups#功能管理)操作。省略 `on/off` 可查詢狀態，末尾可加骰子賬號定向操作。子開關開啟不會喚醒總開關關閉的骰子，也不能繞過徹底停用或黑名單；重新 `.bot on` 不會重置子開關。

插件開關不修改各插件自身的啟停設定；插件內部擲骰由插件開關控制，不歸內建投擲開關控制。人物卡管理、規則選擇等非投擲操作不受投擲開關影響。`.bot reply` 與 `.reply on/off` 共用設定。

當前版本 `.bot off` 會停止日誌寫入和計時，保留日誌會話；「只記日誌」請保持 `.bot on`，按[日誌文件](/zh-hant/use/log#只記日誌)關閉不需要的功能。早期版本允許 off 時獨立記日誌的行為已被分群開關方案替代。

### 當前視窗文字降級 `.bot text`

```text
.bot text              → 查看用法与当前状态
.bot text plain        → 当前群或当前私聊强制使用可读纯文字
.bot text rich         → 恢复跟随骰主设置的传统 / 标准 / 高级视觉方案
```

`plain` 只關閉 Markdown、卡片和原生按鈕等富訊息傳輸，不會改寫人格口吻，也不會切換骰主選擇的文案方案。高階視覺方案裡的狀態條會使用 `HP [██████░░░░] 6/10` 這類純文字降級，操作按鈕會顯示成 `.r // 掷骰指令`，因此資訊仍然完整。群聊可由群管理員、邀請人或骰主修改；私聊隻影響當前使用者與當前適配器。

### 原版 `.master` 相容入口

僅骰主可使用。支援管理員增刪（包括舊式 `+账号/-账号`）、clock、notice、censor、黑白名單、遠端 boton/botoff 和 dismiss 等已適配操作，複用 Next 的許可權與配置邏輯。

這不是任意指令執行器；舊版 reset/delete/groupclr 等未相容操作會明確提示，不會自動改寫歸屬或清空配置。定時插件任務的用法見[定時任務](/zh-hant/manage/schedules)。

## 群設定 `.group`

```
.group                  → 查看本群信息（状态/记录/名片/旁观/黑名单等）
.group +禁用jrrp        → 在本群停用某条指令
.group -禁用jrrp        → 恢复
.group +禁用回复        → 关闭本群自定义回复
.group +禁用回复 -禁用help → 一次调整多个词条
.group 123456 state     → 查看指定群（校验目标群权限）
.group 123456 +禁用回复 → 调整指定群
.group all +禁用回复    → 当前骰子账号的各群批量设置（骰主或信任≥5）
.group clr              → 重置当前账号的本群功能设置
```

可用群管詞條：`停用指令`、`禁用回复`、`禁用jrrp`、`禁用draw`、`禁用me`、`禁用help`、`禁用deck`、`禁用send`。

指定群也可在私聊中操作。當前群的管理員身份不能直接用於其他群；目標群徹底停用時不能通過這些指令解除。`clr` 不影響其他骰子賬號，保留群身份資訊、硬鎖及未結束的日誌，不刪除日誌內容；舊版共享設定也不會在重置後重新生效。`all` 只接受帶正負號的詞條，不支援批次清空。

### 群自動化 `.group auto`

需要骰子在本群有**管理員及以上許可權**才能生效：

```
.group auto                    → 查看本群自动化设置
.group auto pass 暗号          → 加群自动审核：验证消息含「暗号」才自动通过（all=全部通过）
.group auto kick 广告关键词    → 谁的发言含关键词就自动移出本群
.group auto mute 刷屏词 10     → 谁的发言含关键词就禁言 10 分钟
```

關鍵字留空即關閉對應項。

## 旁觀 `.ob`

```
.ob                     → 查看帮助
.ob join                → 加入旁观
.ob list                → 旁观列表
.ob exit                → 退出旁观
.ob clr                 → 群管理或本团 GM 清空旁观名单
.ob on / off            → 开启 / 关闭本群旁观功能（需群管）
```

## 入群歡迎 `.welcome`

```
.welcome 欢迎新人{at}   → 设置入群欢迎词（支持 {at} 等变量）
.welcome show / off     → 查看 / 关闭
```

## 退群 `.dismiss`

```
.dismiss                → 让骰子退出本群
```

僅群主 / 群管理 / 邀請人 / 高信任使用者可用。骰子先發退群宣言、停止響應本群指令，隨機延遲數十秒後真正退群（群記錄保留並標記「已退群」）。

## 訊息連結 `.link`

把兩個視窗的訊息互相轉發（跨群聯動 / 旁聽，需信任等級 ≥ 3）：

```
.link with 12345678     → 与目标群建立双向链接
.link to / from 群号    → 单向（本群→目标 / 目标→本群）
.link start / close     → 恢复 / 暂停本窗口链接
.link list / state      → 全部链接 / 本窗口状态
```

## 留言 `.send`

```
.send 反馈内容          → 给骰主留言
```

骰主可用 `.send group/user <id> <消息>` 向指定目標傳送。

## 語言 `.lang`

```
.lang                   → 查看 / 切换回复语言
.lang 简体 / 繁體 / en / 日本語 → 切换本群（私聊则本人）的回复语言
.lang clr               → 恢复默认
```

詳細說明（含自訂語言包與 AI 翻譯語言）見[幫助與語言](/zh-hant/use/help)。

## 許可權體系（信任等級）

Dice!Next 移植了原版的 nTrust 許可權階梯，每個使用者有 0–255 的**信任等級**：

| 等級 | 含義 |
|------|------|
| 0 | 普通使用者 |
| 1–3 | 信任使用者（可用 `.link` 等，≥3） |
| 4 及以上 | 骰子管理員（可用 `.trust`、好感調控等） |
| Master | 骰主，最高許可權 |

| 指令 | 說明 |
|------|------|
| `.trust @某人 / QQ号 [等级]` | 查詢 / 設定信任等級（需管理員 ≥4，只能授予低於自己的等級） |
| `.admin add/del <@/QQ>` | 授予 / 撤銷管理員（僅骰主） |
| `.admin list` | 列出管理員 |
| `.admin account-alias add <别名ID> <主ID>` | 建立舊版賬號許可權關聯——別名賬號的信任 / Master 身份按主號計算（僅骰主） |
| `.admin account-alias del <别名ID>` | 解除許可權關聯（僅骰主） |
| `.admin account-alias list` | 列出許可權關聯（僅骰主） |

`.alias` 現在用於[海豹式快捷指令](/zh-hant/use/fun#快捷指令-alias)，舊賬號許可權關聯遷到 `.admin account-alias`，已有 `dice/aliases` 配置仍然生效，不需重新填寫。這隻共享許可權，不合並人物卡、暱稱等資料，也不會自動轉換為 `.bind`；跨平臺身份核驗與資料歸併仍使用[身份繫結](/zh-hant/use/cloud)。

## 敏感詞管理

僅骰主可用；WebUI 的**系統設定 → 安全與許可權 → 敏感詞攔截**與這些指令讀寫同一份配置。

```text
.admin censor status
.admin censor on
.admin censor off
.admin censor +=默认按 Warning 添加
.admin censor +Danger=词0|词1
.admin censor -词0|词1
```

可用等級為 `Ignore`、`Notice`、`Caution`、`Warning`（省略時預設）、`Danger`、`Critical`；`Critical` 用於相容舊資料並按最高風險處置。聊天回執和通知不會複述規則原文，避免把同一敏感內容再次傳送到平臺。

## 骰主通知 `.notice`

把當前視窗（群或私聊）設為骰主通知視窗，接收留言、審批、執行報錯等事件推送（僅骰主）：

```
.notice on / off        → 开关本窗口通知
.notice level 15        → 设订阅级别掩码（1例行 / 2重要 / 4关键 / 8错误，可叠加，15=全部）
```

通知事件的逐項勾選、SMTP 郵件 / Webhook 第三方推送在 Web 管理面板的「通知設定」頁配置。

## 骰主（Master）指令

骰主可遠端管理多個群與黑白名單：

| 指令 | 說明 |
|------|------|
| `boton` / `botoff [群号]` | 遠端開關指定群 |
| `blackqq [-]<id>` | 拉黑 / 解除拉黑使用者（字首 `-` 為移除，無引數為列出） |
| `blackgroup` / `whitegroup` | 黑名單群 / 白名單群 |
| `whiteqq` | 信任使用者 |

非骰主使用這些指令會被禮貌拒絕。骰主在[系統設定](/zh-hant/manage/settings)中配置。

### 系統資訊 `.system`

```
.system info       → 系统信息（OS、CPU、内存、本进程内存）
.system stats      → 运行统计（运行时长、指令数、好友/群/玩家/记录数）
```

::: warning 不支援遠端 Shell
舊版 `.system cmd` 沒有恢復。聊天訊息不應成為作業系統命令入口；系統維護請在主機終端或受控管理環境中完成。
:::

## 原版管理相容入口

以下入口複用 Dice!Next 的統一玩家檔案、許可權和黑名單，不另建一套舊資料：

| 指令 | 行為 |
|------|------|
| `.user state` | 檢視自己的信任、指令統計、建檔時間和卡片數 |
| `.user trust <@/ID> [等级]` | 轉到統一的 `.trust` 查詢 / 設定邏輯 |
| `.user tojson [@/ID]` | 匯出玩家檔案與卡片索引；匯出他人需要管理員許可權 |
| `.user diss <@/ID> [原因]` | 管理員把目標加入本地黑名單 |

`.user diss` 會保留玩家檔案和人物卡，解除名單後可繼續使用；舊版 `.user kill` / `.user clr` 這類不可逆刪除只能在 Web 管理面板中確認執行。

舊版 `.cloud update` 與 `.cloud black` 不再提供：這兩條在原版中也只報告狀態並把人指向網頁。版本號請用不帶引數的 `.bot` 檢視，雲黑名單開關在網頁「系統設定」。`.cloud` 現為賬號中心授權與雲人物卡的入口，見[雲服務與身份繫結](/zh-hant/use/cloud)。

## 骰娘名字 `.strSelfName` / `.strSelfCall`

設定骰娘對外的名字與自稱，屬系統級配置（骰主）。回覆文案裡的 `{self}` 會按「自稱 → 名字 → 適配器登入暱稱 → 骰娘」的順序取值。

```
.strSelfName 小海   → 设置骰娘名字为「小海」
.strSelfCall 本喵   → 设置自称（{self} 优先取自称）
.strSelfName        → 查看当前值；加 reset 或 NULL 可重置
```

## 舊版文案指令 `.strXXX`

骰主可以繼續使用已核對過一對一對映的原版文案鍵：

```
.strRollDice show       → 查看当前语言下映射后的掷骰文案
.strRollDice 新文案     → 写入统一文案覆盖表
.strRollDice reset      → 删除覆盖，恢复 Dice!Next 默认文案
.strRollDice NULL       → 保留覆盖但把文案设为空
```

這裡只接受確有同義槽位、且模板引數相容的舊鍵；未知的 `.str…` 不會被相容層吞掉，仍可由其他指令或插件處理。批次編輯、檢查無效舊鍵和人格文案請使用[管理面板 → 指令列表](/zh-hant/manage/commands)。

## 跨平臺身份繫結 `.bind` / `.info`

同一個人在 QQ 官方、Discord、KOOK 與 OneBot / Milky 窗口裡標識不同。`.bind` 關聯真實 QQ，`.info` 檢視身份資訊。只需統一輸入 `.bind qq <QQ号>`：當前客戶端有正式骰娘 key 時優先 OAuth，否則自動使用骰主配置的 SMTP 郵件驗證。頭像核驗已棄用。

```
.info                → 查看当前窗口类型、规范标识、业务号、已绑定端点
.bind qq <真实QQ号>    → QQ 官方 / Discord / KOOK 私聊发起，自动选择核验方式
.bind confirm        → OAuth：网页同意后，回到原私聊确认
.bind confirm <8位验证码> → 邮件：在原私聊提交验证码，无需重填 QQ
.bind qq <真实QQ号> email → 主动选择或切换为邮件，须启用 SMTP
.bind qq QQ-Official-<机器人ID>:<OpenID> → 在 OneBot / Milky 窗口反向绑定
.bind qqgroup QQ-Official-<机器人ID>:<群OpenID> → 在目标真实 QQ 群内由群主或管理执行
.bind discord <用户ID> / .bind kook <用户ID> → 在 OneBot / Milky 窗口反向绑定平台用户
.cloud auth [write] / .cloud confirm → 单独授权云人物卡，不是绑定的前置步骤
```

繫結後，即使未連線 OneBot 也會保留真實 QQ 身份，跨視窗的人物卡、許可權等可歸一。
詳細配置與限制見[雲服務與身份繫結](/zh-hant/use/cloud#qq-郵箱驗證碼)。郵件驗證不能證明群歸屬。

OAuth 的已驗證 QQ 必須與申請號碼一致，失敗不自動傳送郵件。舊 `.bind email <QQ>` 與 `.bind qq <QQ> <验证码>` 僅為相容保留。

## 全域性設定（骰主）

在[系統設定](/zh-hant/manage/settings) → 「原版全域性設定」中可統一配置：

- 全域性靜默、全域性停用 `.jrrp` / `.me` / `.deck` / `.draw` / `.send` 等
- 事件響應開關（加群 / 入群 / 好友請求 / 好友新增 / 黑名單退群 / 被踢自動拉黑 / 被禁言自動拉黑並退群）
- 牌堆 `_` 後設資料鍵隱藏
- 不活躍自動退群天數、單次清群上限等自動維護項
- 外部請求 `{api:}` 開關與超時

好友 / 加群邀請的**審批策略**（關鍵詞暗號、拒絕非好友邀請、強拉退群、群名關鍵詞自動退群、黑名單自動退群等）也在系統設定中配置，詳見[管理面板](/zh-hant/manage/settings)。

## 定時任務

在 [Web 管理面板 → 定時任務](/zh-hant/manage/schedules) 中可設定每日定時向群 / 私聊推送訊息（如早安問候、跑團提醒），還支援條件觸發（如群內多少天不活躍）與退群等動作。按時單點推送，不群發。
