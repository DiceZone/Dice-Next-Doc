# 插件管理

**管理面板 → 扩展管理 → 插件**，统一管理两类扩展，分两个选项卡：

- **JS 插件**：兼容海豹 SealDice 的 JavaScript 插件（`seal.*` API）。
- **Lua 模组**：兼容原版 Dice! 的 Lua mod（目录型 msg_reply 模块与单文件 msg_order 插件）。

## 上传与加载

点「上传插件」选择文件，按扩展名自动分流：

| 文件 | 去向 |
|------|------|
| `.js` | JS 插件 |
| `.lua` | Lua 单文件插件 |
| `.json` | Lua mod 描述档（纯查询类 mod，如技能/法术查询） |
| `.zip` | Lua mod 包——支持原版「`<名>.json` + 目录」成对包、一包多个 mod 的整库压缩包、仅含 `model/`/`rulebook/` 的规则类包 |

也可以直接把文件放进数据目录（Lua mod 放 `data/mod`，单文件插件放 `data/plugin`）再点「重新加载」——重载会同时刷新 JS 与 Lua 两侧，无需重启。停用与删除按钮会把 mod 的描述档与资源目录**成对**处理，不会留下残件。

::: tip 想自己写插件？
从[插件开发快速上手](/develop/plugin-quickstart)开始；完整 API 见 [JS 插件 API 参考](/develop/js-plugin-api)与 [Lua mod 参考](/develop/lua-mod)。
:::

## 插件卡片

每个插件显示名称、版本、作者、简介与注册的指令列表，右侧操作：

- **启停开关**：单个插件即时启用 / 禁用。
- **配置**：JS 插件注册过配置项时出现，弹窗按类型渲染表单（开关 / 下拉选项 / 多行模板 / 数字 / 文本），保存后立即生效。
- **查看详情**：版本、语言、许可、文件名、主页、完整简介、注册的指令；Lua 模组额外区分指令触发词类型（指令 / 关键词 / 含此词即触发）与帮助词条（用 `.help <词条>` 查询）；还可展开「存储的数据」查看插件持久化的键值，支持导出 JSON 与清空。
- **删除**：连文件一起从磁盘删除（有确认弹窗）。

特殊标记：

- **JS兼容规则**：以 `seal.gameSystem` / `coc.registerRule` 形式提供规则系统的 JS 插件，自动归入 `data/mod`，与原生 JSON 规则包区分。
- **旧版（已被顶替）**：同名插件上传新版后旧版自动置灰停用。

## 更新检测

声明了更新地址的 JS 插件可单个「检查更新」或页头「检查更新」批量检查；发现新版本后一键「更新」替换。

## 分群启停

插件默认全局生效，群内可用指令按群控制（仅群主 / 管理员）：

```
.plugin list            列出插件与本群状态
.plugin on|off <名称>   启停某插件
.plugin all on|off      批量启停
```

原版 Dice! 的 `.mod` 写法也接入同一套分群状态：

```
.mod / .mod list        列出插件与本群状态
.mod on|off <名称>      启停某插件
.mod <名称> on|off      原版参数顺序
.mod info <名称>        查看类型、ID 与本群状态
```

`.mod update/reload/del/reinstall` 只会提示转到 Web 管理面板，避免聊天误操作替换或删除插件文件。`.mod` 不是第二套旧版加载器；它与 `.plugin` 共用当前插件清单和启停状态。

## 兼容性

Lua 侧兼容原版 Dice! mod 生态；JS 侧的兼容目标是 **SealDice（海豹）插件 API**，不是旧 Dice! 的 JS 体系（含 `seal.vars` 人物卡桥接、`commands.disable` 覆盖内置指令等）。海豹规则类插件还可以转换打包成规则包分发，实战示例见[海豹插件转规则包](/develop/rulepack-example-fu)与[规则包开发](/develop/rulepack)。

### 群名片与显示名

群聊中，入站消息携带的群名片会优先使用；没有群名片时才回退 QQ 昵称。私聊没有群名片。

| 字段 | 值 |
| --- | --- |
| `ctx.player.name` | 统一显示名：群名片优先，否则 QQ 昵称 |
| `ctx.player.card` / `msg.sender.card` | 当前群名片；未设置或私聊时为空字符串 |
| `msg.sender.nickname` | QQ 昵称（不受群名片影响） |

```js
cmd.solve = (ctx, msg) => {
  const displayName = ctx.player.name;
  const groupCard = ctx.player.card; // 需要严格读取群名片时使用
  seal.replyToSender(ctx, msg, `${displayName} / ${groupCard || '未设群名片'}`);
  return seal.ext.newCmdExecuteResult(true);
};
```

Lua 模组模板中，`{nick}` 是 QQ 昵称，`{card}` 是当前群名片（未设置时为空）。
