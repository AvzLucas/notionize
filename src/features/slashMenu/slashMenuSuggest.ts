import {
  App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext,
  EditorSuggestTriggerInfo, TFile, setIcon,
} from "obsidian";
import { parseBlocks } from "../../core/blocks/parseBlocks";
import { isInsideCodeOrFrontmatter } from "../../core/blocks/query";
import { insertion, isView, keepsIndent, type InsertKind } from "../../core/ops/templates";
import { FolderSuggestModal } from "./folderSuggestModal";
import { slashMenuOptions, type SlashMenuOption } from "./slashMenuOptions";

export class SlashMenuSuggest extends EditorSuggest<SlashMenuOption> {
  constructor(app: App) {
    super(app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const match = line.slice(0, cursor.ch).match(/^(\s*)\/([a-z0-9-]*)$/i);
    if (!match || line.slice(cursor.ch).trim() !== "") return null;

    const text = editor.getValue();
    if (isInsideCodeOrFrontmatter(text, parseBlocks(text), cursor.line)) return null;

    return {
      start: { line: cursor.line, ch: (match[1] ?? "").length },
      end: cursor,
      query: (match[2] ?? "").toLowerCase(),
    };
  }

  getSuggestions(context: EditorSuggestContext): SlashMenuOption[] {
    const query = context.query;
    return slashMenuOptions.filter(
      (option) => query === "" || option.aliases.some((alias) => alias.startsWith(query)) || option.title.toLowerCase().startsWith(query),
    );
  }

  renderSuggestion(option: SlashMenuOption, el: HTMLElement): void {
    el.addClass("notionize-slash-menu__option");
    setIcon(el.createDiv({ cls: "notionize-slash-menu__icon" }), option.icon);
    const body = el.createDiv({ cls: "notionize-slash-menu__body" });
    body.createDiv({ cls: "notionize-slash-menu__title", text: option.title });
    body.createDiv({ cls: "notionize-slash-menu__description", text: option.description });
  }

  selectSuggestion(option: SlashMenuOption, _event: MouseEvent | KeyboardEvent): void {
    const context = this.context;
    if (!context) return;

    const { editor, start, end } = context;
    const indentation = editor.getLine(start.line).slice(0, start.ch);
    const from = keepsIndent(option.kind) ? start : { line: start.line, ch: 0 };

    if (isView(option.kind)) {
      new FolderSuggestModal(this.app, (folder) => {
        this.insert(editor, from, end, option.kind, indentation, folder ?? undefined);
      }).open();
      return;
    }

    this.insert(editor, from, end, option.kind, indentation);
  }

  private insert(editor: Editor, from: EditorPosition, end: EditorPosition, kind: InsertKind, indentation: string, folder?: string): void {
    const { text, cursor } = insertion(kind, indentation, folder);
    editor.focus();
    editor.replaceRange(text, from, end);
    editor.setCursor(editor.offsetToPos(editor.posToOffset(from) + cursor));
  }
}
