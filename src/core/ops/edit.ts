import type { Range } from "../blocks/types";

export interface Edit {
  from: number;
  to: number;
  insert: string;
  cursor: number;
}

export function diff(before: string, after: string, cursor: number): Edit {
  let start = 0;
  const max = Math.min(before.length, after.length);
  while (start < max && before.charCodeAt(start) === after.charCodeAt(start)) start++;
  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before.charCodeAt(endBefore - 1) === after.charCodeAt(endAfter - 1)) {
    endBefore--;
    endAfter--;
  }
  return { from: start, to: endBefore, insert: after.slice(start, endAfter), cursor };
}

export function removeRanges(text: string, ranges: Range[]): string {
  const sorted = [...ranges].sort((a, b) => b.from - a.from);
  let out = text;
  for (const range of sorted) out = out.slice(0, range.from) + out.slice(range.to);
  return out;
}

export function removeLines(text: string, from: number, to: number): { text: string; at: number } {
  if (to < text.length) return { text: text.slice(0, from) + text.slice(to + 1), at: from };
  if (from > 0) return { text: text.slice(0, from - 1) + text.slice(to), at: from - 1 };
  return { text: text.slice(to), at: 0 };
}
