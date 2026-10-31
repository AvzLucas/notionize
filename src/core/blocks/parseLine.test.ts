import { describe, expect, test } from "vitest";
import { parseLine } from "./parseLine";

describe("parseLine", () => {
  test.each([
    ["Plain text", "paragraph", 0, null],
    ["", "blank", 0, null],
    ["   ", "blank", 3, null],
    ["#hashtag", "paragraph", 0, null],
    ["####### seven", "paragraph", 0, null],
    ["-not a bullet", "paragraph", 0, null],
    ["- item", "bullet", 0, { from: 0, to: 2 }],
    ["* item", "bullet", 0, { from: 0, to: 2 }],
    ["+ toggle", "toggle", 0, { from: 0, to: 2 }],
    ["+ [ ] still a task", "task", 0, { from: 0, to: 6 }],
    ["- ", "bullet", 0, { from: 0, to: 2 }],
    ["1. first", "numbered", 0, { from: 0, to: 3 }],
    ["10) tenth", "numbered", 0, { from: 0, to: 4 }],
    ["> a quote", "quote", 0, { from: 0, to: 2 }],
    [">", "quote", 0, { from: 0, to: 1 }],
    ["    - [ ] nested", "task", 4, { from: 4, to: 10 }],
    ["\t- item", "bullet", 1, { from: 1, to: 3 }],
    ["| a | b |", "table", 0, null],
  ])("%j → %s", (line, type, indent, marker) => {
    const info = parseLine(line);
    expect(info.type).toBe(type);
    expect(info.indent).toBe(indent);
    expect(info.marker).toEqual(marker);
  });

  test("headings 1–6 with their level", () => {
    expect(parseLine("# Title")).toMatchObject({ type: "heading", level: 1, marker: { from: 0, to: 2 } });
    expect(parseLine("###### Six")).toMatchObject({ type: "heading", level: 6, marker: { from: 0, to: 7 } });
  });

  test("tasks: checked or not, with -, *, + or a number", () => {
    expect(parseLine("- [ ] milk")).toMatchObject({ type: "task", checked: false, marker: { from: 0, to: 6 } });
    expect(parseLine("- [x] done")).toMatchObject({ type: "task", checked: true, marker: { from: 0, to: 6 } });
    expect(parseLine("- [X] done")).toMatchObject({ type: "task", checked: true, marker: { from: 0, to: 6 } });
    expect(parseLine("* [ ] star")).toMatchObject({ type: "task", marker: { from: 0, to: 6 } });
    expect(parseLine("1. [ ] numbered")).toMatchObject({ type: "task", marker: { from: 0, to: 7 } });
  });

  test("callouts: type and fold", () => {
    expect(parseLine("> [!info] Title")).toMatchObject({ type: "callout", calloutType: "info", marker: { from: 0, to: 10 } });
    expect(parseLine("> [!tip]- Folded")).toMatchObject({ type: "callout", calloutType: "tip", fold: "-", marker: { from: 0, to: 10 } });
  });

  test("callouts: any type, not only info and tip", () => {
    expect(parseLine("> [!warning] Careful")).toMatchObject({ type: "callout", calloutType: "warning", marker: { from: 0, to: 13 } });
    expect(parseLine("> [!my-type] Custom")).toMatchObject({ type: "callout", calloutType: "my-type" });
  });

  test("callouts: no title after the type", () => {
    expect(parseLine("> [!note]")).toMatchObject({ type: "callout", calloutType: "note", marker: { from: 0, to: 9 } });
  });

  test("code fences: the whole line is the marker, with fence and language", () => {
    expect(parseLine("```ts")).toMatchObject({ type: "code", fence: "```", language: "ts", marker: { from: 0, to: 5 } });
    expect(parseLine("~~~~")).toMatchObject({ type: "code", fence: "~~~~", language: "" });
    expect(parseLine("  ```")).toMatchObject({ type: "code", indent: 2, marker: { from: 2, to: 5 } });
  });
});
