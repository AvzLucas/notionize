export type InsertKind =
  | "paragraph"
  | "task"
  | "bullet"
  | "numbered"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "callout"
  | "toggle"
  | "code"
  | "divider"
  | "table-view"
  | "card-view";

export interface Insertion {
  text: string;
  cursor: number;
}

const CURSOR = "\u0000";

function baseBlock(type: string, name: string, folder?: string): string {
  const filters = folder === undefined ? "" : `filters:\n  and:\n    - ${folderFilter(folder)}\n`;
  return "```base\n" + filters + `views:\n  - type: ${type}\n    name: ${name}\n` + "```\n" + CURSOR;
}

function folderFilter(folder: string): string {
  const literal = folder.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `'${`file.folder == "${literal}"`.replace(/'/g, "''")}'`;
}

const TEMPLATES: Record<InsertKind, string> = {
  paragraph: CURSOR,
  task: "- [ ] " + CURSOR,
  bullet: "- " + CURSOR,
  numbered: "1. " + CURSOR,
  h1: "# " + CURSOR,
  h2: "## " + CURSOR,
  h3: "### " + CURSOR,
  quote: "> " + CURSOR,
  callout: "> [!note]\n> " + CURSOR,
  toggle: "+ " + CURSOR,
  code: "```\n" + CURSOR + "\n```",
  divider: "---\n" + CURSOR,
  "table-view": baseBlock("table", "Table"),
  "card-view": baseBlock("cards", "Cards"),
};

const NO_INDENT = new Set<InsertKind>(["h1", "h2", "h3", "divider", "table-view", "card-view"]);

const VIEWS = {
  "table-view": ["table", "Table"],
  "card-view": ["cards", "Cards"],
} as const;

export function isView(kind: InsertKind): kind is keyof typeof VIEWS {
  return kind in VIEWS;
}

export function insertion(kind: InsertKind, indent: string, folder?: string): Insertion {
  const prefix = NO_INDENT.has(kind) ? "" : indent;
  const template = isView(kind) && folder !== undefined ? baseBlock(VIEWS[kind][0], VIEWS[kind][1], folder) : TEMPLATES[kind];
  const lines = template.split("\n").map((line, index) => (index === 0 ? line : prefix + line));
  const full = lines.join("\n");
  const cursor = full.indexOf(CURSOR);
  return { text: full.replace(CURSOR, ""), cursor };
}

export function keepsIndent(kind: InsertKind): boolean {
  return !NO_INDENT.has(kind);
}
