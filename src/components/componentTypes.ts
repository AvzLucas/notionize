export type MarkdownComponentType = "task" | "callout" | "code" | "quote";

export type SlashComponent = MarkdownComponentType | "H1" | "H2" | "H3";

export interface TextRange {
  from: number;
  to: number;
}

export interface MarkdownComponent {
  type: MarkdownComponentType;
  fullRange: TextRange;
  deletionRange: TextRange;
  syntaxRanges: TextRange[];
  contentRanges: TextRange[];
  lineStarts: number[];
  backspacePositions: number[];
  isEmpty: boolean;
}
