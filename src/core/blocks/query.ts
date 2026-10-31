import { findFrontmatterEnd } from "./parseBlocks";
import type { Block } from "./types";

export function flatten(blocks: Block[]): Block[] {
  const out: Block[] = [];
  const walk = (list: Block[]) => {
    for (const block of list) {
      out.push(block);
      walk(block.children);
    }
  };
  walk(blocks);
  return out;
}

export function blockAtLine(blocks: Block[], line: number): Block | null {
  return flatten(blocks).find((block) => block.line <= line && line <= block.endLine) ?? null;
}

export function blockAtPos(text: string, blocks: Block[], pos: number): Block | null {
  return blockAtLine(blocks, lineOf(text, pos));
}

export function lineOf(text: string, pos: number): number {
  let line = 0;
  for (let i = 0; i < pos && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

export function lineStart(text: string, pos: number): number {
  return text.lastIndexOf("\n", pos - 1) + 1;
}

export function lineEnd(text: string, pos: number): number {
  const next = text.indexOf("\n", pos);
  return next === -1 ? text.length : next;
}

export function ownEnd(text: string, block: Block): number {
  let pos = block.from;
  for (let line = block.line; line < block.endLine; line++) pos = lineEnd(text, pos) + 1;
  return lineEnd(text, pos);
}

export function isInsideCodeOrFrontmatter(text: string, blocks: Block[], line: number): boolean {
  if (line <= findFrontmatterEnd(text.split("\n"))) return true;
  return flatten(blocks).some((block) => block.type === "code" && block.line < line && line <= block.endLine);
}
