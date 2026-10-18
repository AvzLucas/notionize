import { Plugin } from "obsidian";
import { NotionizeEditorExtension } from "./features/editorExtension/notionizeEditorExtension";
import { SlashMenuSuggest } from "./features/slashMenu/slashMenuSuggest";

export default class Notionize extends Plugin {
  async onload(): Promise<void> {
    this.registerEditorSuggest(new SlashMenuSuggest(this.app));
    this.registerEditorExtension(new NotionizeEditorExtension().getExtension());
  }
}
