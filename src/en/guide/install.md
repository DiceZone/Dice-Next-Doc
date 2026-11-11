# Installation

Dice!Next is currently in public beta. Each release provides packages for Windows (amd64 / arm64), Linux (amd64 / arm64) and macOS (arm64). For container deployment, see the Docker project's instructions.

## Download and Run (Windows)

1. Get the latest beta package for your platform and architecture from [GitHub Releases](https://github.com/DiceZone/Dice-Next/releases).
2. **Extract the whole archive** to a permanent folder (preferably a path without special characters). Do not put it in a system temporary folder, and do not double-click the program from inside the archive.
3. On Windows, double-click **`dice-next.exe`** to start. On Linux/macOS, run **`./start.sh`** from the package, which starts the core through the `dice-next` manager. The first launch creates `config/` and the data directories automatically.
4. By default the program **shows no window and goes straight to the system tray** (a balloon notification appears in the lower-right corner). Right-click the tray icon to open the web panel, show the console, open the program folder, or exit.
5. To open the web panel, right-click the tray icon and choose "Open web panel", or visit **`http://localhost:18088`** in your browser.

The archive already includes the common runtime libraries (the VC++ runtime), so you usually don't need to install anything else. Only 64-bit Windows 10 / 11 is supported.

::: warning Do not start from a temporary folder
Since build 926, the Windows launcher and the core check both the program folder and the actual working directory. If either is inside a system temporary folder, they refuse to start and show a bilingual (Chinese and English) message, so that your configuration and data are not left in a folder that may be cleaned up at any time. Extract the archive to a permanent folder first, then start `dice-next.exe`.
:::

::: tip Port
The default port is `18088` (change it with `port` in `config/server.json`). If the port is in use at startup, the program **moves to the next free port and writes it back to the configuration**. The tray menu's "Open web panel" always opens the correct address.
:::

::: warning Single instance
Only one process can run on the same data (the same program folder). A second launch exits automatically to avoid data conflicts. See [Troubleshooting](/en/guide/troubleshooting) for details.
:::

## Verify the Installation

After starting, visit:

- **Web panel**: `http://localhost:18088`
- **Status check**: `http://localhost:18088/api/system/status`

If the web panel opens, the service is running. We recommend setting a login password under **WebUI Settings** in the panel first, then following the [Quick Start](/en/guide/quickstart) to connect your QQ bot.

## Start with Windows

You can turn on **start at login** in Web panel → System settings (starts automatically when you sign in to Windows; Windows only). There is no need to create a scheduled task by hand.

## Upgrading

### Automatic updates from the web panel

Open **Web panel → About → Check & auto-update**:

1. Click "Check now". The program reads `update-manifest.json` from the GitHub Release to find the latest version and the package for the current platform.
2. The default "Automatic" source tries the direct GitHub connection and the built-in mirrors in parallel. When the network in mainland China is unstable, it uses whichever mirror succeeds first. You can also force mirrors only, or enter a trusted custom HTTPS mirror.
3. After you click "Download update", the program checks the manifest's repository, platform, architecture, file name, file size and SHA-256. On Windows it also checks the archive for path traversal and the expected layout before extracting.
4. When the program was started through the manager of a full package, you can click "Install and restart". Windows uses `dice-next.exe`; newer Linux/macOS packages with the POSIX manager use `start.sh` or `dice-next`. The manager waits for the core to exit completely, then replaces the program, runtime libraries, WebUI, documents and built-in resources. If replacement fails, program files are rolled back in reverse order.

The version text in the upper-right corner opens the update section directly, and shows a red "New" badge when a new version is available. Downloads can be cancelled: wait for "Cancelled", then retry. If no new data arrives for 60 seconds, or a single source takes longer than 20 minutes, the transfer is stopped and the next source is tried according to your settings. A failed or cancelled download only removes its own unfinished files; you don't need to restart the program. Verification and installation preparation can also be cancelled, but once the actual installation has started it cannot be cancelled.

A web request timing out does not mean the background task stopped. Wait for the panel to fetch the status again, or click refresh before doing anything else.

::: warning First upgrade on Linux/macOS
Packages from beta.928 and earlier have no POSIX manager. Stop the service and overwrite it once with a complete new package that contains `dice-next`. After that, start with `start.sh` or `dice-next` and the panel enables one-click and scheduled installation. Replacing only the WebUI, or running `dice-next-server` directly, does not enable full automatic updates. This capability ships with an upcoming release package.
:::

The Linux/macOS manager runs in the foreground and is suitable for supervision by systemd / launchd; point the service at `start.sh` or `dice-next`. The manager sets the working directory to the installation folder, so pass absolute paths for custom configuration directories; the arguments are kept across restarts. The installation folder must be writable by the account that runs the program. The updater never asks for sudo, never removes the macOS quarantine attribute and does not bypass Gatekeeper.

POSIX updates limit the unpacked size and file count, reject path traversal, hard links and special files, and only allow safe symbolic links inside `lib/`. Before replacing anything, the updater checks that the new core and manager can execute and load their libraries. An interrupted replacement can be recovered from the transaction record. Only program files are rolled back; the database is never downgraded automatically. Problems that appear after the new program has loaded still require keeping backups and investigating by hand.

Automatic checking is on by default, runs every 6 hours, and only notifies you when an update is found. You can switch to automatic download. "Install and restart automatically" requires Windows or the newer Linux/macOS manager mode. When the core is run directly, it can check and download but cannot install. Container deployments only check and notify; they never download or install program updates. Pull the new image and recreate the container instead.

In manager mode you can also turn on **scheduled installation**: the update package is downloaded and verified first, then the program restarts to install it at the chosen time, initially **04:00**. The time follows the server's settings, and the panel shows the exact date and UTC offset. If the time has already passed today when the download finishes, the installation is scheduled for the next day. When automatic installation is on and a package is ready, any earlier restart also installs it, including a manual restart, closing and reopening the program, a system reboot or a restart by a supervisor process. The schedule only controls restarts the program starts by itself. Changing the time or time zone reschedules it; turning the schedule off only cancels the planned restart. To keep a downloaded package without installing it at startup, switch to "Download only" or "Notify only"; you can still install it manually.

::: tip Upgrading containers
The official image carries an explicit container marker, and the program also falls back to Docker / Podman markers, Kubernetes environment variables and cgroup information to detect containers. When it detects a container, the WebUI disables manual and automatic download / installation, but version checks still work. For Compose deployments, run `docker compose pull dice-next` and then `docker compose up -d --force-recreate dice-next`. The mounted `config/` and `data/` are kept.
:::

::: warning Trusting mirrors
SHA-256 detects interrupted or corrupted downloads and mismatches between the manifest and the package, but it is not an independent release signature. Choosing a built-in or custom mirror means you trust that source. If supply-chain security matters to you, use "GitHub only" and check the version on the Release page.
:::

### Manual upgrade

You can also download the new package for your platform from [GitHub Releases](https://github.com/DiceZone/Dice-Next/releases), stop the service, and **overwrite all program files**: the executables, runtime libraries, `i18n/`, `web/dist/`, `docs/` and the built-in resources in the package all need to be updated.

The package does not wipe your data:

- The `config/` directory is not part of the release package;
- Databases, session logs, media and resources you created under `data/` are kept;
- The built-in `data/helpdoc` is refreshed with each version, and `data/plugins` is updated by overwriting the built-in files while keeping all other files.

We still recommend making a backup from the web panel before upgrading, or backing up `config/` and `data/` by hand.

## Install the Web Panel as an App

When your browser allows it, an "Install app" button appears on the right side of the top bar (in the "More" menu on narrow screens). **WebUI Settings → Install as app** offers the same option. The button is hidden when the browser doesn't support installation, the current address doesn't qualify, or the app is already installed; the settings card explains why and what you can do instead. You can also use the browser's own option: "Install Dice!Next" in the Chrome / Edge address bar icon or menu, "Add to Dock" in Safari on macOS, or "Share → Add to Home Screen" in Safari on iOS / iPadOS. Firefox and some other browsers may not support installing web apps.

**You must use HTTPS, or open `http://localhost:port` / `http://127.0.0.1:port` on the computer running Dice!Next.** When you access the panel through `http://LAN-IP:port`, the browser's security rules do not allow installation; this is not a Dice!Next fault. Set up an HTTPS reverse proxy instead of disabling browser security. The manifest uses relative addresses, so installation also works when the panel is served from a reverse proxy subpath (such as `https://example.com/dice/`).

What gets installed is only a standalone window for the panel at the current address. **It does not install or start the bot backend in the background.** The backend still needs to be running, and login checks are unchanged. To meet the browser's installation requirements, the panel registers a Service Worker that only handles page navigation: it **caches nothing**, every request goes straight to the backend, and settings, logs and management APIs are never read offline. When the backend is unreachable, only a connection message is shown. If the server address changes, install the app again from the new address.

## Building from Source

If you want to compile it yourself (CMake + vcpkg + MSVC), see [Building from Source](/en/develop/build).

## Next Steps

- [Quick Start](/en/guide/quickstart): set up your first OneBot connection
- [Data Migration](/en/guide/migration): migrate data from the original Dice!
- [Troubleshooting](/en/guide/troubleshooting): what to do when the bot won't open, won't connect or crashes
