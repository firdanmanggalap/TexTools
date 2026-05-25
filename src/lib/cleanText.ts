export type CleanCategory =
  | "markdown"
  | "latex"
  | "citations"
  | "htmlEmoji"
  | "whitespace";

export interface CleanOptions {
  markdown: boolean;
  latex: boolean;
  citations: boolean;
  htmlEmoji: boolean;
  whitespace: boolean;
}

export const DEFAULT_OPTIONS: CleanOptions = {
  markdown: true,
  latex: true,
  citations: true,
  htmlEmoji: true,
  whitespace: true,
};

export interface CleanResult {
  cleaned: string;
  removedChars: number;
  removedLines: number;
}

/**
 * Strip the requested formatting categories from `input`.
 * Order matters: LaTeX/tables before markdown so command tokens don't get
 * eaten as italic markers, and code fences before bold/italic.
 */
export function cleanText(
  input: string,
  opts: CleanOptions = DEFAULT_OPTIONS
): string {
  let s = input;

  if (opts.latex) {
    s = s.replace(/\\\[[\s\S]*?\\\]/g, "");
    s = s.replace(/\$\$[\s\S]*?\$\$/g, "");
    s = s.replace(/\\\([\s\S]*?\\\)/g, "");
    // Inline $...$ — be conservative: only when tight (no space touching $)
    s = s.replace(/(?<!\$)\$(?=\S)([^$\n]+?)(?<=\S)\$(?!\$)/g, "");
    // \begin{env} ... \end{env}
    s = s.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "");
    // Two-argument commands: \frac{a}{b} -> a b
    s = s.replace(/\\[a-zA-Z]+\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$1 $2");
    // One-argument commands: \sqrt{x} -> x, \text{abc} -> abc
    s = s.replace(/\\[a-zA-Z]+\s*\{([^{}]*)\}/g, "$1");
    // Bare commands: \alpha, \neq, ...
    s = s.replace(/\\[a-zA-Z]+\*?/g, "");
    // Stray subscript/superscript markers
    s = s.replace(/[_^]\{([^{}]*)\}/g, "$1");
    s = s.replace(/[_^]\S/g, "");
  }

  if (opts.htmlEmoji) {
    // HTML/XML tags
    s = s.replace(/<\/?[a-zA-Z][^>]*>/g, "");
    // HTML entities
    s = s.replace(/&[a-zA-Z]+;/g, "");
    s = s.replace(/&#\d+;/g, "");
    // Emoji ranges (Symbols & Pictographs, Misc Symbols, etc.)
    s = s.replace(
      /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F0FF}]/gu,
      ""
    );
    // Common decorative arrows & bullets often used in AI output
    s = s.replace(/[→←↑↓⇒⇐⇑⇓⇔•▪◆◇★☆✓✗✦✧❮❯❘❙❚▶◀▼▲►◄]/g, "");
    // Zero-width / variation selectors
    s = s.replace(/[​-‍﻿️]/g, "");
  }

  if (opts.citations) {
    // Markdown links [text](url) -> text
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
    // Markdown images ![alt](src) -> alt
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1");
    // Bare URLs
    s = s.replace(/https?:\/\/\S+/g, "");
    s = s.replace(/\bwww\.\S+/g, "");
    // Bracketed numeric citations [1], [12], [1, 2, 3], [1-3]
    s = s.replace(/\[\d+(?:\s*[-,;]\s*\d+)*\]/g, "");
    // Author-year: (Smith, 2020), (Doe et al., 2019; Lee, 2021)
    s = s.replace(
      /\(\s*[A-Z][\w.'-]*(?:\s+(?:and|&)\s+[A-Z][\w.'-]*|\s+et\s+al\.?)?\s*,?\s*\d{4}[a-z]?(?:\s*[;,]\s*[A-Z][\w.'-]*(?:\s+(?:and|&)\s+[A-Z][\w.'-]*|\s+et\s+al\.?)?\s*,?\s*\d{4}[a-z]?)*\s*\)/g,
      ""
    );
    // Bracketed author-year: [Smith 2020]
    s = s.replace(
      /\[\s*[A-Z][\w.'-]*(?:\s+(?:and|&)\s+[A-Z][\w.'-]*|\s+et\s+al\.?)?\s+\d{4}[a-z]?\s*\]/g,
      ""
    );
  }

  if (opts.markdown) {
    // Code fences ```lang\n...\n```
    s = s.replace(/```[\s\S]*?```/g, "");
    // Inline code `x`
    s = s.replace(/`([^`]+)`/g, "$1");
    // ATX headings
    s = s.replace(/^\s*#{1,6}\s+/gm, "");
    // Setext-style heading underlines (=== or ---) — only if next line below another line
    s = s.replace(/^[=]{3,}\s*$/gm, "");
    // Bold ** ** and __ __
    s = s.replace(/\*\*([\s\S]+?)\*\*/g, "$1");
    s = s.replace(/__([\s\S]+?)__/g, "$1");
    // Italic * * (avoid matching ** boundaries) and _ _
    s = s.replace(/(?<!\*)\*(?!\s)([^*\n]+?)(?<!\s)\*(?!\*)/g, "$1");
    s = s.replace(/(?<!_)_(?!\s)([^_\n]+?)(?<!\s)_(?!_)/g, "$1");
    // Strikethrough ~~x~~
    s = s.replace(/~~([\s\S]+?)~~/g, "$1");
    // List markers
    s = s.replace(/^\s*[-*+]\s+/gm, "");
    s = s.replace(/^\s*\d+\.\s+/gm, "");
    // Blockquotes
    s = s.replace(/^\s*>\s?/gm, "");
    // Horizontal rules: --- *** ___
    s = s.replace(/^\s*(?:[-*_]\s*){3,}\s*$/gm, "");
  }

  if (opts.whitespace) {
    // Normalize line endings
    s = s.replace(/\r\n?/g, "\n");
    // Trim trailing whitespace on every line
    s = s
      .split("\n")
      .map((l) => l.replace(/[ \t]+$/, ""))
      .join("\n");
    // Collapse multiple in-line spaces (but keep newlines)
    s = s.replace(/[ \t]{2,}/g, " ");
    // Collapse 3+ blank lines into a single blank line
    s = s.replace(/\n{3,}/g, "\n\n");
    s = s.trim();
  }

  return s;
}

export function diffSummary(original: string, cleaned: string): CleanResult {
  return {
    cleaned,
    removedChars: Math.max(0, original.length - cleaned.length),
    removedLines: Math.max(
      0,
      original.split("\n").length - cleaned.split("\n").length
    ),
  };
}

export const CATEGORY_META: Record<
  CleanCategory,
  { label: string; hint: string }
> = {
  markdown: {
    label: "Markdown",
    hint: "Headers, **bold**, *italic*, lists, blockquotes, code fences",
  },
  latex: {
    label: "LaTeX",
    hint: "Inline & display math, \\frac{}{}, \\sqrt{}, environments",
  },
  citations: {
    label: "Citations & URLs",
    hint: "Markdown links, raw URLs, [1] / (Smith, 2020) style references",
  },
  htmlEmoji: {
    label: "HTML & emoji",
    hint: "HTML tags, entities, emoji, decorative arrows & bullets",
  },
  whitespace: {
    label: "Whitespace",
    hint: "Trim line ends, collapse runs of spaces and blank lines",
  },
};
