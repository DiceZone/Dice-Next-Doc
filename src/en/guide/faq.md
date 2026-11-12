# Frequently Asked Questions

Answers for getting started, everyday maintenance and configuration recovery. For startup failures, disconnected adapters or unanswered commands, also see [Troubleshooting](/en/guide/troubleshooting).

## Forgot the panel password? {#reset-password}

You need access to the server's configuration files. If your hosting service does not provide file access, contact its administrator. A QQ dice-master account, an adapter token and the WebUI password are different credentials.

1. **Restrict external access to the panel first**, for example by temporarily disabling its reverse-proxy entry or allowing only your IP. Resetting opens initial password setup; prevent someone else from claiming it first.
2. Stop Dice!Next and any service or supervisor that would automatically restart it.
3. Back up the actual configuration directory, normally `config/`. See [configuration locations](#config-location) for custom paths and containers.
4. Open `config/webui.json` in a text editor. Change only the top-level `password` value to an empty string: `"password": ""`. Keep all other fields; do not replace the entire file with this fragment.
5. Delete `webui_sessions.json` in the same directory, if present, to revoke saved trusted-device sessions. Do not restore the old session file.
6. Start the program, open the panel through the restricted entry and set a new password on the initial setup screen. Use **8–64 characters**, including uppercase and lowercase letters, digits and ASCII special characters. Spaces, Chinese characters and full-width characters are not accepted.
7. Confirm that the new password works before restoring normal external access.

**An empty password requires setup again; it does not enable anonymous access.** The stored password may be a hash. Do not try to recover or generate it manually: let the setup screen save the replacement. No databases, character sheets or plugins need to be deleted.

## Why do I need to log in again after trusting this device? {#login-session}

Trusted password-login sessions last up to 30 days and require both the browser cookie and the server's `config/webui_sessions.json`. Check whether:

- You changed browsers, used a private window or switched addresses. `localhost`, `127.0.0.1` and your domain are different addresses.
- Cookies were cleared, including by a browser setting that clears site data on exit.
- The configuration directory is writable, the session file still exists and the service uses the same configuration directory after restarting.
- You changed the password or explicitly logged out; these invalidate the corresponding sessions.

Third-party account login has separate session rules. The 30-day password-login rule does not apply to every login method.

## Where are the configuration files? {#config-location}

When launched normally through the release package's manager, the default is `config/` in the installation directory. Startup logs identify the configuration directory being read. If service arguments specify another directory, use that path; resolve relative paths against the process's working directory.

In a container, `config/` maps to a host mount or volume defined in your Docker / Compose configuration. Do not edit a different copy in a temporary container. Multiple bot instances should have separate configuration directories, data directories and listening ports.

| Setting | Default file |
| --- | --- |
| Panel bind address, port, database path and log level | `config/server.json` |
| Panel password and interface settings | `config/webui.json` |
| Platform connections and adapter parameters | `config/adapters.json` |
| Dice masters, commands, reply behavior and AI | `config/dice.json` |
| Friend requests and group invitations | `config/events.json` |
| Default reply language | `config/i18n.json` |

See [Basic Configuration](/en/config/basic) for fields. Character sheets and session logs are not all stored in these JSON files; backups also need the data files.

## How do I edit configuration manually? {#edit-config}

Prefer the panel. Edit files when the panel is unavailable or you need to recover settings:

1. Stop the program and its supervisor. Back up the original file outside the configuration directory.
2. Use a text editor and **UTF-8** encoding. Preserve the existing structure and change only the intended fields.
3. Check JSON syntax: English double quotes around keys and strings, no comments or trailing commas, `true` / `false` for booleans, and unquoted numbers for fields such as the port.
4. Start the program, check configuration-loading logs and verify the actual page or command behavior. If loading fails, stop it, restore the backup and restart.

For example, change the port in `config/server.json` to the number `18089`. Use `"port": 18089` directly in that file, **without** an extra `"server": { ... }` wrapper. The root of `adapters.json` is an array, unlike object-based configuration files.

Do not delete the entire configuration directory to reset one setting, or replace an existing file with a full example from the internet. Store manual backups outside this directory: a `.json` backup may otherwise be read as another configuration section.

## Why did an edit have no effect or revert after restarting? {#config-not-applied}

- Confirm that you edited the active instance's actual file, saved it successfully and granted the runtime account write access.
- Panel saves, commands or other configuration writes can overwrite manual edits while the program runs. Stop it before editing.
- Hot reload does not make every setting live. **The bind address and port require a restart**; schedule a restart to verify other uncertain changes too.
- Per-adapter, per-account or group settings may override global defaults. Check the applicable scope.
- If JSON parsing or validation fails, read the filename and error in the startup log instead of assuming the change was loaded.

## Why does the panel work locally but not on another device? {#panel-access}

`127.0.0.1` / `localhost` on another device refers to that device, not the bot server. Use the server's address and port, and check the bind address, firewall and cloud security group.

The default port is `18088`, but it can advance when occupied. Check the startup log or `config/server.json`. Update the reverse proxy's upstream port too if it changed. See [Deployment & Operations](/en/guide/deploy) for HTTPS and reverse proxies.

## What should I back up or move to a new server? {#backup}

Make a panel backup first, check its selected categories—especially plugins, decks, images and media—and download a copy to another device.

For a manual backup, **stop the service** before copying its configuration directory and the entire `data/` directory. Include custom plugins, resources and databases stored elsewhere. A custom main database path is specified by `db_path` in `server.json`. Copying just one `.db` while running can miss pending data.

Install a complete release for the new server's operating system and architecture, then restore configuration and data. A Windows executable cannot simply be moved to Linux. Check absolute paths, permissions, ports and adapter addresses. Stop the old server first to avoid duplicate logins or message handling. Use the [migration tool](/en/guide/migration) for old Dice data; do not overwrite Next databases directly.

## Blank page, 404 or broken styles after an upgrade? {#webui-update}

Confirm the correct instance and port, then try refreshing. If it persists, check whether only the executable was updated and the WebUI was omitted. Use a complete package of the same version, including `web/dist/`, runtime libraries and accompanying resources. Do not mix frontend and backend versions, or delete `config/` or `data/` to troubleshoot.

Stop and back up the service before repairing program files using the [complete upgrade procedure](/en/guide/install#upgrading). With a reverse proxy, also check whether static assets are cached incorrectly or forwarded to an old instance.

## Why can't updates install automatically? {#auto-update}

Installation requires the package manager launcher: `dice-next.exe` on Windows, or the packaged `start.sh` / `dice-next` on Linux and macOS. Running `dice-next-server` directly supports checking and downloading only. Containers support checking and notifications; update the image and recreate the container.

For download failures, read the displayed error and check source connectivity, free space and write permissions. Try a built-in mirror or GitHub. Do not bypass verification to install an incomplete package. Scheduled installation uses the configured server timezone; if automatic installation is enabled and a package is ready, an earlier restart also installs it. See [update settings](/en/manage/settings#check-auto-update).

## Connected, but commands get no reply? {#no-reply}

Send a simple `.r 1d6` and inspect the home page's runtime log:

- **No incoming-message record**: check adapter login, event subscriptions and platform delivery. On QQ Official, try `/r 1d6` and check your configured command prefixes.
- **Message received, no reply generated**: check `.bot off`, global silence, disabled commands, block/allow lists and plugin rules.
- **Reply generated, delivery failed**: read the platform error. Check group membership, sending permissions and platform content rejection.

The [Playground](/en/manage/playground) can test command behavior, but success there does not prove real-platform delivery. Reply formatting, buttons and image support also vary by adapter.

## What should I include in a bug report? {#report}

Include the version, operating system, adapter type, incident time, reproduction steps, expected and actual results, and relevant logs from that time. Add the crash report if applicable. See [Troubleshooting](/en/guide/troubleshooting) for log locations.

Before sharing, remove passwords, tokens, API keys, AppSecrets, session-file contents and unrelated private conversations. **Do not publicly upload the entire configuration directory or database.** A reproducible command and its logs are more useful than “nothing happens”.
