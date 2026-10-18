import type { EditorState } from "@codemirror/state";
import type {
  MarkdownComponent,
  MarkdownComponentType,
  TextRange,
} from "./componentTypes";

const taskPattern = /^(\s*)-\s+\[[ xX]\][ \t]*/;
const calloutPattern = /^(\s*)>[ \t]*\[![A-Za-z0-9_-]+\][+-]?[ \t]?/;
const quotePattern = /^(\s*)>[ \t]?/;
const fencePattern = /^(\s*)(`{3,}|~{3,})[^\n]*$/;

export function findMarkdownComponents(state: EditorState): MarkdownComponent[] {
  const components: MarkdownComponent[] = [];
  let lineNumber = 1;

  while (lineNumber <= state.doc.lines) {
    const line = state.doc.line(lineNumber);
    const codeComponent = findCodeBlock(state, lineNumber);

    if (codeComponent) {
      components.push(codeComponent.component);
      lineNumber = codeComponent.nextLineNumber;
      continue;
    }

    const calloutMatch = calloutPattern.exec(line.text);
    if (calloutMatch) {
      const result = findQuoteBlock(state, lineNumber, "callout", calloutMatch[0].length);
      components.push(result.component);
      lineNumber = result.nextLineNumber;
      continue;
    }

    const taskMatch = taskPattern.exec(line.text);
    if (taskMatch) {
      const syntax = taskMatch[0];
      const contentStart = line.from + syntax.length;
      components.push(createComponent({
        state,
        type: "task",
        fullRange: { from: line.from, to: line.to },
        syntaxRanges: [{ from: line.from, to: contentStart }],
        contentRanges: [{ from: contentStart, to: line.to }],
        lineStarts: [line.from],
      }));
      lineNumber += 1;
      continue;
    }

    const quoteMatch = quotePattern.exec(line.text);
    if (quoteMatch) {
      const result = findQuoteBlock(state, lineNumber, "quote", quoteMatch[0].length);
      components.push(result.component);
      lineNumber = result.nextLineNumber;
      continue;
    }

    lineNumber += 1;
  }

  return components;
}

function findQuoteBlock(
  state: EditorState,
  firstLineNumber: number,
  type: Extract<MarkdownComponentType, "callout" | "quote">,
  firstPrefixLength: number,
): { component: MarkdownComponent; nextLineNumber: number } {
  const firstLine = state.doc.line(firstLineNumber);
  const syntaxRanges: TextRange[] = [];
  const contentRanges: TextRange[] = [];
  const lineStarts: number[] = [];
  let lineNumber = firstLineNumber;

  while (lineNumber <= state.doc.lines) {
    const line = state.doc.line(lineNumber);
    const match = quotePattern.exec(line.text);

    if (!match) break;

    const prefixLength = lineNumber === firstLineNumber
      ? firstPrefixLength
      : match[0].length;
    const prefix = line.text.slice(0, prefixLength);
    const contentStart = line.from + prefixLength;
    const syntaxEnd = contentStart - trailingWhitespaceLength(prefix);

    syntaxRanges.push({ from: line.from, to: syntaxEnd });
    contentRanges.push({ from: contentStart, to: line.to });
    lineStarts.push(line.from);
    lineNumber += 1;
  }

  const lastLine = state.doc.line(lineNumber - 1);

  return {
    component: createComponent({
      state,
      type,
      fullRange: { from: firstLine.from, to: lastLine.to },
      syntaxRanges,
      contentRanges,
      lineStarts,
    }),
    nextLineNumber: lineNumber,
  };
}

function findCodeBlock(
  state: EditorState,
  openingLineNumber: number,
): { component: MarkdownComponent; nextLineNumber: number } | null {
  const openingLine = state.doc.line(openingLineNumber);
  const openingMatch = fencePattern.exec(openingLine.text);

  if (!openingMatch) return null;

  const fence = openingMatch[2];
  if (!fence) return null;

  const fenceCharacter = fence[0];
  if (!fenceCharacter) return null;

  const fenceLength = fence.length;
  const closingPattern = new RegExp(`^\\s*${escapeRegExp(fenceCharacter)}{${fenceLength},}\\s*$`);

  for (let lineNumber = openingLineNumber + 1; lineNumber <= state.doc.lines; lineNumber++) {
    const closingLine = state.doc.line(lineNumber);

    if (!closingPattern.test(closingLine.text)) continue;

    const contentStart = openingLine.to < state.doc.length
      ? openingLine.to + 1
      : openingLine.to;

    return {
      component: createComponent({
        state,
        type: "code",
        fullRange: { from: openingLine.from, to: closingLine.to },
        syntaxRanges: [
          { from: openingLine.from, to: openingLine.to },
          { from: closingLine.from, to: closingLine.to },
        ],
        contentRanges: [{ from: contentStart, to: closingLine.from }],
        lineStarts: getLineStarts(state, openingLineNumber, lineNumber),
      }),
      nextLineNumber: lineNumber + 1,
    };
  }

  return null;
}

function createComponent({
  state,
  type,
  fullRange,
  syntaxRanges,
  contentRanges,
  lineStarts,
}: Omit<MarkdownComponent, "deletionRange" | "backspacePositions" | "isEmpty"> & {
  state: EditorState;
}): MarkdownComponent {
  const content = contentRanges
    .map((range) => state.doc.sliceString(range.from, range.to))
    .join("\n");

  return {
    type,
    fullRange,
    deletionRange: {
      from: fullRange.from,
      to: fullRange.to < state.doc.length ? fullRange.to + 1 : fullRange.to,
    },
    syntaxRanges,
    contentRanges,
    lineStarts,
    backspacePositions: contentRanges.map((range) => range.from),
    isEmpty: content.trim().length === 0,
  };
}

function getLineStarts(
  state: EditorState,
  firstLineNumber: number,
  lastLineNumber: number,
): number[] {
  const starts: number[] = [];

  for (let lineNumber = firstLineNumber; lineNumber <= lastLineNumber; lineNumber++) {
    starts.push(state.doc.line(lineNumber).from);
  }

  return starts;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function trailingWhitespaceLength(value: string): number {
  return value.match(/[ \t]*$/)?.[0].length ?? 0;
}
