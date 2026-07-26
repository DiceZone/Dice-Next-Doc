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

## msg 对象

`echo` 函数与 `msg_order` 函数收到的 `msg`：

| 成员 | 说明 |
| --- | --- |
| `msg.uid` / `msg.gid` | 发送者 / 群（数字；私聊 gid 为 0） |
| `msg.nick` / `msg.card` | 昵称 / 群名片 |
| `msg.fromMsg` | 消息全文；`msg.suffix` 为前缀触发的剩余文本 |
| `msg:echo(text)` | 模板展开后主动发消息 |
| `msg:format(text)` | 只做模板展开 |
| `msg:get(key, def)` / `msg:inc(key, n)` | 读 / 自增本条消息的变量 |
| `msg.char` / `msg.pc` | 发送者人物卡（Actor 对象） |
| `msg.user` / `msg.grp` | 用户 / 群配置代理（读写即存档） |
| `msg.game` | 团务对象（`.game new` 开团后可用，`msg.game:message(text)` 群发） |
| `msg.at` | `[CQ:at,qq=发送者]` 文本 |

## 全局函数参考

**基础**

| 函数 | 说明 |
| --- | --- |
| `log(...)` | 写运行日志 |
| `ranint(a, b)` | [a,b] 随机整数 |
| `getDiceDir()` | 数据目录绝对路径（`data`） |
| `getDiceQQ()` | 骰娘账号 |
| `mkDirs(path)` | 建目录 |
| `sleepTime(ms)` | **空操作**（原版会阻塞；这里为防卡消息线程刻意不等待） |

**配置存取**（持久化在 `data/lua_mod.db`）

| 函数 | 说明 |
| --- | --- |
| `getUserConf(uid, key, default)` / `setUserConf(uid, key, val)` | 用户级；`uid` 传 `nil` 返回所有用户的 `{uid→值}` 表（做排行）；`val=nil` 删除 |
| `getGroupConf(gid, key, default)` / `setGroupConf(gid, key, val)` | 群级 |
| `getUserToday(uid, key, default)` / `setUserToday(uid, key, val)` | 今日数据（按天隔离，未命中返回 0） |

键以 `&` 开头会先经 speech 词条解析成实际字段名（原版惯用法）。

**人物卡**（与 `.st` 是同一份卡）

| 函数 | 说明 |
| --- | --- |
| `getPlayerCard(uid, scope)` | 返回 Actor 对象：`pc.hp` 直接读写、`pc:set{...}` 批量、`pc:rollDice(exp)`、`pc:lock('w'/'r')` / `pc:unlock` |
| `getPlayerCardAttr(uid, scope, attr, default)` | 读属性；`scope` 传卡名字符串则按卡名 |
| `setPlayerCardAttr(uid, scope, attr, val)` | 写属性 |
| `lockPlayerCard / unlockPlayerCard / isPlayerCardLocked` | 卡片锁定（`w` 锁写 `.st`，`r` 锁读 `.st show`） |

**动作**

| 函数 | 说明 |
| --- | --- |
| `sendMsg(text, gid, uid)` | 主动发消息（gid 空 = 私聊） |
| `eventMsg(text, gid, uid)` | 把文本当作某人发的消息跑完整指令管线（如 `eventMsg('.rd100', msg.gid, msg.uid)`） |
| `drawDeck(gid, uid, 牌堆名)` | 抽公共牌堆 |
| `loadLua(名字)` | 执行 `script/<名字>.lua`（支持 `a.b` 点分路径） |
| `askExtra(table)` | 平台扩展查询（透传到适配器，如 OneBot 动作） |

**内置库**

| 库 | 说明 |
| --- | --- |
| `http.get(url)` → `ok, body`；`http.post(url, body, headers)` | 受「外置 API 开关 + 白名单」门控；`http.urlEncode/urlDecode` |
| `json.encode/decode`、`yaml.parse/dump` | 也可 `require("json")` / `require("yaml")` |
| `Set`、`getSelfData(名)`、`Actor`、`GameTable` | 原版对象层：SelfData 落盘 `data/self_data/<名>.json`；GameTable 对接 `.game` 团务 |

`package.path` 已包含 mod 目录与 `data/plugin`，跨插件 `require` 可用（如社区常见的 `lua_useful_extensions`）。

## 模板词条（speech）

回复文本中 `{key}` 按此顺序解析：消息变量 → speech 词条（各 mod 的 `speech/*.yaml` 与描述档 `speech{}` 合并；值以 `&` 开头为别名）→ 内置 `{self}`（骰娘自称）。支持递归展开。

## 与原版的兼容性说明

原版 `DiceLua.cpp` 注册的 21 个全局函数已全部覆盖且签名对齐（含 `getUserConf(nil, field)` 枚举、`&key` 兜底、`drawDeck` 三参等细节），`Set/Context/SelfData/Actor/GameTable/http` 六个库语义可用。以下原版能力**目前尚未支持**，含这些写法的 mod 对应部分会不生效：

| 未支持项 | 说明 |
| --- | --- |
| `reply/*.toml` | TOML 形态的回复规则不加载（只认 `.lua`） |
| `event` 事件表 / `event/` 目录内容 | 定时/事件触发体系未接 |
| `task_call` 定时任务表 | 单文件插件的定时注册未接 |
| `echo = "文本"` / `echo = {数组}` | 纯文本与牌堆抽取形态的 echo 会被跳过，**只认函数与 `{lua=}`** |
| `keyword.regex` | 正则匹配模式未接（match/prefix/search 可用） |
| `limit.prob` / `limit.today` / `limit.user_id` | 概率、每日限次、用户名单门槛未接 |
| `require` 二进制 C 扩展（`.dll`） | 未设置 `package.cpath` |
| `require("Set")` 写法 | 对象层是全局变量，未注册进 `package.loaded`（直接用全局 `Set` 即可） |

迁移遇到问题欢迎带上 mod 文件反馈。
