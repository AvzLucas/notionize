import type { EditorState } from "@codemirror/state";
import { editorLivePreviewField } from "obsidian";

export function isLivePreview(state: EditorState): boolean {
  return state.field(editorLivePreviewField, false) ?? false;
}
