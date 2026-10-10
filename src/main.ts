import { Plugin } from "obsidian";
import { SlashMenuSuggest } from "./features/slash-menu/slash-menu-suggest";

export default class Notionize extends Plugin {
  async onload(): Promise<void> {
    this.registerEditorSuggest(new SlashMenuSuggest(this.app));
    console.debug("Notionize loaded");
  }
}

