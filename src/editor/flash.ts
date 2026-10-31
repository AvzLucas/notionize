import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";

export const flashLines = StateEffect.define<{ from: number; to: number } | null>();

export const flashField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    let next = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(flashLines)) continue;
      if (!effect.value) {
        next = Decoration.none;
        continue;
      }
      const { from, to } = effect.value;
      const doc = tr.state.doc;
      const lines = [];
      for (let n = doc.lineAt(from).number; n <= doc.lineAt(Math.min(to, doc.length)).number; n++) {
        lines.push(Decoration.line({ class: "nz-landed" }).range(doc.line(n).from));
      }
      next = Decoration.set(lines);
    }
    return next;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export function flash(view: EditorView, from: number, to: number): void {
  view.dispatch({ effects: flashLines.of({ from, to }) });
  window.setTimeout(() => {
    if (view.dom.isConnected) view.dispatch({ effects: flashLines.of(null) });
  }, 900);
}
