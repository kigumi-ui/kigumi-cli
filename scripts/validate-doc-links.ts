#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Markdown Link Checker
 *
 * PURPOSE: a relative link in a markdown file is a claim that a path exists.
 * Nothing verified those claims, so they rotted silently: `.cursor/SKILLS.md`
 * pointed at six skill files for six months after the directory holding them
 * was deleted, and two skills sent agents to reference docs that were never
 * written. A dead link in an agent-facing document is worse than no link, as
 * it sends the reader somewhere instead of nowhere.
 *
 * CHECKS (fails the build):
 * - Every relative markdown link `[text](path)` in a tracked `.md`/`.mdx` file
 *   resolves to a path that exists.
 *
 * WHAT IS DELIBERATELY NOT CHECKED:
 * - External URLs. Reaching the network makes the check flaky and slow, and
 *   turns someone else's outage into a failed build here.
 * - Bare anchors (`#section`), mailto: and tel:.
 * - Links inside fenced code blocks: those are examples of syntax, not claims
 *   that a file exists.
 * - `tests/fixtures/`: fixture documents are synthetic by construction. The
 *   state fixtures link to sibling files that intentionally do not exist,
 *   because that is the input the parser under test has to survive.
 *
 * USAGE:
 *   pnpm validate:doc-links
 *   tsx scripts/validate-doc-links.ts
 */

import { execFileSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import pc from 'picocolors';

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(path.dirname(__filename));

/**
 * Paths whose markdown is test input rather than documentation. A fixture that
 * links to a file which does not exist is usually the point of the fixture.
 */
const EXCLUDED_PREFIXES: readonly string[] = ['tests/fixtures/'];

const MARKDOWN_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;
const FENCED_BLOCK = /```[\s\S]*?```/g;
const INLINE_CODE = /`[^`\n]*`/g;

export interface LinkFinding {
  readonly file: string;
  readonly label: string;
  readonly target: string;
  readonly resolved: string;
}

/**
 * True for a link target this check has an opinion about.
 *
 * Only repository-relative paths are claims we can verify. Everything else is
 * either someone else's problem (an external URL) or not a path at all.
 */
export function isCheckableTarget(target: string): boolean {
  const t = target.trim();
  if (!t) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return false; // any URI scheme
  if (t.startsWith('#')) return false; // bare anchor
  if (t.startsWith('//')) return false; // protocol-relative
  return true;
}

/** Strip the anchor and any link title, leaving the path itself. */
export function normalizeTarget(target: string): string {
  return target.trim().split('#')[0]!.split(/\s+/)[0]!.trim();
}

export function isExcluded(file: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => file.startsWith(p));
}

/**
 * Find every unresolvable relative link in one markdown document.
 *
 * Pure apart from the `exists` probe, which is injected so tests can drive the
 * matcher without laying files on disk.
 */
export function findBrokenLinks(
  file: string,
  content: string,
  exists: (repoRelativePath: string) => boolean
): LinkFinding[] {
  const findings: LinkFinding[] = [];

  // Code samples show syntax; they are not claims that a path exists.
  const prose = content.replace(FENCED_BLOCK, '').replace(INLINE_CODE, '');

  const dir = path.dirname(file);
  let match: RegExpExecArray | null;

  // MARKDOWN_LINK is global and shared across calls, but the loop below always
  // runs to completion, and the null that ends it is what resets `lastIndex`.
  // No state survives to the next document. Break out early and that stops
  // being true.
  while ((match = MARKDOWN_LINK.exec(prose)) !== null) {
    const rawTarget = match[2]!;
    if (!isCheckableTarget(rawTarget)) continue;

    const target = normalizeTarget(rawTarget);
    if (!target) continue;

    const resolved = path.normalize(path.join(dir, target));
    if (exists(resolved)) continue;

    findings.push({ file, label: match[1]!, target: rawTarget, resolved });
  }

  return findings;
}

function listTrackedMarkdown(): string[] {
  const out = execFileSync('git', ['ls-files', '-z', '*.md', '*.mdx'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.split('\0').filter(Boolean);
}

export interface LinkScanResult {
  readonly passed: boolean;
  readonly filesScanned: number;
  readonly findings: LinkFinding[];
}

export function validateDocLinks(): LinkScanResult {
  const files = listTrackedMarkdown().filter((f) => !isExcluded(f));
  const findings: LinkFinding[] = [];
  const exists = (rel: string): boolean =>
    fs.pathExistsSync(path.join(PROJECT_ROOT, rel));

  for (const file of files) {
    let content: string;
    try {
      content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
    } catch {
      continue;
    }
    findings.push(...findBrokenLinks(file, content, exists));
  }

  return {
    passed: findings.length === 0,
    filesScanned: files.length,
    findings,
  };
}

function printResults(result: LinkScanResult): void {
  console.log(pc.cyan('\nChecking relative links in tracked markdown...\n'));

  if (result.findings.length > 0) {
    console.log(pc.red(`Broken links (${result.findings.length}):`));
    for (const f of result.findings) {
      console.log(pc.red(`  ${f.file}`));
      console.log(pc.red(`    [${f.label}](${f.target}) -> ${f.resolved}`));
    }
    console.log('');
    console.log(
      pc.yellow(
        'Fix: point the link at a path that exists, or drop it. A link to a\n' +
          'missing file sends the reader somewhere instead of nowhere, which is\n' +
          'worse than having no link at all.\n'
      )
    );
  }

  if (result.passed) {
    console.log(
      pc.green(
        `Doc link validation passed! All relative links resolve across ${result.filesScanned} files.\n`
      )
    );
  } else {
    console.log(
      pc.red(
        `Doc link validation failed with ${result.findings.length} error(s)\n`
      )
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

function main(): void {
  try {
    const result = validateDocLinks();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during doc link validation:'));
    console.error(error);
    process.exit(1);
  }
}

// Only run when executed directly, not when imported (keeps the script testable)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
