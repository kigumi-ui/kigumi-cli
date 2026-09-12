#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Guard the flush code block convention in docs/.
 *
 * Web Awesome rounds all four corners of every `pre`. Where a code block sits
 * flush against the edges of a rounded panel, those corners curve away from
 * the border and leave a visible gap. `docs/src/components/FlushCodeBlock.css`
 * fixes that with an opt-in class, but nothing stopped the bug returning: a new
 * code block written the old way renders wrong, and only a human looking at the
 * page would notice.
 *
 * A block is "flush" when its nearest enclosing JSX container zeroes the
 * panel's own inset, which in this codebase means a `--spacing: 0` card or a
 * `--padding: 0` tab panel. Such a block must carry `flush-code`.
 *
 * Padded, standalone code blocks are deliberately left native and are not
 * flagged, because they have no zero-inset ancestor. That falls out of the rule
 * rather than needing a list of exemptions to keep up to date.
 *
 * Scope: a per-file static scan over docs/src. Every flush container in this
 * tree is an inline style in the same file as its `pre`, so the nesting needed
 * to decide the question is always local. If a container's spacing ever moves
 * into a stylesheet or a wrapper component, this check cannot see it and the
 * approach has to be revisited.
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { glob } from 'tinyglobby';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const DOCS_SRC = path.join(PROJECT_ROOT, 'docs/src');

/** The class that opts a block into following the panel's inner radius. */
const FLUSH_CLASS = 'flush-code';

/** The variant for a block sitting directly below a straight edge. */
const DIVIDER_CLASS = 'flush-code--below-divider';

export interface FlushCodeFinding {
  file: string;
  line: number;
  kind: 'missing-flush-class' | 'missing-divider-variant';
  /** The zero-inset ancestor, or 'divider' when inferred from the edge above. */
  container: string;
}

export interface FlushCodeResult {
  passed: boolean;
  findings: FlushCodeFinding[];
  filesScanned: number;
  blocksChecked: number;
}

/**
 * True when a JSX opening tag zeroes the panel inset that would otherwise
 * hold the code block away from the border.
 *
 * Matches the inline-style forms actually used in docs/, both the single-line
 * `style={{ '--spacing': '0' }}` and the multi-line object where the property
 * sits on its own line. Quotes may be single or double, and the value may be
 * `0` or `0px`.
 */
export function isFlushContainer(tagText: string): boolean {
  return /["']--(?:spacing|padding)["']\s*:\s*["']0(?:px)?["']/.test(tagText);
}

/**
 * True when the element directly above the code block draws a straight
 * horizontal edge, which is what the `--below-divider` variant squares off
 * against. In docs/ that is a tab bar or a filename row.
 */
export function hasDividerAbove(precedingText: string): boolean {
  return (
    /borderBottom\s*:/.test(precedingText) ||
    /<TabGroup[\s>]/.test(precedingText) ||
    /<\/Tab>/.test(precedingText)
  );
}

/**
 * Find the opening tag of the innermost JSX element still open at `index`.
 *
 * Walks backwards counting tag depth so that closed siblings are skipped: a
 * `</div>` seen on the way up means the matching `<div>` encloses a sibling,
 * not us. Self-closing tags and the code block's own tag never open a scope.
 *
 * Returns the full opening tag text, or null at the outermost level.
 */
export function findEnclosingTag(
  source: string,
  index: number
): { tag: string; name: string } | null {
  const before = source.slice(0, index);
  // Every tag, capturing whether it closes and whether it self-closes.
  const tagPattern =
    /<(\/?)([A-Za-z][\w.]*)((?:[^<>'"]|'[^']*'|"[^"]*")*?)(\/?)>/g;

  const openTags: { tag: string; name: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(before)) !== null) {
    const [full, closing, name, , selfClosing] = match;
    if (closing) {
      // Pop back to the matching open tag, tolerating unbalanced fragments.
      for (let i = openTags.length - 1; i >= 0; i--) {
        if (openTags[i].name === name) {
          openTags.length = i;
          break;
        }
      }
    } else if (!selfClosing) {
      openTags.push({ tag: full, name });
    }
  }

  return openTags.length > 0 ? openTags[openTags.length - 1] : null;
}

/**
 * Scan one file's source for code blocks that sit flush without opting in.
 *
 * Exported as a pure function so the rule can be tested against hand-written
 * snippets without touching the repo, and so a bug injected into the rule
 * fails a test rather than only showing up as a silent pass on the real tree.
 */
export function scanFlushCode(
  source: string,
  file: string
): FlushCodeFinding[] {
  const findings: FlushCodeFinding[] = [];
  const prePattern = /<pre(\s[^>]*)?>/g;

  let match: RegExpExecArray | null;
  while ((match = prePattern.exec(source)) !== null) {
    const attrs = match[1] ?? '';
    const line = source.slice(0, match.index).split('\n').length;

    // Walk out through wrappers that do not themselves set the inset, so a
    // `pre` nested in a layout div still sees the card that holds it.
    let index = match.index;
    let container: { tag: string; name: string } | null = null;
    for (let depth = 0; depth < 6; depth++) {
      const enclosing = findEnclosingTag(source, index);
      if (!enclosing) break;
      if (isFlushContainer(enclosing.tag)) {
        container = enclosing;
        break;
      }
      const at = source.lastIndexOf(enclosing.tag, index - 1);
      if (at < 0) break;
      index = at;
    }

    // A block can also be flush without a visible ancestor: helper components
    // like FrameworkCodeBlock's CodePane render the block in one function while
    // the zero-inset Card lives in another. A filename row or tab bar drawn
    // directly above the block is the local evidence that it sits inside a
    // panel, so treat that as flush too rather than skipping the block.
    const preceding = source.slice(
      Math.max(0, match.index - 1200),
      match.index
    );
    const dividerAbove = hasDividerAbove(preceding);

    if (!container && !dividerAbove) continue;

    if (!attrs.includes(FLUSH_CLASS)) {
      findings.push({
        file,
        line,
        kind: 'missing-flush-class',
        container: container?.name ?? 'divider',
      });
      continue;
    }

    // The divider variant is a separate decision: it depends on whether a
    // straight edge sits above the block, not on whether it is flush.
    if (dividerAbove && !attrs.includes(DIVIDER_CLASS)) {
      findings.push({
        file,
        line,
        kind: 'missing-divider-variant',
        container: container?.name ?? 'divider',
      });
    }
  }

  return findings;
}

export async function validateFlushCode(): Promise<FlushCodeResult> {
  const files = await glob('**/*.{tsx,mdx}', {
    cwd: DOCS_SRC,
    // Generated by the CLI; never hand-edited, so never our rule to enforce.
    ignore: ['components/ui/**'],
    onlyFiles: true,
  });

  const findings: FlushCodeFinding[] = [];
  let blocksChecked = 0;

  for (const relative of files.sort()) {
    const source = await fs.readFile(path.join(DOCS_SRC, relative), 'utf-8');
    if (!source.includes('<pre')) continue;
    blocksChecked += (source.match(/<pre(\s[^>]*)?>/g) ?? []).length;
    findings.push(...scanFlushCode(source, path.join('docs/src', relative)));
  }

  return {
    passed: findings.length === 0,
    findings,
    filesScanned: files.length,
    blocksChecked,
  };
}

function printResults(result: FlushCodeResult): void {
  console.log(pc.cyan('\nValidating flush code blocks...\n'));

  const missingClass = result.findings.filter(
    (f) => f.kind === 'missing-flush-class'
  );
  const missingVariant = result.findings.filter(
    (f) => f.kind === 'missing-divider-variant'
  );

  if (missingClass.length > 0) {
    console.log(pc.red('  Code blocks sitting flush without the class:'));
    for (const f of missingClass) {
      const where =
        f.container === 'divider'
          ? 'below a divider'
          : `inside <${f.container}>`;
      console.log(pc.red(`    ${f.file}:${f.line} (${where})`));
    }
    console.log('');
    console.log(
      pc.yellow(
        `Fix: add className="${FLUSH_CLASS}" to the <pre>. Its container zeroes\n` +
          "the panel inset, so without the class Web Awesome's four-corner radius\n" +
          'curves away from the border and leaves a visible gap.\n'
      )
    );
  }

  if (missingVariant.length > 0) {
    console.log(pc.red('  Flush blocks below a divider missing the variant:'));
    for (const f of missingVariant) {
      const where =
        f.container === 'divider'
          ? 'below a divider'
          : `inside <${f.container}>`;
      console.log(pc.red(`    ${f.file}:${f.line} (${where})`));
    }
    console.log('');
    console.log(
      pc.yellow(
        `Fix: use className="${FLUSH_CLASS} ${DIVIDER_CLASS}". A tab bar or\n` +
          'filename row draws a straight edge above the block, so its top corners\n' +
          'must be square rather than following the panel radius.\n'
      )
    );
  }

  if (result.passed) {
    console.log(
      pc.green(
        `Flush code validation passed! ${result.blocksChecked} code block(s) across ${result.filesScanned} files.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `Flush code validation failed with ${result.findings.length} error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const result = await validateFlushCode();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during flush code validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
