import type { EditorView } from "@codemirror/view";
import { Menu, type IconName } from "obsidian";
import { blockAtLine } from "../core/blocks/query";
import type { Block } from "../core/blocks/types";
import { convertBlock, deleteBlock, duplicateBlock, type BlockKind } from "../core/ops/blockActions";
import type { Edit } from "../core/ops/edit";
import { blockField, dispatchEdit } from "../editor";

const TURN_INTO: [BlockKind, string, IconName][] = [
  ["paragraph", "Text", "pilcrow"],
  ["task", "To-do", "check-square"],
  ["h1", "Heading 1", "heading-1"],
  ["h2", "Heading 2", "heading-2"],
  ["h3", "Heading 3", "heading-3"],
  ["bullet", "Bulleted list", "list"],
  ["numbered", "Numbered list", "list-ordered"],
  ["quote", "Quote", "quote"],
  ["callout", "Callout", "info"],
  ["toggle", "Toggle", "chevron-right"],
  ["code", "Code", "code"],
];

export function openBlockMenu(view: EditorView, block: Block, event: MouseEvent): void {
  const run = (make: (text: string, target: Block) => Edit | null) => () => {
    const fresh = blockAtLine(view.state.field(blockField), block.line);
    if (!fresh) return;
    const edit = make(view.state.doc.toString(), fresh);
    if (edit) dispatchEdit(view, edit, "input.notionize");
  };

  const menu = new Menu();
  menu.addItem((item) => item.setTitle("Delete").setIcon("trash-2").onClick(run(deleteBlock)));
  menu.addItem((item) => item.setTitle("Duplicate").setIcon("copy").onClick(run(duplicateBlock)));
  menu.addSeparator();
  for (const [kind, title, icon] of TURN_INTO) {
    menu.addItem((item) =>
      item
        .setTitle(`Turn into ${title.toLowerCase()}`)
        .setIcon(icon)
        .onClick(run((text, target) => convertBlock(text, target, kind))),
    );
  }
  menu.showAtMouseEvent(event);
}
