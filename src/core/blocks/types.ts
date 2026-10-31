export type BlockType =
  | "paragraph"
  | "blank"
  | "heading"
  | "task"
  | "bullet"
  | "numbered"
  | "quote"
  | "callout"
  | "code"
  | "table"
  | "toggle";

export interface Range {
  from: number;
  to: number;
}

type BaseLineInfo = {
  indent: number;
  marker: Range | null;
};

export type LineInfo =
  | (BaseLineInfo & { type: "blank" | "paragraph" | "table"; marker: null })
  | (BaseLineInfo & { type: "heading"; marker: Range; level: 1 | 2 | 3 | 4 | 5 | 6 })
  | (BaseLineInfo & { type: "task"; marker: Range; checked: boolean })
  | (BaseLineInfo & { type: "callout"; marker: Range; calloutType: string; fold?: "+" | "-" })
  | (BaseLineInfo & { type: "code"; marker: Range; fence: string; language: string })
  | (BaseLineInfo & { type: "bullet" | "numbered" | "quote" | "toggle"; marker: Range });

export type Block = LineInfo & {
  line: number;
  endLine: number;
  from: number;
  to: number;
  continuation: Range[];
  closing: Range | null;
  children: Block[];
};
