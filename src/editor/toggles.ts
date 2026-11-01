import { Prec, StateField, type EditorState, type Range as DecorationRange } from "@codemirror/state";
import { foldEffect, unfoldEffect } from "@codemirror/language";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { blockAtLine, flatten } from "../core/blocks/query";
import type { Block } from "../core/blocks/types";
import { blockField } from "./blockField";
import { addFirstChild, isEmpty, isFolded, titleEnd, toggleFold } from "./folding";
import { isLivePreview } from "./livePreview";

interface Toggles {
  decorations: DecorationSet;
  atomic: DecorationSet;
}

const EMPTY: Toggles = { decorations: Decoration.none, atomic: Decoration.none };

function findToggle(view: EditorView, line: number): Block | null {
  const block = blockAtLine(view.state.field(blockField), line);
  return block && block.type === "toggle" ? block : null;
}

class TriangleWidget extends WidgetType {
  constructor(
    private readonly open: boolean,
    private readonly line: number,
  ) {
    super();
  }

  eq(other: TriangleWidget): boolean {
    return other.open === this.open && other.line === this.line;
  }

  toDOM(view: EditorView): HTMLElement {
    const button = createSpan();
    button.className = "nz-toggle" + (this.open ? " is-open" : "");
    button.setAttribute("role", "button");
    button.setAttribute("aria-label", this.open ? "Close toggle" : "Open toggle");
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const block = findToggle(view, this.line);
      if (!block) return;
      if (!isEmpty(view.state, block) || isFolded(view.state, block)) toggleFold(view, block);
      else addFirstChild(view, block);
    });
    return button;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class PlaceholderWidget extends WidgetType {
  constructor(
    private readonly line: number,
    private readonly indent: number,
  ) {
    super();
  }

  eq(other: PlaceholderWidget): boolean {
    return other.line === this.line && other.indent === this.indent;
  }

  toDOM(view: EditorView): HTMLElement {
    const placeholder = createDiv();
    placeholder.className = "nz-toggle-empty";
    placeholder.style.setProperty("--nz-indent", String(this.indent));
    placeholder.textContent = "Empty toggle. Click or drop blocks inside.";
    placeholder.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const block = findToggle(view, this.line);
      if (block) addFirstChild(view, block);
    });
    return placeholder;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

function build(state: EditorState): Toggles {
  if (!isLivePreview(state)) return EMPTY;

  const decorations: DecorationRange<Decoration>[] = [];
  const atomic: DecorationRange<Decoration>[] = [];

  for (const block of flatten(state.field(blockField))) {
    if (block.type !== "toggle") continue;
    const folded = isFolded(state, block);
    decorations.push(Decoration.replace({ widget: new TriangleWidget(!folded, block.line) }).range(block.marker.from, block.marker.to));
    atomic.push(Decoration.replace({}).range(block.marker.from, block.marker.to));
    decorations.push(Decoration.line({ class: "nz-toggle-line" }).range(block.from));
    if (!folded && isEmpty(state, block)) {
      decorations.push(Decoration.widget({ widget: new PlaceholderWidget(block.line, block.indent), side: 1, block: true }).range(titleEnd(state, block)));
    }
  }

  return { decorations: Decoration.set(decorations, true), atomic: Decoration.set(atomic, true) };
}

export const toggles = StateField.define<Toggles>({
  create: build,
  update(value, tr) {
    const modeChanged = isLivePreview(tr.startState) !== isLivePreview(tr.state);
    const foldChanged = tr.effects.some((effect) => effect.is(foldEffect) || effect.is(unfoldEffect));
    return tr.docChanged || modeChanged || foldChanged || tr.reconfigured ? build(tr.state) : value;
  },
  provide: (field) => [
    Prec.highest(EditorView.decorations.from(field, (value) => value.decorations)),
    EditorView.atomicRanges.of((view) => view.state.field(field).atomic),
  ],
});
