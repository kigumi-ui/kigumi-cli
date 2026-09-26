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
 *     files. Requires a CEM describing every registry component -- in practice
 *     the Pro package. A partial CEM is refused rather than silently narrowed,
 *     and a run that could not verify says so instead of reporting a pass
 *     (issue #43). Runs in CI's own `freshness` job, which installs Pro.
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
 *     The Vue arm holds every `.js.vue` to the same rule against its `.vue`:
 *     its `defineEmits` names, host listeners and props (issue #122). Both
 *     variants come from one generator, so a finding means a dialect branch
 *     in the generator or a hand edit. A declaration the reader cannot
 *     enumerate is a finding. Either arm comparing no Template is a finding.
 *
 *   D (starter fixtures, comment-normalized): each fixture `.css` under
 *     `tests/fixtures/starter-snapshots/` must match its source template by
 *     rules (next -> react template, angular -> angular template).
 *
 * Exit codes: 0 = fresh (or, outside CI and on fork PRs, unverified because no
 * complete CEM was reachable -- reported as "NOT verified", never as a pass);
 * 1 = drift found, or the CEM was unusable where verification was required.
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
import ts from 'typescript';
import { parse as parseSfc } from 'vue/compiler-sfc';
import {
  resolveCem,
  assessCemCompleteness,
  type CemVerdict,
} from './find-cem.js';

import {
  summarizeGuard,
  skipPermitted,
  type GuardResult,
  type GuardSummary,
} from './guard-outcome.js';

// Re-exported so the guard's own consumers and tests keep one import site.
export { assessCemCompleteness } from './find-cem.js';
export type { CemVerdict, CemOutcome } from './find-cem.js';
export { summarizeGuard } from './guard-outcome.js';
export type {
  GuardResult,
  GuardSummary,
  SummarizeOptions,
} from './guard-outcome.js';
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

export interface VueSurface {
  /** Event names declared in `defineEmits`. */
  emits: Set<string>;
  /** Event names passed to `addEventListener`, i.e. the host listeners. */
  listeners: Set<string>;
  /** Prop names declared in `defineProps`, plus one per `defineModel`. */
  props: Set<string>;
  /**
   * Declarations found but not enumerable, each naming the code at fault.
   * Non-empty means the sets above are incomplete and must not be compared.
   */
  unreadable: string[];
}

/** The literal name of a property, or `undefined` for a computed one. */
function staticName(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name)
    ? name.text
    : undefined;
}

/** A node's source on one line, cut short, to name it in a finding. */
function snippet(node: ts.Node): string {
  const text = node.getText().replace(/\s+/g, ' ');
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

/**
 * The members of a macro's type argument: an inline type literal, or an
 * interface or type-literal alias declared in the same `<script setup>`.
 * Any other type goes to `report`: its members cannot be listed from here.
 */
function typeMembers(
  type: ts.TypeNode,
  script: ts.SourceFile,
  report: (problem: string) => void
): ts.TypeElement[] {
  if (ts.isTypeLiteralNode(type)) return [...type.members];
  const typeName =
    ts.isTypeReferenceNode(type) && ts.isIdentifier(type.typeName)
      ? type.typeName.text
      : undefined;
  for (const statement of script.statements) {
    if (
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === typeName
    ) {
      for (const clause of statement.heritageClauses ?? []) {
        report(`${snippet(clause)} is not read`);
      }
      return [...statement.members];
    }
    if (
      ts.isTypeAliasDeclaration(statement) &&
      statement.name.text === typeName
    ) {
      if (ts.isTypeLiteralNode(statement.type)) {
        return [...statement.type.members];
      }
      report(`${snippet(statement.type)} is not a type literal`);
      return [];
    }
  }
  report(
    `${snippet(type)} is not a type literal or a type declared in this <script setup>`
  );
  return [];
}

/**
 * The event names a call signature's first parameter admits (`'a' | 'b'`),
 * or `undefined` when any part of that type is not a string literal.
 */
function eventLiterals(type: ts.TypeNode | undefined): string[] | undefined {
  if (type && ts.isUnionTypeNode(type)) {
    const names = type.types.map(eventLiterals);
    return names.every((name) => name !== undefined) ? names.flat() : undefined;
  }
  return type && ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)
    ? [type.literal.text]
    : undefined;
}

/**
 * The names one member of a macro's type argument declares: a property or
 * method name, or the events an event call signature admits. `undefined`
 * when the member has no literal name to read.
 */
function typeMemberNames(
  member: ts.TypeElement,
  { callSignatures }: { callSignatures: boolean }
): string[] | undefined {
  if (callSignatures && ts.isCallSignatureDeclaration(member)) {
    return eventLiterals(member.parameters[0]?.type);
  }
  if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) {
    const name = staticName(member.name);
    return name === undefined ? undefined : [name];
  }
  return undefined;
}

/**
 * Names a `defineProps` / `defineEmits` call declares, in either dialect.
 * Call signatures (`(e: 'change'): void`) declare events only, as in Vue.
 * Anything that is not a literal name goes to `report`, never into the list.
 */
function declaredNames(
  call: ts.CallExpression,
  script: ts.SourceFile,
  { callSignatures }: { callSignatures: boolean },
  report: (problem: string) => void
): string[] {
  const names: string[] = [];
  const [runtime] = call.arguments;
  if (runtime && ts.isArrayLiteralExpression(runtime)) {
    for (const element of runtime.elements) {
      if (ts.isStringLiteralLike(element)) names.push(element.text);
      else report(`${snippet(element)} is not a string literal`);
    }
  } else if (runtime && ts.isObjectLiteralExpression(runtime)) {
    for (const property of runtime.properties) {
      const name =
        (ts.isPropertyAssignment(property) ||
          ts.isShorthandPropertyAssignment(property) ||
          ts.isMethodDeclaration(property)) &&
        staticName(property.name);
      if (name) names.push(name);
      else report(`${snippet(property)} has no literal name`);
    }
  } else if (runtime) {
    report(`${snippet(runtime)} is not an array or object literal`);
  }
  const [type] = call.typeArguments ?? [];
  if (type) {
    for (const member of typeMembers(type, script, report)) {
      const memberNames = typeMemberNames(member, { callSignatures });
      if (memberNames) names.push(...memberNames);
      else report(`${snippet(member)} has no literal name`);
    }
  }
  return names;
}

/**
 * The prop a `defineModel` call declares: its name argument, or Vue's default
 * `modelValue` when the call passes only options.
 */
function modelName(
  call: ts.CallExpression,
  report: (problem: string) => void
): string | undefined {
  const [name] = call.arguments;
  if (!name || ts.isObjectLiteralExpression(name)) return 'modelValue';
  if (ts.isStringLiteralLike(name)) return name.text;
  report(`${snippet(name)} is not a string literal`);
  return undefined;
}

/** The `<script setup lang>` values this reader parses: the two generated. */
const SCRIPT_KINDS = new Map<string, ts.ScriptKind>([
  ['js', ts.ScriptKind.JS],
  ['ts', ts.ScriptKind.TS],
]);

/**
 * Extract the declared surface of a Vue Template, either dialect: the
 * `defineEmits` names, the `defineProps` names plus one prop per
 * `defineModel`, and the `addEventListener` names (the host listeners).
 *
 * `.vue` and `.js.vue` spell the same declaration differently (an interface
 * and a typed tuple list against an options object and a string array), and
 * Prettier re-wraps both, so the `<script setup>` block is parsed rather than
 * pattern-matched. Vue's own SFC parser splits the file; the TypeScript
 * parser reads the script.
 *
 * Only literal declarations are enumerable: string arrays, object keys, type
 * literals, and interfaces or type-literal aliases declared in the same
 * block. Anything else (a variable, a spread, an imported type, a parse
 * error, a plain `<script>` block) lands in `unreadable` with the code at
 * fault. It is never read as "declares nothing", which Check C would take
 * for a subset of anything.
 */
export function extractVueSurface(source: string): VueSurface {
  const surface: VueSurface = {
    emits: new Set(),
    listeners: new Set(),
    props: new Set(),
    unreadable: [],
  };
  // Each early return leaves a reason: an SFC this reader cannot take apart
  // must never read as one that declares nothing.
  const { descriptor, errors } = parseSfc(source);
  const [error] = errors;
  if (error) {
    surface.unreadable.push(`the SFC does not parse: ${error.message}`);
    return surface;
  }
  const block = descriptor.scriptSetup;
  if (!block) {
    surface.unreadable.push('no <script setup> block');
    return surface;
  }
  if (descriptor.script) {
    surface.unreadable.push(
      'a plain <script> block, whose options are not read'
    );
    return surface;
  }
  const scriptKind = SCRIPT_KINDS.get(block.lang ?? 'js');
  if (scriptKind === undefined) {
    surface.unreadable.push(
      `<script setup lang="${block.lang}"> is not JavaScript or TypeScript`
    );
    return surface;
  }

  const script = ts.createSourceFile(
    'script-setup.ts',
    block.content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  const readCall = (call: ts.CallExpression): void => {
    const callee = call.expression;
    // Vue compiles a macro only when it is called by its bare name.
    const name = ts.isIdentifier(callee)
      ? callee.text
      : ts.isPropertyAccessExpression(callee) &&
          callee.name.text === 'addEventListener'
        ? 'addEventListener'
        : undefined;
    const report = (problem: string): void => {
      surface.unreadable.push(`${name}: ${problem}`);
    };
    if (name === 'defineEmits') {
      const events = declaredNames(
        call,
        script,
        { callSignatures: true },
        report
      );
      for (const event of events) surface.emits.add(event);
    } else if (name === 'defineProps') {
      const props = declaredNames(
        call,
        script,
        { callSignatures: false },
        report
      );
      for (const prop of props) surface.props.add(prop);
    } else if (name === 'defineModel') {
      const prop = modelName(call, report);
      if (prop) surface.props.add(prop);
    } else if (name === 'addEventListener') {
      const [eventName] = call.arguments;
      if (eventName && ts.isStringLiteralLike(eventName)) {
        surface.listeners.add(eventName.text);
      } else if (eventName) {
        report(`${snippet(eventName)} is not a string literal`);
      }
    }
  };
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) readCall(node);
    ts.forEachChild(node, visit);
  };
  visit(script);
  return surface;
}

// ── Finding model ────────────────────────────────────────────────────────────

/**
 * A finding from one of this guard's five checks. Narrower than the shared
 * `Finding`, so a typo'd check label fails to compile here.
 */
export interface Finding {
  check: 'A' | 'B' | 'C' | 'D' | 'E';
  component: string;
  message: string;
}

/** Options this guard passes to {@link summarizeGuard} on every call. */
const SUMMARY_LABELLING = {
  label: 'Check A',
  passHeadline: 'Generated-artifact freshness check passed!',
  fixHint:
    'Install the Web Awesome Pro package so the guard can regenerate and\n' +
    'diff every template (pnpm setup:npmrc, then install docs deps).',
} as const;

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

/**
 * Check C for one Vue Template: every event the `.js.vue` emits or listens
 * for, and every prop it declares, must exist in the `.vue`. A variant the
 * reader cannot enumerate is reported instead of compared, because its sets
 * would be incomplete and an empty set is a subset of anything.
 */
export function compareVueVariants(
  component: string,
  tsSource: string,
  jsSource: string
): Finding[] {
  const tsSurface = extractVueSurface(tsSource);
  const jsSurface = extractVueSurface(jsSource);
  const unreadable = [
    ...tsSurface.unreadable.map((problem) => `cannot read .vue: ${problem}`),
    ...jsSurface.unreadable.map((problem) => `cannot read .js.vue: ${problem}`),
  ];
  if (unreadable.length > 0) {
    return unreadable.map((message) => ({ check: 'C', component, message }));
  }

  const findings: Finding[] = [];
  const surfaces: Array<[string, Set<string>, Set<string>]> = [
    ['emits events', jsSurface.emits, tsSurface.emits],
    ['listens for events', jsSurface.listeners, tsSurface.listeners],
    ['declares props', jsSurface.props, tsSurface.props],
  ];
  for (const [verb, jsNames, tsNames] of surfaces) {
    const violations = diffSubset(jsNames, tsNames);
    if (violations.length > 0) {
      findings.push({
        check: 'C',
        component,
        message: `.js.vue ${verb} absent from .vue: ${violations.join(', ')}`,
      });
    }
  }
  return findings;
}

/** One Template directory's two variants, both read. */
interface VariantPair {
  name: string;
  tsSource: string;
  jsSource: string;
}

/**
 * Every Template directory under `dir` that holds both `<Name><tsExt>` and
 * `<Name><jsExt>`, with both files read. A directory missing either variant
 * is skipped: that is `validate:templates`' finding, not Check C's.
 */
async function readVariantPairs(
  dir: string,
  tsExt: string,
  jsExt: string
): Promise<VariantPair[]> {
  if (!(await fs.pathExists(dir))) return [];
  const pairs: VariantPair[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const tsPath = path.join(dir, name, `${name}${tsExt}`);
    const jsPath = path.join(dir, name, `${name}${jsExt}`);
    if (!(await fs.pathExists(tsPath)) || !(await fs.pathExists(jsPath))) {
      continue;
    }
    pairs.push({
      name,
      tsSource: await fs.readFile(tsPath, 'utf-8'),
      jsSource: await fs.readFile(jsPath, 'utf-8'),
    });
  }
  return pairs;
}

/**
 * What one arm of Check C found, and how many Templates it compared, so the
 * caller can tell "nothing drifted" from "nothing was compared" (ADR 0003).
 */
export interface VariantSubsetResult {
  findings: Finding[];
  pairs: number;
}

/**
 * Check C across a React templates directory: every event a `.jsx` wires
 * must also be wired by its `.tsx`.
 */
export async function checkReactJsVariantSubset(
  templatesDir: string
): Promise<VariantSubsetResult> {
  const findings: Finding[] = [];
  const pairs = await readVariantPairs(templatesDir, '.tsx', '.jsx');
  for (const { name, tsSource, jsSource } of pairs) {
    const tsx = extractReactSurface(tsSource);
    const jsx = extractReactSurface(jsSource);

    const eventViolations = diffSubset(jsx.events, tsx.events);
    if (eventViolations.length) {
      findings.push({
        check: 'C',
        component: name,
        message: `.jsx wires events absent from .tsx: ${eventViolations.join(', ')}`,
      });
    }
  }
  return { findings, pairs: pairs.length };
}

/**
 * Check C across a Vue templates directory: every event a `.js.vue` emits or
 * listens for, and every prop it declares, must exist in its `.vue`.
 */
export async function checkVueJsVariantSubset(
  templatesDir: string
): Promise<VariantSubsetResult> {
  const pairs = await readVariantPairs(templatesDir, '.vue', '.js.vue');
  return {
    findings: pairs.flatMap(({ name, tsSource, jsSource }) =>
      compareVueVariants(name, tsSource, jsSource)
    ),
    pairs: pairs.length,
  };
}

async function checkJsVariantSubset(): Promise<Finding[]> {
  const arms = [
    {
      dir: 'templates/react',
      variants: '.tsx and .jsx',
      check: checkReactJsVariantSubset,
    },
    {
      dir: 'templates/vue',
      variants: '.vue and .js.vue',
      check: checkVueJsVariantSubset,
    },
  ];
  const findings: Finding[] = [];
  for (const { dir, variants, check } of arms) {
    const result = await check(path.join(PROJECT_ROOT, dir));
    findings.push(...result.findings);
    if (result.pairs === 0) {
      findings.push({
        check: 'C',
        component: dir,
        message: `no Template holds both ${variants}, so nothing was compared`,
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
          'or reconcile the hand-maintained docs wrapper / .jsx variant. A .js.vue\n' +
          'finding comes from the Vue generator (scripts/generate-vue-templates.ts).\n'
      )
    );
  }
}

async function main(): Promise<void> {
  try {
    const result = await runGuard();
    const summary = summarizeGuard(result, {
      ...SUMMARY_LABELLING,
      allowSkip: skipPermitted(),
    });
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
