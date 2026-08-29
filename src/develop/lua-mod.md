# Lua mod 参考

Dice!Next 完整兼容原版 Dice! 的 Lua mod 体系：原版的 mod 包与单文件 Lua 插件可以直接上传使用，也可以按本页参考继续开发新 mod。DiceFavor（好感度）、PC_Inventory（背包）等社区 mod 已实测可用。

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
| `helpdoc` | 词条表，接入 `.help` 查询；值以 `&` 开头表示「指向另一词条的别名」 |
| `speech` | 模板词条（`{key}` 展开用）；值为数组时取第一项 |

解析容忍尾逗号与注释（真实社区 mod 常见）。

## 资源目录语义

| 子目录 | 内容 | 说明 |
| --- | --- | --- |
| `reply/*.lua` | `msg_reply` 因果规则 | 关键词触发的回复逻辑（见下） |
| `script/*.lua` | 函数脚本 | 供 `loadLua()` 与 `echo={lua=...}` 调用 |
| `speech/*.yaml` | 模板词条 | 平铺 `key: 文本`，合并进全局模板 |
| `model/*.xml` | 属性模板 | COC7.xml 等；含此目录的 mod 视为「规则类」，在规则管理页展示 |
| `rulebook/*.yaml` | 规则手册 | `{rule, manual: {术语: 解释}}`，manual 并入 `.help` 词条 |
| `event/` | 事件 | 仅作为 mod 识别信号，**内容目前不加载**（见文末兼容性说明） |

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
| `limit.cd` | 冷却秒数；`{user=10, grp=30}` 可分设 |
| `limit.user_var.trust.at_least` | 信任等级门槛 |
| `limit.grp_id` | 写成表即「仅群聊」 |
| `echo` | **函数**（返回值作为回复模板）或 `{lua = "脚本名"}`（执行 `script/<脚本名>.lua`） |

规则必须有 `echo` 且至少一种 `keyword` 才会被收录。回复文本会再做一次模板展开——`echo` 里写进 `msg` 表的字段（如 `msg.favor = 5`）可在回复里用 `{favor}` 引用。

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
| `log(...)` | 写运行日志 |
| `ranint(a?, b?)` | 闭区间随机整数；默认 `ranint()` 为 1–100，a>b 时自动交换 |
| `getDiceDir()` | 数据目录绝对路径（`data`） |
| `getDiceQQ()` | 骰娘账号 |
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
| `drawDeck(gid, uid, 牌堆名)` | 抽公共牌堆 |
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
| `drawDeck(gid, uid, deckName)` | 字符串 | 原版三参数签名；也兼容 `drawDeck(deckName)`。当前抽取公共牌堆。 |
| `askExtra({action=..., params=...})` | 表 / 字符串 / `nil` | 透传原生平台动作。当前只有 OneBot 适配器可响应；QQ 官方、Discord、KOOK 返回 `nil`。 |
| `getDiceQQ()` / `getDiceDir()` | 字符串 | 骰娘自身账号 / `data` 目录绝对路径。 |
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

## 与原版的兼容性说明

原版 `DiceLua.cpp` 注册的全局函数已覆盖且签名对齐（含 `getUserConf(nil, field)` 枚举、`&key` 兜底、`drawDeck` 三参等细节），`Set/Context/SelfData/Actor/GameTable/http` 六个库语义可用；单文件插件的 `task_call` 与消息内 `sleepTime` 也已接入。以下原版能力**目前尚未支持**，含这些写法的 mod 对应部分会不生效：

| 未支持项 | 说明 |
| --- | --- |
| `reply/*.toml` | TOML 形态的回复规则不加载（只认 `.lua`） |
| `event` 事件表 / `event/` 目录内容 | 定时/事件触发体系未接 |
| `echo = "文本"` / `echo = {数组}` | 纯文本与牌堆抽取形态的 echo 会被跳过，**只认函数与 `{lua=}`** |
| `keyword.regex` | 正则匹配模式未接（match/prefix/search 可用） |
| `limit.prob` / `limit.today` / `limit.user_id` | 概率、每日限次、用户名单门槛未接 |
| `require` 二进制 C 扩展（`.dll`） | 未设置 `package.cpath` |
| `require("Set")` 写法 | 对象层是全局变量，未注册进 `package.loaded`（直接用全局 `Set` 即可） |

迁移遇到问题欢迎带上 mod 文件反馈。
