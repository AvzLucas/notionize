import { Notice, SuggestModal, prepareFuzzySearch, type App } from "obsidian";

interface FolderChoice {
  path: string | null;
  create: boolean;
}

export class FolderSuggestModal extends SuggestModal<FolderChoice> {
  constructor(
    app: App,
    private readonly onChoose: (folder: string | null) => void,
  ) {
    super(app);
    this.setPlaceholder("Pick a folder, or type a new one");
  }

  getSuggestions(query: string): FolderChoice[] {
    const typed = query.trim().replace(/^\/+|\/+$/g, "");
    const paths = this.app.vault.getAllFolders(false).map((folder) => folder.path);
    const matches = prepareFuzzySearch(typed);

    const found = paths
      .map((path) => ({ path, result: matches(path) }))
      .filter((entry) => entry.result)
      .sort((a, b) => b.result!.score - a.result!.score)
      .map((entry): FolderChoice => ({ path: entry.path, create: false }));

    const choices: FolderChoice[] = typed === "" ? [{ path: null, create: false }] : [];
    choices.push(...found);
    if (typed !== "" && !paths.includes(typed)) choices.push({ path: typed, create: true });
    return choices;
  }

  renderSuggestion(choice: FolderChoice, el: HTMLElement): void {
    if (choice.path === null) el.setText("All notes");
    else el.setText(choice.create ? `Create folder "${choice.path}"` : choice.path);
  }

  async onChooseSuggestion(choice: FolderChoice): Promise<void> {
    if (choice.create && choice.path !== null) {
      try {
        await this.app.vault.createFolder(choice.path);
      } catch {
        new Notice(`Could not create the folder "${choice.path}".`);
        return;
      }
    }
    this.onChoose(choice.path);
  }
}
