# 群管与系统

群管理员与骰主（Master）用于控制骰子行为的指令。大部分管理操作也可在 [Web 管理面板](/manage/dashboard) 完成。

## 开关骰子

| 指令 | 说明 |
|------|------|
| `.bot` | 查看版本 / 状态 |
| `.bot on` / `.bot off` | 在本群开启 / 关闭骰子（需群管理） |
| `外置开` / `外置关` | 外置模式：停用内置指令，仅保留自定义回复 |

`.bot` 信息可配置页眉 / 页脚（见[系统设置](/manage/settings)）。

### 分群功能开关

```text
.bot log on / off       → 开启 / 关闭日志功能
.bot reply on / off     → 开启 / 关闭自定义回复
.bot roll on / off      → 开启 / 关闭内置投掷功能
.bot plugin on / off    → 开启 / 关闭插件功能
.bot log                → 查询日志功能开关（其他三类同理）
```

修改需群管权限，只对当前骰娘账号在本群生效；也可在[群组管理](/manage/groups#功能管理)操作。子开关开启不会唤醒总开关关闭的骰子，也不能绕过彻底禁用或黑名单。

当前版本 `.bot off` 会停止日志写入和计时，保留日志会话；「只记日志」请保持 `.bot on`，按[日志文档](/use/log#只记日志)关闭不需要的功能。早期版本允许 off 时独立记日志的行为已被分群开关方案替代。

### 当前窗口文字降级 `.bot text`

```text
.bot text              → 查看用法与当前状态
.bot text plain        → 当前群或当前私聊强制使用可读纯文字
.bot text rich         → 恢复跟随骰主设置的传统 / 标准 / 高级视觉方案
```

`plain` 只关闭 Markdown、卡片和原生按钮等富消息传输，不会改写人格口吻，也不会切换骰主选择的文案方案。高级视觉方案里的状态条会使用 `HP [██████░░░░] 6/10` 这类纯文字降级，操作按钮会显示成 `.r // 掷骰指令`，因此信息仍然完整。群聊可由群管理员、邀请人或骰主修改；私聊只影响当前用户与当前适配器。

### 原版 `.master` 兼容入口

仅骰主可使用。支持管理员增删（包括旧式 `+账号/-账号`）、clock、notice、censor、黑白名单、远程 boton/botoff 和 dismiss 等已适配操作，复用 Next 的权限与配置逻辑。

这不是任意指令执行器；旧版 reset/delete/groupclr 等未兼容操作会明确提示，不会自动改写归属或清空配置。定时插件任务的用法见[定时任务](/manage/schedules)。

## 群设定 `.group`

```
.group                  → 查看本群信息（状态/记录/名片/旁观/黑名单等）
.group +禁用jrrp        → 在本群停用某条指令
.group -禁用jrrp        → 恢复
.group +禁用回复        → 关闭本群自定义回复
.group clr              → 清空本群所有设定
```

可用群管词条：`停用指令`、`禁用回复`、`禁用jrrp`、`禁用draw`、`禁用me`、`禁用help`、`禁用deck`、`禁用send`。

### 群自动化 `.group auto`

需要骰子在本群有**管理员及以上权限**才能生效：

```
.group auto                    → 查看本群自动化设置
.group auto pass 暗号          → 加群自动审核：验证消息含「暗号」才自动通过（all=全部通过）
.group auto kick 广告关键词    → 谁的发言含关键词就自动移出本群
.group auto mute 刷屏词 10     → 谁的发言含关键词就禁言 10 分钟
```

关键字留空即关闭对应项。

## 旁观 `.ob`

```
.ob                     → 旁观本群会话
.ob list                → 旁观列表
.ob exit                → 退出旁观
.ob clr                 → 清空旁观名单
.ob on / off            → 开启 / 关闭本群旁观功能
```

## 入群欢迎 `.welcome`

```
.welcome 欢迎新人{at}   → 设置入群欢迎词（支持 {at} 等变量）
.welcome show / off     → 查看 / 关闭
```

## 退群 `.dismiss`

```
.dismiss                → 让骰子退出本群
```

仅群主 / 群管理 / 邀请人 / 高信任用户可用。骰子先发退群宣言、停止响应本群指令，随机延迟数十秒后真正退群（群记录保留并标记「已退群」）。

## 消息链接 `.link`

把两个窗口的消息互相转发（跨群联动 / 旁听，需信任等级 ≥ 3）：

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

骰主可用 `.send group/user <id> <消息>` 向指定目标发送。

## 语言 `.lang`

```
.lang                   → 查看 / 切换回复语言
.lang 简体 / 繁體 / en / 日本語 → 切换本群（私聊则本人）的回复语言
.lang clr               → 恢复默认
```

详细说明（含自定义语言包与 AI 翻译语言）见[帮助与语言](/use/help)。

## 权限体系（信任等级）

Dice!Next 移植了原版的 nTrust 权限阶梯，每个用户有 0–255 的**信任等级**：

| 等级 | 含义 |
|------|------|
| 0 | 普通用户 |
| 1–3 | 信任用户（可用 `.link` 等，≥3） |
| 4 及以上 | 骰子管理员（可用 `.trust`、好感调控等） |
| Master | 骰主，最高权限 |

| 指令 | 说明 |
|------|------|
| `.trust @某人 / QQ号 [等级]` | 查询 / 设置信任等级（需管理员 ≥4，只能授予低于自己的等级） |
| `.admin add/del <@/QQ>` | 授予 / 撤销管理员（仅骰主） |
| `.admin list` | 列出管理员 |
| `.alias add <别名ID> <主ID>` | 绑定账号别名——别名账号的信任 / Master 身份按主号计算（仅骰主） |
| `.alias del / list` | 解绑 / 列出别名 |

## 敏感词管理

仅骰主可用；WebUI 的**系统设置 → 安全与权限 → 敏感词拦截**与这些指令读写同一份配置。

```text
.admin censor status
.admin censor on
.admin censor off
.admin censor +=默认按 Warning 添加
.admin censor +Danger=词0|词1
.admin censor -词0|词1
```

可用等级为 `Ignore`、`Notice`、`Caution`、`Warning`（省略时默认）、`Danger`、`Critical`；`Critical` 用于兼容旧数据并按最高风险处置。聊天回执和通知不会复述规则原文，避免把同一敏感内容再次发送到平台。

## 骰主通知 `.notice`

把当前窗口（群或私聊）设为骰主通知窗口，接收留言、审批、运行报错等事件推送（仅骰主）：

```
.notice on / off        → 开关本窗口通知
.notice level 15        → 设订阅级别掩码（1例行 / 2重要 / 4关键 / 8错误，可叠加，15=全部）
```

通知事件的逐项勾选、SMTP 邮件 / Webhook 第三方推送在 Web 管理面板的「通知设置」页配置。

## 骰主（Master）指令

骰主可远程管理多个群与黑白名单：

| 指令 | 说明 |
|------|------|
| `boton` / `botoff [群号]` | 远程开关指定群 |
| `blackqq [-]<id>` | 拉黑 / 解除拉黑用户（前缀 `-` 为移除，无参数为列出） |
| `blackgroup` / `whitegroup` | 黑名单群 / 白名单群 |
| `whiteqq` | 信任用户 |

非骰主使用这些指令会被礼貌拒绝。骰主在[系统设置](/manage/settings)中配置。

### 系统信息 `.system`

```
.system info       → 系统信息（OS、CPU、内存、本进程内存）
.system stats      → 运行统计（运行时长、指令数、好友/群/玩家/记录数）
```

::: warning 不支持远程 Shell
旧版 `.system cmd` 没有恢复。聊天消息不应成为操作系统命令入口；系统维护请在主机终端或受控管理环境中完成。
:::

## 原版管理兼容入口

以下入口复用 Dice!Next 的统一玩家档案、权限和黑名单，不另建一套旧数据：

| 指令 | 行为 |
|------|------|
| `.user state` | 查看自己的信任、指令统计、建档时间和卡片数 |
| `.user trust <@/ID> [等级]` | 转到统一的 `.trust` 查询 / 设置逻辑 |
| `.user tojson [@/ID]` | 导出玩家档案与卡片索引；导出他人需要管理员权限 |
| `.user diss <@/ID> [原因]` | 管理员把目标加入本地黑名单 |

`.user diss` 会保留玩家档案和人物卡，解除名单后可继续使用；旧版 `.user kill` / `.user clr` 这类不可逆删除只能在 Web 管理面板中确认执行。

旧版 `.cloud update` 与 `.cloud black` 不再提供：这两条在原版中也只报告状态并把人指向网页。版本号请用不带参数的 `.bot` 查看，云黑名单开关在网页「系统设置」。`.cloud` 现为账号中心授权与云人物卡的入口，见[云服务与身份绑定](/use/cloud)。

## 骰娘名字 `.strSelfName` / `.strSelfCall`

设置骰娘对外的名字与自称，属系统级配置（骰主）。回复文案里的 `{self}` 会按「自称 → 名字 → 适配器登录昵称 → 骰娘」的顺序取值。

```
.strSelfName 小海   → 设置骰娘名字为「小海」
.strSelfCall 本喵   → 设置自称（{self} 优先取自称）
.strSelfName        → 查看当前值；加 reset 或 NULL 可重置
```

## 旧版文案指令 `.strXXX`

骰主可以继续使用已核对过一对一映射的原版文案键：

```
.strRollDice show       → 查看当前语言下映射后的掷骰文案
.strRollDice 新文案     → 写入统一文案覆盖表
.strRollDice reset      → 删除覆盖，恢复 Dice!Next 默认文案
.strRollDice NULL       → 保留覆盖但把文案设为空
```

这里只接受确有同义槽位、且模板参数兼容的旧键；未知的 `.str…` 不会被兼容层吞掉，仍可由其他指令或插件处理。批量编辑、检查无效旧键和人格文案请使用[管理面板 → 指令列表](/manage/commands)。

## 跨平台身份绑定 `.bind` / `.info`

同一个人在 QQ 官方、Discord、KOOK 与 OneBot / Milky 窗口里标识不同。`.bind` 关联真实 QQ，`.info` 查看身份信息。只需统一输入 `.bind qq <QQ号>`：当前客户端有正式骰娘 key 时优先 OAuth，否则自动使用骰主配置的 SMTP 邮件验证。头像核验已弃用。

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

绑定后，即使未连接 OneBot 也会保留真实 QQ 身份，跨窗口的人物卡、权限等可归一。
详细配置与限制见[云服务与身份绑定](/use/cloud#qq-邮箱验证码)。邮件验证不能证明群归属。

OAuth 的已验证 QQ 必须与申请号码一致，失败不自动发送邮件。旧 `.bind email <QQ>` 与 `.bind qq <QQ> <验证码>` 仅为兼容保留。

## 全局设置（骰主）

在[系统设置](/manage/settings) → 「原版全局设置」中可统一配置：

- 全局静默、全局停用 `.jrrp` / `.me` / `.deck` / `.draw` / `.send` 等
- 事件响应开关（加群 / 入群 / 好友请求 / 好友添加）
- 牌堆 `_` 元数据键隐藏
- 不活跃自动退群天数、单次清群上限等自动维护项
- 外部请求 `{api:}` 开关与超时

好友 / 加群邀请的**审批策略**（关键词暗号、拒绝非好友邀请、强拉退群、群名关键词自动退群、黑名单自动退群等）也在系统设置中配置，详见[管理面板](/manage/settings)。

## 定时任务

在 [Web 管理面板 → 定时任务](/manage/schedules) 中可设置每日定时向群 / 私聊推送消息（如早安问候、跑团提醒），还支持条件触发（如群内多少天不活跃）与退群等动作。按时单点推送，不群发。
