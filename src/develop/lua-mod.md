# Lua mod 参考

Dice!Next 持续兼容原版 Dice! 的 Lua mod 与单文件插件。2026-10-15 的本地实现扩展了 TOML、条件、事件、嵌套模组和安全数值模板；尚未随本轮安装包发布。已有部分社区语料验证，但不能由此推断任意旧 mod 完整可用；移植前请核对文末边界与所用版本。

::: tip 新插件建议用 JS
Lua 体系的定位是**承接原版生态**。从零写新插件建议用 [JS 插件](/develop/plugin-quickstart)——API 更现代，配置项、存储管理等与面板的集成也更完整。
:::

## mod 的三种形态

| 形态 | 位置 | 说明 |
| --- | --- | --- |
| 描述档 + 目录（原版标准形态） | `data/mod/<名>.json` + `data/mod/<名>/` | 成对出现；`<名>.json` 是登记档（元数据 + helpdoc + speech），目录放资源 |
| 纯描述档 | `data/mod/<名>.json` | 查询类 mod（COC 技能查询这类纯 helpdoc 包）只有一个 json |
| 单文件插件 | `data/plugin/<名>.lua` | `msg_order` 前缀指令插件 |

**上传**：管理面板「插件管理」→「上传插件」，支持 `.lua`、`.json`、`.zip`。zip 会自动解压归位——json+目录成对包、一包多 mod 的整库压缩包、只含 `model/`/`rulebook/` 的规则类包都能识别。**停用/删除**由面板管理：停用是改名加 `.disabled` 后缀（json 与目录会成对处理），删除会把描述档和目录一起清掉。

## 描述档（`<名>.json` / `descriptor.json`）

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

| 字段 | 说明 |
| --- | --- |
| `mod` 或 `title` | 显示名 |
| `author` / `ver`（或 `version`）/ `brief` | 元数据 |
| `helpdoc` | 词条表，主题忽略 ASCII 大小写；接入 `.help` 查询，`&主题` 可跨 Mod 多级转向 |
| `speech` | 模板词条（`{key}` 展开用）；文本或均匀随机文本数组，键忽略 ASCII 大小写 |

解析容忍尾逗号与注释（真实社区 mod 常见）。

## 资源目录语义

| 子目录 | 内容 | 说明 |
| --- | --- | --- |
| `reply/*.lua` / `reply/*.toml` | `msg_reply` / TOML 回复规则 | 关键词触发的回复逻辑（见下）；TOML 支持多行、引号键、内联表等语法，但动作仍受安全边界限制 |
| `script/*.lua` | 函数脚本 | 供 `loadLua()` 与 `echo={lua=...}` 调用 |
| `speech/*.yaml` | 模板词条 | 平铺文本或文本数组，合并进全局模板，键忽略 ASCII 大小写 |
| `model/*.xml` | 属性模板 | COC7.xml 等；含此目录的 mod 视为「规则类」，在规则管理页展示 |
| `rulebook/*.yaml` | 规则手册 | 当前规则优先、父规则继承、主题查询与受控 tape |
| `event/*.lua` | 定时 / 事件声明 | cycle、服务器时区 clock 及安全生命周期 / 消息钩子 |

资源可以分层放置。嵌套模组使用 `父.子` 管理 ID，父级停用时子级也不会执行；同名目录与单文件插件使用独立 ID，防止管理操作指向错误文件。加载保留 `mod_order.json` 顺序，脚本按命名空间登记、后加载覆盖；仅登记资源，不把资源目录里的 Lua 全部自动执行。符号链接、Windows 联接和路径穿越不允许。

脚本名忽略 ASCII 大小写，例如 `loadLua('Tools.Ping')` 与 `loadLua('tools.ping')` 查同一个全局脚本，后加载的 Mod 优先。`script/Tools/init.lua` 可用 `loadLua('Tools')` 调用，也保留 Next 的显式 `Tools.init` 写法；不会因此允许绝对路径或 `..`。

## msg_reply 因果规则（reply/*.lua）

每个文件在干净的全局 `msg_reply` 表里执行，之后枚举其中的规则：

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

| 字段 | 说明 |
| --- | --- |
| `keyword.match` | 精确等于才触发（字符串或数组；先做 `{模板}` 展开，所以 `{自称}好感` 可用） |
| `keyword.prefix` | 前缀命中，剩余文本放进 `msg.suffix` |
| `keyword.search` | 包含即命中 |
| `keyword.regex` | 有执行时限的 ECMAScript `i` 整条匹配，保留旧版 400 字节输入上限；非 `u` 模式按 UTF-16 单元计数 |
| `limit.cd` | 冷却秒数；`{user=10, grp=30}` 可分设 |
| `limit.user_var.trust.at_least` | 信任等级门槛 |
| `limit.grp_id` / `limit.user_id` | ID / ID 列表；`{nor={...}}` 排除指定 ID；群 ID `0` 表示私聊，空列表不限制 |
| `limit.prob` | 百分比触发概率；0 沿用旧版“不额外限制”语义 |
| `limit.today` | 每日限次，服务器时区换日；支持共享名称与 user / chat / global 范围 |
| `limit.lock` | 有界、非阻塞同步锁；支持共享名称及范围，Lua 暂停期间仍持锁 |
| `limit.self_var` / `limit.user_var` / `limit.grp_var` | 骰娘自身、用户、群变量的真值或比较条件 |
| `limit.dicemaid` | ignore / only / off，由宿主的骰娘名单判断，不相信消息伪造的身份 |
| `echo` | 函数、静态文本、文本候选数组或 `{lua="脚本名 / 内联 Lua"}`；不执行旧 JS / Python |

规则必须有 `echo` 且至少一种 `keyword` 才会被收录。回复文本会再做一次模板展开——`echo` 里写进 `msg` 表的字段（如 `msg.favor = 5`）可在回复里用 `{favor}` 引用。

### TOML、条件与优先级

`reply/*.toml` 通过 toml++ 解析，支持多行字符串、引号键、复杂表、内联表与数组。回复支持 Match / Prefix / Search / Regex、`rule` / `type="Game"`、静态文本、Lua 与文本候选；候选可用 `::权重::`，并继续嵌套 `{sample:甲|乙}`。空回复、仅副作用和暂停等待也算已处理，不会再触发 AI 等兜底回复。

条件支持真值、equal、neq、at_least、at_most、more、less，以及上表的名单 / 概率 / 计数 / 锁。多个比较条件须全部满足。标量冷却按聊天窗口计算，共享计数可显式指定范围与名称。兼容表声明与旧式 `limit="prob:50;grp_id:!0;cd:10"` 文本。未知或无效的条件会记录诊断并跳过整条规则，不会变成无条件允许。

目录模组按“活动团规则 → Match → 最长 Prefix → Search → Regex”选择；同级目录按加载顺序覆盖。关键词的 ASCII 大小写兼容旧版；单文件插件仍保留原有匹配习惯。一次消息选一条回复，不复制旧版多个 Regex 同时连续发言的行为。

### 定时与安全事件

`event/*.lua` 的 `trigger.cycle` 支持 1 秒至 7 天，单位为 second / minute / hour / day；所有模组加载后立即执行一次并重排。`trigger.clock` 支持 `{hour=4, minute=0}` 或这类表的列表，使用服务器时区，不补跑错过的日期。

可用 hook：`StartUp`、`DayEnd`、`DayNew`、`Message`、`FriendRequest`、`FriendAdd`、`GroupRequest`、`GroupAdd`、`GroupWelcome`、`GroupDecrease`、`GroupRecall`、`GroupUpload`、`Poke`、`LogEnd`。具体通知仍取决于适配器是否提供该入站事件。`StartUp` 仅在宿主启动时触发，重载不触发；日界事件按服务器日期变化执行。

请求钩子可拒绝但不能越过宿主策略批准；钩子失败会留下待处理请求。消息与 tape 遵守黑名单、禁用、内容拦截及分群插件开关，凭据 / 恢复管理指令不会被吞掉。`LogEnd` 只提供受控日志路径和默认上传控制，不恢复任意文件发布。授权、审查和云黑名单策略覆盖钩子不执行。

`LogEnd` 在 `.log end` 或 `.game over` 完成日志关闭与结算后调用。可读取 `log_file`（实际导出文件名）、`log_path`（绝对路径）、`log_id`、`log_name`、`log_count`，以及 uid / gid / fromUser / fromQQ / fromGroup / platform / adapterId / selfId / msgid / time；文件名不是用户可输入的显示标题，默认导出不发布本地图片。团务结束钩子运行时原团务已清理，不保留可修改的旧 Session 对象。

cycle、clock、启动 / 日界动作可以用 `sleepTime` 暂停续跑；需要即时处理结果的消息、审批、通知及 tape 钩子同步执行，不能靠 `sleepTime` 延迟宿主决策。不可挂起的调用中它立即返回，不阻塞消息线程。

事件动作可用 Lua 函数、脚本名或内联 Lua；不支持的混合动作 / 触发条件会整体报告，不能只执行支持的一半。回调与锁队列有数量上限，重载 / 销毁会取消旧任务。触发平台和帐号在延时后保留，原帐号离线时不会改用另一个帐号发送。

目录文件 / 内联文本脚本的临时全局变量按每次执行隔离，延时续跑保留当次环境；`loadLua` 的子脚本与入口共享当次变量。`eventMsg` 嵌套触发其他指令后会恢复外层消息，外层回复不借用内层昵称、用户 ID 或变量。需要跨消息保存的数据请用配置或人物卡 API，不依赖上次脚本遗留的全局变量。已登记的 Lua 函数保留 Next 原有闭包能力；这不是为任意代码创建完整独立 LuaState 或安全沙箱。

### XML 模型与规则书

XML 支持属性别名、CDATA、基本实体及只读数值公式，包括算术、比较、短路、三元、属性默认值和 floor / ceil / round / min / max 等白名单函数。例如 `Math.floor(this.力量/2)` 可转换，但脚本块、赋值、动态调用和任意 JavaScript 不会执行。无法转换的属性会显示兼容性诊断；模组顺序、启停与重载会同步刷新模板，原生规则包的优先级不变。

规则书支持当前规则优先、父规则继承和命名主题查询；tape 只在活动团务、参与者及分群开关允许时执行。

## msg_order 单文件插件（data/plugin/*.lua）

```lua
msg_order['选择'] = 'choose'

function choose(msg)
  local opts = {}
  for w in msg.suffix:gmatch('[^%s]+') do opts[#opts+1] = w end
  return '就决定是：' .. opts[ranint(1, #opts)]
end
```

`msg_order[触发词] = "全局函数名"`；触发词按长度降序匹配（长词优先）。函数收到 `msg` 表，返回值第一项作为回复。

插件里调用 `sleepTime(ms)` 时，Dice!Next 会暂停当前 Lua 处理并交还消息线程，时间到后从原位置继续执行；因此旧插件的分段延时回复不会再阻塞收消息。插件重载会取消尚未恢复的旧协程，避免执行已卸载代码。

旧单文件插件可继续通过 io.open 读取入口脚本同级资源。若插件附带的生成缓存仍保存作者电脑上的旧绝对路径，Dice!Next 会在首次打开失败后，仅把无路径穿越的 plugin/… 尾部重映射到当前 data/plugin 目录；文件审计日志也会自动整理 UTF-8 / CP936 混合路径，非法编码不会再令宿主进程退出。

### task_call 定时入口

旧式单文件插件可登记由骰主定时触发的全局函数：

```lua
task_call = task_call or {}
task_call['dailynews'] = 'sendDailyNews'

function sendDailyNews()
  -- 获取新闻、整理内容并主动 sendMsg(...)
end
```

登记后由骰主在聊天中管理每日执行时间：

```text
.admin clock + dailynews 07:30
.admin clock list
.admin clock - dailynews
```

任务会复用系统定时器持久化并显示在管理面板的「定时任务」列表中；可以停用、立即运行或删除。时间兼容旧插件文档常见的 `7:30` 和标准 `07:30`，保存时统一为两位小时。`task_call` 任务没有固定群 / 用户目标，应由插件函数自行通过 `sendMsg` 决定发送位置。

原版无空格写法 `.admin clock+dailynews=7:30` 同样兼容。若要在当前群 / 私聊定时调用普通插件指令，可使用 `.admin clock + 本群早报 07:30 .dailynews`；这会建立带当前帐号和窗口作用域的标准「执行插件指令」任务，并可在 WebUI 中完整编辑。

DailyNews 一类插件使用的 `eventMsg(".admin notice group/QQ … +8")` 与 `eventMsg(".send notice 8 …")` 会映射到 Dice!Next 的统一通知窗口；这条内部桥只识别上述两类旧通知命令，不会授予 Lua `eventMsg` 其他骰主管理权限。

## msg 对象

`echo` 函数与 `msg_order` 函数收到的 `msg`：

| 成员 | 说明 |
| --- | --- |
| `msg.uid` / `msg.gid` | 发送者 / 群 ID；QQ 通常为数字，其他平台可能是字符串；私聊 gid 为 0 |
| `msg.platform` | 当前消息平台（如 `onebot_v11`、`qq_official`、`discord`、`kook`） |
| `msg.nick` | 发送者的 QQ 昵称（群名片不覆盖它） |
| `msg.card` | **当前群名片**；未设置或私聊时为 `""` |
| `msg.fromMsg` | 消息全文；`msg.suffix` 为前缀触发的剩余文本 |
| `msg:echo(text)` | 模板展开后主动发消息 |
| `msg:format(text)` | 只做模板展开 |
| `msg:get(key, def)` / `msg:inc(key, n)` | 读 / 自增本条消息的变量 |
| `msg.char` / `msg.pc` | 发送者人物卡（Actor 对象） |
| `msg.user` / `msg.grp` | 用户 / 群配置代理（读写即存档） |
| `msg.game` | 团务对象（`.game new` 开团后可用，`msg.game:message(text)` 群发） |
| `msg.at` | `[CQ:at,qq=发送者]` 文本 |

```lua
-- 当前消息发送者的群名片；没有时回退 QQ 昵称
local displayName = msg.card ~= '' and msg.card or msg.nick

-- 当前群绑定人物卡上的属性。第五个参数 false 可强制把 gid 当群作用域，
-- 对 Discord、KOOK、QQ 官方机器人等非数字群 ID 必须带上。
local skill = getPlayerCardAttr(msg.uid, msg.gid, '侦查', -1, false)
```

## 全局函数参考

**基础**

| 函数 | 说明 |
| --- | --- |
| `log(...)` / `print(...)` | 按 INFO 写入 `[插件]` 日志，标明当前插件来源；旧用法保持兼容 |
| `logTrace/logDebug/logInfo/logSuccess/logWarn/logError(...)` | 按指定级别写运行日志；默认 INFO 隐藏 TRACE/DEBUG，延时和定时入口保留来源 |
| `ranint(a?, b?)` | 闭区间随机整数；默认 `ranint()` 为 1–100，a>b 时自动交换 |
| `getDiceDir()` | 数据目录绝对路径（`data`） |
| `getDiceQQ()` | 当前触发帐号；延时 / 事件续跑保留帐号。已知帐号身份缺失时为空，不借用另一帐号；仅无帐号上下文时用全局配置 |
| `mkDirs(path)` | 建目录 |
| `sleepTime(ms)` | 在 `msg_order` 消息处理中非阻塞等待；协程到时恢复，不占住消息线程 |

**配置存取**（持久化在 `data/lua_mod.db`）

| 函数 | 说明 |
| --- | --- |
| `getUserConf(uid, key, default)` / `setUserConf(uid, key, val)` | 用户级；`uid` 传 `nil` 返回所有用户的 `{uid→值}` 表（做排行）；`val=nil` 删除 |
| `getGroupConf(gid, key, default)` / `setGroupConf(gid, key, val)` | 群级 |
| `getUserToday(uid, key, default)` / `setUserToday(uid, key, val)` | 今日数据（按天隔离，未命中返回 0） |

键以 `&` 开头会先经 speech 词条解析成实际字段名（原版惯用法）。

**好感度**（与内置 `.favor` 是同一份数据）

| 函数 | 说明 |
| --- | --- |
| `getFavor(uid, platform?)` | 读取好感度；尚无记录时返回 `0`。消息处理期间可省略 platform。 |
| `setFavor(uid, value, platform?)` | 覆写好感度并返回写入后的值。 |
| `addFavor(uid, delta, platform?)` | 增减好感度并返回变更后的值。 |
| `growFavor(uid, platform?)` | 按内置概率规则成长，返回 `success, delta, value`；未成长时 delta 为 `0`。 |

```lua
local before = getFavor(msg.uid)
local after = addFavor(msg.uid, 5)
local success, delta, value = growFavor(msg.uid)
```

`msg_order`、`reply echo` 及其 `loadLua()` 调用链会自动继承 `msg.platform`。若在插件加载阶段或其他脱离消息的代码中调用，必须显式传入 platform；平台或 uid 缺失时返回 `nil`（`growFavor` 返回 `false, 0, 0`），且不会写入数据。

**人物卡**（与 `.st` 是同一份卡）

| 函数 | 说明 |
| --- | --- |
| `getPlayerCard(uid, scope)` | 返回 Actor 对象：`pc.hp` 直接读写、`pc:set{...}` 批量、`pc:rollDice(exp)`、`pc:lock('w'/'r')` / `pc:unlock` |
| `getPlayerCardAttr(uid, scope, attr, default?, byName?)` | 读属性；缺失时返回 default（未给则 `nil`）。`scope` 为数字/`nil` 时是群作用域，为字符串时默认视为卡名；`byName=false` 可强制按群读取，适合非数字群 ID |
| `setPlayerCardAttr(uid, scope, attr, val, byName?)` | 写属性；val 为 `nil` 时删除属性 |
| `lockPlayerCard(uid, scope, key, byName?)` / `unlockPlayerCard(...)` | 锁定/解锁卡片属性；`key='w'` 锁 `.st` 写入，`key='r'` 锁 `.st show` 读取 |
| `isPlayerCardLocked(uid, scope, key, byName?)` | 返回布尔值 |

**动作**

| 函数 | 说明 |
| --- | --- |
| `sendMsg(text, gid, uid)` | 主动发消息（gid 空 = 私聊） |
| `eventMsg(text, gid, uid)` | 把文本当作某人发的消息跑完整指令管线（如 `eventMsg('.rd100', msg.gid, msg.uid)`） |
| `drawDeck(gid, uid, 牌堆名)` | 优先抽当前群 Session 私有牌堆（不放回），无同名私有牌堆时才抽公共牌堆 |
| `loadLua(名字)` | 目录型 mod 优先执行 `script/<名字>.lua`；旧式单文件插件也支持入口脚本同级子目录（支持 `a.b` 点分路径） |
| `askExtra(table)` | 平台扩展查询（透传到适配器，如 OneBot 动作） |

OneBot v11 下，`sendMsg` 发送的文本或事件钩子直接返回的文本可以包含 CQ 音乐码；Dice!Next 会将其转换为音乐卡片消息段，而不是显示 CQ 码原文。支持平台曲目和自定义音乐卡片，例如：

```lua
sendMsg('[CQ:music,type=qq,id=歌曲ID]', msg.gid, msg.uid)
sendMsg('[CQ:music,type=custom,url=跳转链接,audio=音频链接,title=标题,content=简介,image=封面链接]', msg.gid, msg.uid)
```

**内置库**

| 库 | 说明 |
| --- | --- |
| `http.get(url)` → `ok, body`；`http.post(url, body, headers)` | 默认允许公网 HTTP(S)，始终拦截内网 / 环回 / 危险 URL；严格模式再要求外置 API 开关与白名单；`http.urlEncode/urlDecode` |
| `json.encode/decode`、`yaml.parse/dump` | 也可 `require("json")` / `require("yaml")` |
| `Set`、`getSelfData(名)`、`Actor`、`GameTable` | 原版对象层：SelfData 落盘 `data/self_data/<名>.json`；GameTable 对接 `.game` 团务 |

`package.path` 已包含 mod 目录与 `data/plugin`，跨插件 `require` 可用（如社区常见的 `lua_useful_extensions`）。

Windows 下会在加载旧单文件插件时自动识别并转换 GBK / CP936 源码；插件传给 `sendMsg`、`eventMsg`、JSON 编码器或适配器的文本也会统一整理为有效 UTF-8。无法恢复的非法字节以替代字符显示，不再让 JSON 序列化异常穿透并导致进程退出。

## 完整 Lua API 签名与对象方法

本节列出当前运行时直接注册的全部 Lua 插件 API。参数名中的 `?` 表示可选；除特别说明外，写入函数没有返回值。

### 数据、消息与平台

| API | 参数与返回值 | 说明 |
| --- | --- | --- |
| `getUserConf(uid, key, default?)` | 值 / `default` / `nil` | 用户持久化配置。uid 为 `nil` 时返回 `{[uid]=value}` 表，可用于排行。 |
| `setUserConf(uid, key, value)` | — | value 为 `nil` 时删除。 |
| `getGroupConf(gid, key, default?)` / `setGroupConf(gid, key, value)` | 值 / — | 群持久化配置；value 为 `nil` 时删除。 |
| `getUserToday(uid, key, default?)` / `setUserToday(uid, key, value)` | 值 / — | 按当前日期隔离；未命中默认返回 0。 |
| `getFavor(uid, platform?)` | number / `nil` | 读取内置好感度；消息调用栈中自动继承当前平台。 |
| `setFavor(uid, value, platform?)` | number / `nil` | 覆写内置好感度并返回新值。 |
| `addFavor(uid, delta, platform?)` | number / `nil` | 增减内置好感度并返回新值。 |
| `growFavor(uid, platform?)` | `success, delta, value` | 按内置好感度成长规则判定并写回。 |
| `sendMsg(text, gid?, uid?)` | — | gid 非空时向群发；gid 为空时向 uid 私聊。 |
| `eventMsg(text, gid?, uid?)` | — | 将文本作为该用户发出的消息重新进入完整指令/回复管线。也可传 `{fromMsg=, gid=, uid=}`。 |
| `drawDeck(gid, uid, deckName)` | 字符串 | 三参优先使用当前群 Session 的私有牌堆，抽空不回退同名公共牌堆；一参 `drawDeck(deckName)` 仍抽公共牌堆。gid / uid 为 0 按未指定处理。 |
| `askExtra({action=..., params=...})` | 表 / 字符串 / `nil` | 透传原生平台动作。当前只有 OneBot 适配器可响应；QQ 官方、Discord、KOOK 返回 `nil`。 |
| `getDiceQQ()` / `getDiceDir()` | 字符串 | 当前触发帐号的自身 ID / `data` 目录绝对路径；帐号无法确定时不借用其他帐号。 |
| `mkDirs(path)` | boolean | 创建目录。 |
| `loadLua(name)` | 脚本返回值 | 目录型 mod 优先执行 `script/<name>.lua`；旧式 `data/plugin/*.lua` 也会回退到入口同级路径，例如 `loadLua("求签/月老灵签")` 读取 `data/plugin/求签/月老灵签.lua`。`a.b` 仍映射为 `a/b.lua`。 |
| `sleepTime(ms)` | — | 在可挂起的消息处理调用链中非阻塞等待并从原位置恢复；其他调用环境保持立即返回。 |

`key` 以 `&` 开头时，会先解析当前 mod 的 speech 词条；这是旧版 mod 常见的字段别名写法。

### 人物卡与 Actor

```lua
-- 当前群绑定卡：QQ 数字群可用 getPlayerCard；跨平台请用 Actor 明确传 false。
local pc = Actor(msg.uid, msg.gid, false)
local hp = pc:get('hp') or 0
pc:set('hp', hp - 1)
pc.san = 60                 -- 字段赋值等价于 set

-- 按卡名读取（第二参是字符串卡名，或显式 byName=true）
local named = getPlayerCardAttr(msg.uid, '备用卡', 'hp', 0, true)
```

| Actor API | 参数与返回值 | 说明 |
| --- | --- | --- |
| `Actor(uid, scope, byName?)` | Actor | 建立人物卡代理；跨平台群 ID 请显式传 `false`，使 scope 按群处理。 |
| `getPlayerCard(uid, scope)` | Actor | 旧版兼容入口：数字 scope 按群处理，字符串 scope 按卡名处理。 |
| `pc:get(key)` / `pc[key]` | 值或 `nil` | 读数值、文本或关联属性原文。 |
| `pc:set(key, value)` / `pc:set({key=value,...})` / `pc[key]=value` | 单字段返回 1；批量返回写入数 | 写入真实人物卡；value 为 `nil` 删除。 |
| `pc:rollDice(exp?)` | `{expr,sum,expansion}` 或 `{expr,error}` | 使用人物卡 `__DefaultDiceExp` / `__DefaultDice`；未设置时为 `1D` / d100。 |
| `pc:lock(key)` / `pc:unlock(key)` / `pc:locked(key)` | boolean | 操作真实人物卡的字段锁。 |

### 内置对象与编码库

| API | 参数与返回值 | 说明 |
| --- | --- | --- |
| `getSelfData(name)` | SelfData 代理 | 自动持久化到 `data/self_data/<name>.json`；支持 `obj[key]`、`obj:get(key, default)`、`obj:set(key,value)`、`obj:__totable()`。 |
| `Set.new()` | Set 对象 | `:add(value)`、`:remove(value)`、`:in(value)`、`:totable()`；`#set` 返回元素数量。 |
| `GameTable(gid)` / `msg.game` | 团务表代理 | `obj[key]` 与 `obj:set(key,value)` 读写当前团共享数据，`:message(text)` 向当前群发消息。未开团时 `msg.game` 为 `nil`。 |
| `msg.user` / `msg.grp` | 用户/群配置代理 | `obj[key]` 读，`obj[key]=value` 写；`msg.user.nick/name/nn` 为昵称，`msg.user.trust` 为信任等级。 |
| `json.encode(value)` / `json.decode(text)` | string / Lua 值或 `nil` | 同时支持 `require('json')`。 |
| `yaml.parse(text)` / `yaml.dump(value)` | Lua 值或 `nil` / string | 同时支持 `require('yaml')`。 |
| `http.get(url)` | `ok, body` | HTTP GET；默认允许公网 HTTP(S)，始终拒绝非 HTTP(S)、内网 / 环回及危险 URL；严格模式下再要求外置 API 开关与白名单。 |
| `http.post(url, body, headers?)` | `ok, body` | body 为 table 时自动 JSON 编码；headers 可为 table 或字符串。 |
| `http.urlEncode(text)` / `http.urlDecode(text)` | string | URL 编解码。 |

> 严格模式沿用历史配置键 `dice/js_fetch_strict`，同时作用于 SealDice JS `fetch` 与旧 Dice! Lua `http`。关闭严格模式不会关闭 SSRF、协议和危险字符检查。

::: warning 内部 `__dnx_*` 函数
`__dnx_roll`、`__dnx_fmt`、`__dnx_conf`、`__dnx_sd_load`、`__dnx_sd_save` 是对象层的内部桥接函数。它们会随实现调整，插件应使用本页的 `Actor`、`msg:format`、`GameTable`、`getSelfData` 等公开 API。
:::

## 模板词条（speech）

回复文本中 `{key}` 按此顺序解析：消息变量 → speech 词条（各 mod 的 `speech/*.yaml` 与描述档 `speech{}` 合并；值以 `&` 开头为别名）→ 内置 `{self}`（骰娘自称）。支持递归展开。

speech 键忽略 ASCII 大小写，例如 `{reply_spells_list}` 可引用 `Reply_Spells_List`。消息变量先取同名精确项，再作 ASCII 不区分大小写的兼容查询，中文键不被改写。

YAML 和 JSON 描述档都支持文本数组，每次引用均匀随机抽取一条，再展开其中的变量 / sample；不是只显示第一条。空数组返回空文本，别名仍可指向数组：

```yaml
Roll_Reply:
  - "{nick}：{sample:干得漂亮|效果拔群}"
  - "轮到 {nick} 了！"
roll_alias: "&ROLL_REPLY"
```

这些改动属于 2026-10-16 的本地兼容收尾，是否进入所用安装包请核对实际源码版本。已对 ResourceSearchEngine、求签 / DailyNews、PC_Inventory 与 PC_Slots 做过副本验收；测试使用网络与发消息替身，不保证外部服务或真实帐号投递，插件自身源代码错误也不会由宿主偷偷改写。

### 帮助词条与引用

`helpdoc` 使用各活动 Mod 合并后的大小写不敏感命名空间，同名主题按加载顺序覆盖。帮助列表与 `{help:主题}` 一致，`&主题` 别名可跨 Mod、多级转向；循环别名不会卡住列表。普通 `.help` 保留 Next 原有内置 / JS 帮助优先级与搜索域过滤，仅渲染最终选中的 Mod 条目。

帮助内容中的引用按「消息变量 → Mod 帮助主题 → speech → 内置变量」解析，可包含 sample。例如：

```json
{"helpdoc":{"骰子用法":"{nick}，输入 .r d100 即可。","掷骰帮助":"&骰子用法","索引":"{掷骰帮助}"}}
```

`.help 索引` 和 Lua 回复中的 `{help:索引}` 都会带入当前昵称。普通回复的 `{主题}` 不会因此自动改成帮助查询；需要帮助时请显式写 `{help:主题}`。

模板展开最多 24 层、10,000 次变量 / 引用解析；单个结果最多 4 MiB，中间文本累计最多 32 MiB。超出大小或工作量限制返回空文本，不执行任意脚本。图片 URL / CQ 引用不会按图片文件体积计数，直接嵌入模板的 Base64 则属于文本。

## 与原版的兼容性说明

常见全局 API 与 `Set/Context/SelfData/Actor/GameTable/http` 对象层已接入，包含 `getUserConf(nil, field)` 枚举、`&key` 兜底、`drawDeck` 三参、单文件 `task_call` 与 `sleepTime`。`require('Set')`、`Actor`、`GameTable`、`SelfData` 可用公开别名。以下边界仍保留，不能承诺任意旧包无损复刻：

| 未支持项 | 说明 |
| --- | --- |
| 旧 JS / Python 动作与任意 XML 脚本 | 不执行；SealDice JS 引擎不等于旧 Dice! JS API，XML 仅转换安全数值公式 |
| 旧远程安装与安全策略覆盖 | 不恢复 `.mod get/update/reinstall` 下载器，不允许绕过禁用、黑名单、内容拦截与请求审批 |
| 多重回复 / 比较的历史行为 | 一次消息选一条回复；多个比较操作全部满足，不复制宽松的部分匹配或连续刷屏 |
| 外部 Lua 字节码 | 不加载，仅接受文本 Lua；资源发现与队列有深度 / 数量上限 |
| 二进制 C 扩展（`.dll`） | 沿用已有运行库搜索策略；需匹配平台与 Lua ABI，严格模式另限制搜索目录。本轮不新增原生库加载权限 |
| 旧宿主特有对象 | 私聊 / 频道旧团务仍不自动启用；`LogEnd` 补齐常用字段，但不保证完整旧日志 / Session 对象逐字段等价 |

迁移遇到问题欢迎带上 mod 文件反馈。

配置底层虽然使用字符串列，但 Lua 值通过类型编码区分文本、布尔、数字、空串与集合；未编码的历史值仍按兼容规则读取。正则引擎与原版 C++ locale / POSIX 扩展不保证等价，400 字节上限也不是执行时限的替代。完整实现状态、保留差异与测试范围见[主仓兼容记录](https://github.com/DiceZone/Dice-Next/blob/main/docs/legacy-mod-compatibility.md)。
