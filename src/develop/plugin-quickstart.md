# 插件开发快速上手

本页带你在五分钟内写出、装上并跑通第一个 Dice!Next 插件。写完这页你就知道该选哪种扩展方式、去哪查完整 API。

## 先选对扩展方式

Dice!Next 有四种扩展方式，按「想做什么」选：

| 想做什么 | 用什么 | 要写代码吗 | 参考 |
| --- | --- | --- | --- |
| 关键词自动回复、条件触发、计数器 | 管理面板「高级回复」（因果规则） | 不用 | [高级回复](/manage/replies) |
| 抽卡、随机文本 | 牌堆 JSON | 不用 | [牌堆与随机](/use/deck) |
| 查询词条、规则速查 | 帮助文档 / 规则包 | 不用 | [帮助文档](/manage/help-docs)、[规则包编写](/develop/rulepack) |
| **自定义指令、逻辑、联网、定时任务** | **JS 插件（推荐）** | JavaScript | 本页 + [JS 插件 API](/develop/js-plugin-api) |
| 沿用原版 Dice! 的 mod / Lua 脚本 | Lua mod | Lua | [Lua mod 参考](/develop/lua-mod) |
| 打包一整套规则（属性、指令、帮助、脚本） | 规则包 bundle | 可选 | [规则包编写](/develop/rulepack) |

::: tip 一句话选型
写**逻辑**用 JS 插件；发**内容**用规则包或牌堆；迁移**老 mod** 用 Lua。规则包本质是个「容器」——它里面也可以装 JS 和 Lua。
:::

## 五分钟：第一个 JS 插件

Dice!Next 的 JS 插件兼容海豹（SealDice）的 `seal.ext` 模型，海豹插件通常可以直接使用，海豹的开发经验也基本通用。

### 1. 写代码

新建 `hello.js`：

```javascript
// ==UserScript==
// @name         打招呼
// @author       希亚
// @version      1.0.0
// @description  示例插件：.hello 会回复问候
// ==/UserScript==

const ext = seal.ext.new('hello', '希亚', '1.0.0');

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'hello';
cmd.help = '.hello // 骰娘向你问好';
cmd.solve = (ctx, msg, cmdArgs) => {
  seal.replyToSender(ctx, msg, `你好，${ctx.player.name}！今天也要好好跑团哦。`);
  return seal.ext.newCmdExecuteResult(true);
};

ext.cmdMap['hello'] = cmd;
seal.ext.register(ext);
```

头部的 `// @name` 等 UserScript 注释是插件元数据（管理面板会显示；同名插件按 `@version` 取最高版本）。

### 2. 装上

两种方式任选：

- **管理面板**（推荐）：「插件管理」→「上传插件」，选中 `hello.js`。
- **手动**：把文件放进 `data/plugins/js/`，然后在插件管理页点「重新加载」。

### 3. 跑通

打开管理面板侧边栏的「测试台」，输入 `.hello`——不用连 QQ 就能验证。在真实群里发 `.hello` 效果相同。

改完代码重新上传（或点「重新加载」）即可生效，不用重启。

## 常用能力速览

下面每段都是可以直接抄的完整片段，细节见 [JS 插件 API 参考](/develop/js-plugin-api)。

**读写持久化数据**（重启不丢，存放在 `data/plugins.db`）：

```javascript
ext.storageSet('count', String(Number(ext.storageGet('count') || '0') + 1));
```

**读写玩家人物卡**（与 `.st` 是同一份卡）：

```javascript
const [hp, ok] = seal.vars.intGet(ctx, 'hp');   // 无 $ 前缀 = 人物卡属性
seal.vars.intSet(ctx, 'hp', hp - 1);
const [note] = seal.vars.strGet(ctx, '$m备注');  // $m=个人 $g=群 $=全局 变量
```

**参数解析**：

```javascript
cmd.solve = (ctx, msg, cmdArgs) => {
  const who = cmdArgs.getArgN(1);            // 第 1 个参数
  const rest = cmdArgs.getRestArgsFrom(2);   // 第 2 个起的剩余文本
  const at = cmdArgs.at[0];                  // 消息里 @ 的人 {userId}
  // ...
};
```

**定时任务**（每天固定时刻执行）：

```javascript
seal.ext.registerTask(ext, 'daily', '08:30', () => {
  // 这里 replyToSender 需要你自己保存的 ctx/msg，或使用群号直发
}, 'morning', '早安提醒');
```

**联网**（需在管理面板「系统设置」开启外置 API 开关并配置白名单）：

```javascript
const resp = await fetch('https://api.example.com/data');
const data = await resp.json();
```

**给插件加 WebUI 配置项**（用户不用改代码就能调参数）：

```javascript
seal.ext.registerStringConfig(ext, '问候语', '今天也要好好跑团哦', '打招呼的后半句');
// solve 里读取：
const greeting = seal.ext.getStringConfig(ext, '问候语');
```

## 监听非指令消息

想让插件响应普通聊天（不带 `.` 前缀），实现 `ext.onNotCommandReceived`：

```javascript
ext.onNotCommandReceived = (ctx, msg) => {
  if (msg.message.includes('骰娘晚安')) {
    seal.replyToSender(ctx, msg, '晚安，好梦～');
  }
};
```

## 下一步

- 完整 API（`ctx`/`msg`/`cmdArgs` 每个字段、全部 `seal.*` 函数、当前限制清单）：[JS 插件 API 参考](/develop/js-plugin-api)
- 老 Dice! 的 mod 想直接用或二次开发：[Lua mod 参考](/develop/lua-mod)
- 想把属性模板、帮助、脚本打成一个包发布：[规则包编写指南](/develop/rulepack)
- 想通过 HTTP 操控骰娘（做外部工具）：[API 参考](/develop/api)
