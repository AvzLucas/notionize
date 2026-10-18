import type { SlashComponent } from "./componentTypes";

interface Insertion {
  text: string;
  cursor: { line: number; ch: number };
}

export const getInsertion = (
  line: number,
  ch: number,
  component: SlashComponent,
  indentation: string,
): Insertion => {
  const insertions = {
    task: { text: "- [ ] ", cursor: { line, ch: ch + 6 } },
    callout: {
      text: `> [!info]\n${indentation}> `,
      cursor: { line: line + 1, ch: indentation.length + 2 },
    },
    code: {
      text: `\`\`\`\n${indentation}\n${indentation}\`\`\``,
      cursor: { line: line + 1, ch: indentation.length },
    },
    quote: { text: "> ", cursor: { line, ch: ch + 2 } },
    H1: { text: "# ", cursor: { line, ch: ch + 2 } },
    H2: { text: "## ", cursor: { line, ch: ch + 3 } },
    H3: { text: "### ", cursor: { line, ch: ch + 4 } },
  };

  return insertions[component];
};
