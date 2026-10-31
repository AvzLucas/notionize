import type { LineInfo } from "./types";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type RuleResult = DistributiveOmit<
  Exclude<LineInfo, { type: "blank" | "paragraph" | "table" }>,
  "indent" | "marker"
>;

type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface Rule {
  regex: RegExp;
  build: (match: RegExpExecArray) => RuleResult;
}

const RULES: Rule[] = [
  {
    regex: /^(#{1,6})[ \t]/,
    build: (m) => ({ type: "heading", level: m[1]!.length as Level }),
  },
  {
    regex: /^(`{3,}|~{3,})[ \t]*([^\s`]*).*$/,
    build: (m) => ({ type: "code", fence: m[1]!, language: m[2]! }),
  },
  {
    regex: /^(?:[-*+]|\d+[.)])[ \t]+\[([ xX])\][ \t]/,
    build: (m) => ({ type: "task", checked: m[1] !== " " }),
  },
  {
    regex: /^>[ \t]*\[!([\w-]+)\]([+-])?[ \t]?/,
    build: (m) => ({
      type: "callout",
      calloutType: m[1]!.toLowerCase(),
      ...(m[2] ? { fold: m[2] as "+" | "-" } : {}),
    }),
  },
  { regex: /^>[ \t]?/, build: () => ({ type: "quote" }) },
  { regex: /^\+[ \t]/, build: () => ({ type: "toggle" }) },
  { regex: /^[-*][ \t]/, build: () => ({ type: "bullet" }) },
  { regex: /^\d+[.)][ \t]/, build: () => ({ type: "numbered" }) },
];

export function parseLine(line: string): LineInfo {
  const indent = /^[ \t]*/.exec(line)![0].length;
  const rest = line.slice(indent);

  if (rest === "") return { type: "blank", indent, marker: null };
  if (rest.startsWith("|")) return { type: "table", indent, marker: null };

  for (const rule of RULES) {
    const match = rule.regex.exec(rest);
    if (match) {
      return {
        ...rule.build(match),
        indent,
        marker: { from: indent, to: indent + match[0].length },
      };
    }
  }

  return { type: "paragraph", indent, marker: null };
}
