# 贡献指南

感谢你对 Dice!Next 的关注！本页说明如何参与，以及贡献时**特别需要注意的事项**。

## 行为准则

- 尊重所有贡献者，建设性地讨论与审查
- 专注技术，对事不对人

## 贡献方式

### 报告 Bug

在 GitHub Issues 提交，请尽量包含：版本号（`.bot` 可查）、操作系统、复现步骤、期望 vs 实际、相关日志。

### 功能建议

说明功能描述、使用场景、与现有功能的兼容性。涉及指令的，请优先参考**原版 Dice! 的行为**（见下方注意事项）。

### 提交代码

```bash
git checkout -b feature/my-feature
# 编写代码…
git commit -m "feat: 新功能描述"
git push origin feature/my-feature
# 在 GitHub 发起 Pull Request
```

## 开发环境

项目拆分为多个仓库，按贡献内容选择要 clone 的仓：

| 仓库 | 内容 |
| --- | --- |
| `Dice-Next` | 后端主仓（C++，CMake 工程在 `server/`） |
| `Dice-Next-WebUI` | Web 管理面板（Vite + React + TS） |
| `Dice-Next-Doc` | 本文档站（VitePress） |
| `Dice-Next-Docker` | 容器化部署 |
| `onedice-cpp-lib` | OneDice 表达式引擎（编译后端必需，与主仓放同级目录） |

完整步骤与目录摆放见[从源码构建](/develop/build)，简要：

```bash
# 后端（Dice-Next 仓；onedice-cpp-lib 需在同级目录）
cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=<vcpkg>/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release
# 前端（Dice-Next-WebUI 仓）
npm install && npm run build
```

## ⚠️ 注意事项（重要）

这些是本项目特有的约定，**动手前请务必了解**：

### 1. 忠实复刻优先，先查原版

Dice!Next 的核心目标是让老 Dice! 用户**无痛迁移**。新增 / 改动任何**指令、规则、文案、键值**之前，先查原版 Dice! 的实际行为（`DiceEvent.cpp` / `GlobalVar.cpp` 等），**不要自己发明**语法或措辞。参考项目（海豹 / 青果）也可对照。

### 2. 文案一律走 i18n，不要硬编码

所有面向用户的文本都通过 i18n 系统输出，**不要在代码里写死中文**。新增文案键时，**四种语言（zh-Hans / zh-Hant / en / ja）都要补**，否则切换语言会缺字。另外注意：`.help` 帮助文本的首行统一为「描述词 + 指令」的句式，且默认回复文案**不得以指令前缀开头**（`tools/audit_i18n_texts.py` 会做回归检查）。

### 3. 改数据库表结构要改两处

数据库 schema 在两个地方各声明一次，**必须同步修改**：
- `server/src/storage/database.h` 的 `Storage` `decltype(make_storage(...))`
- `server/src/storage/database.cpp` 的 `make_storage(...)`

只改一处会导致一大段模板报错。新增列由 `sync_schema` 自动 ALTER，不会丢数据。

### 4. 绝不提交密钥 / Token

OneBot Access Token、API Key 等**不得**写进提交。`config/default_config.json` 是运行时自动生成的，注意不要把含真实 Token 的本地配置提交上去。

### 5. Windows 平台坑

- `windows.h` 的 `max`/`min` 宏会和 `std::max`/`std::min` 冲突（C2589）；用 `(a < b ? b : a)` 或定义 `NOMINMAX`。
- 跨进程外部调用走 `curl`（drogon 的异步 DNS 在 Windows 上有问题），参考既有日志上传 / `{api:}` 实现。

### 6. 文档改动要过构建

文档站启用了死链检查，新增 / 改链接后请本地跑一遍 `npm run docs:build`（在 `docs/`），通过再提交。

### 7. 前端一律用网页样式组件，禁用浏览器原生控件

下拉框、弹窗、确认框等**不要用浏览器自带的原生控件**，统一用项目内的样式组件，保证三端外观一致、可主题化：

- **下拉框**：用 `@/components/ui/select` 的 `Select`（`SelectTrigger` / `SelectContent` / `SelectItem` / `SelectValue`），**不要写原生 `<select>`**。
- **确认 / 输入弹窗**：用 `@/hooks/use-dialogs` 的 `useDialogs()` —— `await dlg.confirm({ title, description, destructive })`、`await dlg.prompt({ title, defaultValue })`，并把 `dlg.node` 渲染进组件树。**不要用 `window.confirm` / `alert` / `prompt`**。
- **对话框 / 抽屉**：用 `@/components/ui/dialog`，不要自己堆原生 `<dialog>` 或裸 `position:fixed` 遮罩。

参考既有用法：下拉看 `components/adapter/adapter-form.tsx`，弹窗看 `pages/groups-page.tsx`。

## Commit 规范

采用 [Conventional Commits](https://www.conventionalcommits.org/)：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档 |
| `refactor` | 重构 |
| `perf` | 性能 |
| `chore` | 构建 / 工具链 |

## 代码风格

- **C++20**；4 空格缩进；类型 / 函数驼峰（`DiceEngine` / `rollDice`），变量蛇形（`max_count`）；不可变引用加 `const`。尽量与周围既有代码风格保持一致。
- **TypeScript / React**：遵循项目 ESLint；函数式组件；Props 用 `interface`。下拉 / 弹窗等交互一律用网页样式组件，不用浏览器原生控件（见上方注意事项第 7 条）。

## 许可证

Dice!Next 基于 **AGPLv3**（沿用原版 Dice! 的协议）。提交贡献即表示你同意在该许可证下发布。
