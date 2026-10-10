export interface SlashMenuOption {
  title: string;
  description: string;
  aliases: string[];
  insert: "task" | "callout" | "code";
}

export const slashMenuOptions: SlashMenuOption[] = [
  { title: "To-do list", description: "Track a task", aliases: ["todo", "task", "checkbox"], insert: "task" },
  { title: "Callout", description: "Add an information callout", aliases: ["callout", "info"], insert: "callout" },
  { title: "Code", description: "Add a code block", aliases: ["code", "codeblock"], insert: "code" }
];
