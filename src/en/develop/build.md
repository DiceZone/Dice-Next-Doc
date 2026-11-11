# Building from Source

For developers: how to compile the Dice!Next backend from source, build the WebUI and create a local test package. The backend is C++20 (CMake + vcpkg); Windows + MSVC is recommended for everyday local development, and the Release workflow builds Windows, Linux and macOS packages.

## Dependencies

The vcpkg dependency manifest is `server/vcpkg.json` (manifest mode, installed automatically at configure time):

```
drogon · brotli · nlohmann-json · sqlite-orm · spdlog · yaml-cpp
quickjs-ng · lua (5.4.x) · zstd
```

Brotli must include the upstream fix for CVE-2026-111497. The project loads `server/vcpkg-overlays/brotli` through `server/vcpkg-configuration.json`, keeping the pinned versions of the other dependencies. When installing in classic mode, also pass `--overlay-ports=server/vcpkg-overlays`; don't bypass CMake's security patch check.

::: warning Multi-repository layout: place them side by side in one parent directory
Dice!Next is split into several repositories, and the build / packaging scripts find each other **in sibling directories**. Lay them out like this:

```
your working directory/
├── Dice-Next/          ← main backend repository (server/ CMake project, package.ps1)
├── Dice-Next-WebUI/    ← web panel (Vite + React)
├── Dice-Next-Doc/      ← this documentation site (VitePress)
├── Dice-Next-Docker/   ← container deployment (optional)
├── onedice-cpp-lib/    ← OneDice V1 expression engine (required by CMake)
└── dicescript-c-lib/   ← DiceScript C99-compatible engine (required by CMake)
```

`server/CMakeLists.txt` brings in the sibling `onedice-cpp-lib` and `dicescript-c-lib` with `add_subdirectory`, so CMake configuration fails immediately if either repository is missing. The packaging script looks for `Dice-Next-WebUI/dist` and `Dice-Next-Doc` in sibling directories by default (you can also point elsewhere with the environment variables `DICENEXT_WEB_ROOT` / `DICENEXT_DOC_ROOT`).
:::

## Windows (Recommended / Verified)

### Preparing the environment

```powershell
# 1. Visual Studio 2022 Build Tools, with "Desktop development with C++" checked
# 2. CMake >= 3.20
winget install Kitware.CMake
# 3. vcpkg
git clone https://github.com/Microsoft/vcpkg.git C:/dev/vcpkg
cd C:/dev/vcpkg
.\bootstrap-vcpkg.bat
```

### Building

The CMake project is in the main repository's `server/` directory:

```powershell
cd Dice-Next

cmake -B server/build -S server -DCMAKE_TOOLCHAIN_FILE=C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build server/build --config Release -j
```

On the first configure, vcpkg fetches and compiles all dependencies, which takes a while; that's normal. `server/build.bat` is a one-click script for reference (adjust the paths for your machine).

### Running

```powershell
# The working directory must be server/ (or the root of a package) so config/ and i18n/ can be found
cd server
.\build\Release\dice-next-server.exe
```

After starting, visit `http://localhost:18088`. The first run creates the `config/` and `data/` directories; change the management port with `port` in `config/server.json`.

## Linux

::: info A successful build isn't real-device verification on that platform
Release CI builds Linux x64 / ARM64, macOS ARM64 and Windows x64 / ARM64, and separate Linux / Windows backend tests gate releases. A successful build here doesn't mean every adapter has been verified with real accounts; the `cross-compile*` scripts at the repository root are also available for reference.
:::

```bash
git clone https://github.com/Microsoft/vcpkg.git ~/vcpkg && ~/vcpkg/bootstrap-vcpkg.sh
# Dice-Next, onedice-cpp-lib and dicescript-c-lib must be in the same parent directory
cd Dice-Next
cmake -B server/build -S server \
  -DCMAKE_TOOLCHAIN_FILE=$HOME/vcpkg/scripts/buildsystems/vcpkg.cmake \
  -DCMAKE_BUILD_TYPE=Release
cmake --build server/build -j$(nproc)
```

## Frontend and Documentation

The web panel and the documentation site are **separate repositories**, each built with npm:

Use Node.js **26.12.1 or a newer secure 26.x release**. CI follows `26.x` with `check-latest: true`, checks the minimum secure version before building and records the actual version; it never moves to 27 automatically.

```bash
# Web panel (Dice-Next-WebUI repository; the build output dist/ is served by the backend and collected by the packaging script)
cd Dice-Next-WebUI && npm install && npm run build   # or npm run dev for local development

# Documentation site (Dice-Next-Doc repository; dead link checking is on, so run a build locally after changes)
cd Dice-Next-Doc && npm install
npm run docs:dev      # local preview
npm run docs:build    # build (including dead link checks)
```

Frontend changes should also run `npm test` and `npm run lint`; don't judge success just because the dev server opens. Installing as an app uses a manifest and icons with relative addresses, and `public/sw.js`, which only handles page navigation and caches nothing (registered only in production builds over HTTPS / localhost); don't add API or resource caching to it.

## Release Caching and Test Gates

- Release targets set `BUILD_TESTING=OFF` explicitly, so test programs aren't compiled into the platform packages; Windows x64 / Linux x64 have separate `BUILD_TESTING=ON` jobs that run CTest, and releases only go out when all pass.
- Dependencies are installed against a pinned vcpkg baseline, using the full Git history to fetch the locked port versions. The cache only stores ABI binary packages, separated by platform, triplet, runner environment and dependency family, and the snapshot is refreshed when packages are added; compatibility checks are never disabled.
- Windows test builds use controlled `/MP2` file-level parallelism to avoid the memory spikes of stacking project-level parallelism; adjust locally with `DICENEXT_MSVC_COMPILE_PROCESSES`.
- A cold cache still needs warming up, so no fixed number of minutes per run is promised. The most recent beta.925 Release workflow succeeded; for detailed implementation and verification, see the [main repository build record](https://github.com/DiceZone/Dice-Next/blob/main/docs/ci-release-build.md).

### Beta and official version labels

Default builds use the Beta label, and the interface shows `beta-3.0.0(123)`. Maintainers of official releases add `-DDICENEXT_PRERELEASE=OFF` when configuring CMake, and the interface shows `v3.0.0(123)`; this option doesn't change the semantic version or the build number counting rules, and doesn't create a GitHub Release automatically. The current release workflow is still Beta.

## Creating a Local Windows Test Package

`package.ps1` at the root of the main `Dice-Next` repository packages a Windows release zip in one step (output to `release/`, with the version / build number / timestamp in the file name; the frontend dist and documentation data are collected from the sibling repositories by default):

```powershell
$env:DICENEXT_WEB_ROOT = "..\Dice-Next-WebUI"
$env:DICENEXT_DOC_ROOT = "..\Dice-Next-Doc"
powershell -ExecutionPolicy Bypass -File package.ps1
```

The default output is `release/` in the main repository. Use `DICENEXT_RELEASE_ROOT` to choose another output directory. The script checks the backend build output and the WebUI's `dist/`, and stops if either is missing, so an incomplete test package is never produced.

Package contents:

- The `dice-next.exe` launcher / manager, the `app/dice-next-core.exe` service core, and the dependencies and MSVC runtime gathered in `lib/`
- The `i18n/` language packs
- `data/`: `decks/`, `rules/`, `helpdoc/`, `card-templates/`, `rulepacks/` and the bundled sample JS plugins
- `docs/roadmap.md`, `docs/commands.json` (data sources for the roadmap page / command table page)
- The `web/dist` frontend output

Finish the backend compilation and frontend build before packaging (the script reports an error and exits if either is missing). Configuration files are **not packaged**; they are generated on first run, so upgrades never overwrite user configuration.
