# JS 插件 API 参考

本页是 Dice!Next JS 插件的完整 API 参考。快速上手示例见[插件开发快速上手](/develop/plugin-quickstart)。

Dice!Next 内嵌 quickjs-ng 引擎（支持现代 ES 语法与 `async/await`），以海豹（SealDice）的 `seal.ext` 插件模型为兼容目标——多数海豹插件可直接运行，本页同时标注了与海豹的差异和当前未实现的占位项。

## 运行环境与加载规则

- **目录**：主目录 `data/plugins/js/`；规则类插件（调用过 `seal.gameSystem` 的）自动迁移到 `data/mod/`；规则包内的 `js/` 目录随包加载（并受按群激活控制）。
- **包装**：每个插件在独立的 IIFE 中求值，顶层 `let/const` 互不冲突；提供假的 `module`/`exports` 以兼容打包产物，但**没有** `require`/`import`——插件必须是自包含单文件。
- **去重**：按元数据 `@name`（不是文件名）去重，多个同名文件保留 `@version` 最高的一个，其余标记为「已被取代」不加载。
- **停用**：文件改名为 `*.js.disabled`（管理面板开关即此操作）。
- **执行模型**：所有插件共享一个 JS 运行时，**单线程串行**执行。死循环或缓慢的同步操作会卡住整条消息处理管线——耗时逻辑请尽量放进定时器回调。

### 元数据（UserScript 头）

文件前 40 行内的 `// @key value` 注释会被解析：

| 键 | 说明 |
| --- | --- |
| `@name` | 插件名（去重与显示依据；缺省用文件名） |
| `@author` / `@version` / `@description` / `@license` | 展示用元数据 |
| `@homepageURL`（或 `@homepage`） | 主页链接 |
| `@updateUrl`（或 `@updateURL`） | 指向插件源码的直链；管理面板「检查更新」会拉取该地址比较 `@version`，一键更新 |

## 扩展与指令注册（seal.ext）

| API | 说明 |
| --- | --- |
| `seal.ext.new(name, author, version)` | 创建扩展对象 `ext`（含 `cmdMap`、`storageSet/storageGet`） |
| `seal.ext.register(ext)` | 注册扩展；注册后再往 `cmdMap` 加指令同样生效 |
| `seal.ext.find(name)` | 按名查找已注册扩展（跨插件协作） |
| `seal.ext.newCmdItemInfo()` | 创建指令对象 `cmd` |
| `seal.ext.newCmdExecuteResult(solved)` | 创建 `solve` 的返回值 `{solved, showHelp:false}`；`showHelp=true` 时宿主自动把 `cmd.help` 附进回复 |

`cmd` 的字段：

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `name` | `""` | 指令名 |
| `help` | `""` | 帮助文本（会聚合进 `.help` 系统与管理面板） |
| `solve(ctx, msg, cmdArgs)` | — | 指令处理函数，返回 `newCmdExecuteResult(true)` 表示已处理 |
| `allowDelegate` | `false` | 兼容字段（代骰请直接用 `seal.getCtxProxyFirst`） |
| `disabledInPrivate` | `false` | 私聊禁用 |
| `enableExecuteTimesParse` | `false` | 允许解析 `3#指令` 连续执行前缀（次数在 `cmdArgs.specialExecuteTimes`） |
| `raw` / `checkCurrentBotOn` / `checkMentionOthers` | — | 兼容字段 |

指令匹配为**首词精确匹配**（`.hello world` 匹配 `cmdMap['hello']`）。派发前会先过「按群启停」开关（管理面板群详情 → 插件），被关掉的群不会触发。

## 事件钩子

| 钩子 | 触发时机 |
| --- | --- |
| `ext.onNotCommandReceived(ctx, msg)` | 收到**非指令**消息时 |
| `ext.onMessageReceived(ctx, msg)` | 同上（两者依次调用，兼容两种海豹写法） |

::: warning 当前只有这两个钩子
入群/退群、戳一戳、撤回、好友申请等事件目前**不会**通知 JS 插件（海豹的 `onGroupJoined`、`onPoke` 等不支持）。这类自动化可先用管理面板的「高级回复 / 定时任务 / 群自动化」实现。
:::

## ctx / msg / cmdArgs

### ctx

| 字段 | 说明 |
| --- | --- |
| `ctx.player.userId` | 发送者 ID |
| `ctx.player.name` | 显示名（群名片优先，回退平台昵称） |
| `ctx.player.card` | 群名片 |
| `ctx.group.groupId` | 群号（私聊为空） |
| `ctx.group.logOn` / `ctx.group.logCurName` | 当前群跑团日志状态 / 日志名 |
| `ctx.isPrivate` | 是否私聊 |
| `ctx.privilegeLevel` | 权限等级（数值越高权限越大；骰主远大于群管） |
| `ctx.endPoint` | 骰娘自身账号 `{platform, userId, nickname, ...}` |
| `ctx.isCurGroupBotOn` | 占位，恒 `true`（能进 solve 就说明群是开的） |

### msg

| 字段 | 说明 |
| --- | --- |
| `msg.message` | 消息全文 |
| `msg.platform` | 平台名（如 `QQ`） |
| `msg.messageType` | `"group"` 或 `"private"` |
| `msg.groupId` | 群号 |
| `msg.time` | Unix 秒 |
| `msg.sender` | `{userId, nickname, card}` |
| `msg.segment` | **占位，恒为空数组**——暂时拿不到图片/@/表情等富媒体分段，只有纯文本 |
| `msg.rawId` / `msg.guildId` / `msg.channelId` | 占位空串 |

### cmdArgs

字段：

| 字段 | 说明 |
| --- | --- |
| `command` | 指令词（首词） |
| `args` | 参数数组（空白切分） |
| `cleanArgs` / `rawArgs` | 去掉指令词后的剩余文本 |
| `rawText` | 整条命令原文 |
| `at` | `[{userId}, ...]` 消息中真实 @ 的人 |
| `kwargs` | `[{name, value, valueExists}, ...]`（解析 `--key` / `--key=value`） |
| `specialExecuteTimes` | `N#指令` 的 N（1–99，默认 1，需 `cmd.enableExecuteTimesParse`） |
| `amIBeMentioned` / `amIBeMentionedFirst` | 占位，恒 `false` |

方法：

| 方法 | 说明 |
| --- | --- |
| `getArgN(n)` | 第 n 个参数（1 起），越界返回 `""` |
| `getRestArgsFrom(n)` | 第 n 个参数起的剩余文本（空格连接） |
| `isArgEqual(n, ...vals)` | 第 n 个参数是否等于任一候选 |
| `chopPrefixToArgsWith(...prefixes)` | 首参命中前缀则移除并返回 `true` |
| `eatPrefixWith(...prefixes)` | 同上但返回被吃掉的前缀 |
| `getKwarg(name)` / `getKwargs(name)` | 取 `--key` 参数，无则 `null` |

## 回复

| API | 行为 |
| --- | --- |
| `seal.replyToSender(ctx, msg, text)` | 回复到消息来处。指令处理期间多次调用会按行合并成一条；在定时器等异步回调里调用则立即直发 |
| `seal.replyGroup(ctx, msg, text)` | 同 `replyToSender` |
| `seal.replyPerson(ctx, msg, text)` | 恒私聊直发给发送者（如暗骰结果） |

文本中可以内嵌图片码 `[CQ:image,file=URL]`（QQ 平台）。目前没有独立的「发送图片/语音」API。

## 变量与人物卡（seal.vars）

| API | 说明 |
| --- | --- |
| `seal.vars.intGet(ctx, name)` → `[value, ok]` | 读整数变量 |
| `seal.vars.intSet(ctx, name, value)` | 写整数变量 |
| `seal.vars.strGet(ctx, name)` → `[value, ok]` | 读字符串变量 |
| `seal.vars.strSet(ctx, name, value)` | 写字符串变量 |

变量名前缀决定归属：

| 前缀 | 作用域 | 存储位置 |
| --- | --- | --- |
| `$m名字` | 当前用户个人 | 插件 KV 库（跨插件共享） |
| `$g名字` | 当前群 | 同上 |
| `$名字` | 全局 | 同上 |
| **无前缀** | **人物卡属性** | 与 `.st` 同一份卡 |

无前缀名字直达人物卡，是海豹 `gameSystem` 规则插件能读写 `.st` 卡的原因；`strGet` 还能读到「表达式属性」的原文（如 `.st 物防='dex+1'` 存的表达式）。特例：`$t玩家` 返回 `ctx.player.name`。

`seal.format(ctx, s)` / `seal.formatTmpl`：对字符串做模板求值——`{$变量}` 查变量、`{骰点表达式}` 走掷骰引擎（如 `{1d100}`）。

## 插件存储（ext.storage）

```javascript
ext.storageSet('key', '值必须是字符串');   // 对象请 JSON.stringify
const v = ext.storageGet('key');          // 无值返回 undefined
```

数据持久化在 `data/plugins.db`，按插件名隔离；管理面板「插件管理」可以查看、导出、清空每个插件的存储。玩家管理页也能看到 `$m` 变量。

## 配置项（WebUI 可视化）

注册后用户可在管理面板插件详情里直接编辑，无需改代码：

| API | 表单形态 |
| --- | --- |
| `seal.ext.registerStringConfig(ext, key, default, desc?)` | 文本框 |
| `seal.ext.registerIntConfig / registerFloatConfig(ext, key, default, desc?)` | 数字框 |
| `seal.ext.registerBoolConfig(ext, key, default, desc?)` | 开关 |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | 多行模板（数组） |
| `seal.ext.registerOptionConfig(ext, key, default, options, desc?)` | 下拉选择 |

读取：`getStringConfig` / `getIntConfig` / `getFloatConfig` / `getBoolConfig` / `getTemplateConfig`（返回数组）/ `getOptionConfig`。也有批量式 `newConfigItem` + `registerConfig`（海豹写法兼容）。

## 定时

| API | 说明 |
| --- | --- |
| `setTimeout(fn, ms)` / `clearTimeout(id)` | 真定时器（不是消息触发的假定时） |
| `setInterval(fn, ms)` / `clearInterval(id)` | 间隔下限 200ms，活跃定时器上限 256 个 |
| `seal.ext.registerTask(ext, 'daily', 'HH:MM', fn, key?, desc?)` | 每日定点任务；`taskType='cron'` 仅支持每日等价的 `M H * * *` 表达式 |

定时回调里的 `replyToSender` 会立即直发。每周/任意 cron 暂不支持。

## 网络（fetch）

```javascript
const resp = await fetch(url, { method: 'POST', headers: {...}, body: {...} });
// resp.ok / resp.status / await resp.text() / await resp.json()
```

受安全门控：需要在管理面板「系统设置」打开**外置 API 开关**并把目标域名加入白名单，否则请求会被拒绝（Promise reject）。`body` 传对象会自动 JSON 序列化。另有 `btoa`/`atob` 全局函数。

::: warning 同步实现
`fetch` 底层是同步阻塞的，慢接口会拖住消息处理——对时效不敏感的请求放进定时器回调更稳妥。
:::

## 群管理与名单

| API | 说明 |
| --- | --- |
| `seal.memberBan(ctx, groupId, userId, duration)` | 禁言（秒） |
| `seal.memberKick(ctx, groupId, userId)` | 踢人 |
| `seal.setPlayerGroupCard(ctx, template)` | 设发送者群名片 |
| `seal.ban.addBan(ctx, id, place, reason)` | 加黑名单（接骰娘的黑白名单系统） |
| `seal.ban.addTrust(ctx, id, place, reason)` | 加白名单 |
| `seal.ban.remove(ctx, id)` | 移出名单 |
| `seal.ban.getList()` / `seal.ban.getUser(id)` | 查询名单 |

## 代骰

```javascript
const mctx = seal.getCtxProxyFirst(ctx, cmdArgs) || ctx;  // 有 @ 目标则代表 TA
```

`getCtxProxyFirst` / `getCtxProxyAtPos(ctx, cmdArgs, pos)` 用消息里第 pos 个被 @ 的人构造代理 ctx——之后 `seal.vars` 的人物卡读写都指向被 @ 者的卡。

## 牌堆与掷骰

| API | 说明 |
| --- | --- |
| `seal.deck.draw(ctx, name, isShuffle)` | 抽牌堆，返回 `{exists, err, result}` |
| `seal.format(ctx, '{1d100}')` | 借模板求值走真实掷骰引擎 |

## 规则模板（gameSystem）

`seal.gameSystem.newTemplate(jsonStr)` / `newTemplateByYaml(yamlStr)`：注册整套规则模板（属性别名、衍生属性等），接入内建 `.st`/`.ra`。调用过它的插件被视为「规则类」，自动迁入 `data/mod/` 并出现在规则管理页。实战教程：[转化海豹规则插件](/develop/rulepack-example-fu)。

`seal.coc.registerRule` 目前仅把插件标记为规则类，**自定义检定判定不会真正接管** `.ra` 内核。

## 其它全局

| API | 说明 |
| --- | --- |
| `console.log/info/warn/error(...)` | 写入骰娘运行日志（前缀 `[js]`） |
| `seal.getVersion()` | `{version, versionSimple, versionCode, ...}` |
| `seal.getEndPoints()` | 占位，恒空数组 |

## 当前限制一览

写插件前值得知道的边界（也是我们的改进路线）：

1. 事件钩子只有非指令消息两个；平台事件（入群/戳一戳/撤回等）不通知插件。
2. `msg.segment` 恒空——拿不到图片等富媒体，只有纯文本；也没有专用的发图 API（可发 `[CQ:image]` 码）。
3. 没有 `require`/`import` 与文件系统 API，插件必须单文件自包含。
4. 单线程串行执行，无超时与资源配额——请避免死循环与慢同步操作。
5. `registerTask` 只支持每日任务；`seal.coc` 自定义判定、`cmdArgs.amIBeMentioned`、`seal.getEndPoints` 等为占位。
6. `fetch` 受外置 API 开关与白名单门控（这是刻意的安全设计，不是 bug）。
