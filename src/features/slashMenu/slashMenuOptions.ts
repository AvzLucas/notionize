import type { SlashComponent } from "../../components/componentTypes";

export interface SlashMenuOption {
  title: string;
  description: string;
  aliases: string[];
  insert: SlashComponent;
}

export const slashMenuOptions: SlashMenuOption[] = [
  { title: "To-do list", description: "Track a task", aliases: ["todo", "task", "checkbox"], insert: "task" },
  { title: "Callout", description: "Add an callout", aliases: ["callout", "info"], insert: "callout" },
  { title: "Code", description: "Add a code block", aliases: ["code", "codeblock"], insert: "code" },
  { title: "Quote", description: "Add a quote", aliases: ["quote"], insert: "quote" },
  { title: "Heading 1", description: "Add a big heading", aliases: ["heading-1", "heading", "header", "h1", "title"], insert: "H1" },
  { title: "Heading 2", description: "Add a mid heading", aliases: ["heading-2", "heading", "header", "h2", "title"], insert: "H2" },
  { title: "Heading 3", description: "Add a small heading", aliases: ["heading-3", "heading", "header", "h3", "title"], insert: "H3" },
];
