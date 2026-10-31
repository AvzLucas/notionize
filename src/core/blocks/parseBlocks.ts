import { parseLine } from "./parseLine";
import type { Block, LineInfo } from "./types";

interface OpenFence {
  block: Block;
  char: string;
  length: number;
}

export function parseBlocks(text: string): Block[] {
  const roots: Block[] = [];
  const stack: Block[] = [];
  const lines = text.split("\n");
  const frontmatterEnd = findFrontmatterEnd(lines);
  let offset = 0;
  let fence: OpenFence | null = null;
  let last: Block | null = null;

  lines.forEach((lineText, line) => {
    const from = offset;
    const end = from + lineText.length;
    offset = end + 1;

    if (line <= frontmatterEnd) return;

    if (fence) {
      extend(fence.block, line, end, stack);
      if (closesFence(lineText, fence)) {
        const indent = lineText.length - lineText.trimStart().length;
        fence.block.closing = { from: from + indent, to: end };
        fence = null;
      }
      return;
    }

    const info = parseLine(lineText);
    if (info.type === "blank") {
      last = null;
      keepInToggle(stack, info.indent, end);
      return;
    }

    if (last && last.endLine === line - 1 && last.indent === info.indent && continues(last, info)) {
      if (info.marker) last.continuation.push({ from: from + info.marker.from, to: from + info.marker.to });
      extend(last, line, end, stack);
      return;
    }

    const marker = info.marker && { from: from + info.marker.from, to: from + info.marker.to };
    const block = {
      ...info,
      marker,
      line,
      endLine: line,
      from,
      to: end,
      continuation: [],
      closing: null,
      children: [],
    } as Block;

    while (stack.length > 0 && stack[stack.length - 1]!.indent >= block.indent) stack.pop();

    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(block);
    else roots.push(block);

    for (const ancestor of stack) ancestor.to = block.to;
    stack.push(block);

    if (block.type === "code") fence = { block, char: block.fence[0]!, length: block.fence.length };
    last = block;
  });

  return roots;
}

function keepInToggle(stack: Block[], indent: number, end: number): void {
  let owner = stack.length - 1;
  while (owner >= 0 && stack[owner]!.indent >= indent) owner--;
  if (owner < 0 || stack[owner]!.type !== "toggle") return;
  for (let i = 0; i <= owner; i++) stack[i]!.to = Math.max(stack[i]!.to, end);
}

export function findFrontmatterEnd(lines: string[]): number {
  if (lines[0] !== "---") return -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---" || lines[i] === "...") return i;
  }
  return -1;
}

function continues(last: Block, info: LineInfo): boolean {
  if (last.type === "quote" || last.type === "callout") return info.type === "quote";
  if (last.type === "table") return info.type === "table";
  return false;
}

function closesFence(lineText: string, fence: OpenFence): boolean {
  const trimmed = lineText.trim();
  return trimmed.length >= fence.length && trimmed === fence.char.repeat(trimmed.length);
}

function extend(block: Block, line: number, end: number, stack: Block[]): void {
  block.endLine = line;
  block.to = Math.max(block.to, end);
  for (const ancestor of stack) ancestor.to = Math.max(ancestor.to, end);
}
