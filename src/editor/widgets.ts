import { WidgetType, type EditorView } from "@codemirror/view";
import { setIcon } from "obsidian";
import { calloutIcon } from "./callouts";

export class CheckboxWidget extends WidgetType {
  constructor(
    private readonly checked: boolean,
    private readonly box: number,
  ) {
    super();
  }

  eq(other: CheckboxWidget): boolean {
    return other.checked === this.checked && other.box === this.box;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrap = document.createElement("label");
    wrap.className = "task-list-label nz-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "task-list-item-checkbox";
    input.dataset.task = this.checked ? "x" : " ";
    input.checked = this.checked;
    if (this.checked) input.setAttribute("checked", "");
    input.tabIndex = -1;
    input.addEventListener("mousedown", (event) => event.preventDefault());
    input.addEventListener("click", (event) => {
      event.preventDefault();
      view.dispatch({
        changes: { from: this.box, to: this.box + 1, insert: this.checked ? " " : "x" },
        userEvent: "input.toggle",
      });
    });
    wrap.append(input);
    return wrap;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

export class CalloutLabelWidget extends WidgetType {
  constructor(
    private readonly calloutType: string,
    private readonly showName: boolean,
  ) {
    super();
  }

  eq(other: CalloutLabelWidget): boolean {
    return other.calloutType === this.calloutType && other.showName === this.showName;
  }

  toDOM(): HTMLElement {
    const label = document.createElement("span");
    label.className = "nz-callout-label";
    const icon = label.createSpan({ cls: "nz-callout-icon" });
    setIcon(icon, calloutIcon(this.calloutType));
    if (this.showName) {
      label.createSpan({ cls: "nz-callout-name", text: this.calloutType.charAt(0).toUpperCase() + this.calloutType.slice(1) });
    }
    return label;
  }
}

export class CodeLabelWidget extends WidgetType {
  constructor(private readonly language: string) {
    super();
  }

  eq(other: CodeLabelWidget): boolean {
    return other.language === this.language;
  }

  toDOM(): HTMLElement {
    const label = document.createElement("span");
    label.className = "nz-code-label";
    label.textContent = this.language || "code";
    return label;
  }
}
