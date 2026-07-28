#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Generated-Artifact Freshness Guard (`validate:generated-fresh`).
 *
 * Enforces "committed == freshly generated" for artifacts that `validate:all`
 * (registry/templates/changes/stories/cem-sync/parity/agents) does NOT cover.
 * Four checks, each designed against the measured reality of the tree rather
 * than the naive "byte-identical" assumption:
 *
 *   A (generator-driven): regenerate metadata + templates + skill-refs into a
 *     tmp copy, run Prettier on the outputs, then diff against the committed
 *     files. Skipped when the Web Awesome CEM isn't on disk (fresh clone / no
 *     Pro token), mirroring `check-metadata-freshness`.
 *
 *   B (docs-wrapper CSS, comment-normalized): the hand-maintained docs wrappers
 *     in `docs/src/components/ui/` were authored with a richer comment style than
 *     the template generator emits, so 74/78 differ byte-wise while only their
 *     `/* *\/` doc-comments diverge. We compare CSS *rules* after stripping
 *     comments. Genuine docs-only `::part` overrides (e.g. Page's
 *     `navigation-toggle`) are permitted via a small allowlist.
 *
 *   C (JS-variant parity, subset): `.jsx` files are hand-maintained and
 *     intentionally wire *fewer* events/props than their `.tsx` siblings
 *     (14/78 components). We enforce that the `.jsx` surface is a SUBSET of the
 *     `.tsx` surface — the `.jsx` may do less, but must never reference an
 *     event/prop/method the `.tsx` doesn't have (a real typo/drift).
 *
 *   D (starter fixtures, comment-normalized): each fixture `.css` under
 *     `tests/fixtures/starter-snapshots/` must match its source template by
 *     rules (next -> react template, angular -> angular template).
 *
 * Exit codes: 0 = fresh (or skipped because CEM missing); 1 = drift found.
 *
 *   E (llms.txt version claims): `llms.txt` is hand-maintained, ships in the
 *     npm tarball, and is written for LLM consumers. Its sample `status --json`
 *     payload had gone four minor releases stale unnoticed, so the CLI and Web
 *     Awesome versions it quotes are now checked against package.json.
 */
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { findCustomElementsJson } from './find-cem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.dirname(__dirname);

// ── Pure helpers (unit-tested) ───────────────────────────────────────────────

/**
 * Strip `/* *\/` block comments and blank lines, then trim each remaining line.
 * Used to compare CSS *rules* while ignoring the doc-comment style differences
 * between hand-authored docs wrappers and generated templates.
 */
export function stripCssComments(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/** Two CSS strings are rule-equal if they match after comment-normalization. */
export function cssRulesEqual(a: string, b: string): boolean {
  return stripCssComments(a) === stripCssComments(b);
}

/**
 * Docs-only CSS allowlist: components whose docs wrapper may add specific
 * `::part(<name>)` overrides absent from the template. The Page wrapper hides
 * the navigation toggle on the docs site; that is intentional, not drift.
 */
const DOCS_ONLY_CSS_ALLOWLIST: Record<string, string[]> = {
  Page: ['navigation-toggle'],
};

/**
 * True when the CSS contains a nested at-rule (`@media`, `@supports`,
 * `@keyframes`, `@layer`, ...). The flat `}`-split in {@link splitCssRuleBlocks}
 * cannot represent nested blocks, so callers that rely on rule-block granularity
 * must refuse to reason about such CSS rather than mis-split it. No component
 * CSS uses at-rules today; this guards the day one does.
 */
export function containsAtRule(css: string): boolean {
  return /@[a-z-]+/i.test(stripCssComments(css));
}

/**
 * Split comment-normalized CSS into whole rule blocks (`selector { ... }`).
 * Rule-block granularity is required because a docs-only override spans several
 * lines (selector line, declarations, closing brace). Only valid for flat CSS
 * with no nested at-rules — guard with {@link containsAtRule} first.
 */
export function splitCssRuleBlocks(css: string): string[] {
  const normalized = stripCssComments(css);
  return normalized
    .split(/\}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => `${block}\n}`);
}

/**
 * Returns true when the only rule-level differences between `docsCss` and
 * `templateCss` are docs-only `::part(<name>)` overrides explicitly allowlisted
 * for `component`. Any other extra/changed/missing rule returns false.
 *
 * Refuses (returns false) when either side contains a nested at-rule, because
 * the rule-block splitter cannot safely reason about nested blocks; such drift
 * should fail loudly and be re-examined rather than silently pass.
 */
export function isDocsOnlyCssAllowed(
  component: string,
  docsCss: string,
  templateCss: string
): boolean {
  const allowedParts = DOCS_ONLY_CSS_ALLOWLIST[component];
  if (!allowedParts || allowedParts.length === 0) return false;
  if (containsAtRule(docsCss) || containsAtRule(templateCss)) return false;

  const docsBlocks = splitCssRuleBlocks(docsCss);
  const templateBlocks = new Set(splitCssRuleBlocks(templateCss));

  // Every template rule must still be present in docs (no missing/changed rule).
  for (const block of templateBlocks) {
    if (!docsBlocks.includes(block)) return false;
  }
  // Every docs rule absent from the template must be an allowlisted ::part().
  for (const block of docsBlocks) {
    if (templateBlocks.has(block)) continue;
    const matchesAllowedPart = allowedParts.some((part) =>
      block.includes(`::part(${part})`)
    );
    if (!matchesAllowedPart) return false;
  }
  return true;
}

export interface ReactSurface {
  events: Set<string>;
}

/**
 * Extract the observable surface of a React wrapper source.
 *
 * Scope is deliberately limited to `addEventListener('x', ...)` event names —
 * the one signal that extracts reliably across all 78 hand-written wrappers and
 * for which the `.jsx ⊆ .tsx` subset invariant provably holds. The forwarded
 * `onX` props and `useImperativeHandle` method names were considered but
 * dropped: the `.tsx` and `.jsx` variants legitimately expose *different*
 * imperative APIs (e.g. Dialog.tsx exposes an `element` getter while Dialog.jsx
 * exposes `show`/`hide`/`requestClose`), so a subset rule there yields false
 * positives. Events are forwarded one-to-one in both variants, so a `.jsx`
 * event missing from the `.tsx` is a genuine typo/drift.
 */
export function extractReactSurface(src: string): ReactSurface {
  const events = new Set<string>();
  for (const m of src.matchAll(/addEventListener\(\s*['"]([^'"]+)['"]/g)) {
    events.add(m[1]);
  }
  return { events };
}

/** Members present in `subset` but absent from `superset` (subset violations). */
export function diffSubset(
  subset: Set<string>,
  superset: Set<string>
): string[] {
  return [...subset].filter((member) => !superset.has(member)).sort();
}

// ── Finding model ────────────────────────────────────────────────────────────

interface Finding {
  check: 'A' | 'B' | 'C' | 'D' | 'E';
  component: string;
  message: string;
}

interface GuardResult {
  passed: boolean;
  skippedA: boolean;
  findings: Finding[];
}

// ── Check B: docs-wrapper CSS (comment-normalized) ───────────────────────────

async function checkDocsWrapperCss(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const docsUiDir = path.join(PROJECT_ROOT, 'docs/src/components/ui');
  if (!(await fs.pathExists(docsUiDir))) return findings;

  const entries = await fs.readdir(docsUiDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const docsCssPath = path.join(docsUiDir, name, `${name}.css`);
    const templateCssPath = path.join(
      PROJECT_ROOT,
      'templates/react',
      name,
      `${name}.css`
    );
    if (!(await fs.pathExists(docsCssPath))) continue;
    if (!(await fs.pathExists(templateCssPath))) {
      findings.push({
        check: 'B',
        component: name,
        message: `docs wrapper has no matching react template CSS`,
      });
      continue;
    }
    const docsCss = await fs.readFile(docsCssPath, 'utf-8');
    const templateCss = await fs.readFile(templateCssPath, 'utf-8');
    if (cssRulesEqual(docsCss, templateCss)) continue;
    if (isDocsOnlyCssAllowed(name, docsCss, templateCss)) continue;
    findings.push({
      check: 'B',
      component: name,
      message: `docs wrapper CSS rules drift from templates/react/${name}/${name}.css`,
    });
  }
  return findings;
}

// ── Check C: JS-variant subset parity ────────────────────────────────────────

async function checkJsVariantSubset(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const reactDir = path.join(PROJECT_ROOT, 'templates/react');
  if (!(await fs.pathExists(reactDir))) return findings;

  const entries = await fs.readdir(reactDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const tsxPath = path.join(reactDir, name, `${name}.tsx`);
    const jsxPath = path.join(reactDir, name, `${name}.jsx`);
    if (!(await fs.pathExists(tsxPath)) || !(await fs.pathExists(jsxPath))) {
      continue;
    }
    const tsx = extractReactSurface(await fs.readFile(tsxPath, 'utf-8'));
    const jsx = extractReactSurface(await fs.readFile(jsxPath, 'utf-8'));

    const eventViolations = diffSubset(jsx.events, tsx.events);
    if (eventViolations.length) {
      findings.push({
        check: 'C',
        component: name,
        message: `.jsx wires events absent from .tsx: ${eventViolations.join(', ')}`,
      });
    }
  }
  return findings;
}

// ── Check D: starter fixtures (comment-normalized) ───────────────────────────

const FIXTURE_FRAMEWORK_TEMPLATE: Record<string, string> = {
  next: 'react',
  react: 'react',
  vue: 'vue',
  angular: 'angular',
};

async function checkStarterFixtures(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const fixturesRoot = path.join(
    PROJECT_ROOT,
    'tests/fixtures/starter-snapshots'
  );
  if (!(await fs.pathExists(fixturesRoot))) return findings;

  for (const [fixtureFramework, templateFramework] of Object.entries(
    FIXTURE_FRAMEWORK_TEMPLATE
  )) {
    const uiDir = path.join(fixturesRoot, fixtureFramework, 'components/ui');
    if (!(await fs.pathExists(uiDir))) continue;

    const entries = await fs.readdir(uiDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      const fixtureCssPath = path.join(uiDir, name, `${name}.css`);
      const templateCssPath = path.join(
        PROJECT_ROOT,
        'templates',
        templateFramework,
        name,
        `${name}.css`
      );
      if (!(await fs.pathExists(fixtureCssPath))) continue;
      if (!(await fs.pathExists(templateCssPath))) continue;
      const fixtureCss = await fs.readFile(fixtureCssPath, 'utf-8');
      const templateCss = await fs.readFile(templateCssPath, 'utf-8');
      if (cssRulesEqual(fixtureCss, templateCss)) continue;
      findings.push({
        check: 'D',
        component: `${fixtureFramework}/${name}`,
        message: `starter fixture CSS rules drift from templates/${templateFramework}/${name}/${name}.css`,
      });
    }
  }
  return findings;
}

// ── Check E: llms.txt version claims ─────────────────────────────────────────

/**
 * `llms.txt` is hand-maintained and ships in the npm tarball. It carries a
 * sample `kigumi status --json` payload whose `version` and Web Awesome
 * `version` silently went four minor releases stale before anyone noticed,
 * which is a poor first impression for a file written for LLM consumers.
 */
async function checkLlmsTxtVersions(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const llmsPath = path.join(PROJECT_ROOT, 'llms.txt');
  if (!(await fs.pathExists(llmsPath))) return findings;

  const llms = await fs.readFile(llmsPath, 'utf-8');
  const pkg = await fs.readJSON(path.join(PROJECT_ROOT, 'package.json'));

  const cliVersion: string = pkg.version;
  const waVersion: string = (
    pkg.dependencies?.['@awesome.me/webawesome'] ?? ''
  ).replace(/^[^0-9]*/, '');

  const claimedCli = llms.match(/"version":\s*"([^"]+)"/)?.[1];
  if (claimedCli && claimedCli !== cliVersion) {
    findings.push({
      check: 'E',
      component: 'llms.txt',
      message: `sample status output claims kigumi ${claimedCli}, package.json says ${cliVersion}`,
    });
  }

  const claimedWa = llms.match(
    /"package":\s*\{[^}]*"version":\s*"([^"]+)"/
  )?.[1];
  if (waVersion && claimedWa && claimedWa !== waVersion) {
    findings.push({
      check: 'E',
      component: 'llms.txt',
      message: `sample status output claims Web Awesome ${claimedWa}, package.json pins ${waVersion}`,
    });
  }

  return findings;
}

// ── Check A: generator-driven freshness (tmp regen + prettier + diff) ─────────

const GENERATED_DIFF_TARGETS = [
  'src/utils/component-metadata.ts',
  'scripts/css-metadata.ts',
  '.claude/skills/shared/react-api-surface.md',
  '.claude/skills/shared/vue-api-surface.md',
  '.claude/skills/shared/angular-api-surface.md',
];

// Every diff target is Prettier-formatted before comparing, so the committed
// (Prettier-clean) files match the generator's raw output without false
// whitespace/formatting diffs. Generators emit consistent output today, but
// normalizing all targets uniformly avoids the asymmetry of prettifying only
// the markdown and leaving the .ts outputs raw.
const PRETTIER_TARGETS = GENERATED_DIFF_TARGETS;

/** Symlink `target` -> `linkPath` when `target` exists; no-op otherwise. */
async function symlinkIfExists(
  target: string,
  linkPath: string
): Promise<void> {
  if (!(await fs.pathExists(target))) return;
  await fs.ensureDir(path.dirname(linkPath));
  await fs.symlink(target, linkPath, 'dir');
}

async function checkGeneratorFreshness(): Promise<{
  findings: Finding[];
  skipped: boolean;
}> {
  const cemPath = await findCustomElementsJson();
  if (!cemPath) {
    // Fresh clone / no Pro token: cannot regenerate, mirror metadata-freshness.
    return { findings: [], skipped: true };
  }

  const tmpDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'kigumi-generated-fresh-')
  );
  try {
    // Work on a tmp copy of the repo so we never touch the real working tree.
    // node_modules / docs/node_modules / .git / dist are excluded from the deep
    // copy (huge, irrelevant); the two node_modules trees are instead symlinked
    // back to the real install below so the generators can resolve `tsx` + their
    // dependencies AND `find-cem` can locate the Web Awesome CEM (which lives in
    // docs/node_modules) — both resolved relative to the script's PROJECT_ROOT,
    // which becomes the tmp dir when the generators run there.
    await fs.copy(PROJECT_ROOT, tmpDir, {
      filter: (src) => {
        const rel = path.relative(PROJECT_ROOT, src);
        if (rel === '') return true;
        return !(
          rel === 'node_modules' ||
          rel.startsWith('node_modules/') ||
          rel === 'docs/node_modules' ||
          rel.startsWith('docs/node_modules/') ||
          rel === '.git' ||
          rel.startsWith('.git/') ||
          rel === 'dist' ||
          rel.startsWith('dist/') ||
          rel.includes('.claude/worktrees')
        );
      },
    });

    // Symlink the real dependency trees into the tmp copy.
    await symlinkIfExists(
      path.join(PROJECT_ROOT, 'node_modules'),
      path.join(tmpDir, 'node_modules')
    );
    await symlinkIfExists(
      path.join(PROJECT_ROOT, 'docs/node_modules'),
      path.join(tmpDir, 'docs/node_modules')
    );

    const run = (cmd: string) => execSync(cmd, { cwd: tmpDir, stdio: 'pipe' });

    run('pnpm generate:metadata');
    run('pnpm generate:templates');
    run('pnpm generate:skill-refs');
    // Prettier the markdown outputs so committed (prettier-clean) files match
    // the generator's raw markdown without false whitespace diffs.
    run(
      `npx prettier --write ${PRETTIER_TARGETS.map((t) => `"${t}"`).join(' ')}`
    );

    const findings: Finding[] = [];
    for (const rel of GENERATED_DIFF_TARGETS) {
      const committed = path.join(PROJECT_ROOT, rel);
      const regenerated = path.join(tmpDir, rel);
      if (!(await fs.pathExists(regenerated))) continue;
      const committedContent = (await fs.pathExists(committed))
        ? await fs.readFile(committed, 'utf-8')
        : null;
      const regeneratedContent = await fs.readFile(regenerated, 'utf-8');
      if (committedContent !== regeneratedContent) {
        findings.push({
          check: 'A',
          component: rel,
          message: `committed file differs from freshly generated output`,
        });
      }
    }

    // Diff generated template files (NOT hand-maintained .jsx / .test.jsx).
    findings.push(...(await diffGeneratedTemplates(tmpDir)));

    return { findings, skipped: false };
  } finally {
    await fs.remove(tmpDir);
  }
}

async function diffGeneratedTemplates(tmpDir: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  const templatesDir = path.join(PROJECT_ROOT, 'templates');
  const frameworks = ['react', 'vue', 'angular'] as const;

  // Generated (diffed): .tsx/.ts/.vue/.css and their generated .test.tsx /
  // .component.spec.ts. Hand-maintained (skipped): the JavaScript variants
  // .jsx / .test.jsx, which legitimately differ from their .tsx siblings.
  const isGenerated = (file: string): boolean => {
    if (file.endsWith('.jsx')) return false;
    if (file.endsWith('.test.jsx')) return false;
    return /\.(tsx|ts|vue|css)$/.test(file);
  };

  for (const framework of frameworks) {
    const fwDir = path.join(templatesDir, framework);
    if (!(await fs.pathExists(fwDir))) continue;
    const componentDirs = await fs.readdir(fwDir, { withFileTypes: true });
    for (const comp of componentDirs) {
      if (!comp.isDirectory()) continue;
      const compDir = path.join(fwDir, comp.name);
      const files = await fs.readdir(compDir);
      for (const file of files) {
        if (!isGenerated(file)) continue;
        const rel = path.join('templates', framework, comp.name, file);
        const committed = path.join(PROJECT_ROOT, rel);
        const regenerated = path.join(tmpDir, rel);
        if (!(await fs.pathExists(regenerated))) continue;
        const committedContent = await fs.readFile(committed, 'utf-8');
        const regeneratedContent = await fs.readFile(regenerated, 'utf-8');
        if (committedContent !== regeneratedContent) {
          findings.push({
            check: 'A',
            component: rel,
            message: `committed template differs from freshly generated output`,
          });
        }
      }
    }
  }
  return findings;
}

// ── Orchestration ────────────────────────────────────────────────────────────

export async function runGuard(): Promise<GuardResult> {
  const findings: Finding[] = [];

  // B + C + D + E first: pure file comparisons, no CEM needed, fast.
  findings.push(...(await checkDocsWrapperCss()));
  findings.push(...(await checkJsVariantSubset()));
  findings.push(...(await checkStarterFixtures()));
  findings.push(...(await checkLlmsTxtVersions()));

  // A: tmp regen + prettier + diff. Skipped when CEM unreachable.
  const { findings: aFindings, skipped: skippedA } =
    await checkGeneratorFreshness();
  findings.push(...aFindings);

  return { passed: findings.length === 0, skippedA, findings };
}

function printResult(result: GuardResult): void {
  console.log(pc.cyan('\nValidating generated-artifact freshness...\n'));
  if (result.skippedA) {
    console.log(
      pc.yellow(
        '  Check A skipped: Web Awesome CEM not found (fresh clone / no Pro token).\n'
      )
    );
  }
  if (result.findings.length === 0) {
    console.log(pc.green('Generated-artifact freshness check passed!\n'));
    return;
  }
  console.log(pc.red(`Drift found (${result.findings.length}):`));
  for (const f of result.findings) {
    console.log(pc.red(`  [${f.check}] ${f.component}: ${f.message}`));
  }
  console.log('');
  console.log(
    pc.yellow(
      'Fix: regenerate the affected artifacts (pnpm generate:* / update:starter-snapshots)\n' +
        'or reconcile the hand-maintained docs wrapper / .jsx variant.\n'
    )
  );
}

async function main(): Promise<void> {
  try {
    const result = await runGuard();
    printResult(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during generated-freshness check:'));
    console.error(error);
    process.exit(1);
  }
}

const invokedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === __filename
  : false;
if (invokedDirectly) {
  void main();
}
