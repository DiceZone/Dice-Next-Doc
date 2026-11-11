# Dice!Next Doc

<p>
  <b>English</b> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a> · <a href="README.ja.md">日本語</a>
</p>

The user documentation project of Dice!Next. It contains the VitePress documentation site, the current roadmap, command data and release notes, and is the single place for users to learn about features and development progress.

## Contents

- `src/`: source and theme configuration of the VitePress documentation site.
- `roadmap.md`: feature progress and update records for test users.
- `commands.json`: command categories and descriptions used by the admin panel.
- `i18n.md`, `versioning.md`: conventions for multilingual support and versioning.

## Local Preview

Requirements: Node.js 26.12.1 or a newer 26.x release, with the bundled npm.

```powershell
npm ci
npm run docs:dev
```

Build the static site:

```powershell
npm run docs:build
npm run docs:preview
```

## Documentation Languages

The documentation site is available in Simplified Chinese, Traditional Chinese, English and Japanese. On the first visit the language is chosen from the browser language, falling back to Simplified Chinese when it can't be determined; the language menu at the top right switches languages, and the choice is remembered in the browser.

| Language | Directory | How it's maintained |
| --- | --- | --- |
| Simplified Chinese | `src/` (root) | The source text; every change starts here |
| Traditional Chinese | `src/zh-hant/` | Generated from Simplified Chinese by `npm run i18n:hant`; don't edit by hand |
| English | `src/en/` | Translated by hand |
| Japanese | `src/ja/` | Translated by hand |

After changing a Simplified Chinese page:

1. Run `npm run i18n:hant` to regenerate Traditional Chinese (`docs:build` also runs it automatically).
2. Update the matching pages in `src/en/` and `src/ja/`.
3. Run `npm run i18n:check`: it checks for missing pages, outdated Traditional Chinese pages, in-site links without a language prefix, and broken `#anchors`. English and Japanese headings differ from the Chinese ones, so cross-page anchors must use the actual heading of the target-language page; `npm run i18n:anchors` fixes anchors that are written slightly differently.

When an icon is needed, use `<Icon name="…" />` (the Lucide icon library) instead of emoji.

## Relationship to the Release Packages

When the Dice!Next main program is packaged, it reads `roadmap.md` and `commands.json` from the root of this repository and writes them into the `docs/` directory of the installer. So after changing either file, the main program should be repackaged.

The full development environment also includes `Dice-Next`, `Dice-Next-WebUI` and `onedice-cpp-lib`. With the four projects in the same workspace, the main program's Release workflow can assemble complete release packages directly.

## Documentation Maintenance

- Completed historical requirements are kept as compact tables, so the roadmap doesn't turn into a long development log.
- New features are appended to the changelog by date and build number, without overwriting existing dated entries.
- User-facing docs should describe the behavior that actually works, avoiding internal implementation details or temporary ticket numbers.

## Feedback

The project is currently in public beta. Please submit problems and feature suggestions through [GitHub Issues](https://github.com/DiceZone/Dice-Next/issues) first; you're also welcome to join QQ group `933145116` to chat and give feedback.

## License

This project is released under the **GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later)**, the same as the [Dice-Next](https://github.com/DiceZone/Dice-Next) main repository. See [LICENSE](LICENSE) for the full terms.
