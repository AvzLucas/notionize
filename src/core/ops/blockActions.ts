import { ownEnd } from "../blocks/query";
import type { Block } from "../blocks/types";
import { diff, removeLines, type Edit } from "./edit";

export type BlockKind =
  | "paragraph"
  | "task"
  | "bullet"
  | "numbered"
  | "h1"
  | "h2"
  | "h3"
  | "quote"
  | "callout"
  | "toggle"
  | "code";

const MARKERS: Record<Exclude<BlockKind, "code">, string> = {
  paragraph: "",
  task: "- [ ] ",
  bullet: "- ",
  numbered: "1. ",
  h1: "# ",
  h2: "## ",
  h3: "### ",
  quote: "> ",
  callout: "> [!note] ",
  toggle: "+ ",
};

export function toggleTask(text: string, block: Block): Edit | null {
  if (block.type !== "task") return null;
  const box = text.indexOf("[", block.marker.from) + 1;
  if (box <= 0 || box >= block.marker.to) return null;
  const next = block.checked ? " " : "x";
  return diff(text, text.slice(0, box) + next + text.slice(box + 1), box + 1);
}

export function deleteBlock(text: string, block: Block): Edit {
  const removed = removeLines(text, block.from, block.to);
  return diff(text, removed.text, removed.at);
}

export function duplicateBlock(text: string, block: Block): Edit {
  const copy = text.slice(block.from, block.to);
  const result = text.slice(0, block.to) + "\n" + copy + text.slice(block.to);
  return diff(text, result, block.to + 1 + copy.length);
}

export function contentLines(text: string, block: Block): string[] {
  const end = ownEnd(text, block);
  const lines = text.slice(block.from, end).split("\n");

  if (block.type === "code") {
    const inner = lines.slice(1, block.closing ? -1 : undefined);
    return inner.map((line) => line.slice(Math.min(block.indent, leadingWhitespace(line))));
  }

  const markerLength = block.marker ? block.marker.to - block.marker.from : 0;
  const prefixLengths = block.continuation.map((range) => range.to - range.from);
  return lines.map((line, index) => {
    const body = line.slice(Math.min(block.indent, leadingWhitespace(line)));
    const cut = index === 0 ? markerLength : (prefixLengths[index - 1] ?? 0);
    return body.slice(cut);
  });
}

export function convertBlock(text: string, block: Block, kind: BlockKind): Edit {
  const end = ownEnd(text, block);
  const prefix = text.slice(block.from, block.from + block.indent);
  const lines = contentLines(text, block);
  let rebuilt: string[];

  if (kind === "code") {
    rebuilt = [prefix + "```", ...lines.map((line) => prefix + line), prefix + "```"];
  } else {
    const marker = MARKERS[kind];
    const rest = kind === "quote" || kind === "callout" ? "> " : "";
    rebuilt = lines.map((line, index) => prefix + (index === 0 ? marker : rest) + line);
  }

  const replacement = rebuilt.join("\n");
  const firstLineEnd = block.from + rebuilt[0]!.length;
  const cursor = kind === "code" ? block.from + rebuilt[0]!.length + 1 + (rebuilt[1]?.length ?? 0) : firstLineEnd;
  return diff(text, text.slice(0, block.from) + replacement + text.slice(end), cursor);
}

function leadingWhitespace(line: string): number {
  return /^[ \t]*/.exec(line)![0].length;
}
