import { Prec, StateField, type EditorState, type Range as DecorationRange } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { flatten, ownEnd } from "../core/blocks/query";
import type { Block, Range } from "../core/blocks/types";
import { blockField } from "./blockField";
import { isLivePreview } from "./livePreview";
import { calloutColorVar } from "./callouts";
import { CalloutLabelWidget, CheckboxWidget, CodeLabelWidget } from "./widgets";

interface Hidden {
  decorations: DecorationSet;
  atomic: DecorationSet;
}

const EMPTY: Hidden = { decorations: Decoration.none, atomic: Decoration.none };
const hide = Decoration.replace({});
const fade = Decoration.mark({ class: "nz-transparent" });

export function activeBlocks(state: EditorState, blocks: Block[]): Block[] {
  const text = state.doc.toString();
  return flatten(blocks).filter((block) => {
    const end = ownEnd(text, block);
    return state.selection.ranges.some((range) => range.from <= end && range.to >= block.from);
  });
}

function build(state: EditorState): Hidden {
  if (!isLivePreview(state)) return EMPTY;

  const text = state.doc.toString();
  const decorations: DecorationRange<Decoration>[] = [];
  const atomic: DecorationRange<Decoration>[] = [];

  const replace = (range: Range | null, decoration: Decoration = hide) => {
    if (!range || range.from >= range.to) return;
    decorations.push(decoration.range(range.from, range.to));
    atomic.push(hide.range(range.from, range.to));
  };

  const fadeOut = (range: Range | null) => {
    if (!range || range.from >= range.to) return;
    decorations.push(fade.range(range.from, range.to));
    atomic.push(hide.range(range.from, range.to));
  };

  for (const block of activeBlocks(state, state.field(blockField))) {
    switch (block.type) {
      case "heading":
        replace(block.marker);
        break;
      case "quote":
        fadeOut(block.marker);
        block.continuation.forEach(fadeOut);
        break;
      case "callout": {
        const headerEnd = state.doc.lineAt(block.from).to;
        const hasTitle = text.slice(block.marker.to, headerEnd).trim() !== "";
        replace(block.marker, Decoration.replace({ widget: new CalloutLabelWidget(block.calloutType, !hasTitle) }));
        block.continuation.forEach((range) => replace(range));
        const style = `--callout-color: ${calloutColorVar(block.calloutType)}`;
        for (let line = block.line; line <= block.endLine; line++) {
          const classes = ["nz-callout-line"];
          if (line === block.line) classes.push("nz-callout-first");
          if (line === block.endLine) classes.push("nz-callout-last");
          decorations.push(Decoration.line({ attributes: { class: classes.join(" "), style } }).range(state.doc.line(line + 1).from));
        }
        break;
      }
      case "task": {
        const box = text.indexOf("[", block.marker.from) + 1;
        replace(
          { from: block.marker.from, to: block.marker.to - 1 },
          Decoration.replace({ widget: new CheckboxWidget(block.checked, box) }),
        );
        break;
      }
      case "code":
        replace(block.marker, Decoration.replace({ widget: new CodeLabelWidget(block.language) }));
        replace(block.closing);
        break;
    }
  }

  return {
    decorations: Decoration.set(decorations, true),
    atomic: Decoration.set(atomic, true),
  };
}

export const hideMarkdown = StateField.define<Hidden>({
  create: build,
  update(value, tr) {
    const modeChanged = isLivePreview(tr.startState) !== isLivePreview(tr.state);
    return tr.docChanged || tr.selection || modeChanged ? build(tr.state) : value;
  },
  provide: (field) => [
    Prec.highest(EditorView.decorations.from(field, (value) => value.decorations)),
    EditorView.atomicRanges.of((view) => view.state.field(field).atomic),
  ],
});
