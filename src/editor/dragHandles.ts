import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import { setIcon } from "obsidian";
import { blockAtLine } from "../core/blocks/query";
import type { Block } from "../core/blocks/types";
import { canMove, moveBlock, type Side } from "../core/ops/move";
import { blockField } from "./blockField";
import { dispatchEdit } from "./dispatch";
import { flash } from "./flash";
import { isFolded, unfold, unit } from "./folding";
import { isLivePreview } from "./livePreview";

export interface DragOptions {
  onMenu: (view: EditorView, block: Block, event: MouseEvent) => void;
}

interface DragState {
  block: Block;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
  target: { block: Block; side: Side } | null;
  ghost: HTMLElement | null;
  dimmed: HTMLElement[];
}

const MOVE_THRESHOLD = 4;
const SCROLL_EDGE = 40;
const SCROLL_STEP = 12;
const GHOST_LINES = 6;

export function dragHandles(options: DragOptions) {
  return ViewPlugin.fromClass(
    class {
      private readonly handle: HTMLElement;
      private readonly indicator: HTMLElement;
      private hovered: Block | null = null;
      private drag: DragState | null = null;

      constructor(private readonly view: EditorView) {
        this.handle = createDiv();
        this.handle.className = "nz-handle";
        this.handle.setAttribute("aria-label", "Drag to move, click for options");
        this.handle.draggable = false;
        setIcon(this.handle, "grip-vertical");

        this.indicator = createDiv();
        this.indicator.className = "nz-drop-indicator";

        view.dom.append(this.handle, this.indicator);
        view.dom.addEventListener("mousemove", this.onHover);
        view.dom.addEventListener("mouseleave", this.onLeave);
        view.scrollDOM.addEventListener("scroll", this.onScroll);
        this.handle.addEventListener("pointerdown", this.onPointerDown);
        this.handle.addEventListener("mousedown", this.swallow);
        this.handle.addEventListener("dragstart", this.swallow);
      }

      update(update: ViewUpdate): void {
        if (!this.drag && (update.docChanged || update.geometryChanged)) this.hideHandle();
      }

      destroy(): void {
        this.endDrag();
        this.view.dom.removeEventListener("mousemove", this.onHover);
        this.view.dom.removeEventListener("mouseleave", this.onLeave);
        this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
        this.handle.remove();
        this.indicator.remove();
      }

      private swallow = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      private onHover = (event: MouseEvent) => {
        if (this.drag || this.handle.contains(event.target as Node)) return;
        if (!isLivePreview(this.view.state)) return this.hideHandle();
        const block = this.blockAtY(event.clientY);
        if (!block) return this.hideHandle();
        this.hovered = block;
        this.placeHandle(block);
      };

      private onLeave = (event: MouseEvent) => {
        if (this.drag || this.handle.contains(event.relatedTarget as Node)) return;
        this.hideHandle();
      };

      private onScroll = () => {
        if (!this.drag) this.hideHandle();
      };

      private onPointerDown = (event: PointerEvent) => {
        if (!this.hovered || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = this.handle.getBoundingClientRect();
        this.drag = {
          block: this.hovered,
          startX: event.clientX,
          startY: event.clientY,
          offsetX: event.clientX - rect.right,
          offsetY: event.clientY - rect.top,
          moved: false,
          target: null,
          ghost: null,
          dimmed: [],
        };
        window.addEventListener("pointermove", this.onDragMove, true);
        window.addEventListener("pointerup", this.onDragEnd, true);
        window.addEventListener("pointercancel", this.onDragCancel, true);
        window.addEventListener("blur", this.onDragCancel);
        window.addEventListener("keydown", this.onKey, true);
      };

      private onKey = (event: KeyboardEvent) => {
        if (event.key !== "Escape" || !this.drag) return;
        event.preventDefault();
        event.stopPropagation();
        this.endDrag();
      };

      private onDragMove = (event: PointerEvent) => {
        const drag = this.drag;
        if (!drag) return;
        event.preventDefault();

        if (!drag.moved) {
          if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < MOVE_THRESHOLD) return;
          drag.moved = true;
          document.body.classList.add("nz-dragging");
          this.startGhost(drag);
        }

        if (drag.ghost) {
          drag.ghost.style.transform = `translate(${event.clientX - drag.offsetX}px, ${event.clientY - drag.offsetY}px)`;
        }

        this.autoScroll(event.clientY);
        const target = this.blockAtY(event.clientY);
        if (!target || !canMove(drag.block, target)) {
          drag.target = null;
          this.indicator.classList.remove("is-visible");
          return;
        }

        const top = this.view.documentTop + this.view.lineBlockAt(target.from).top;
        const bottom = this.view.documentTop + this.view.lineBlockAt(target.to).bottom;
        const side = this.sideFor(target, event.clientY, top, bottom);
        drag.target = { block: target, side };
        const titleBottom = this.view.documentTop + this.view.lineBlockAt(target.from).bottom;
        this.placeIndicator(target, side === "before" ? top : side === "inside" ? titleBottom : bottom, side === "inside");
      };

      private onDragEnd = (event: PointerEvent) => {
        const drag = this.drag;
        this.endDrag();
        if (!drag) return;
        event.preventDefault();
        event.stopPropagation();

        if (!drag.moved) {
          options.onMenu(this.view, drag.block, event);
          return;
        }

        if (!drag.target) return;
        const { block: target, side } = drag.target;
        if (side === "inside" && isFolded(this.view.state, target)) unfold(this.view, target);
        const edit = moveBlock(this.view.state.doc.toString(), drag.block, target, side, unit(this.view.state));
        if (!edit) return;
        dispatchEdit(this.view, edit, "move.drop");
        const landed = blockAtLine(this.view.state.field(blockField), this.view.state.doc.lineAt(edit.cursor).number - 1);
        if (landed) flash(this.view, landed.from, landed.to);
      };

      private onDragCancel = () => {
        this.endDrag();
      };

      private endDrag(): void {
        const drag = this.drag;
        this.drag = null;
        window.removeEventListener("pointermove", this.onDragMove, true);
        window.removeEventListener("pointerup", this.onDragEnd, true);
        window.removeEventListener("pointercancel", this.onDragCancel, true);
        window.removeEventListener("blur", this.onDragCancel);
        window.removeEventListener("keydown", this.onKey, true);
        document.body.classList.remove("nz-dragging");
        this.indicator.classList.remove("is-visible");
        if (drag) {
          drag.ghost?.remove();
          drag.dimmed.forEach((line) => line.classList.remove("nz-drag-source"));
        }
        this.hideHandle();
      }

      private startGhost(drag: DragState): void {
        const lines = this.linesOf(drag.block);
        if (lines.length === 0) return;
        const shown = lines.slice(0, GHOST_LINES);
        const first = shown[0]!.getBoundingClientRect();
        const last = shown[shown.length - 1]!.getBoundingClientRect();
        const ghost = createDiv();
        ghost.className = "nz-drag-ghost markdown-source-view mod-cm6";
        const height = `${last.bottom - first.top}px`;
        ghost.style.setProperty("width", `${first.width}px`, "important");
        ghost.style.setProperty("height", height, "important");
        ghost.style.setProperty("max-height", height, "important");
        for (const line of shown) ghost.append(line.cloneNode(true));
        document.body.append(ghost);
        drag.offsetX = drag.startX - first.left;
        drag.offsetY = drag.startY - first.top;
        drag.ghost = ghost;
        drag.dimmed = lines;
        lines.forEach((line) => line.classList.add("nz-drag-source"));
      }

      private linesOf(block: Block): HTMLElement[] {
        const doc = this.view.state.doc;
        const out: HTMLElement[] = [];
        const last = doc.lineAt(Math.min(block.to, doc.length)).number;
        for (let n = doc.lineAt(block.from).number; n <= last; n++) {
          const line = this.lineElementAt(doc.line(n).from);
          if (line && !out.includes(line)) out.push(line);
        }
        return out;
      }

      private lineElementAt(pos: number): HTMLElement | null {
        const { node, offset } = this.view.domAtPos(pos);
        const start = node === this.view.contentDOM ? node.childNodes[offset] ?? null : node;
        const element = start instanceof Element ? start : start?.parentElement ?? null;
        const line = element?.closest(".cm-line") ?? null;
        return line instanceof HTMLElement ? line : null;
      }

      private blockAtY(clientY: number): Block | null {
        const content = this.view.contentDOM.getBoundingClientRect();
        if (clientY < content.top || clientY > content.bottom) return null;
        const pos = this.view.posAtCoords({ x: content.left + content.width / 2, y: clientY }, false);
        const line = this.view.state.doc.lineAt(this.view.lineBlockAt(pos).from).number - 1;
        return blockAtLine(this.view.state.field(blockField), line);
      }

      private leftOf(block: Block): number {
        const coords = this.view.coordsAtPos(Math.min(block.from + block.indent, this.view.state.doc.length));
        return coords ? coords.left : this.view.contentDOM.getBoundingClientRect().left;
      }

      private placeHandle(block: Block): void {
        const dom = this.view.dom.getBoundingClientRect();
        const text = this.view.coordsAtPos(Math.min(block.from + block.indent, this.view.state.doc.length));
        const line = this.view.lineBlockAt(block.from);
        const top = text ? text.top : this.view.documentTop + line.top;
        const available = text ? text.bottom - text.top : Math.min(line.height, 40);
        const height = Math.min(available, 28);
        this.handle.style.top = `${top - dom.top + (available - height) / 2}px`;
        this.handle.style.left = `${this.handleLeft(block) - dom.left}px`;
        this.handle.style.height = `${height}px`;
        this.handle.classList.add("is-visible");
      }

      private handleLeft(block: Block): number {
        const left = this.leftOf(block) - 24;
        const arrow = this.lineElementAt(block.from)?.querySelector(".cm-fold-indicator .collapse-indicator");
        const box = arrow?.getBoundingClientRect();
        return box && box.width > 0 ? Math.min(left, box.left - 20) : left;
      }

      private sideFor(target: Block, clientY: number, top: number, bottom: number): Side {
        if (target.type !== "toggle") return clientY < (top + bottom) / 2 ? "before" : "after";
        const title = this.view.lineBlockAt(target.from);
        const titleMid = this.view.documentTop + title.top + title.height / 2;
        if (clientY < titleMid) return "before";
        if (target.children.length === 0 || isFolded(this.view.state, target)) {
          return clientY > bottom + 2 ? "after" : "inside";
        }
        return "inside";
      }

      private placeIndicator(target: Block, clientY: number, nested = false): void {
        const dom = this.view.dom.getBoundingClientRect();
        const content = this.view.contentDOM.getBoundingClientRect();
        const left = this.leftOf(target) + (nested ? 24 : 0);
        this.indicator.style.top = `${clientY - dom.top - 1}px`;
        this.indicator.style.left = `${left - dom.left}px`;
        this.indicator.style.width = `${Math.max(40, content.right - left)}px`;
        this.indicator.classList.add("is-visible");
      }

      private hideHandle(): void {
        this.hovered = null;
        this.handle.classList.remove("is-visible");
      }

      private autoScroll(clientY: number): void {
        const scroller = this.view.scrollDOM.getBoundingClientRect();
        if (clientY < scroller.top + SCROLL_EDGE) this.view.scrollDOM.scrollBy(0, -SCROLL_STEP);
        else if (clientY > scroller.bottom - SCROLL_EDGE) this.view.scrollDOM.scrollBy(0, SCROLL_STEP);
      }
    },
  );
}
