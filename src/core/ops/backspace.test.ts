import { describe, expect, test } from "vitest";
import { parseBlocks } from "../blocks/parseBlocks";
import { backspace } from "./backspace";
import { apply } from "./testUtils";

const run = (text: string, pos: number) => apply(text, backspace(text, parseBlocks(text), pos));

describe("backspace", () => {
  test.each([
    ["- [ ] milk", 6, "milk", 0],
    ["## Title", 3, "Title", 0],
    ["- item", 2, "item", 0],
    ["1. first", 3, "first", 0],
    ["+ toggle", 2, "toggle", 0],
    ["a\n- [x] done", 8, "a\ndone", 2],
    ["  - [ ] nested", 8, "  nested", 2],
  ])("at the start of %j's text removes the marker", (text, pos, expected, cursor) => {
    expect(run(text, pos)).toEqual({ text: expected, cursor });
  });

  test("an empty to-do loses its marker in one press", () => {
    expect(run("- [ ] ", 6)).toEqual({ text: "", cursor: 0 });
  });

  test("anywhere else, Backspace is left to the editor", () => {
    expect(run("- [ ] milk", 8)).toBeNull();
    expect(run("Plain text", 0)).toBeNull();
    expect(run("Plain text", 5)).toBeNull();
  });

  test("a quote is unwrapped, every line", () => {
    expect(run("> one\n> two", 2)).toEqual({ text: "one\ntwo", cursor: 0 });
  });

  test("an empty callout is removed entirely", () => {
    expect(run("Before\n> [!note]\n> \nAfter", 16)).toEqual({ text: "Before\nAfter", cursor: 7 });
  });

  test("a callout with text is unwrapped", () => {
    expect(run("> [!note] Title\n> body", 10)).toEqual({ text: "Title\nbody", cursor: 0 });
  });

  test("at the start of a callout's second line, it merges with the line above", () => {
    expect(run("> [!note] Title\n> body", 18)).toEqual({ text: "> [!note] Titlebody", cursor: 15 });
  });

  test("an empty code block is removed", () => {
    expect(run("```\n\n```\nAfter", 4)).toEqual({ text: "After", cursor: 0 });
  });

  test("a code block with content is unwrapped into plain lines", () => {
    expect(run("```js\nlet a = 1\n```", 6)).toEqual({ text: "let a = 1", cursor: 0 });
  });
});
