import type { Extension } from "@codemirror/state";
import { blockField } from "./blockField";
import { dragHandles, type DragOptions } from "./dragHandles";
import { flashField } from "./flash";
import { hideMarkdown } from "./hideMarkdown";
import { notionizeKeymap } from "./keymap";
import { toggles } from "./toggles";

export { blockField } from "./blockField";
export { dispatchEdit } from "./dispatch";

export function notionizeEditor(options: DragOptions): Extension {
  return [blockField, hideMarkdown, toggles, flashField, notionizeKeymap, dragHandles(options)];
}
