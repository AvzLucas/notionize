import { Plugin } from "obsidian";
import { SlashMenuSuggest } from "./features/slashMenu/slashMenuSuggest";

export default class Notionize extends Plugin {
  async onload(): Promise<void> {
    this.registerEditorSuggest(new SlashMenuSuggest(this.app));
  }
}
