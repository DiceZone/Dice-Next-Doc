# DiceNext 版本号规则（务必遵守）

> 给后续的 AI / 贡献者：改动版本号前先读这份。`.bot` 指令展示的就是这套版本号。

`.bot` 输出示例：

```
Dice!Next By DiceZone/Shia Ver 3.0.0(001)
[MSVC 19.44 2026-06-14 06:48:32 For Adapter/OnebotV11]
```

## 组成

| 部分 | 含义 | 谁来改 |
|------|------|--------|
| `3.0.0` | 语义版本（major.minor.patch） | **只有维护者 Shia 明确说要改才改**，AI 不要自行变动 |
| `(001)` | 构建号，编译一次自动 +1 | 全自动，见下 |
| `MSVC 19.44` | 编译器及版本 | 编译时自动探测（MSVC / GNUC / Clang） |
| 时间 | 该次构建时间戳 | 自动 |
| `For Adapter/OnebotV11` | 触发 `.bot` 的那条消息来自哪个适配器 | 运行时自动 |

## 构建号 `(NNN)` 的规则

- **每次编译 +1**（由 CMake `cmake/bump_build.cmake` 在每次构建前执行）。
- **重置条件**：当 `major.minor` 变化时重置为 1。
  - `3.0.0 → 3.1.0`（minor 变了）→ **重置** 回 `(001)`
  - `3.0.0 → 4.0.0`（major 变了）→ **重置**
  - `3.0.0 → 3.0.1`（只有 patch 变）→ **不重置**，继续累加
- 计数状态存在 `server/build_counter.txt`（格式 `主.次:数字`，如 `3.0:17`），不要手改。

## 怎么改语义版本

只改 `server/CMakeLists.txt` 顶部的 `project(dice-next-server VERSION X.Y.Z ...)`。
版本字符串通过 `DICE_VERSION_STRING` 编译宏注入，构建号/时间通过自动生成的
`build/generated/version_build.cpp` 注入；实现见 `src/common/version.cpp`。

## 实现位置

- 规则脚本：`server/cmake/bump_build.cmake`
- 版本接口：`server/src/common/version.h` / `version.cpp`（`botBanner()`）
- 触发：`.bot`（无参数）→ `CommandRouter::handleBot()`
