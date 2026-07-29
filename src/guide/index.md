# 快速开始概览

欢迎来到 **Dice!Next 3.0**——新一代 TRPG 骰子机器人。

## 什么是 Dice!Next？

Dice!Next 是 Dice! 的全新重构版本，从原有的 CoolQ 单体 DLL 架构彻底重构为现代化的前后端分离架构：

- **后端 (C++)**：基于 drogon 框架，提供 HTTP REST API + WebSocket 推送
- **前端 (React)**：基于 Vite + shadcn/ui + Tailwind CSS 的 SPA 管理面板
- **协议层**：OneBot v11 开箱即用（正向 / 反向 WS），插件式适配器架构支持协议扩展

## 核心特性

| 特性 | 说明 |
|------|------|
| 🎲 全能掷骰 | COC7 / DND / BRP 检定与房规、命运骰、暗骰、奖惩骰，兼容原版指令 |
| 🌏 多语言 | 简体 / 繁體 / English / 日本語四语回复，支持自定义语言包 |
| 🖥️ Web 面板 | 群管、玩家、牌堆、规则、日志、定时任务、通知……全部网页化 |
| 🧩 扩展生态 | 兼容原版 Dice! Lua mod 与海豹 SealDice JS 插件，规则包一键导入 |
| 🤖 AI 增强 | 可选接入大模型：回复润色、翻译、对话、NPC 扮演、工具调用 |
| 📦 解压即用 | Windows 包自带运行库，双击启动，托盘常驻，开机自启 |
| ⚡ 热加载 | 配置变更自动生效；面板改设置即时保存 |

## 快速导航

- [安装部署](/guide/install) — 下载、运行与升级
- [快速开始](/guide/quickstart) — 5 分钟上手 Dice!Next
- [数据迁移](/guide/migration) — 从旧版 Dice! 迁移数据
- [部署与运维](/guide/deploy) — 长期运行、备份与安全
- [故障排查](/guide/troubleshooting) — 打不开 / 连不上 / 闪退怎么办

## 系统要求

| 场景 | 要求 |
|------|------|
| 运行发行包 | 64 位 Windows 10 / 11（压缩包已附带常见运行库） |
| Linux / Docker | Linux amd64 / arm64 发行包与 Docker 镜像；具体部署见发行说明 |
| 从源码构建 | Visual Studio 2019+ / cmake ≥ 3.20 / vcpkg，见[从源码构建](/develop/build) |

## 版本说明

当前为 **Dice!Next 3.0 公测（Beta）** 阶段，以 AGPLv3 协议开源。欢迎通过 [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) 反馈问题。
