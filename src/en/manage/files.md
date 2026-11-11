# Files & Image Resources

Entry: **Data → Files → Image resources**.

The file list only shows the name, path, size and modification time, without loading thumbnails. Click "Preview" when you want to see an image; "Copy image code" gives code you can use directly in replies, roll texts, decks and so on.

## Where Images Are Stored

Everything is stored in this instance's `data/images/`:

| Directory | Purpose |
| --- | --- |
| `reply/` | Custom replies |
| `text/` | Roll texts, persona texts |
| `deck/<deck file name>/` | Images for that deck; the full file name includes `.json`, and internal subdirectories are kept |
| `plugin/<plugin name>/`, `mod/<mod name>/` | Stored together by the plugin or mod they belong to |
| `chat/` | Chat images and saved stickers you uploaded |
| `shared/` | General images |
| `cache/chat/`, `cache/log/` | Chat / session log caches with their own cleanup rules |

You can create your own folders. A directory only indicates ownership and doesn't restrict where images can be used; images of one deck or plugin are never split into other directories for global deduplication.

## Common Operations

- Search, sorting and server-side paging are supported, with 20 items per page by default.
- After selecting several items you can copy, cut, delete or download them as a ZIP; go to the target directory and paste, and overwriting files with the same name requires confirmation.
- Each row offers preview and copy image code; "More" offers copying the path, download, finding references, renaming and so on.
- Image ZIPs can be imported in bulk with their subdirectories kept; only images are accepted and scripts in the package are never run.
- Replies, roll texts, decks, plugin template settings and the chat simulator share the same image picker, where you can upload new images or reference existing resources directly.

Moving or renaming updates the references that were recognized, and old image codes and links keep working. Images that are still referenced can't be deleted; replace the references first, then move the image to the recycle bin, from which it can be restored if needed. Permanent deletion can't be undone, so be careful.

::: warning Dynamic paths can't all be detected statically
Plugins may build paths themselves, read external databases or list private directories. Finding no references doesn't guarantee an image is unused; we recommend moving it to the recycle bin and watching for a while rather than deleting it permanently right away. Source code is never rewritten automatically to migrate images.
:::

## Migration and Backups

After startup, old Next image directories are reorganized in the background; if a problem occurs, the source files are kept and a migration notice is shown. Importing from the old Dice! is read-only on the source bot: deck images are copied into Next and Next's references are adjusted, without modifying the old files.

Private plugin / mod resources are filed by name. Lua file reads and writes of registered images keep working through path aliases; old private paths that can't be proven deletable keep a compatibility copy so that dynamic calls don't break.

Backups save the chosen images and the path index; a partial restore merges the index so links to images you didn't choose aren't lost. Chat and log caches are still cleaned up by their original retention / deletion rules, and permanent resources such as replies and decks are never cleaned up.

Managing and previewing require a panel login or API key. Ordinary previews never make images public; when HTTP sending is configured, permanent resources can get random token links, and caches are never made public through the resource sharing entry.

To move decks together with their images to another bot, see [`.deck` packages](/en/use/deck#deck-牌堆包).
