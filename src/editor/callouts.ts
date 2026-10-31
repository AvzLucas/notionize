import type { IconName } from "obsidian";

const ALIASES: Record<string, string> = {
  abstract: "summary",
  tldr: "summary",
  hint: "tip",
  important: "tip",
  check: "success",
  done: "success",
  help: "question",
  faq: "question",
  caution: "warning",
  attention: "warning",
  failure: "fail",
  missing: "fail",
  danger: "error",
  cite: "quote",
};

const ICONS: Record<string, IconName> = {
  note: "pencil",
  summary: "clipboard-list",
  info: "info",
  todo: "check-circle-2",
  tip: "flame",
  success: "check",
  question: "help-circle",
  warning: "alert-triangle",
  fail: "x",
  error: "zap",
  bug: "bug",
  example: "list",
  quote: "quote",
};

export function calloutKind(type: string): string {
  return ALIASES[type] ?? type;
}

export function calloutColorVar(type: string): string {
  const kind = calloutKind(type);
  const known = kind in ICONS ? (kind === "note" ? "default" : kind) : "default";
  return `var(--callout-${known})`;
}

export function calloutIcon(type: string): IconName {
  return ICONS[calloutKind(type)] ?? "pencil";
}
