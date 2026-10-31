declare module "@codemirror/language" {
  import type { EditorState, Facet, StateEffectType } from "@codemirror/state";
  import type { DecorationSet } from "@codemirror/view";

  export const foldEffect: StateEffectType<{ from: number; to: number }>;
  export const unfoldEffect: StateEffectType<{ from: number; to: number }>;
  export function foldedRanges(state: EditorState): DecorationSet;
  export const indentUnit: Facet<string, string>;
}
