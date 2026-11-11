# Dice!Next Doc

<p>
  <a href="README.md">English</a> · <b>简体中文</b> · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.ja.md">日本語</a>
</p>

Dice!Next 的用户文档项目。它包含 VitePress 文档站、当前路线图、指令数据与版本说明，是使用者了解功能和开发进度的统一入口。

## 内容

- `src/`：VitePress 文档站源码与主题配置。
- `roadmap.md`：面向测试用户的功能进度与更新记录。
- `commands.json`：管理后台使用的指令分类与说明数据。
- `i18n.md`、`versioning.md`：多语言与版本维护约定。

## 本地预览

环境要求：Node.js 26.12.1 或更新的 26.x 版本，以及随附的 npm。

```powershell
npm ci
npm run docs:dev
```

构建静态站点：

```powershell
npm run docs:build
npm run docs:preview
```

## 文档站的多语言

文档站提供简体中文、繁體中文、English 与日本語四种语言。首次访问时按浏览器语言自动选择，无法判断时显示简体中文；右上角可切换语言，选择会记在浏览器里。

| 语言 | 目录 | 维护方式 |
| --- | --- | --- |
| 简体中文 | `src/`（根目录） | 原文，所有修改先改这里 |
| 繁體中文 | `src/zh-hant/` | 由 `npm run i18n:hant` 从简体中文自动生成，不要手工修改 |
| English | `src/en/` | 人工翻译 |
| 日本語 | `src/ja/` | 人工翻译 |

修改简体中文页面后：

1. 运行 `npm run i18n:hant` 重新生成繁體中文（`docs:build` 前也会自动执行）。
2. 同步修改 `src/en/` 与 `src/ja/` 中对应的页面。
3. 运行 `npm run i18n:check`：检查缺页、过期的繁體中文页面、未加语言前缀的站内链接，以及失效的 `#锚点`。英文和日文的标题与中文不同，跨页锚点要写目标语言页面实际的标题；`npm run i18n:anchors` 可自动修正写法相近的锚点。

需要图标时使用 `<Icon name="…" />`（Lucide 图标库），不要使用 emoji。

## 与发行包的关系

Dice!Next 主程序打包时会读取本仓库根目录的 `roadmap.md` 与 `commands.json`，并将它们写入安装包的 `docs/` 目录。因此修改这两个文件后，应重新打包主程序。

完整开发环境还包括 `Dice-Next`、`Dice-Next-WebUI` 和 `onedice-cpp-lib`。将四个项目放在同一工作区，可直接使用主程序的 Release 工作流组装完整发行包。

## 文档维护

- 已完成的历史需求使用压缩表格保留，避免路线图变成冗长的开发记录。
- 新功能按日期与构建号追加更新日志，不覆盖既有日期条目。
- 面向用户的文档应说明实际可用行为，避免记录内部实现细节或临时工单号。

## 反馈

项目目前处于公测（Beta）阶段。问题和功能建议请优先通过 [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) 提交；也欢迎加入 QQ 群 `933145116` 交流与反馈。

## 开源许可证

本项目以 **GNU Affero General Public License v3.0 or later（AGPL-3.0-or-later）** 发布，与 [Dice-Next](https://github.com/DiceZone/Dice-Next) 主仓库保持一致。完整条款见 [LICENSE](LICENSE)。
