# Contributing

Thank you for your interest in Dice!Next! This page explains how to take part, and what **needs special attention** when contributing.

## Code of Conduct

- Respect all contributors, and discuss and review constructively
- Focus on the technical issue, not the person

## Ways to Contribute

### Reporting bugs

Submit them on GitHub Issues, including as much as possible: the version (check with `.bot`), operating system, steps to reproduce, expected vs. actual behavior, and relevant logs.

### Feature suggestions

Describe the feature, the use case and compatibility with existing features. For anything involving commands, refer first to **the original Dice!'s behavior** (see the notes below).

### Submitting code

```bash
git checkout -b feature/my-feature
# write code…
git commit -m "feat: describe the new feature"
git push origin feature/my-feature
# open a Pull Request on GitHub
```

## Development Environment

The project is split into several repositories; clone the ones relevant to your contribution:

| Repository | Content |
| --- | --- |
| `Dice-Next` | The main backend repository (C++, CMake project in `server/`) |
| `Dice-Next-WebUI` | The web panel (Vite + React + TS) |
| `Dice-Next-Doc` | This documentation site (VitePress) |
| `Dice-Next-Docker` | Container deployment |
| `onedice-cpp-lib` | OneDice expression engine (required to build the backend; place it next to the main repository) |
| `dicescript-c-lib` | DiceScript C99-compatible engine (required to build the backend; place it next to the main repository) |

For the full steps and directory layout, see [Building from Source](/en/develop/build). In short:

```bash
# Backend (Dice-Next repository; the two expression engine libraries must be in sibling directories)
cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=<vcpkg>/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release
# Frontend (Dice-Next-WebUI repository)
npm install && npm run build
```

## Notes (Important)

These conventions are specific to this project; **please read them before you start**:

### 1. Faithful reproduction first: check the original

Dice!Next's core goal is to let users of the old Dice! **migrate painlessly**. Before adding or changing any **command, rule, text or key**, check the original Dice!'s actual behavior (`DiceEvent.cpp` / `GlobalVar.cpp` and so on), and **don't invent** syntax or wording yourself. Reference projects (SealDice / OlivaDice) can also be compared.

### 2. All texts go through i18n; never hard-code

All user-facing text is output through the i18n system; **don't hard-code Chinese in the code**. When adding a text key, **add it for all four languages (zh-Hans / zh-Hant / en / ja)**, or text will be missing when switching languages. Also note: the first line of `.help` text always follows the "description + command" pattern, and default reply texts **must not start with a command prefix** (`tools/audit_i18n_texts.py` checks this for regressions).

### 3. Database schema changes must be made in two places

The database schema is declared once in each of two places, which **must be changed together**:
- `Storage` `decltype(make_storage(...))` in `server/src/storage/database.h`
- `make_storage(...)` in `server/src/storage/database.cpp`

Changing only one causes a large block of template errors. New columns are added automatically by `sync_schema` with ALTER, without losing data.

### 4. Never commit keys / tokens

OneBot Access Tokens, API keys and the like **must not** be committed. `config/` is a local directory generated at runtime; be careful not to commit local configuration containing real tokens.

### 5. Windows pitfalls

- The `max`/`min` macros of `windows.h` conflict with `std::max`/`std::min` (C2589); use `(a < b ? b : a)` or define `NOMINMAX`.
- External cross-process calls go through `curl` (drogon's asynchronous DNS has problems on Windows); see the existing log upload / `{api:}` implementations.

### 6. Documentation changes must pass the build

The documentation site has dead link checking enabled. After adding or changing links, run `npm run docs:build` locally and commit only once it passes.

### 7. Frontend: always use styled web components, never native browser controls

Don't use the browser's built-in native controls for dropdowns, dialogs, confirmations and so on; always use the project's styled components so all three platforms look consistent and can be themed:

- **Dropdowns**: use `Select` from `@/components/ui/select` (`SelectTrigger` / `SelectContent` / `SelectItem` / `SelectValue`); **don't write a native `<select>`**.
- **Confirm / input dialogs**: use `useDialogs()` from `@/hooks/use-dialogs`: `await dlg.confirm({ title, description, destructive })`, `await dlg.prompt({ title, defaultValue })`, and render `dlg.node` into the component tree. **Don't use `window.confirm` / `alert` / `prompt`**.
- **Dialogs / drawers**: use `@/components/ui/dialog`; don't build your own native `<dialog>` or bare `position:fixed` overlays.

See the existing usage: dropdowns in `components/adapter/adapter-form.tsx`, dialogs in `pages/groups-page.tsx`.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Refactoring |
| `perf` | Performance |
| `chore` | Build / toolchain |

## Code Style

- **C++20**; 4-space indentation; camelCase for types / functions (`DiceEngine` / `rollDice`), snake_case for variables (`max_count`); `const` on immutable references. Keep consistent with the surrounding code as much as possible.
- **TypeScript / React**: follow the project's ESLint; function components; `interface` for props. Always use styled web components for dropdowns, dialogs and other interactions instead of native browser controls (see note 7 above).

## License

Dice!Next is licensed under the **AGPLv3** (the same license as the original Dice!). By contributing, you agree to release your contribution under that license.
