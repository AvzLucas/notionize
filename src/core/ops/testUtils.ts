import type { Edit } from "./edit";

export function apply(text: string, edit: Edit | null): { text: string; cursor: number } | null {
  if (!edit) return null;
  return { text: text.slice(0, edit.from) + edit.insert + text.slice(edit.to), cursor: edit.cursor };
}
