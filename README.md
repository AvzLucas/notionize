# Notionize

Notionize brings a more intuitive, Notion-like writing experience to Obsidian while preserving portable Markdown files.

## Foundation

The first MVP feature is a slash menu that appears when `/` is typed on an otherwise blank line. It offers To-do list, Callout, and Code blocks, and filters as the user types (for example, `/tod`).

## Development

Requirements: Node.js 18 or later and an Obsidian vault for testing.

```bash
npm install
npm run dev
```

The development build writes `main.js` to the project root. To test it in Obsidian, place or link this project in `<your-vault>/.obsidian/plugins/notionize/`, then enable **Notionize** under **Settings → Community plugins**.
