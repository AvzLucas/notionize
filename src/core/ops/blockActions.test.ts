import { describe, expect, test } from "vitest";
import { parseBlocks } from "../blocks/parseBlocks";
import { flatten } from "../blocks/query";
import { convertBlock, deleteBlock, duplicateBlock, toggleTask } from "./blockActions";
import { apply } from "./testUtils";

const first = (text: string) => flatten(parseBlocks(text))[0]!;

describe("toggleTask", () => {
  test("checks and unchecks", () => {
    expect(apply("- [ ] a", toggleTask("- [ ] a", first("- [ ] a")))!.text).toBe("- [x] a");
    expect(apply("- [x] a", toggleTask("- [x] a", first("- [x] a")))!.text).toBe("- [ ] a");
  });

  test("ignores blocks that aren't tasks", () => {
    expect(toggleTask("- a", first("- a"))).toBeNull();
  });
});

describe("deleteBlock and duplicateBlock", () => {
  test("delete removes the block with its children", () => {
    const text = "- a\n  - a1\n- b";
    expect(apply(text, deleteBlock(text, first(text)))!.text).toBe("- b");
  });

  test("duplicate inserts a copy right after", () => {
    const text = "- a\n  - a1\n- b";
    expect(apply(text, duplicateBlock(text, first(text)))!.text).toBe("- a\n  - a1\n- a\n  - a1\n- b");
  });
});

describe("convertBlock", () => {
  test.each([
    ["Plain", "task", "- [ ] Plain"],
    ["- [ ] Task", "h2", "## Task"],
    ["## Head", "paragraph", "Head"],
    ["- item", "numbered", "1. item"],
    ["Text", "quote", "> Text"],
    ["Text", "callout", "> [!note] Text"],
    ["> one\n> two", "paragraph", "one\ntwo"],
    ["> [!info] T\n> body", "task", "- [ ] T\nbody"],
    ["Line", "code", "```\nLine\n```"],
    ["- item", "toggle", "+ item"],
    ["```\nlet a\n```", "paragraph", "let a"],
    ["  - nested", "task", "  - [ ] nested"],
  ])("%j → %s", (text, kind, expected) => {
    expect(apply(text, convertBlock(text, first(text), kind as never))!.text).toBe(expected);
  });
});
