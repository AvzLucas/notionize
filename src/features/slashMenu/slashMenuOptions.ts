import type { IconName } from "obsidian";
import type { InsertKind } from "../../core/ops/templates";

export interface SlashMenuOption {
  title: string;
  description: string;
  aliases: string[];
  kind: InsertKind;
  icon: IconName;
}

export const slashMenuOptions: SlashMenuOption[] = [
  { title: "To-do list", description: "Track a task", aliases: ["todo", "task", "checkbox"], kind: "task", icon: "check-square" },
  { title: "Heading 1", description: "Big section heading", aliases: ["h1", "heading", "title"], kind: "h1", icon: "heading-1" },
  { title: "Heading 2", description: "Medium section heading", aliases: ["h2", "heading", "subtitle"], kind: "h2", icon: "heading-2" },
  { title: "Heading 3", description: "Small section heading", aliases: ["h3", "heading"], kind: "h3", icon: "heading-3" },
  { title: "Bulleted list", description: "A simple bulleted list", aliases: ["bullet", "list", "ul"], kind: "bullet", icon: "list" },
  { title: "Numbered list", description: "A list with numbers", aliases: ["numbered", "list", "ol"], kind: "numbered", icon: "list-ordered" },
  { title: "Toggle list", description: "Hide content inside", aliases: ["toggle", "fold", "collapse", "dropdown"], kind: "toggle", icon: "chevron-right" },
  { title: "Quote", description: "Capture a quote", aliases: ["quote", "blockquote"], kind: "quote", icon: "quote" },
  { title: "Callout", description: "Make text stand out", aliases: ["callout", "info", "note"], kind: "callout", icon: "info" },
  { title: "Code", description: "A code block", aliases: ["code", "codeblock", "snippet"], kind: "code", icon: "code" },
  { title: "Divider", description: "Separate sections", aliases: ["divider", "hr", "line", "separator"], kind: "divider", icon: "minus" },
  { title: "Table view", description: "Your notes as a table", aliases: ["table", "database", "view"], kind: "table-view", icon: "table" },
  { title: "Card view", description: "Your notes as cards", aliases: ["cards", "gallery", "board", "view"], kind: "card-view", icon: "layout-grid" },
];
