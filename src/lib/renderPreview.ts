import katex from "katex";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

interface RenderResult {
  html: string;
  errors: string[];
}

function renderMath(expr: string, displayMode: boolean, errors: string[]): string {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      output: "html",
    });
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    const safe = expr.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
    return `<code class="katex-error">${safe}</code>`;
  }
}

/**
 * Render text containing markdown + LaTeX into HTML. Math expressions are
 * rendered with KaTeX first (and stashed as placeholders) so the markdown
 * parser doesn't mangle their backslashes or braces.
 */
export function renderPreview(input: string): RenderResult {
  if (!input.trim()) return { html: "", errors: [] };

  const errors: string[] = [];
  const stash: string[] = [];
  const PLACEHOLDER = (i: number) => `@@MATH_${i}@@`;

  function park(html: string): string {
    stash.push(html);
    return PLACEHOLDER(stash.length - 1);
  }

  let s = input;

  // Display math: \[...\] and $$...$$
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, expr: string) =>
    park(renderMath(expr, true, errors))
  );
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_m, expr: string) =>
    park(renderMath(expr, true, errors))
  );

  // Inline math: \(...\)
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_m, expr: string) =>
    park(renderMath(expr, false, errors))
  );

  // Inline math: $...$ — conservative (no whitespace touching $)
  s = s.replace(/(?<!\$)\$(?=\S)([^$\n]+?)(?<=\S)\$(?!\$)/g, (_m, expr: string) =>
    park(renderMath(expr, false, errors))
  );

  // Run markdown
  let html = marked.parse(s, { async: false }) as string;

  // Restore math
  html = html.replace(/@@MATH_(\d+)@@/g, (_m, idx: string) => stash[Number(idx)]);

  return { html, errors };
}
