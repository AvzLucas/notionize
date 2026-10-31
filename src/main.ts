import { Plugin } from "obsidian";
import { notionizeEditor } from "./editor";
import { openBlockMenu } from "./features/blocks";
import { SlashMenuSuggest } from "./features/slashMenu/slashMenuSuggest";

export default class Notionize extends Plugin {
  async onload(): Promise<void> {
    this.registerEditorSuggest(new SlashMenuSuggest(this.app));
    this.registerEditorExtension(notionizeEditor({ onMenu: openBlockMenu }));
  }
}
