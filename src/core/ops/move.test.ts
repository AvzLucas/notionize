import { describe, expect, test } from "vitest";
import { parseBlocks } from "../blocks/parseBlocks";
import { flatten } from "../blocks/query";
import { moveBlock } from "./move";
import { apply } from "./testUtils";

const byLine = (text: string, line: number) => flatten(parseBlocks(text)).find((b) => b.line === line)!;

const move = (text: string, from: number, to: number, side: "before" | "after") =>
  apply(text, moveBlock(text, byLine(text, from), byLine(text, to), side))?.text ?? null;

describe("moveBlock", () => {
  const list = "- a\n- b\n- c";

  test("moves a block down, after another", () => {
    expect(move(list, 0, 2, "after")).toBe("- b\n- c\n- a");
  });

  test("moves a block up, before another", () => {
    expect(move(list, 2, 0, "before")).toBe("- c\n- a\n- b");
  });

  test("moving next to itself changes nothing", () => {
    expect(move(list, 1, 0, "after")).toBe(list);
  });

  test("a parent carries its children", () => {
    const text = "- a\n  - a1\n  - a2\n- b";
    expect(move(text, 0, 3, "after")).toBe("- b\n- a\n  - a1\n  - a2");
  });

  test("dropping after a parent goes after its whole subtree", () => {
    const text = "- x\n- a\n  - a1";
    expect(move(text, 0, 1, "after")).toBe("- a\n  - a1\n- x");
  });

  test("a child moved next to a top-level block is re-indented", () => {
    const text = "- a\n    - a1\n- b";
    expect(move(text, 1, 2, "after")).toBe("- a\n- b\n- a1");
  });

  test("a top-level block moved next to a child is indented to match", () => {
    const text = "- a\n  - a1\n- b";
    expect(move(text, 2, 1, "before")).toBe("- a\n  - b\n  - a1");
  });

  test("a block can't be dropped inside itself", () => {
    const text = "- a\n  - a1";
    expect(move(text, 0, 1, "after")).toBeNull();
  });

  test("a multi-line callout moves as one block", () => {
    const text = "Top\n> [!note] T\n> body\nEnd";
    expect(move(text, 1, 0, "before")).toBe("> [!note] T\n> body\nTop\nEnd");
  });

  test("the cursor lands at the end of the moved block's first line", () => {
    const text = "- a\n- b";
    const edit = moveBlock(text, byLine(text, 0), byLine(text, 1), "after")!;
    const result = apply(text, edit)!;
    expect(result.text.slice(0, result.cursor)).toBe("- b\n- a");
  });

  test("dropping inside a toggle makes the block its first child", () => {
    const text = "+ toggle\n- a\n- b";
    const toggle = byLine(text, 0);
    const edit = moveBlock(text, byLine(text, 2), toggle, "inside");
    expect(apply(text, edit)!.text).toBe("+ toggle\n\t- b\n- a");
  });

  test("dropping inside a toggle that already has children puts it first", () => {
    const text = "- a\n+ toggle\n\t- child";
    expect(apply(text, moveBlock(text, byLine(text, 0), byLine(text, 1), "inside"))!.text).toBe("+ toggle\n\t- a\n\t- child");
  });

  test("inside uses the given indent unit and keeps nested children", () => {
    const text = "+ t\n- a\n  - a1";
    expect(apply(text, moveBlock(text, byLine(text, 1), byLine(text, 0), "inside", "    "))!.text).toBe("+ t\n    - a\n      - a1");
  });
});
