import { describe, expect, test } from "vitest";
import { insertion } from "./templates";

describe("insertion", () => {
  test("a quote is just the marker, cursor after it", () => {
    expect(insertion("quote", "")).toEqual({ text: "> ", cursor: 2 });
  });

  test("a callout puts the cursor in its body, not its title", () => {
    expect(insertion("callout", "")).toEqual({ text: "> [!note]\n> ", cursor: 12 });
  });

  test("a code block puts the cursor on the empty middle line, indented", () => {
    expect(insertion("code", "  ")).toEqual({ text: "```\n  \n  ```", cursor: 6 });
  });

  test("a toggle is a + item with the cursor on its title", () => {
    expect(insertion("toggle", "  ")).toEqual({ text: "+ ", cursor: 2 });
  });

  test("a card view is a Bases block", () => {
    expect(insertion("card-view", "  ").text).toBe("```base\nviews:\n  - type: cards\n    name: Cards\n```\n");
  });

  test("a table view limited to a folder filters on that folder", () => {
    expect(insertion("table-view", "", "Projects/Tasks").text).toBe(
      "```base\nfilters:\n  and:\n    - 'file.folder == \"Projects/Tasks\"'\nviews:\n  - type: table\n    name: Table\n```\n",
    );
  });

  test("a folder with quotes is escaped in the filter and in YAML", () => {
    expect(insertion("card-view", "", `Bob's "notes"`).text).toContain(`- 'file.folder == "Bob''s \\"notes\\""'`);
  });

  test("the cursor lands after the closing fence of a folder view", () => {
    const { text, cursor } = insertion("table-view", "", "A");
    expect(cursor).toBe(text.length);
  });

  test("a folder is ignored for blocks that are not views", () => {
    expect(insertion("quote", "", "A")).toEqual(insertion("quote", ""));
  });
});
