# Help Documents

**Web panel → Help Documents** gathers every `.help` entry so you can search, edit and manage them.

## Help Sources

The help system is a unified registry with entries from several sources, which the page labels:

| Source | Description | Editable? |
|------|------|----------|
| Built-in | Command help built into the program (i18n texts) | Editable, with one-click "Restore default" |
| Custom help entries | `help.topic.*` entries added by older commands or imported from the old `CustomHelp.json` | Editable, deletable |
| Rule pack · name | Help shipped with a rule pack | Read-only (edit the rule pack to change it) |
| Plugin · name / Lua module · name | Help entries shipped with JS plugins / Lua mods | Read-only (edit the plugin to change it) |
| Document pack · name | Structured help packs in directories such as `data/helpdoc/`, which may ship with the program or be added by the dice master | Read-only |
| Custom documents | Help created by the dice master (stored in `data/help/*.md`) | Editable, deletable |

Built-in help you have modified still belongs to "Built-in" with an extra "Customized" label, so it's never mistaken for a new user document. Help from rule packs and plugins **ships with the package**: install the package and you get the help, uninstall it and the help disappears.

Historical custom entries don't need to be re-imported and are never forcibly converted into files: the original content, language and plain text / Markdown format stay in the original text override layer. Old data has no reliable record of whether an entry was "created by a command or imported by migration", so the page classifies them all as user-defined without guessing the source.

## Browsing and Searching

- By default the help file library is on the left and the current entry on the right. Filter first by "User-defined / Built-in help / Plugins / Rule packs / Help document packs / Other sources", then choose a specific plugin, pack or file, and search topic names or content.
- Filtering, counts and paging run on the server over the full catalog, not just the current page. Plugins include both JS and Lua; help documents shipped with rule packs still belong to the rule pack and keep their original document source name.
- Split-pane paging offers page number buttons and direct page input, fixed to two rows to avoid occasional irregular line wraps.
- Empty documents you created and files hidden by entries with the same name still appear in the management list with a corresponding note; this doesn't change the priority of same-named entries in chat.

## Visual Editing

Select an entry on the left, then click "Edit" on the right to open a dialog. "New document" creates a custom help file (enter a name + content); after saving, `.help <name>` works in groups right away. Historical help entries can also be edited or deleted directly; built-in help can be modified and restored to default.

Text entries show the language of their actual content, and editing and deleting act on that language while keeping content in other languages; when a language has no entry, the bot falls back according to its configuration. The format choice keeps the explicit meaning of plain text / Markdown, and `{sample:甲|乙}` is not evaluated while browsing. Leaving with unsaved changes asks for confirmation.

Standalone custom help no longer appears as uncategorized text under "Commands → All texts"; that page links to Help Documents instead. Usage text tied to commands and text editing in the persona layer remain there.

## Import / Export

- **Export**: downloads JSON with `kind: "dicenext.help"` and `version: 1`, saving custom files and help text overrides in all languages separately (including historical entries, built-in help modifications, formats and probability candidates). Files and text entries with the same name are saved separately and don't overwrite each other. Plugins, rule packs and personas are not included; use their own backup entries.
- **Import**: supports the new backup above, and still accepts old `.json` (a `{name: content}` object or an array with `name` / `content`) and single `.md` / `.txt` files (the file name is the entry name). The whole input is validated first, and invalid names and duplicate entries in the same language are rejected. Overwriting existing content requires confirmation, and when a network error causes partial success, the result is reported instead of pretending everything succeeded.

## Chat Commands

On 2026-10-19 old help aliases were completed: write an entry's body as `&target topic` and lookups go to the target. Multiple levels are supported, and ASCII case is ignored. Text entries added by commands or imported from the old version, custom files and document packs all use the same resolution rules; the current language, rule-preferred source and search scope are kept, and aliases can't be used to bypass scope limits. Loops deeper than 16 levels or missing targets give a notice, and lists and exports still keep the original alias instead of freezing it into body text in advance.

Use `.help <entry>` in groups to look up help. `.helpdoc scope <source>` locks the group's search scope to one source (for example, only a particular rule pack), and `.helpdoc default <source>` sets the preferred source for same-named entries (for example, letting dnd5r win over dnd3r). See [Admin commands](/en/use/admin).

::: tip
When there are many help entries, `.help` in chat only does exact / fuzzy lookups; to browse all entries, use the browsing and search on this page.
:::
