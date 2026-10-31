import type { Block } from "../blocks/types";
import { diff, removeLines, type Edit } from "./edit";

export type Side = "before" | "after" | "inside";

export function canMove(block: Block, target: Block): boolean {
  return !(target.from >= block.from && target.to <= block.to);
}

export function moveBlock(text: string, block: Block, target: Block, side: Side, unit = "\t"): Edit | null {
  if (!canMove(block, target)) return null;

  const titleEnd = lineEndOf(text, target.from);
  const targetPrefix = text.slice(target.from, target.from + target.indent);
  const prefix = side === "inside" ? targetPrefix + unit : targetPrefix;
  const chunk = text
    .slice(block.from, block.to)
    .split("\n")
    .map((line) => (line.trim() === "" ? "" : prefix + line.slice(Math.min(block.indent, leadingWhitespace(line)))))
    .join("\n");

  const removed = removeLines(text, block.from, block.to);
  const removedLength = text.length - removed.text.length;
  const anchor = side === "before" ? target.from : side === "inside" ? titleEnd : target.to;
  const insertAt = anchor > block.from ? anchor - removedLength : anchor;

  const inserted = side === "before" ? chunk + "\n" : "\n" + chunk;
  const result = removed.text.slice(0, insertAt) + inserted + removed.text.slice(insertAt);
  const chunkStart = side === "before" ? insertAt : insertAt + 1;
  const firstLineEnd = chunk.indexOf("\n") === -1 ? chunk.length : chunk.indexOf("\n");

  return diff(text, result, chunkStart + firstLineEnd);
}

function leadingWhitespace(line: string): number {
  return /^[ \t]*/.exec(line)![0].length;
}

function lineEndOf(text: string, pos: number): number {
  const next = text.indexOf("\n", pos);
  return next === -1 ? text.length : next;
}
