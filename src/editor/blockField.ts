import { StateField } from "@codemirror/state";
import { parseBlocks } from "../core/blocks/parseBlocks";
import type { Block } from "../core/blocks/types";

export const blockField = StateField.define<Block[]>({
  create: (state) => parseBlocks(state.doc.toString()),
  update: (blocks, tr) => (tr.docChanged ? parseBlocks(tr.state.doc.toString()) : blocks),
});
