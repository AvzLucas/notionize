type Component = "task"| "callout" | "code" | "H1"| "H2" | "H3" | "quote"

export interface SlashMenuOption {
  title: string;
  description: string;
  aliases: string[];
  insert: Component;
}

interface Insertion {
  text: string,
  cursor: { line: number, ch: number},
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

export const getInsertion = (line: number, ch: number, component: Component, indentation: string): Insertion => {
  const insertions = {
    task: { text: "- [ ] ", cursor: { line, ch: ch + 6 } },
    callout: { text: "> [!info] ", cursor: { line, ch: ch + 10 } },
    code: {
      text: `\`\`\`\n${indentation}\n${indentation}\`\`\``,
      cursor: { line: line + 1, ch: indentation.length },
    },
    quote: { text: "> **", cursor: { line, ch: ch + 3 } },
    H1: { text: "# ", cursor: { line, ch: ch + 2 } },
    H2: { text: "## ", cursor: { line, ch: ch + 3 } },
    H3: { text: "### ", cursor: { line, ch: ch + 4 } },
  };
          
  return insertions[component]
}
