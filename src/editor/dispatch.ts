import type { EditorView } from "@codemirror/view";
import type { Edit } from "../core/ops/edit";

export function dispatchEdit(view: EditorView, edit: Edit, userEvent: string): void {
  view.dispatch({
    changes: { from: edit.from, to: edit.to, insert: edit.insert },
    selection: { anchor: edit.cursor },
    userEvent,
    scrollIntoView: true,
  });
}
