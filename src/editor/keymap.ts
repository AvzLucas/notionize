import { Prec } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import { blockAtPos } from "../core/blocks/query";
import { backspace } from "../core/ops/backspace";
import { blockField } from "./blockField";
import { dispatchEdit } from "./dispatch";
import { addFirstChild, isFolded, titleEnd } from "./folding";
import { isLivePreview } from "./livePreview";

function singleCursor(view: EditorView): number | null {
  const { state } = view;
  if (!isLivePreview(state) || state.selection.ranges.length > 1) return null;
  const selection = state.selection.main;
  return selection.empty ? selection.head : null;
}

function runBackspace(view: EditorView): boolean {
  const head = singleCursor(view);
  if (head === null) return false;
  const edit = backspace(view.state.doc.toString(), view.state.field(blockField), head);
  if (!edit) return false;
  dispatchEdit(view, edit, "delete.backward");
  return true;
}

function runEnter(view: EditorView): boolean {
  const head = singleCursor(view);
  if (head === null) return false;
  const block = blockAtPos(view.state.doc.toString(), view.state.field(blockField), head);
  if (!block || block.type !== "toggle" || head !== titleEnd(view.state, block)) return false;
  if (isFolded(view.state, block)) return false;
  addFirstChild(view, block);
  return true;
}

export const notionizeKeymap = Prec.highest(
  keymap.of([
    { key: "Backspace", run: runBackspace },
    { key: "Enter", run: runEnter },
  ]),
);
