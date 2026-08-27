# JS 插件 API 参考

本页是 Dice!Next JS 插件的完整 API 参考。快速上手示例见[插件开发快速上手](/develop/plugin-quickstart)。

Dice!Next 内嵌 quickjs-ng 引擎（支持现代 ES 语法与 `async/await`），以海豹（SealDice）的 `seal.ext` 插件模型为兼容目标——多数海豹插件可直接运行，本页同时标注了与海豹的差异和当前未实现的占位项。

## 运行环境与加载规则

- **目录**：主目录 `data/plugins/js/`；规则类插件（调用过 `seal.gameSystem` 的）自动迁移到 `data/mod/`；规则包内的 `js/` 目录随包加载（并受按群激活控制）。
- **包装**：每个插件在独立的 IIFE 中求值，顶层 `let/const` 互不冲突；提供假的 `module`/`exports` 以兼容打包产物，但**没有** `require`/`import`——插件必须是自包含单文件。
- **去重**：按元数据 `@name`（不是文件名）去重，多个同名文件保留 `@version` 最高的一个，其余标记为「已被取代」不加载。
- **停用**：文件改名为 `*.js.disabled`（管理面板开关即此操作）。
- **执行模型**：所有插件共享一个 JS 运行时，**单线程串行**执行。死循环或缓慢的同步操作会卡住整条消息处理管线——耗时逻辑请尽量放进定时器回调。
- **加载生命周期**：扩展注册时 `ext.isLoaded=false`；全部脚本完成注册后，宿主统一设为 `true` 并调用各扩展的 `ext.onLoad()`，因此 `onLoad` 中可以安全使用 `seal.ext.find` 查找其他插件。

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

正式消息的主要顺序与 `sealdice-core` 对齐：

```text
onMessageReceived → 内置指令或 cmd.solve → 清空异步任务 → onCommandReceived → 实际发送 → onMessageSend
```

| 钩子 | 触发时机 |
| --- | --- |
| `ext.onLoad()` | 全部脚本注册完毕、`ext.isLoaded` 设为 `true` 后调用一次 |
| `ext.onMessageReceived(ctx, msg)` | 每条被接收的消息进入指令处理前调用；它是观察钩子，不会压掉后续内置 / 插件指令 |
| `ext.onCommandReceived(ctx, msg, cmdArgs)` | 指令求解与其中的 Promise 任务完成后调用；内置指令、JS 指令和已解析但未知的指令都会触发 |
| `ext.onNotCommandReceived(ctx, msg)` | 消息未产生指令、Lua / 因果 / 自定义回复时，作为非指令兜底调用 |
| `ext.onMessageSend(ctx, msg, flag)` | Dice!Next 的最终回复实际投递后调用；`msg` 是已发送消息 |
| `ext.onGroupJoined(ctx, msg)` | 骰子自身加入普通群 |
| `ext.onGroupMemberJoined(ctx, msg)` | 普通成员加入群 |
| `ext.onGuildJoined(ctx, msg)` | 骰子自身加入带 guild 标识的频道 / 服务器 |
| `ext.onBecomeFriend(ctx, msg)` | 好友添加完成 |
| `ext.onMessageDeleted(ctx, msg)` | 收到消息撤回事件；`msg.rawId` 为被撤回消息 ID（适配器提供时） |
| `ext.onPoke(ctx, event)` | 戳一戳；`event={groupId,senderId,targetId,isPrivate}` |
| `ext.onGroupLeave(ctx, event)` | 群成员退出 / 被移出；`event={groupId,userId,operatorId}` |

即使注册的指令对象没有 `solve`，或指令词未在任何 `cmdMap` 中命中，已解析的指令消息仍会进入 `onCommandReceived`。事件类钩子是否触发取决于适配器是否上报对应 `BotEvent`。

::: warning 与 SealDice 边界
`onMessageEdit` 暂不可用，因为 Dice!Next 当前的 `BotEvent` 传输层没有消息编辑事件。`onCommandOverride` 在 `sealdice-core` 本身没有 JS 绑定，因此不属于 JS 插件兼容目标。
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
| `ctx.endPoint` | 骰娘自身端点 `{platform,id,userId,nickname,state,enable}` |
| `ctx.isCurGroupBotOn` | 占位，恒 `true`（能进 solve 就说明群是开的） |

### msg

| 字段 | 说明 |
| --- | --- |
| `msg.message` | 原始消息全文（优先 `rawContent`） |
| `msg.platform` | 适配器平台标识 |
| `msg.messageType` | `"group"` 或 `"private"` |
| `msg.groupId` | 群号；私聊严格为空字符串 |
| `msg.time` | 适配器消息时间（Unix 秒；缺失时取当前时间） |
| `msg.sender` | `{userId, nickname, card}` |
| `msg.segment` | 适配器提供的富媒体分段；优先读取 `segments`、OneBot `raw.message` 或 `msg_elements`，没有时为空数组 |
| `msg.rawId` / `msg.guildId` / `msg.channelId` | 原消息 ID、服务器 ID、频道 ID；适配器未提供的字段为空字符串 |

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
| `amIBeMentioned` / `amIBeMentionedFirst` | 是否 @ 到当前骰子 / 是否第一个 @ 的就是当前骰子，依据真实 `atList` 计算 |

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

`onMessageSend` 观察的是经过模板、润色 / 翻译并实际投递的最终回复。钩子、定时器或事件回调里调用回复 API 的直发消息不会再次递归触发 `onMessageSend`，以避免插件制造无限消息循环。

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

## 好感度系统（seal.favor）

这些接口与内置 `.favor` / `好感` 指令直接读写同一份 `player_profiles.favor`，不会生成插件私有副本。平台从 `ctx.endPoint.platform` 自动取得；省略 `userId` 时操作 `ctx.player.userId`。

| API | 返回值 | 说明 |
| --- | --- | --- |
| `seal.favor.get(ctx, userId?)` | `number` 或 `null` | 读取当前好感度；尚无记录时为 `0`。 |
| `seal.favor.set(ctx, value, userId?)` | `number` 或 `null` | 覆写好感度，并返回写入后的值。 |
| `seal.favor.add(ctx, delta, userId?)` | `number` 或 `null` | 增减好感度，并返回变更后的值。 |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` 或 `null` | 执行与 `.favor grow` 相同的概率成长；未成长时 `success=false`、`delta=0`。 |

```javascript
const before = seal.favor.get(ctx);
const after = seal.favor.add(ctx, 5);
const growth = seal.favor.grow(ctx);
seal.replyToSender(ctx, msg,
  `好感：${before} → ${after}\n成长：${growth.success ? `+${growth.delta}` : '未成长'}`);
```

传入第三方平台的用户 ID 时必须使用该平台原始字符串 ID，不能假定所有账号都是数字 QQ。目标 `userId` 或上下文平台缺失时返回 `null`，且不会写入数据。

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

## 完整 JS API 清单与签名

下面是当前运行时导出的完整公开 API。标为“兼容占位”的项目可以安全调用，但不具备海豹原版的完整行为；不要把它们当作功能已实现。

### `seal.ext`、扩展与配置

| API | 参数 / 返回值 | 状态与说明 |
| --- | --- | --- |
| `seal.ext.new(name, author, version)` | `ext` | 新建扩展对象，内含 `name`、`author`、`version`、`cmdMap`、`storageGet/Set`。 |
| `seal.ext.register(ext)` | — | 注册扩展。 |
| `seal.ext.find(name)` | `ext` 或 `null` | 查找已注册扩展。 |
| `seal.ext.newCmdItemInfo()` | `cmd` | 新建指令对象。 |
| `seal.ext.newCmdExecuteResult(solved?)` | `{solved, showHelp}` | solve 的标准返回值。 |
| `seal.ext.registerTask(ext, type, value, fn, key?, desc?, group?)` | — | `daily` + `HH:MM`，或每日等价 `cron`：`M H * * *`。key/desc/group 当前仅为兼容参数。 |
| `seal.ext.newConfigItem(key?, defaultValue?, desc?)` | ConfigItem | 批量配置入口；对象字段含 `key`、`defaultValue`、`type`、`description`。 |
| `seal.ext.registerConfig(ext, ...items)` | — | 批量注册 ConfigItem。 |
| `seal.ext.getConfig(ext, key)` | `{key, value}` | 返回配置对象；读取值使用 `.value`。 |
| `seal.ext.registerStringConfig / registerIntConfig / registerFloatConfig / registerBoolConfig(ext, key, defaultValue, desc?)` | — | 注册对应类型配置。 |
| `seal.ext.registerTemplateConfig(ext, key, defaultArray, desc?)` | — | 注册字符串数组模板配置。 |
| `seal.ext.registerOptionConfig(ext, key, defaultValue, options, desc?)` | — | 注册下拉配置；options 为数组。 |
| `seal.ext.getStringConfig / getIntConfig / getFloatConfig / getBoolConfig / getTemplateConfig / getOptionConfig(ext, key)` | 值 | 分别返回 string / number / number / boolean / string[] / string。 |
| `seal.ext.unregisterConfig(ext)` | `0` | **兼容占位**，当前不移除已注册配置。 |

### 消息、上下文与回复

| API | 参数 / 返回值 | 说明 |
| --- | --- | --- |
| `seal.replyToSender(ctx, msg, text)` | — | 回到原消息窗口。 |
| `seal.replyGroup(ctx, msg, text)` | — | 当前与 `replyToSender` 行为相同。 |
| `seal.replyPerson(ctx, msg, text)` | — | 始终私聊发送者；临时 msg 没有 sender 时用 `ctx.player.userId`。 |
| `seal.newMessage()` | `{}` | 新建空消息对象；按需补 `platform`、`messageType`、`groupId`、`sender` 后可配合回复 API 使用。 |
| `seal.createTempCtx()` | `{player:{userId,name}, group:{groupId}}` | 新建最小上下文；需自行补齐 userId / groupId。 |
| `seal.getCtxProxyFirst(ctx, msgOrArgs)` | `ctx` | 有 @ 目标时返回以第一个目标为 `ctx.player` 的代理；无目标时返回原 ctx。 |
| `seal.getCtxProxyAtPos(ctx, msgOrArgs, pos)` | `ctx` | 同上，pos 从 0 开始。 |
| `seal.setPlayerGroupCard(ctx, template)` | — | 设置当前发送者的群名片；需要平台具备该能力与足够权限。 |
| `seal.applyPlayerGroupCardByTemplate(ctx, template)` | `0` | **兼容占位**，当前不执行设置。 |
| `seal.memberBan(ctx, groupId, userId, durationSec?)` | — | 禁言；平台不支持或权限不足时不会生效。 |
| `seal.memberKick(ctx, groupId, userId)` | — | 踢人；平台不支持或权限不足时不会生效。 |

`ctx.player` 公开字段为 `userId`、`name`、`card`；`ctx.group` 为 `groupId`、`logOn`、`logCurName`。`msg.sender` 为 `userId`、`nickname`、`card`。跨平台 ID 均为字符串，不能假定为 QQ 数字。

### 变量、人物卡、牌堆与规则

| API | 参数 / 返回值 | 说明 |
| --- | --- | --- |
| `seal.setVarInt(ctx, name, value)` / `seal.vars.intSet(...)` | — | 写整数变量；无 `$` 前缀时写当前人物卡属性。 |
| `seal.setVarStr(ctx, name, value)` / `seal.vars.strSet(...)` | — | 写字符串变量；无 `$` 前缀时写人物卡文本/表达式属性。 |
| `seal.vars.intGet(ctx, name)` | `[number, ok]` | 读整数变量或人物卡数值。 |
| `seal.vars.strGet(ctx, name)` | `[string, ok]` | 读字符串变量、人物卡表达式属性；`$t玩家` / `$t玩家_RAW` 返回显示名。 |
| `seal.vars.computedGet / computedSet(ctx, name, value?)` | 同 `strGet/strSet` | **兼容近似**：目前等价于字符串读写，不执行完整 RollVM 计算。 |
| `seal.format(ctx, text)` / `seal.formatTmpl(ctx, text)` | string | `{$变量}` 求值，`{1d100}` 等骰式由真实掷骰引擎处理。 |
| `seal.favor.get(ctx, userId?)` | number / `null` | 读取内置好感度。 |
| `seal.favor.set(ctx, value, userId?)` | number / `null` | 覆写内置好感度并返回新值。 |
| `seal.favor.add(ctx, delta, userId?)` | number / `null` | 增减内置好感度并返回新值。 |
| `seal.favor.grow(ctx, userId?)` | `{success, delta, value}` / `null` | 按内置好感度成长规则判定并写回。 |
| `seal.deck.draw(ctx, name, shuffle?)` | `{exists, err, result}` | 抽公共牌堆；shuffle 参数当前保留兼容。 |
| `seal.deck.reload()` | `0` | **兼容占位**，牌堆由管理面板或文件重载。 |
| `seal.gameSystem.newTemplate(jsonText)` / `newTemplateByYaml(yamlText)` | `{}` | 标记规则类插件，并登记属性模板供 `.st/.ra` 使用。 |
| `seal.coc.newRule()` / `newRuleCheckResult()` | `{}` | **兼容占位**，只返回空对象。 |
| `seal.coc.registerRule(rule)` | `0` | 标记规则类插件；不会接管内置 `.ra` 判定内核。 |

### 名单、工具与标准全局

| API | 参数 / 返回值 | 说明 |
| --- | --- | --- |
| `seal.ban.addBan(ctx, id, place?, reason?)` | — | 加入黑名单；place 当前仅兼容参数。 |
| `seal.ban.addTrust(ctx, id, place?, reason?)` | — | 加入信任/白名单。 |
| `seal.ban.remove(ctx, id)` | — | 移出名单。 |
| `seal.ban.getList()` | array | 返回全部名单记录。 |
| `seal.ban.getUser(id)` | object 或 `null` | 返回单条名单记录。 |
| `seal.getVersion()` | object | 返回 `version`、`versionSimple`、`versionCode`、`versionDetail`。 |
| `seal.getEndPoints()` | `[]` | **兼容占位**，当前不会列出端点。 |
| `setTimeout(fn, ms)` / `setInterval(fn, ms)` | timerId | 真定时器；间隔最小 200ms，最多 256 个活动计时器。 |
| `clearTimeout(id)` / `clearInterval(id)` | — | 取消计时器。 |
| `fetch(url, options?)` | `Promise<Response>` | Response 含 `ok`、`status`、`statusText`、异步 `text()` / `json()`；底层请求仍会同步阻塞。 |
| `btoa(text)` / `atob(text)` | string | Base64 编解码；`atob` 接受 `data:*;base64,` 前缀。 |
| `console.log/info/warn/error(...values)` | — | 写入运行日志。 |

## 最小可运行示例：读取群名片与人物卡

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

## 当前限制一览

写插件前值得知道的边界（也是我们的改进路线）：

1. `onMessageEdit` 暂不可用；其他平台事件也只有在适配器上报对应 `BotEvent` 时才触发。
2. `msg.segment` 是适配器原生分段、并非跨平台统一结构；未上报时为空，也没有专用的发图 API（可发 `[CQ:image]` 码）。
3. 没有 `require`/`import` 与文件系统 API，插件必须单文件自包含。
4. 单线程串行执行，无超时与资源配额——请避免死循环与慢同步操作。
5. `registerTask` 只支持每日任务；`seal.coc` 自定义判定与 `seal.getEndPoints` 等仍为占位。
6. `fetch` 受外置 API 开关与白名单门控（这是刻意的安全设计，不是 bug）。
