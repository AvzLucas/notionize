import {
  App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext,
  EditorSuggestTriggerInfo, TFile
} from "obsidian";
import { SlashMenuOption, slashMenuOptions, getInsertion } from "./slashMenuOptions";

export class SlashMenuSuggest extends EditorSuggest<SlashMenuOption> {
  constructor(app: App) {
    super(app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line);
    const textBeforeCursor = line.slice(0, cursor.ch);
    const textAfterCursor = line.slice(cursor.ch);
    const match = textBeforeCursor.match(/^(\s*)\/([a-z0-9-]*)$/i);

    if (!match || textAfterCursor.trim() !== "") return null;

    const indentation = match[1] ?? "";
    const query = match[2] ?? "";
    return {
      start: { line: cursor.line, ch: indentation.length },
      end: cursor,
      query: query.toLowerCase()
    };
  }

  getSuggestions(context: EditorSuggestContext): SlashMenuOption[] {
    const query = context.query;
    return slashMenuOptions.filter((option) =>
      query === "" || option.aliases.some((alias) => alias.startsWith(query))
    );
  }

  renderSuggestion(option: SlashMenuOption, el: HTMLElement): void {
    el.addClass("notionize-slash-menu__option");
    el.createDiv({ cls: "notionize-slash-menu__title", text: option.title });
    el.createDiv({ cls: "notionize-slash-menu__description", text: option.description });
  }

  selectSuggestion(option: SlashMenuOption, _event: MouseEvent | KeyboardEvent): void {
    const context = this.context;
    if (!context) return;

    const indentation = context.editor.getLine(context.start.line).slice(0, context.start.ch);
    const insertion = this.createInsertion(option, indentation);
    context.editor.replaceRange(insertion.text, context.start, context.end);
    context.editor.setCursor(insertion.cursor);
  }

  private createInsertion(option: SlashMenuOption, indentation: string): { text: string; cursor: EditorPosition } {
    const start = this.context?.start;
    if (!start) throw new Error("A slash-menu suggestion requires an active editor context.");
    return getInsertion(start.line, start.ch, option.insert, indentation)
  }
}
