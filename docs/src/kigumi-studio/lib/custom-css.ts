// Custom CSS: the free-form rules of a custom theme (GLOSSARY.md). Studio
// stores them as they go into a project's overrides.css, unscoped, and scopes
// them only for the preview, so no rule reaches Studio's own UI (ADR 0009).

/** One top-level piece of a stylesheet. */
export type CssNode =
  | { kind: 'rule'; selector: string; body: string }
  | { kind: 'block'; prelude: string; body: string }
  | { kind: 'statement'; text: string };

interface ParsedCss {
  nodes: CssNode[];
  errors: string[];
}

/** Index just past the comment or string starting at `i`, or -1 if unterminated. */
function skipCommentOrString(css: string, i: number): number | undefined {
  if (css.startsWith('/*', i)) {
    const end = css.indexOf('*/', i + 2);
    return end === -1 ? -1 : end + 2;
  }
  const quote = css[i];
  if (quote !== '"' && quote !== "'") return undefined;
  for (let j = i + 1; j < css.length; j++) {
    if (css[j] === '\\') j++;
    else if (css[j] === quote) return j + 1;
    else if (css[j] === '\n') return -1;
  }
  return -1;
}

/** Index of the `}` matching the `{` before `start`, or -1. */
function matchingBrace(css: string, start: number): number {
  let depth = 1;
  for (let i = start; i < css.length; i++) {
    const skipped = skipCommentOrString(css, i);
    if (skipped === -1) return -1;
    if (skipped !== undefined) {
      i = skipped - 1;
      continue;
    }
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return i;
  }
  return -1;
}

/** Collapse comments out of a selector or prelude. */
function withoutComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCss(css: string): ParsedCss {
  const nodes: CssNode[] = [];
  const errors: string[] = [];
  let prelude = '';
  for (let i = 0; i < css.length; i++) {
    const skipped = skipCommentOrString(css, i);
    if (skipped === -1) {
      errors.push(
        css.startsWith('/*', i)
          ? 'A comment is never closed with */.'
          : 'A string is never closed.'
      );
      return { nodes, errors };
    }
    if (skipped !== undefined) {
      prelude += css.slice(i, skipped);
      i = skipped - 1;
      continue;
    }
    const ch = css[i];
    if (ch === '{') {
      const end = matchingBrace(css, i + 1);
      const head = withoutComments(prelude);
      if (end === -1) {
        errors.push(`"${head || '{'}" opens a block that is never closed.`);
        return { nodes, errors };
      }
      const body = css.slice(i + 1, end);
      if (!head) errors.push('A block has no selector before its {.');
      else if (head.startsWith('@'))
        nodes.push({ kind: 'block', prelude: head, body });
      else nodes.push({ kind: 'rule', selector: head, body });
      prelude = '';
      i = end;
    } else if (ch === '}') {
      errors.push('A } closes a block that was never opened.');
      return { nodes, errors };
    } else if (ch === ';') {
      const text = withoutComments(prelude);
      if (text.startsWith('@'))
        nodes.push({ kind: 'statement', text: `${text};` });
      else if (text) errors.push(`"${text};" is outside any rule.`);
      prelude = '';
    } else {
      prelude += ch;
    }
  }
  const rest = withoutComments(prelude);
  if (rest)
    errors.push(`"${rest}" after the last rule is not part of any rule.`);
  return { nodes, errors };
}

/** Split on `separator` outside parentheses, brackets and strings. */
function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let current = '';
  for (const ch of text) {
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    if (ch === separator && depth === 0 && !quote) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** At-rules whose blocks hold style rules, which need scoping too. */
const CONDITIONAL_AT_RULES = /^@(media|supports|container)\b/i;

/**
 * A selector that starts at the document root (`:root`, `html`, `body`, or
 * the mode classes `.wa-dark` / `.wa-light`): what follows the root in its
 * leading compound (`suffix`, such as `.wa-dark`) and the rest after it.
 */
function rootParts(
  selector: string
): { suffix: string; rest: string } | undefined {
  const element = /^(?::root|html|body)(?![\w-])([^\s>+~]*)([\s\S]*)$/i.exec(
    selector
  );
  if (element) return { suffix: element[1], rest: element[2] };
  const mode = /^(\.wa-(?:dark|light))(?![\w-])([^\s>+~]*)([\s\S]*)$/.exec(
    selector
  );
  if (mode) return { suffix: mode[1] + mode[2], rest: mode[3] };
  return undefined;
}

function declarationBlock(declarations: string[]): string {
  return `{\n  ${declarations.map((d) => `${d};`).join('\n  ')}\n}`;
}

/**
 * One style rule, scoped. A rule for the root itself is split: its custom
 * properties go to the theme root's children, where they beat the custom
 * theme's values the preview sets inline on the root; everything else goes
 * to the root.
 */
function scopeRule(selector: string, body: string, root: string): string[] {
  const bareRoots: string[] = [];
  const scoped: string[] = [];
  for (const one of splitTopLevel(selector, ',')) {
    const parts = rootParts(one);
    if (parts && !parts.rest.trim()) bareRoots.push(`${root}${parts.suffix}`);
    else if (parts) scoped.push(`${root}${parts.suffix}${parts.rest}`);
    else scoped.push(`${root} ${one}`);
  }
  const out: string[] = [];
  if (bareRoots.length > 0) {
    const declarations = splitTopLevel(body, ';');
    const own = declarations.filter((d) => !d.startsWith('--'));
    const inherited = declarations.filter((d) => d.startsWith('--'));
    if (own.length > 0) {
      out.push(`${bareRoots.join(', ')} ${declarationBlock(own)}`);
    }
    if (inherited.length > 0) {
      const children = bareRoots.map((r) => `${r} > *`).join(', ');
      out.push(`${children} ${declarationBlock(inherited)}`);
    }
  }
  if (scoped.length > 0) out.push(`${scoped.join(', ')} {${body}}`);
  return out;
}

function scopeNodes(nodes: CssNode[], root: string): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    if (node.kind === 'rule') {
      out.push(...scopeRule(node.selector, node.body, root));
    } else if (
      node.kind === 'block' &&
      CONDITIONAL_AT_RULES.test(node.prelude)
    ) {
      const inner = scopeNodes(parseCss(node.body).nodes, root).join('\n');
      out.push(`${node.prelude} {\n${inner}\n}`);
    } else if (node.kind === 'block' && /^@layer\b/i.test(node.prelude)) {
      // Unwrapped: in a project @layer orders the rules among the layers;
      // in the preview a layer loses to Studio's unlayered CSS and to the
      // inline theme values, so its rules would never show.
      out.push(...scopeNodes(parseCss(node.body).nodes, root));
    } else if (node.kind === 'block') {
      // @keyframes, @font-face, @property: no selectors to scope.
      out.push(`${node.prelude} {${node.body}}`);
    } else {
      out.push(node.text);
    }
  }
  return out;
}

/**
 * The top-level rules, at-rule blocks and at-rule statements of `css`, in
 * order; comments are dropped from selectors and preludes, bodies are kept
 * as written. Stops at the first structural error (`validateCustomCSS`).
 */
export function splitStylesheet(css: string): CssNode[] {
  return parseCss(css).nodes;
}

/** Whether a block holds style rules: a conditional group or a layer. */
function holdsRules(prelude: string): boolean {
  return CONDITIONAL_AT_RULES.test(prelude) || /^@layer\b/i.test(prelude);
}

/**
 * What is wrong with the structure of `css`, one sentence each: blocks that
 * do not close, declarations outside a rule, a block without a selector, an
 * unclosed comment or string. Empty when it can be applied. Property names
 * and values are not checked; a browser ignores what it does not know.
 */
export function validateCustomCSS(css: string): string[] {
  const { nodes, errors } = parseCss(css);
  if (errors.length > 0) return errors;
  return nodes.flatMap((node) =>
    node.kind === 'block' && holdsRules(node.prelude)
      ? validateCustomCSS(node.body)
      : []
  );
}

/**
 * `css` scoped to the preview: every selector goes under `root`, the
 * preview's theme root, so the rules reach the preview and nothing else.
 */
export function scopeCustomCSS(css: string, root: string): string {
  return scopeNodes(parseCss(css).nodes, root).join('\n\n');
}

/**
 * Custom CSS as an earlier Studio saved it, as written: its import stored
 * each selector with the preview scope (`.studio-preview .Card`) in front.
 */
export function storedCustomCSS(
  stored: string | null | undefined
): string | null {
  if (!stored) return null;
  return stored.replace(/\.studio-preview\s+/g, '');
}
