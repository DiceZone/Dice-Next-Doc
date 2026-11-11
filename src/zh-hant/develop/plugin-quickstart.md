<!-- 本页由 scripts/i18n-hant.mjs 根据简体中文版自动生成，请修改简体中文原文后重新生成。 -->

# 插件開發快速上手

本頁帶你在五分鐘內寫出、裝上並跑通第一個 Dice!Next 插件。寫完這頁你就知道該選哪種擴展方式、去哪查完整 API。

## 先選對擴展方式

Dice!Next 有四種擴展方式，按「想做什麼」選：

| 想做什麼 | 用什麼 | 要寫程式碼嗎 | 參考 |
| --- | --- | --- | --- |
| 關鍵詞自動回覆、條件觸發、計數器 | 管理面板「高階回覆」（因果規則） | 不用 | [高階回覆](/zh-hant/manage/replies) |
| 抽卡、隨機文本 | 牌堆 JSON | 不用 | [牌堆與隨機](/zh-hant/use/deck) |
| 查詢詞條、規則速查 | 幫助文件 / 規則包 | 不用 | [幫助文件](/zh-hant/manage/help-docs)、[規則包編寫](/zh-hant/develop/rulepack) |
| **自訂指令、邏輯、聯網、定時任務** | **JS 插件（推薦）** | JavaScript | 本頁 + [JS 插件 API](/zh-hant/develop/js-plugin-api) |
| 沿用原版 Dice! 的 mod / Lua 指令碼 | Lua mod | Lua | [Lua mod 參考](/zh-hant/develop/lua-mod) |
| 打包一整套規則（屬性、指令、幫助、指令碼） | 規則包 bundle | 可選 | [規則包編寫](/zh-hant/develop/rulepack) |

::: tip 一句話選型
寫**邏輯**用 JS 插件；發**內容**用規則包或牌堆；遷移**老 mod** 用 Lua。規則包本質是個「容器」——它裡面也可以裝 JS 和 Lua。
:::

## 五分鐘：第一個 JS 插件

Dice!Next 的 JS 插件相容海豹（SealDice）的 `seal.ext` 模型，海豹插件通常可以直接使用，海豹的開發經驗也基本通用。

### 1. 寫程式碼

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

頭部的 `// @name` 等 UserScript 註釋是插件後設資料（管理面板會顯示；同名插件按 `@version` 取最高版本）。

### 2. 裝上

兩種方式任選：

- **管理面板**（推薦）：「插件管理」→「上傳插件」，選中 `hello.js`。
- **手動**：把檔案放進 `data/plugins/js/`，然後在插件管理頁點「重新載入」。

### 3. 跑通

開啟管理面板側邊欄的「測試臺」，輸入 `.hello`——不用連 QQ 就能驗證。在真實群裡發 `.hello` 效果相同。

改完程式碼重新上傳（或點「重新載入」）即可生效，不用重啟。

## 常用能力速覽

下面每段都是可以直接抄的完整片段，細節見 [JS 插件 API 參考](/zh-hant/develop/js-plugin-api)。

**讀寫持久化資料**（重啟不丟，存放在 `data/plugins.db`）：

```javascript
ext.storageSet('count', String(Number(ext.storageGet('count') || '0') + 1));
```

**讀寫玩家人物卡**（與 `.st` 是同一份卡）：

```javascript
const [hp, ok] = seal.vars.intGet(ctx, 'hp');   // 无 $ 前缀 = 人物卡属性
seal.vars.intSet(ctx, 'hp', hp - 1);
const [note] = seal.vars.strGet(ctx, '$m备注');  // $m=个人 $g=群 $=全局 变量
```

**引數解析**：

```javascript
cmd.solve = (ctx, msg, cmdArgs) => {
  const who = cmdArgs.getArgN(1);            // 第 1 个参数
  const rest = cmdArgs.getRestArgsFrom(2);   // 第 2 个起的剩余文本
  const at = cmdArgs.at[0];                  // 消息里 @ 的人 {userId}
  // ...
};
```

**定時任務**（每天固定時刻執行）：

```javascript
seal.ext.registerTask(ext, 'daily', '08:30', () => {
  // 这里 replyToSender 需要你自己保存的 ctx/msg，或使用群号直发
}, 'morning', '早安提醒');
```

**聯網**（需在管理面板「系統設定」開啟外接 API 開關並配置白名單）：

```javascript
const resp = await fetch('https://api.example.com/data');
const data = await resp.json();
```

**給插件加 WebUI 配置項**（使用者不用改程式碼就能調引數）：

```javascript
seal.ext.registerStringConfig(ext, '问候语', '今天也要好好跑团哦', '打招呼的后半句');
// solve 里读取：
const greeting = seal.ext.getStringConfig(ext, '问候语');
```

## 監聽非指令訊息

想讓插件響應普通聊天（不帶 `.` 字首），實現 `ext.onNotCommandReceived`：

```javascript
ext.onNotCommandReceived = (ctx, msg) => {
  if (msg.message.includes('骰娘晚安')) {
    seal.replyToSender(ctx, msg, '晚安，好梦～');
  }
};
```

## 下一步

- 完整 API（`ctx`/`msg`/`cmdArgs` 每個欄位、全部 `seal.*` 函式、當前限制清單）：[JS 插件 API 參考](/zh-hant/develop/js-plugin-api)
- 老 Dice! 的 mod 想直接用或二次開發：[Lua mod 參考](/zh-hant/develop/lua-mod)
- 想把屬性模板、幫助、指令碼打成一個包釋出：[規則包編寫指南](/zh-hant/develop/rulepack)
- 想通過 HTTP 操控骰娘（做外部工具）：[API 參考](/zh-hant/develop/api)
