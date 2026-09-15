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
import { resolveCem, type CemResolution } from './find-cem.js';
import { getAllComponents } from '../src/utils/registry.js';

/** How many components the registry tracks, i.e. what a complete CEM covers. */
function countRegistryComponents(): number {
  const all: unknown = getAllComponents();
  return Array.isArray(all) ? all.length : Object.keys(all as object).length;
}

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

/** Why Check A can or cannot run against the CEM that was resolved. */
export type CemOutcome = 'complete' | 'partial' | 'absent';

export interface CemVerdict {
  usable: boolean;
  outcome: CemOutcome;
  reason: string;
}

/**
 * Decide whether a resolved CEM is complete enough for Check A to run.
 *
 * Check A regenerates every template and diffs it against what is committed.
 * That is only honest against a CEM describing every component the registry
 * tracks: run against the free package it would verify the free subset and say
 * nothing about the remaining Pro components. Issue #43 is what happens when
 * "said nothing" gets printed as a pass, so the gate is all-or-nothing and a
 * partial CEM is refused rather than quietly narrowed.
 *
 * A CEM describing *more* components than the registry tracks is a superset,
 * not a gap: Web Awesome may ship a component Kigumi has not wrapped yet.
 */
export function assessCemCompleteness(
  resolution: CemResolution,
  registrySize: number
): CemVerdict {
  if (!resolution.found) {
    return {
      usable: false,
      outcome: 'absent',
      reason:
        'no Custom Elements Manifest found (Web Awesome Pro not installed)',
    };
  }

  if (resolution.componentCount < registrySize) {
    return {
      usable: false,
      outcome: 'partial',
      reason:
        `the ${resolution.tier} Custom Elements Manifest describes ` +
        `${resolution.componentCount} of ${registrySize} registry components`,
    };
  }

  return {
    usable: true,
    outcome: 'complete',
    reason:
      `${resolution.tier} Custom Elements Manifest, ` +
      `${resolution.componentCount} components`,
  };
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

export interface Finding {
  check: 'A' | 'B' | 'C' | 'D' | 'E';
  component: string;
  message: string;
}

export interface GuardResult {
  passed: boolean;
  findings: Finding[];
  /** Whether Check A had a manifest complete enough to run against. */
  cem: CemVerdict;
}

export interface GuardSummary {
  exitCode: number;
  /** True only when Check A actually ran against a complete manifest. */
  verified: boolean;
  headline: string;
  detail: string;
}

export interface SummarizeOptions {
  /**
   * Whether an unusable manifest may be tolerated. True only where the Pro
   * package genuinely cannot be installed -- fork pull requests, which receive
   * no secrets. Everywhere else an unusable manifest is a real failure.
   */
  allowSkip?: boolean;
}

/**
 * Turn a guard result into an exit code and a report.
 *
 * Keeps "did it pass" and "did it actually run" as separate facts. Before
 * issue #43 they were conflated: Check A printed "freshness check passed!"
 * directly beneath its own skip notice and exited 0, so a job that had never
 * verified anything looked exactly like one that had.
 */
export function summarizeGuard(
  result: GuardResult,
  options: SummarizeOptions = {}
): GuardSummary {
  if (result.findings.length > 0) {
    return {
      exitCode: 1,
      verified: result.cem.usable,
      headline: `Drift found (${result.findings.length})`,
      detail: result.findings
        .map((f) => `  [${f.check}] ${f.component}: ${f.message}`)
        .join('\n'),
    };
  }

  if (!result.cem.usable) {
    const skipAllowed = options.allowSkip ?? false;
    return {
      exitCode: skipAllowed ? 0 : 1,
      verified: false,
      headline: skipAllowed
        ? `Check A skipped, NOT verified: ${result.cem.reason}`
        : `Check A could not run: ${result.cem.reason}`,
      detail: skipAllowed
        ? 'Generator drift is unguarded on this run. Expected only where the\n' +
          'Web Awesome Pro package cannot be installed (fork pull requests).'
        : 'Install the Web Awesome Pro package so the guard can regenerate and\n' +
          'diff every template (pnpm setup:npmrc, then install docs deps).',
    };
  }

  return {
    exitCode: 0,
    verified: true,
    headline: 'Generated-artifact freshness check passed!',
    detail: `  Verified against the ${result.cem.reason}.`,
  };
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
  // Web Awesome sits in devDependencies here. Reading only `dependencies` left
  // waVersion as '' and made the Web Awesome half of this check inert: the
  // `if (waVersion && ...)` guard below could never be true.
  const waSpec: string =
    pkg.dependencies?.['@awesome.me/webawesome'] ??
    pkg.devDependencies?.['@awesome.me/webawesome'] ??
    '';
  const waVersion: string = waSpec.replace(/^[^0-9]*/, '');

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

// Only the .ts outputs are Prettier-formatted before comparing, so the
// committed (Prettier-clean) files match the generator's output without false
// whitespace diffs.
//
// The api-surface markdown is deliberately EXCLUDED. Prettier treats `_` as
// emphasis syntax, so running it over these files rewrites the identifiers they
// document: `eyedropper-button__base` becomes `eyedropper-button**base` and
// `_blank` becomes `\_blank`. Those are Web Awesome CSS part and attribute
// names that agents copy into user code, so mangling them makes the reference
// wrong. Compare the generator's raw markdown instead, and keep these files out
// of `format`/`format:check` so nothing re-mangles them.
const PRETTIER_TARGETS = GENERATED_DIFF_TARGETS.filter(
  (target) => !target.endsWith('.md')
);

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
  cem: CemVerdict;
}> {
  const resolution = await resolveCem(PROJECT_ROOT);
  const cem = assessCemCompleteness(resolution, countRegistryComponents());
  if (!cem.usable) {
    // Cannot regenerate honestly. The caller decides whether that is a skip or
    // a failure; either way it is never reported as a pass (issue #43).
    return { findings: [], cem };
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

    return { findings, cem };
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

  // A: tmp regen + prettier + diff. Needs a complete manifest.
  const { findings: aFindings, cem } = await checkGeneratorFreshness();
  findings.push(...aFindings);

  return { passed: findings.length === 0, findings, cem };
}

/**
 * Skipping is permitted only where the Web Awesome Pro package genuinely
 * cannot be installed: a fork pull request, which receives no repository
 * secrets. Everywhere else an unusable manifest is a real failure, because
 * tolerating it everywhere is what let Check A skip on every CI run.
 */
function skipPermitted(): boolean {
  if (process.env.KIGUMI_FRESHNESS_ALLOW_SKIP === '1') return true;
  // Outside CI a developer may not have the Pro package; keep local runs
  // usable, but still report them as unverified rather than as a pass.
  return process.env.CI !== 'true';
}

function printSummary(summary: GuardSummary): void {
  console.log(pc.cyan('\nValidating generated-artifact freshness...\n'));

  const paint =
    summary.exitCode !== 0 ? pc.red : summary.verified ? pc.green : pc.yellow;

  console.log(paint(summary.headline));
  if (summary.detail) console.log(summary.detail);
  console.log('');

  if (summary.exitCode !== 0 && summary.verified) {
    console.log(
      pc.yellow(
        'Fix: regenerate the affected artifacts (pnpm generate:* / update:starter-snapshots)\n' +
          'or reconcile the hand-maintained docs wrapper / .jsx variant.\n'
      )
    );
  }
}

async function main(): Promise<void> {
  try {
    const result = await runGuard();
    const summary = summarizeGuard(result, { allowSkip: skipPermitted() });
    printSummary(summary);
    process.exit(summary.exitCode);
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
