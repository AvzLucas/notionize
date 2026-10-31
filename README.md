# Notionize

An Obsidian plugin for Notion lovers: write the way you do in Notion while your notes stay plain Markdown files.

## Features

- **Slash menu.** Type `/` on an empty line to add a to-do, heading, bulleted or numbered list, toggle, quote, callout, code block, divider, or a table or card view of your notes.
- **Drag handles.** Hover a block to see its handle. Drag it to move the block, with everything nested under it. Click it to delete, duplicate, or turn the block into another type.
- **Markdown stays out of sight.** In Live Preview, the syntax of the block you're editing (`## `, `> `, `- [ ] `, `> [!note]`, code fences) is hidden. To-dos show a real checkbox.
- **One Backspace removes a block's syntax.** At the start of a to-do, heading or list item, Backspace turns it into plain text. Empty callouts and code blocks are removed in one press.
- **Your files don't change format.** Everything Notionize writes is standard Obsidian Markdown. Turn the plugin off and your notes look exactly as before.

Table and card views use Obsidian's built-in Bases, so they need Obsidian 1.9 or newer.

## Demo

![Notionize slash menu demo](assets/slashMenuDemo.gif)

## Installation

### From Obsidian

Once Notionize is approved for the community directory: **Settings → Community plugins → Browse**, search for Notionize, then install and enable it.

### Manual installation

1. Download `main.js`, `manifest.json` and `styles.css` from the latest GitHub release.
2. Create the folder `.obsidian/plugins/notionize` in your vault and copy the three files into it.
3. In Obsidian, enable **Community plugins** and turn on **Notionize**.

## Development

```bash
git clone https://github.com/AvzLucas/notionize.git
cd notionize
npm install
npm test
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Rebuilds `main.js` on every change |
| `npm run build` | Type-checks and builds the production `main.js` |
| `npm run deploy` | Builds, then copies the plugin into your vault |
| `npm test` | Runs the tests in watch mode |

To use `npm run deploy`, copy `.env.example` to `.env` and set `OBSIDIAN_PLUGIN_DIR` to `/path/to/your/vault/.obsidian/plugins/notionize`.

### Releasing

Bump `version` in `manifest.json`, `package.json` and `versions.json`, commit, then push a tag with the same version (for example `0.2.0`). GitHub Actions runs the tests, builds the plugin and publishes the release with `main.js`, `manifest.json` and `styles.css`.

## Roadmap

- [ ] Notion-style template (optional, from settings)
- [ ] Columns

## License

[MIT](LICENSE)
