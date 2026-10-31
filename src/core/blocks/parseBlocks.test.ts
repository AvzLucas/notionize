import { describe, expect, test } from "vitest";
import { parseBlocks } from "./parseBlocks";

const lines = (blocks: { line: number }[]) => blocks.map((b) => b.line);

describe("parseBlocks: nesting", () => {
  test("empty note → no blocks", () => {
    expect(parseBlocks("")).toEqual([]);
  });

  test("flat list: two top-level blocks, no children", () => {
    const blocks = parseBlocks("- a\n- b");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "bullet", line: 0, from: 0, to: 3, children: [] });
    expect(blocks[1]).toMatchObject({ type: "bullet", line: 1, from: 4, to: 7, children: [] });
  });

  test("marker positions are in NOTE coordinates, not line coordinates", () => {
    const blocks = parseBlocks("- a\n- b");
    expect(blocks[1]!.marker).toEqual({ from: 4, to: 6 });
  });

  test("one level: an indented line is a child of the line above", () => {
    const text = ["- [ ] milk", "    - [x] oat milk", "- [ ] eggs"].join("\n");
    const blocks = parseBlocks(text);
    expect(lines(blocks)).toEqual([0, 2]);
    expect(lines(blocks[0]!.children)).toEqual([1]);
    expect(blocks[0]!.children[0]).toMatchObject({
      type: "task", checked: true, indent: 4,
      from: 11, to: 29, marker: { from: 15, to: 21 },
    });
  });

  test("a parent's `to` includes all its children", () => {
    const [milk] = parseBlocks("- [ ] milk\n    - [x] oat milk\n- [ ] eggs");
    expect(milk).toMatchObject({ from: 0, to: 29 });
  });

  test("three levels, then back out to the middle level", () => {
    const text = [
      "- [ ] groceries",
      "    - [ ] milk",
      "        - [x] oat milk",
      "    - [ ] eggs",
      "## Plans",
      "Call the bank",
    ].join("\n");
    const [groceries, plans, call] = parseBlocks(text);
    expect(lines(groceries!.children)).toEqual([1, 3]);
    expect(lines(groceries!.children[0]!.children)).toEqual([2]);
    expect(groceries).toMatchObject({ from: 0, to: 68 });
    expect(groceries!.children[0]).toMatchObject({ from: 16, to: 53 });
    expect(plans).toMatchObject({ type: "heading", line: 4, children: [] });
    expect(call).toMatchObject({ type: "paragraph", line: 5, from: 78, to: 91 });
  });

  test("a heading and the text under it are siblings, like in Notion", () => {
    const blocks = parseBlocks("# Title\nSome text");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph"]);
    expect(blocks[0]!.children).toEqual([]);
  });

  test("an indented paragraph under a list item is its child", () => {
    const [item] = parseBlocks("- item\n  continued text");
    expect(item!.children).toHaveLength(1);
    expect(item!.children[0]).toMatchObject({ type: "paragraph", line: 1 });
  });

  test("blank lines are skipped, but line numbers and positions still count them", () => {
    const blocks = parseBlocks("- a\n\n- b");
    expect(blocks).toHaveLength(2);
    expect(blocks[1]).toMatchObject({ line: 2, from: 5 });
  });

  test("a blank line inside a list doesn't break nesting", () => {
    const blocks = parseBlocks("- a\n\n    - b");
    expect(blocks).toHaveLength(1);
    expect(lines(blocks[0]!.children)).toEqual([2]);
    expect(blocks[0]).toMatchObject({ from: 0, to: 12 });
  });

  test("a trailing newline doesn't create a block", () => {
    expect(parseBlocks("- a\n")).toHaveLength(1);
  });
});

describe("parseBlocks: containers", () => {
  test("a callout and its following > lines are one block", () => {
    const text = "> [!info] Title\n> first\n>\n> last\nAfter";
    const [callout, after] = parseBlocks(text);
    expect(callout).toMatchObject({ type: "callout", line: 0, endLine: 3, from: 0, to: 32 });
    expect(callout!.continuation).toEqual([
      { from: 16, to: 18 },
      { from: 24, to: 25 },
      { from: 26, to: 28 },
    ]);
    expect(after).toMatchObject({ type: "paragraph", line: 4 });
  });

  test("consecutive quote lines are one quote block", () => {
    const [quote] = parseBlocks("> one\n> two");
    expect(quote).toMatchObject({ type: "quote", endLine: 1, to: 11, continuation: [{ from: 6, to: 8 }] });
  });

  test("a blank line ends a quote", () => {
    expect(parseBlocks("> one\n\n> two")).toHaveLength(2);
  });

  test("table rows are one table block", () => {
    const [table] = parseBlocks("| a | b |\n| - | - |\n| 1 | 2 |");
    expect(table).toMatchObject({ type: "table", line: 0, endLine: 2 });
  });
});

describe("parseBlocks: code fences and frontmatter", () => {
  test("a code block spans to its closing fence, and its lines are not parsed", () => {
    const text = "```ts\n- [ ] not a task\n```\n- [ ] real";
    const [code, task] = parseBlocks(text);
    expect(code).toMatchObject({ type: "code", language: "ts", line: 0, endLine: 2, from: 0, to: 26, closing: { from: 23, to: 26 } });
    expect(code!.children).toEqual([]);
    expect(task).toMatchObject({ type: "task", line: 3 });
  });

  test("an unclosed code block runs to the end of the note", () => {
    const [code] = parseBlocks("```\nx\ny");
    expect(code).toMatchObject({ endLine: 2, to: 7, closing: null });
  });

  test("a shorter fence doesn't close a longer one", () => {
    const [code] = parseBlocks("````\n```\n````");
    expect(code).toMatchObject({ endLine: 2 });
  });

  test("frontmatter is skipped", () => {
    const blocks = parseBlocks("---\ntags: [a]\n- not a block\n---\n# Title");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "heading", line: 4 });
  });

  test("a code block nested in a list item extends its parent", () => {
    const [item] = parseBlocks("- item\n  ```\n  code\n  ```");
    expect(item!.children[0]).toMatchObject({ type: "code", endLine: 3 });
    expect(item!.to).toBe(25);
  });
});

describe("parseBlocks: indented blank lines inside a toggle", () => {
  test("an indented blank line under a toggle extends the toggle's range", () => {
    const text = "+ thing\n\t";
    const [toggle] = parseBlocks(text);
    expect(toggle).toMatchObject({ type: "toggle", to: text.length, children: [] });
  });

  test("trailing indented blank line after a child is still inside the toggle", () => {
    const text = "+ thing\n\tchild\n\t";
    const [toggle] = parseBlocks(text);
    expect(toggle!.to).toBe(text.length);
    expect(toggle!.children).toHaveLength(1);
  });

  test("a blank line that is not indented deeper does not extend the toggle", () => {
    const [toggle] = parseBlocks("+ thing\n");
    expect(toggle!.to).toBe(7);
  });

  test("indented blank lines under a non-toggle block are ignored", () => {
    const [bullet] = parseBlocks("- a\n\t");
    expect(bullet!.to).toBe(3);
  });
});
