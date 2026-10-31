import { blockAtPos, lineStart, ownEnd } from "../blocks/query";
import type { Block } from "../blocks/types";
import { diff, removeLines, removeRanges, type Edit } from "./edit";

const MARKER_ONLY = new Set(["task", "heading", "bullet", "numbered", "toggle"]);

export function backspace(text: string, blocks: Block[], pos: number): Edit | null {
  const block = blockAtPos(text, blocks, pos);
  if (!block || !block.marker) return null;

  if (block.type === "code") return backspaceInCode(text, block, pos);

  if (pos === block.marker.to) {
    if (MARKER_ONLY.has(block.type)) {
      return diff(text, removeRanges(text, [block.marker]), block.marker.from);
    }
    if (block.type === "quote" || block.type === "callout") {
      if (block.type === "callout" && isEmptyContainer(text, block)) {
        const removed = removeLines(text, block.from, ownEnd(text, block));
        return diff(text, removed.text, removed.at);
      }
      return diff(text, removeRanges(text, [block.marker, ...block.continuation]), block.marker.from);
    }
  }

  for (const prefix of block.continuation) {
    if (pos === prefix.to) {
      const start = lineStart(text, prefix.from);
      return diff(text, text.slice(0, start - 1) + text.slice(prefix.to), start - 1);
    }
  }

  return null;
}

function backspaceInCode(text: string, block: Block, pos: number): Edit | null {
  const marker = block.marker!;
  const contentStart = marker.to + 1;
  if (pos !== contentStart || contentStart > text.length) return null;

  const end = ownEnd(text, block);
  const closingLineStart = block.closing ? lineStart(text, block.closing.from) : null;
  const content = text.slice(contentStart, closingLineStart === null ? end : Math.max(contentStart, closingLineStart - 1));

  if (content.trim() === "") {
    const removed = removeLines(text, block.from, end);
    return diff(text, removed.text, removed.at);
  }

  const replaced = text.slice(0, block.from) + content + text.slice(end);
  return diff(text, replaced, block.from);
}

function isEmptyContainer(text: string, block: Block): boolean {
  const end = ownEnd(text, block);
  const withoutMarkers = removeRanges(text.slice(0, end), [block.marker!, ...block.continuation]);
  return withoutMarkers.slice(block.from).trim() === "";
}
