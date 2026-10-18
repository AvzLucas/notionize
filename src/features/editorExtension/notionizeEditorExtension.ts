import {  Decoration, type DecorationSet, EditorView,
  keymap,
  WidgetType,
} from "@codemirror/view";
import {
  type EditorState,
  type Extension,
  Prec,
  type Range,
  StateField,
} from "@codemirror/state";
import { findMarkdownComponents } from "../../components/markdownComponents";
import type { MarkdownComponent, TextRange } from "../../components/componentTypes";

const notionizeDecorations = StateField.define<DecorationSet>({
  create(state) {
    return createDecorations(state);
  },
  update(decorations, transaction) {
    if (!transaction.docChanged && !transaction.reconfigured) return decorations;

    return createDecorations(transaction.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

const notionizeAtomicRanges = StateField.define<DecorationSet>({
  create(state) {
    return createAtomicRanges(state);
  },
  update(ranges, transaction) {
    if (!transaction.docChanged && !transaction.reconfigured) return ranges;

    return createAtomicRanges(transaction.state);
  },
});

export class NotionizeEditorExtension {
  private readonly extension: Extension = [
    Prec.highest([
      keymap.of([{ key: "Backspace", run: (view) => this.handleBackspace(view) }]),
      notionizeDecorations,
      notionizeAtomicRanges,
      EditorView.atomicRanges.of((view) => view.state.field(notionizeAtomicRanges)),
    ]),
  ];

  getExtension(): Extension {
    return this.extension;
  }

  private handleBackspace(view: EditorView): boolean {
    const selection = view.state.selection.main;
    if (!selection.empty) return false;

    const component = findMarkdownComponents(view.state).find((candidate) => (
      candidate.isEmpty && candidate.backspacePositions.includes(selection.head)
    ));

    if (!component) return false;

    view.dispatch({
      changes: {
        from: component.deletionRange.from,
        to: component.deletionRange.to,
        insert: "",
      },
    });

    return true;
  }
}

function createDecorations(state: EditorState): DecorationSet {
  const ranges: Range<Decoration>[] = [];

  for (const component of findMarkdownComponents(state)) {
    for (const syntaxRange of component.syntaxRanges) {
      ranges.push(createSyntaxDecoration(state, component, syntaxRange).range(
        syntaxRange.from,
        syntaxRange.to,
      ));
    }

    for (const contentRange of component.contentRanges) {
      if (contentRange.from === contentRange.to) continue;

      ranges.push(Decoration.mark({
        class: `notionize-component__content notionize-component--${component.type}`,
      }).range(contentRange.from, contentRange.to));
    }

    component.lineStarts.forEach((lineStart, index) => {
      ranges.push(Decoration.line({
        class: [
          "notionize-component-line",
          `notionize-component-line--${component.type}`,
          index === 0 && "notionize-component-line--first",
          index === component.lineStarts.length - 1 && "notionize-component-line--last",
        ].filter(Boolean).join(" "),
      }).range(lineStart));
    });
  }

  return Decoration.set(ranges, true);
}

function createAtomicRanges(state: EditorState): DecorationSet {
  const ranges: Range<Decoration>[] = [];

  for (const component of findMarkdownComponents(state)) {
    for (const syntaxRange of component.syntaxRanges) {
      ranges.push(Decoration.replace({}).range(syntaxRange.from, syntaxRange.to));
    }
  }

  return Decoration.set(ranges, true);
}

function createSyntaxDecoration(
  state: EditorState,
  component: MarkdownComponent,
  syntaxRange: TextRange,
): Decoration {
  if (component.type === "task") {
    const source = state.doc.sliceString(syntaxRange.from, syntaxRange.to);
    const checkboxPosition = syntaxRange.from + source.indexOf("[") + 1;

    return Decoration.replace({
      widget: new TaskCheckboxWidget(
        source.includes("[x]") || source.includes("[X]"),
        checkboxPosition,
      ),
    });
  }

  if (component.type === "callout" && syntaxRange.from === component.syntaxRanges[0]?.from) {
    return Decoration.replace({ widget: new CalloutHeaderWidget() });
  }

  if (component.type === "callout") {
    return Decoration.replace({ widget: new CalloutContentIndentWidget() });
  }

  if (component.type === "code" && syntaxRange.from === component.syntaxRanges[0]?.from) {
    return Decoration.replace({ widget: new IconWidget("</>", "Code block") });
  }

  return Decoration.replace({});
}

class IconWidget extends WidgetType {
  constructor(
    private readonly icon: string,
    private readonly label: string,
  ) {
    super();
  }

  eq(other: IconWidget): boolean {
    return this.icon === other.icon && this.label === other.label;
  }

  toDOM(): HTMLElement {
    const icon = document.createElement("span");
    icon.className = "notionize-component__icon";
    icon.ariaLabel = this.label;
    icon.textContent = this.icon;
    return icon;
  }
}

class CalloutHeaderWidget extends WidgetType {
  eq(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    const header = document.createElement("span");
    header.className = "notionize-callout__header";

    const icon = header.createSpan({ cls: "notionize-callout__icon", text: "ⓘ" });
    icon.ariaLabel = "Information callout";
    header.createSpan({ cls: "notionize-callout__title", text: "Info" });
    return header;
  }
}

class CalloutContentIndentWidget extends WidgetType {
  eq(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    const indent = document.createElement("span");
    indent.className = "notionize-callout__content-indent";
    indent.ariaHidden = "true";
    return indent;
  }
}

class TaskCheckboxWidget extends WidgetType {
  constructor(
    private readonly checked: boolean,
    private readonly checkboxPosition: number,
  ) {
    super();
  }

  eq(other: TaskCheckboxWidget): boolean {
    return this.checked === other.checked
      && this.checkboxPosition === other.checkboxPosition;
  }

  toDOM(view: EditorView): HTMLElement {
    const container = document.createElement("span");
    container.className = "notionize-component__checkbox-container";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = this.checked;
    checkbox.className = "notionize-component__checkbox";
    checkbox.tabIndex = -1;
    checkbox.addEventListener("mousedown", (event) => event.preventDefault());
    checkbox.addEventListener("click", (event) => {
      event.preventDefault();
      view.dispatch({
        changes: {
          from: this.checkboxPosition,
          to: this.checkboxPosition + 1,
          insert: this.checked ? " " : "x",
        },
      });
    });
    container.append(checkbox);
    return container;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
