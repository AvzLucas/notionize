import type { EditorState } from "@codemirror/state";
import { foldedRanges, foldEffect, indentUnit, unfoldEffect } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";
import type { Block } from "../core/blocks/types";

export function titleEnd(state: EditorState, block: Block): number {
  return state.doc.lineAt(block.from).to;
}

export function isEmpty(state: EditorState, block: Block): boolean {
  return block.to === titleEnd(state, block);
}

export function foldedRangeOf(state: EditorState, block: Block): { from: number; to: number } | null {
  const end = titleEnd(state, block);
  let found: { from: number; to: number } | null = null;
  foldedRanges(state).between(end, end, (from, to) => {
    if (from === end) found = { from, to };
  });
  return found;
}

export function isFolded(state: EditorState, block: Block): boolean {
  return foldedRangeOf(state, block) !== null;
}

export function unit(state: EditorState): string {
  return state.facet(indentUnit) || "\t";
}

export function toggleFold(view: EditorView, block: Block): void {
  const folded = foldedRangeOf(view.state, block);
  if (folded) {
    view.dispatch({ effects: unfoldEffect.of(folded) });
    return;
  }
  if (isEmpty(view.state, block)) return;
  view.dispatch({ effects: foldEffect.of({ from: titleEnd(view.state, block), to: block.to }) });
}

export function unfold(view: EditorView, block: Block): void {
  const folded = foldedRangeOf(view.state, block);
  if (folded) view.dispatch({ effects: unfoldEffect.of(folded) });
}

export function addFirstChild(view: EditorView, block: Block): void {
  const end = titleEnd(view.state, block);
  const prefix = view.state.doc.sliceString(block.from, block.from + block.indent) + unit(view.state);
  view.dispatch({
    changes: { from: end, insert: "\n" + prefix },
    selection: { anchor: end + 1 + prefix.length },
    userEvent: "input.notionize",
    scrollIntoView: true,
  });
  view.focus();
}
