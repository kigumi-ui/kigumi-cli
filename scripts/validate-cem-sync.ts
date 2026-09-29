#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CEM-to-Registry Sync Checker
 *
 * PURPOSE: Verifies that the local registry stays in sync with Web Awesome's
 * `custom-elements.json` (CEM) on two axes:
 *   1. Component presence (via `component-metadata.ts`).
 *   2. Enumerated prop values (via the raw CEM attribute types).
 *
 * NOTE: Events, slots, and methods live exclusively in `component-metadata.ts`
 * (auto-generated from CEM). The registry does not duplicate them, so there is
 * no drift to check on those fields.
 *
 * CHECKS:
 * - Components in CEM metadata but not in registry (warning)
 * - Components in registry but not in CEM metadata (error)
 * - Registry enum prop values that CEM no longer accepts (error) — a value the
 *   registry advertises but Web Awesome rejects is a user-facing defect.
 * - CEM enum values the registry has not surfaced yet (warning) — additive,
 *   e.g. the XS/XL/short-form `size` tokens added in WA 3.6.0.
 * - CEM attribute names with no registry prop (warning), see `checkAttributeDrift`.
 * - Deprecations the CEM and the registry disagree on, see `checkDeprecationDrift`.
 *
 * Prop-value drift is what silently slipped through before: `component-metadata.ts`
 * does not carry attribute value enums, so this check reads the CEM directly.
 *
 * USAGE:
 *   pnpm validate:cem-sync
 *   node scripts/validate-cem-sync.ts
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import pc from 'picocolors';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';
import { toKebabCase } from '../src/utils/naming.js';
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';
import path from 'path';
import {
  resolveCem,
  assessCemCompleteness,
  type CemVerdict,
} from './find-cem.js';
import {
  summarizeGuard,
  skipPermitted,
  type GuardSummary,
} from './guard-outcome.js';

const PROJECT_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

// ── Types ───────────────────────────────────────────────────────────────────

export interface SyncFinding {
  component: string;
  category:
    | 'missing-from-registry'
    | 'missing-from-cem'
    | 'prop-value-drift'
    | 'allowlisted-but-wrapped'
    | 'attribute-missing-from-registry'
    | 'stale-allowlist-entry'
    | 'stale-kigumi-deprecation'
    | 'deprecation-missing-from-registry'
    | 'deprecation-missing-from-cem';
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Known, pre-existing registry enum values that intentionally (or as tracked
 * tech debt) diverge from the CEM. Keyed by `<component>.<prop>`. Entries here
 * are downgraded from error to warning so new drift still fails the build while
 * existing divergences stay visible without blocking. Tracked for reconciliation
 * in the findings backlog.
 */
const REGISTRY_VALUE_ALLOWLIST: Record<string, readonly string[]> = {
  // Empty: dropdown-item.variant and scroller.orientation were reconciled to
  // the CEM in F-153. The mechanism is kept for future tracked divergences.
};

/**
 * CEM components Kigumi deliberately does not wrap. Listed entries are skipped
 * by the missing-from-registry check so every validator run stays at zero
 * warnings; any NEW unwrapped CEM component still warns. Adding a wrapper for
 * one of these is a separate scoped effort — remove its entry here when doing so.
 */
export const INTENTIONALLY_UNWRAPPED: ReadonlySet<string> = new Set([
  // WA 3.11 Pro data grid: 15 events, JS-driven `data`/`columns` API, not a
  // thin attribute wrapper. Scoped effort of its own, not this bump.
  'data-grid',
]);

/**
 * CEM attributes every custom element carries that Kigumi never surfaces as a
 * registry prop, independent of which component declares them. Keyed by
 * kebab-cased attribute name (see `checkAttributeDrift`).
 */
export const GLOBAL_ATTRIBUTE_ALLOWLIST: ReadonlySet<string> = new Set([
  // Lit's ReactiveElement base class reflects these on every custom element;
  // Kigumi hosts inherit them from the DOM (React/Vue/Angular all pass
  // `dir`/`lang` straight through as ordinary HTML attributes) rather than
  // wrapping them per-component.
  'dir',
  'lang',
  // SSR hydration marker Web Awesome's Lit runtime writes on every element;
  // internal to the did-ssr protocol, never user-facing.
  'did-ssr',
]);

/** True for the `with-*` SSR slot-hint attributes Web Awesome's DSD renderer writes. */
function isSsrSlotHint(attrName: string): boolean {
  return attrName.startsWith('with-');
}

/**
 * Why a per-component allowlist entry is not (yet) a registry prop.
 *
 * `backfill` marks an attribute that should be surfaced but is tracked by an
 * open issue rather than by the change that found it (a Web Awesome bump,
 * say); its reason names the issue. No entry is `backfill` today: issues
 * #101, #116 and #102 triaged the whole 2026-09-24 baseline. `intentional`
 * marks attributes that are never expected to become a prop: ones a caller
 * cannot meaningfully set from markup (function-, object- or element-typed
 * values, playback state), ones the component manages itself (e.g. ARIA
 * `role`/`tabindex` on composite widgets, a submenu's open state), and ones
 * the element accepts but ignores (x/y axis settings on a chart without x/y
 * axes, see `INERT_ON_AXISLESS_CHART`, or QrCode's `image-padding`).
 */
export interface AttributeAllowlistEntry {
  kind: 'backfill' | 'intentional';
  reason: string;
}

/*
 * Every typed chart element (`wa-pie-chart`, `wa-radar-chart`, ...) is a
 * `WaChart` subclass that sets nothing but its chart type, so it inherits the
 * x/y axis attributes `x-label`, `y-label`, `stacked`, `index-axis`, `grid`,
 * `min` and `max`. `WaChart.getDefaultConfig` reads six of them only while
 * building the x and y scales, which it does for bar, line, scatter and
 * bubble alone. Pie and doughnut charts get no scales at all. Polar-area and
 * radar charts get one radial `r` scale, built from theme colours and fonts
 * without reading any of the seven. `index-axis` also lands in Chart.js's
 * `indexAxis` option, which only picks between the x and y scales these
 * charts do not have.
 *
 * So on those four elements the attributes change nothing, and a prop for
 * one would be a setting with no effect (issue #116). Checked against the
 * Web Awesome Pro 3.13.0 build (the `WaChart` chunk under `dist/chunks/`);
 * re-check `getDefaultConfig` when a Web Awesome bump touches charts, since
 * an upstream change that starts honouring one of these is not a CEM change
 * and so cannot trip validate:cem-sync.
 */

/** An x/y axis attribute on a pie or doughnut chart, which gets no scales. */
export const INERT_ON_AXISLESS_CHART: AttributeAllowlistEntry = {
  kind: 'intentional',
  reason:
    'x/y axis setting; WaChart builds no scales for this chart type, so it is never read',
};

/**
 * An x/y axis attribute on a polar-area or radar chart, whose only scale is
 * the radial `r` scale.
 */
export const INERT_ON_RADIAL_CHART: AttributeAllowlistEntry = {
  kind: 'intentional',
  reason:
    'x/y axis setting; WaChart builds this chart only a radial r scale, which does not read it',
};

/*
 * Four of the `intentional` entries below rest on how Web Awesome's runtime
 * treats an attribute, not on anything the CEM says, so a Web Awesome bump
 * that changes the behaviour is not a CEM change and cannot trip
 * validate:cem-sync. Checked against the Web Awesome Pro 3.13.0 build
 * (issue #102); re-check them when a bump touches these components:
 *
 * - `wa-carousel` declares `slides` and `currentSlide` as reflected
 *   properties, sets both to 0 in its constructor and never reads or writes
 *   them again. The slide it shows is its internal `activeSlide` state,
 *   moved by `goToSlide()`, so a prop for either would change nothing.
 * - `wa-qr-code` hands `image-padding` to qr-creator as `imagePadding`,
 *   which qr-creator reads into its settings and never uses: it pads the
 *   centre image by a fixed 4px. That holds for 1.0.1 and 1.1.0, the two
 *   releases inside Web Awesome's `^1.0.1` range.
 * - `wa-dropdown-item` opens and closes its own submenu on hover and from the
 *   keyboard, and closes any open sibling's, without an event a bound prop
 *   could follow. Lit also reads the attribute as `submenuopen`, not the
 *   kebab-cased name a Template would write.
 */

/**
 * Per-component attribute allowlist. Keyed by registry key, then by the
 * kebab-cased CEM attribute name: the CEM's `submenuOpen` is keyed
 * `submenu-open`. A key in any other form matches nothing and is reported as a
 * stale entry. The Free CEM baseline measured on 2026-09-24 found 75
 * attributes across 26 Free components (after the global allowlist above
 * absorbs the inherited `dir`/`lang`/`did-ssr` and `with-*` SSR hints);
 * checking against the Pro CEM (what CI installs, and what `assessCemCompleteness`
 * requires for an all-or-nothing run covering all 87 registry components)
 * adds 50 more across 13 Pro-only components (charts, `combobox`,
 * `file-input`, `video`, `date-input`), for 125 across 39 components total.
 * Issue #101 then surfaced the 49 form-control entries as registry props,
 * leaving 76 across 25 components (50 `backfill`, 26 `intentional`).
 * Issue #116 then surfaced three of the Pro-only entries as registry props
 * (`file-input` `capture`, `scatter-chart` `stacked` / `index-axis`) and moved
 * its other 24 to `intentional`, leaving 73 across 24 components (23
 * `backfill`, 50 `intentional`). Web Awesome 3.14.0 added `step`'s `role`
 * (`intentional`), leaving 74 across 25 components (23 `backfill`, 51
 * `intentional`). Issue #102 then surfaced 15 of the last 23 `backfill`
 * entries as registry props and moved the other 8 to `intentional`, leaving
 * 59 across 20 components, all `intentional`.
 *
 * See `AttributeAllowlistEntry` for what each kind covers.
 */
export const COMPONENT_ATTRIBUTE_ALLOWLIST: Readonly<
  Record<string, Readonly<Record<string, AttributeAllowlistEntry>>>
> = {
  carousel: {
    slides: {
      kind: 'intentional',
      reason: 'declared but never read; the carousel counts its slides itself',
    },
    'current-slide': {
      kind: 'intentional',
      reason:
        'declared but never read; the shown slide is internal state, moved by goToSlide()',
    },
  },
  'dropdown-item': {
    'submenu-open': {
      kind: 'intentional',
      reason:
        'submenu state the item toggles itself, with no event a bound prop could follow',
    },
  },
  popup: {
    'flip-boundary': {
      kind: 'intentional',
      reason:
        'Element or Element[] reference, which no attribute value can express',
    },
    'shift-boundary': {
      kind: 'intentional',
      reason:
        'Element or Element[] reference, which no attribute value can express',
    },
    'auto-size-boundary': {
      kind: 'intentional',
      reason:
        'Element or Element[] reference, which no attribute value can express',
    },
  },
  'qr-code': {
    'image-padding': {
      kind: 'intentional',
      reason: 'never applied; qr-creator pads the centre image by a fixed 4px',
    },
  },
  rating: {
    role: {
      kind: 'intentional',
      reason: 'ARIA role Web Awesome manages internally for the widget pattern',
    },
    'get-symbol': {
      kind: 'intentional',
      reason:
        'function returning the symbol markup, which no attribute value can express',
    },
  },
  step: {
    role: {
      kind: 'intentional',
      reason:
        'ARIA role Web Awesome manages internally for the stepper list pattern',
    },
  },
  tab: {
    role: {
      kind: 'intentional',
      reason:
        'ARIA role Web Awesome manages internally for the tablist pattern',
    },
  },
  'tab-panel': {
    role: {
      kind: 'intentional',
      reason:
        'ARIA role Web Awesome manages internally for the tablist pattern',
    },
  },
  tree: {
    tabindex: {
      kind: 'intentional',
      reason: 'roving tabindex Web Awesome manages internally for keyboard nav',
    },
    role: {
      kind: 'intentional',
      reason: 'ARIA role Web Awesome manages internally for the tree pattern',
    },
  },
  'tree-item': {
    tabindex: {
      kind: 'intentional',
      reason: 'roving tabindex Web Awesome manages internally for keyboard nav',
    },
    role: {
      kind: 'intentional',
      reason: 'ARIA role Web Awesome manages internally for the tree pattern',
    },
  },
  video: {
    duration: {
      kind: 'intentional',
      reason: 'length of the loaded media, reported by the element',
    },
    'current-time': {
      kind: 'intentional',
      reason:
        'live playback position that advances every frame; a bound prop would fight playback',
    },
  },
  chart: {
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'bar-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'line-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'bubble-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'doughnut-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    'x-label': INERT_ON_AXISLESS_CHART,
    'y-label': INERT_ON_AXISLESS_CHART,
    stacked: INERT_ON_AXISLESS_CHART,
    'index-axis': INERT_ON_AXISLESS_CHART,
    grid: INERT_ON_AXISLESS_CHART,
    min: INERT_ON_AXISLESS_CHART,
    max: INERT_ON_AXISLESS_CHART,
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'pie-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    'x-label': INERT_ON_AXISLESS_CHART,
    'y-label': INERT_ON_AXISLESS_CHART,
    stacked: INERT_ON_AXISLESS_CHART,
    'index-axis': INERT_ON_AXISLESS_CHART,
    grid: INERT_ON_AXISLESS_CHART,
    min: INERT_ON_AXISLESS_CHART,
    max: INERT_ON_AXISLESS_CHART,
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'polar-area-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    'x-label': INERT_ON_RADIAL_CHART,
    'y-label': INERT_ON_RADIAL_CHART,
    stacked: INERT_ON_RADIAL_CHART,
    'index-axis': INERT_ON_RADIAL_CHART,
    grid: INERT_ON_RADIAL_CHART,
    min: INERT_ON_RADIAL_CHART,
    max: INERT_ON_RADIAL_CHART,
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'radar-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    // `stacked`, `grid`, `min` and `max` are just as inert here, but they are
    // still registry props, deprecated by #129, so they need no entry yet.
    // #130 removes them in the next major and files them here.
    'x-label': INERT_ON_RADIAL_CHART,
    'y-label': INERT_ON_RADIAL_CHART,
    'index-axis': INERT_ON_RADIAL_CHART,
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
  'scatter-chart': {
    type: {
      kind: 'intentional',
      reason:
        'fixed by this typed chart element; only wa-chart takes a chart type',
    },
    plugins: {
      kind: 'intentional',
      reason:
        'array of Chart.js plugin objects, which carry functions no attribute value can express',
    },
  },
};

/** Why Kigumi deprecates a prop whose Web Awesome attribute is not deprecated. */
export interface KigumiDeprecation {
  /** Quoted in the stale-entry error, so whoever removes the entry sees why it was there. */
  reason: string;
}

const NO_EFFECT_ON_RADAR_CHART: KigumiDeprecation = {
  reason:
    'wa-radar-chart declares it, but WaChart builds a radar chart with only a radial r scale and never reads it; the registry message names any r-scale replacement; deprecated by #129, removed by #130',
};

/**
 * Registry props Kigumi deprecates on its own account, keyed by registry key,
 * then by kebab-cased prop name. `checkDeprecationDrift` errors on any other
 * registry deprecation the CEM does not share, so a deprecation copied from a
 * Web Awesome changelog that never reached the manifest is caught, while one
 * Kigumi decided on is stated here with its reason.
 *
 * An entry is stale, and an error, once the registry prop is no longer
 * deprecated (or gone) or Web Awesome deprecates the attribute as well.
 */
export const KIGUMI_DEPRECATIONS: Readonly<
  Record<string, Readonly<Record<string, KigumiDeprecation>>>
> = {
  'radar-chart': {
    stacked: NO_EFFECT_ON_RADAR_CHART,
    grid: NO_EFFECT_ON_RADAR_CHART,
    min: NO_EFFECT_ON_RADAR_CHART,
    max: NO_EFFECT_ON_RADAR_CHART,
  },
};

/**
 * Allowlist keys that already have a registry entry. Those wrappers exist, so
 * the allowlist entry is a lie — remove it when adding the wrapper.
 */
export function allowlistedKeysInRegistry(
  registryKeys: Iterable<string>,
  allowlist: ReadonlySet<string> = INTENTIONALLY_UNWRAPPED
): string[] {
  const registry = new Set(registryKeys);
  return [...allowlist].filter((key) => registry.has(key)).sort();
}

interface SyncResult {
  passed: boolean;
  findings: SyncFinding[];
  /**
   * Whether the manifest half (prop-value and attribute drift, which read the
   * same CEM) could run. The presence half needs no manifest
   * -- it compares the registry against the committed `COMPONENT_METADATA` --
   * so the two halves are reported separately rather than under one verdict
   * that would be true of only one of them.
   */
  cem: CemVerdict;
  stats: {
    /**
     * Components described by the committed `COMPONENT_METADATA`, NOT by a CEM
     * read from disk. The old label said "CEM components", which made the
     * number look like evidence that a manifest had been read; it printed 84
     * just the same when no manifest existed.
     */
    metadataComponents: number;
    registryComponents: number;
    onlyInCem: number;
    onlyInRegistry: number;
    synced: number;
    propValueDrift: number;
    /**
     * Counted separately from `propValueDrift`: that check compares enum
     * *values* for props the registry already declares, while this counts CEM
     * attribute *names* with no registry prop at all. Stale allowlist entries
     * are not drift; they fail the run and are listed under the errors.
     */
    attributeDrift: number;
    /**
     * Registry props whose deprecation disagrees with the CEM, in either
     * direction. Stale `KIGUMI_DEPRECATIONS` entries are errors listed with
     * the stale allowlist entries, not counted here.
     */
    deprecationDrift: number;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function registryKeyToCemKey(registryKey: string): string {
  return registryKey.toLowerCase();
}

function getCemKeys(): Set<string> {
  return new Set(Object.keys(COMPONENT_METADATA));
}

function getRegistryMap(): Map<string, ComponentDefinition> {
  const components = getAllComponents();
  const map = new Map<string, ComponentDefinition>();
  for (const [key, def] of Object.entries(components)) {
    map.set(registryKeyToCemKey(key), def);
  }
  return map;
}

/**
 * Parse a CEM attribute `type.text` into its set of string-literal members, but
 * only when the entire union is made of string literals (e.g.
 * `'small' | 'medium' | 'large'`). Returns null for non-enum types
 * (`string`, `number`, `boolean | undefined`, …) so we never compare against
 * open-ended types.
 */
export function parseStringEnum(text: string | undefined): string[] | null {
  if (!text) return null;
  const parts = text.split('|').map((s) => s.trim());
  const literals = parts
    .filter((p) => /^'[^']*'$/.test(p) || /^"[^"]*"$/.test(p))
    .map((p) => p.slice(1, -1));
  return literals.length === parts.length && literals.length > 0
    ? literals
    : null;
}

/** A CEM attribute's `deprecated` field: a message, or `true` when bare. */
export type CemDeprecation = string | true;

/** What the manifest half reads from the CEM, keyed by `wa-<tag>`. */
export interface CemAttributes {
  /** attrName -> `type.text`, for prop-value and attribute-name drift. */
  types: Map<string, Record<string, string | undefined>>;
  /** attrName -> deprecation, holding only the deprecated attributes. */
  deprecations: Map<string, Record<string, CemDeprecation>>;
}

export interface CemManifest {
  modules?: Array<{
    declarations?: Array<{
      customElement?: boolean;
      tagName?: string;
      attributes?: Array<{
        name: string;
        type?: { text?: string };
        deprecated?: boolean | string;
      }>;
    }>;
  }>;
}

/**
 * Read every custom element's attribute types and deprecations from a parsed
 * CEM. Pure, so the `deprecated` handling is tested on literal manifests: the
 * schema allows a message or a bare `true` (an empty message reads as `true`),
 * and `false` means not deprecated.
 */
export function parseCemAttributes(cem: CemManifest): CemAttributes {
  const types: CemAttributes['types'] = new Map();
  const deprecations: CemAttributes['deprecations'] = new Map();

  for (const mod of cem.modules ?? []) {
    for (const dec of mod.declarations ?? []) {
      if (!dec.customElement || !dec.tagName) continue;
      const attributes = dec.attributes ?? [];
      types.set(
        dec.tagName,
        Object.fromEntries(attributes.map((a) => [a.name, a.type?.text]))
      );
      // The schema's string is the reason, so an empty one is still a
      // deprecation: only an absent field or `false` means not deprecated.
      const deprecated = attributes.flatMap((a) =>
        a.deprecated === undefined || a.deprecated === false
          ? []
          : [[a.name, a.deprecated === '' ? true : a.deprecated] as const]
      );
      if (deprecated.length > 0) {
        deprecations.set(dec.tagName, Object.fromEntries(deprecated));
      }
    }
  }
  return { types, deprecations };
}

/**
 * Read the CEM at `cemPath`.
 *
 * Takes a resolved path rather than finding one itself. It previously returned
 * an empty map when the CEM was unreachable, which `checkPropValueDrift` then
 * read as "nothing to compare" and the summary printed as
 * `Prop-value drift: 0` -- identical output to a run that had checked all 84
 * components. Whether a missing manifest is tolerable is now decided before
 * this function is reached, so it can assume its input exists.
 */
function readCemAttributes(cemPath: string): CemAttributes {
  return parseCemAttributes(
    JSON.parse(fs.readFileSync(cemPath, 'utf8')) as CemManifest
  );
}

// ── Comparison ──────────────────────────────────────────────────────────────

function checkComponentPresence(
  cemKeys: Set<string>,
  registryMap: Map<string, ComponentDefinition>
): SyncFinding[] {
  const findings: SyncFinding[] = [];

  for (const cemKey of cemKeys) {
    if (INTENTIONALLY_UNWRAPPED.has(cemKey)) continue;
    if (!registryMap.has(cemKey)) {
      findings.push({
        component: cemKey,
        category: 'missing-from-registry',
        severity: 'warning',
        message: `wa-${cemKey} exists in CEM metadata but has no registry entry`,
      });
    }
  }

  for (const [regKey] of registryMap) {
    if (!cemKeys.has(regKey)) {
      findings.push({
        component: regKey,
        category: 'missing-from-cem',
        severity: 'error',
        message: `${regKey} is in registry but not found in CEM metadata (possibly removed upstream)`,
      });
    }
  }

  for (const key of allowlistedKeysInRegistry(registryMap.keys())) {
    findings.push({
      component: key,
      category: 'allowlisted-but-wrapped',
      severity: 'error',
      message: `${key} is in INTENTIONALLY_UNWRAPPED but also has a registry entry; remove it from the allowlist`,
    });
  }

  return findings;
}

/**
 * Compare each registry enum prop's `values` against the corresponding CEM
 * attribute enum, in both directions. This is the check that would have caught
 * the WA 3.6.0 `size` widening (xs/s/m/l/xl) instead of letting it pass silently.
 */
function checkPropValueDrift(
  registryMap: Map<string, ComponentDefinition>,
  cemAttrTypes: Map<string, Record<string, string | undefined>>
): SyncFinding[] {
  const findings: SyncFinding[] = [];
  if (cemAttrTypes.size === 0) return findings; // CEM unreachable → skip

  for (const [regKey, def] of registryMap) {
    const attrs = cemAttrTypes.get(`wa-${regKey}`);
    if (!attrs) continue;

    for (const prop of def.props) {
      if (!prop.values || prop.values.length === 0) continue;
      const cemEnum = parseStringEnum(attrs[prop.name]);
      if (!cemEnum) continue; // attribute is not an enum upstream

      const cemSet = new Set(cemEnum);
      const regSet = new Set(prop.values);
      const allowed = new Set(
        REGISTRY_VALUE_ALLOWLIST[`${regKey}.${prop.name}`] ?? []
      );

      const extraInRegistry = prop.values.filter(
        (v) => !cemSet.has(v) && !allowed.has(v)
      );
      if (extraInRegistry.length > 0) {
        findings.push({
          component: regKey,
          category: 'prop-value-drift',
          severity: 'error',
          message: `${regKey}.${prop.name} advertises value(s) [${extraInRegistry.join(', ')}] that Web Awesome no longer accepts (CEM: [${cemEnum.join(', ')}])`,
        });
      }

      const missingFromRegistry = cemEnum.filter((v) => !regSet.has(v));
      if (missingFromRegistry.length > 0) {
        findings.push({
          component: regKey,
          category: 'prop-value-drift',
          severity: 'warning',
          message: `${regKey}.${prop.name} is missing newly-available value(s) [${missingFromRegistry.join(', ')}] (CEM: [${cemEnum.join(', ')}])`,
        });
      }
    }
  }

  return findings;
}

/** The attributes `checkAttributeDrift` may find missing without warning. */
export interface AttributePolicy {
  global: ReadonlySet<string>;
  perComponent: Readonly<
    Record<string, Readonly<Record<string, AttributeAllowlistEntry>>>
  >;
}

type StaleCategory = 'stale-allowlist-entry' | 'stale-kigumi-deprecation';

/** An allowlist entry that no longer describes a gap, which fails the run. */
function staleEntry(
  category: StaleCategory,
  component: string,
  message: string
): SyncFinding {
  return { component, category, severity: 'error', message };
}

/**
 * A stale entry for each component a per-component allowlist names that the
 * registry does not have. Shared by every check that keeps such an allowlist.
 */
function unregisteredAllowlistKeys(
  category: StaleCategory,
  allowlistName: string,
  allowlist: Readonly<Record<string, unknown>>,
  registryMap: ReadonlyMap<string, ComponentDefinition>
): SyncFinding[] {
  return Object.keys(allowlist)
    .filter((regKey) => !registryMap.has(regKey))
    .map((regKey) =>
      staleEntry(
        category,
        regKey,
        `${allowlistName} has entries for "${regKey}", which is not a registry component; remove them`
      )
    );
}

/**
 * Compare each wrapped component's full CEM attribute list against its
 * registry props, in both directions:
 *
 * - A CEM attribute with no matching registry prop and no allowlist entry is
 *   a warning: additive drift, the same as a newly added enum value.
 * - A per-component allowlist entry is an error when it no longer describes a
 *   gap: the registry now surfaces the attribute, the CEM no longer declares
 *   it, or its component is not in the registry. The same discipline
 *   `allowlistedKeysInRegistry` applies to `INTENTIONALLY_UNWRAPPED`.
 *
 * Every name is compared kebab-cased through `toKebabCase`, on both sides. A
 * Lit property without an explicit `attribute:` option appears in the CEM
 * under its camelCase property name (`submenuOpen`), so normalizing only the
 * registry side would leave such an attribute unmatchable by any prop.
 *
 * Pure and exported so each case is table-tested against literal fixtures
 * rather than the real registry/CEM.
 */
export function checkAttributeDrift(
  registryMap: Map<string, ComponentDefinition>,
  cemAttrTypes: Map<string, Record<string, string | undefined>>,
  policy: AttributePolicy
): SyncFinding[] {
  const findings: SyncFinding[] = [];
  const stale = (component: string, message: string) =>
    findings.push(staleEntry('stale-allowlist-entry', component, message));

  for (const [regKey, def] of registryMap) {
    // Kebab name -> name as the CEM spells it, so messages quote the source.
    const cemAttrs = new Map(
      Object.keys(cemAttrTypes.get(`wa-${regKey}`) ?? {}).map((name) => [
        toKebabCase(name),
        name,
      ])
    );
    const propAttrs = new Set(def.props.map((p) => toKebabCase(p.name)));
    const allowlist = policy.perComponent[regKey] ?? {};

    for (const [attr, cemName] of cemAttrs) {
      if (
        propAttrs.has(attr) ||
        policy.global.has(attr) ||
        isSsrSlotHint(attr) ||
        Object.hasOwn(allowlist, attr)
      ) {
        continue;
      }
      findings.push({
        component: regKey,
        category: 'attribute-missing-from-registry',
        severity: 'warning',
        message: `wa-${regKey} declares attribute "${cemName}" in the CEM with no matching registry prop`,
      });
    }

    for (const [attr, entry] of Object.entries(allowlist)) {
      if (propAttrs.has(attr)) {
        stale(
          regKey,
          `${regKey}.${attr} is allowlisted as "${entry.kind}" but the registry now has a matching prop; remove it from COMPONENT_ATTRIBUTE_ALLOWLIST`
        );
      } else if (!cemAttrs.has(attr)) {
        stale(
          regKey,
          `${regKey}.${attr} is allowlisted as "${entry.kind}" but wa-${regKey} declares no such attribute in the CEM (removed upstream, or the key is not kebab-cased); remove or rename it in COMPONENT_ATTRIBUTE_ALLOWLIST`
        );
      }
    }
  }

  findings.push(
    ...unregisteredAllowlistKeys(
      'stale-allowlist-entry',
      'COMPONENT_ATTRIBUTE_ALLOWLIST',
      policy.perComponent,
      registryMap
    )
  );

  return findings;
}

/**
 * Compare each registry prop's `deprecated` against its CEM attribute's
 * `deprecated`, matching names kebab-cased on both sides as
 * `checkAttributeDrift` does:
 *
 * - The CEM deprecates the attribute and the registry prop does not: a
 *   warning, additive drift like a new attribute. Mark the prop `deprecated`
 *   (in Kigumi's own words) and regenerate.
 * - The registry prop is deprecated and the CEM attribute is not (or the CEM
 *   has no such attribute): an error, unless `kigumiDeprecations` records it
 *   as a Kigumi-side deprecation. The message says which of the two it is,
 *   since an attribute Web Awesome removed needs a different fix.
 * - A `kigumiDeprecations` entry is a `stale-kigumi-deprecation` error once its prop is no longer
 *   deprecated, once the CEM deprecates the attribute too, or when its
 *   component is not in the registry.
 *
 * A CEM deprecation on an attribute with no registry prop is left to
 * `checkAttributeDrift`, which already reports the missing prop.
 *
 * Pure and exported so each case is table-tested against literal fixtures.
 */
export function checkDeprecationDrift(
  registryMap: Map<string, ComponentDefinition>,
  cem: CemAttributes,
  kigumiDeprecations: Readonly<
    Record<string, Readonly<Record<string, KigumiDeprecation>>>
  >
): SyncFinding[] {
  const findings: SyncFinding[] = [];
  const stale = (component: string, message: string) =>
    findings.push(staleEntry('stale-kigumi-deprecation', component, message));

  for (const [regKey, def] of registryMap) {
    const declared = new Set(
      Object.keys(cem.types.get(`wa-${regKey}`) ?? {}).map(toKebabCase)
    );
    const upstream = new Map(
      Object.entries(cem.deprecations.get(`wa-${regKey}`) ?? {}).map(
        ([name, deprecation]) => [toKebabCase(name), deprecation]
      )
    );
    const ownDeprecations = kigumiDeprecations[regKey] ?? {};
    const deprecatedProps = new Set<string>();

    for (const prop of def.props) {
      const attr = toKebabCase(prop.name);
      const cemDeprecation = upstream.get(attr);
      if (prop.deprecated) deprecatedProps.add(attr);

      if (cemDeprecation !== undefined && !prop.deprecated) {
        const says = cemDeprecation === true ? '' : ` ("${cemDeprecation}")`;
        findings.push({
          component: regKey,
          category: 'deprecation-missing-from-registry',
          severity: 'warning',
          message: `${regKey}.${prop.name} is deprecated in the CEM${says} but not in the registry; add \`deprecated\` to the prop in Kigumi's own words and regenerate`,
        });
      } else if (
        cemDeprecation === undefined &&
        prop.deprecated &&
        !Object.hasOwn(ownDeprecations, attr)
      ) {
        findings.push({
          component: regKey,
          category: 'deprecation-missing-from-cem',
          severity: 'error',
          message: declared.has(attr)
            ? `${regKey}.${prop.name} is deprecated in the registry but not in the CEM; if Kigumi deprecates it on its own account, record why in KIGUMI_DEPRECATIONS`
            : `${regKey}.${prop.name} is deprecated in the registry, and wa-${regKey} declares no such attribute in the CEM; if Web Awesome removed it, remove the prop or keep it until the next major and record that in KIGUMI_DEPRECATIONS, otherwise fix the prop name`,
        });
      }
    }

    for (const [attr, entry] of Object.entries(ownDeprecations)) {
      const recorded = `is in KIGUMI_DEPRECATIONS ("${entry.reason}")`;
      if (!deprecatedProps.has(attr)) {
        stale(
          regKey,
          `${regKey}.${attr} ${recorded} but is not deprecated in the registry; remove the entry`
        );
      } else if (upstream.has(attr)) {
        stale(
          regKey,
          `${regKey}.${attr} ${recorded} but Web Awesome now deprecates it upstream; remove the entry`
        );
      }
    }
  }

  findings.push(
    ...unregisteredAllowlistKeys(
      'stale-kigumi-deprecation',
      'KIGUMI_DEPRECATIONS',
      kigumiDeprecations,
      registryMap
    )
  );

  return findings;
}

/**
 * The summary's per-kind counts. Stale allowlist and Kigumi-deprecation
 * entries are errors listed with the others, not drift, so no count includes
 * them. Pure so each count is tested on literal findings.
 */
export function countDrift(
  findings: readonly SyncFinding[]
): Pick<
  SyncResult['stats'],
  | 'onlyInCem'
  | 'onlyInRegistry'
  | 'propValueDrift'
  | 'attributeDrift'
  | 'deprecationDrift'
> {
  const count = (...categories: SyncFinding['category'][]) =>
    findings.filter((f) => categories.includes(f.category)).length;
  return {
    onlyInCem: count('missing-from-registry'),
    onlyInRegistry: count('missing-from-cem'),
    propValueDrift: count('prop-value-drift'),
    attributeDrift: count('attribute-missing-from-registry'),
    deprecationDrift: count(
      'deprecation-missing-from-registry',
      'deprecation-missing-from-cem'
    ),
  };
}

// ── Main ────────────────────────────────────────────────────────────────────

export async function validateCemSync(
  root: string = PROJECT_ROOT
): Promise<SyncResult> {
  const cemKeys = getCemKeys();
  const registryMap = getRegistryMap();

  // All-or-nothing, matching Check A: a pass means every registry component was
  // compared. The free manifest describes 66 of 84 components, and the 18 it
  // omits are all enum-bearing (the nine charts, toast, combobox, file-input,
  // sparkline, ...), so a free-manifest run would verify 49 of 67 enum-bearing
  // components. Reporting that as a pass is the same trap at smaller scale.
  const resolution = await resolveCem(root);
  const cem = assessCemCompleteness(resolution, registryMap.size);

  // `usable` implies a resolved path, but narrow on the path itself rather
  // than asserting, so the two can never disagree silently.
  const cemAttributes =
    cem.usable && resolution.path !== null
      ? readCemAttributes(resolution.path)
      : null;
  const cemAttrTypes = cemAttributes?.types ?? null;
  const propValueFindings = cemAttrTypes
    ? checkPropValueDrift(registryMap, cemAttrTypes)
    : [];
  const attributeDriftFindings = cemAttrTypes
    ? checkAttributeDrift(registryMap, cemAttrTypes, {
        global: GLOBAL_ATTRIBUTE_ALLOWLIST,
        perComponent: COMPONENT_ATTRIBUTE_ALLOWLIST,
      })
    : [];
  const deprecationDriftFindings = cemAttributes
    ? checkDeprecationDrift(registryMap, cemAttributes, KIGUMI_DEPRECATIONS)
    : [];

  const findings = [
    ...checkComponentPresence(cemKeys, registryMap),
    ...propValueFindings,
    ...attributeDriftFindings,
    ...deprecationDriftFindings,
  ];
  const synced = [...registryMap.keys()].filter((k) => cemKeys.has(k)).length;

  return {
    passed: !findings.some((f) => f.severity === 'error'),
    findings,
    cem,
    stats: {
      metadataComponents: cemKeys.size,
      registryComponents: registryMap.size,
      synced,
      ...countDrift(findings),
    },
  };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: SyncResult): void {
  console.log(pc.cyan('\nValidating CEM-to-Registry sync...\n'));

  // Each half says whether it ran. Before this, every line below printed the
  // same numbers whether or not a manifest had been read, so a run that
  // compared nothing was indistinguishable from one that compared everything.
  console.log(pc.bold('Coverage:'));
  console.log(
    `  Component presence:  ${pc.green('verified')} (committed component metadata, ${result.stats.metadataComponents} components)`
  );
  const cemCoverage = result.cem.usable
    ? `${pc.green('verified')} (${result.cem.reason})`
    : pc.yellow(`NOT RUN - ${result.cem.reason}`);
  console.log(`  Prop-value drift:    ${cemCoverage}`);
  console.log(`  Attribute drift:     ${cemCoverage}`);
  console.log(`  Deprecation drift:   ${cemCoverage}`);
  console.log('');

  console.log(pc.bold('Statistics:'));
  console.log(`  Metadata components: ${result.stats.metadataComponents}`);
  console.log(`  Registry components: ${result.stats.registryComponents}`);
  console.log(`  Synced:              ${result.stats.synced}`);
  console.log(`  Only in metadata:    ${result.stats.onlyInCem}`);
  console.log(`  Only in Registry:    ${result.stats.onlyInRegistry}`);
  console.log(
    `  Prop-value drift:    ${
      result.cem.usable ? result.stats.propValueDrift : pc.yellow('not checked')
    }`
  );
  console.log(
    `  Attribute drift:     ${
      result.cem.usable ? result.stats.attributeDrift : pc.yellow('not checked')
    }`
  );
  console.log(
    `  Deprecation drift:   ${
      result.cem.usable
        ? result.stats.deprecationDrift
        : pc.yellow('not checked')
    }`
  );
  console.log('');

  const errors = result.findings.filter((f) => f.severity === 'error');
  const warnings = result.findings.filter((f) => f.severity === 'warning');

  if (warnings.length > 0) {
    console.log(pc.yellow(`Warnings (${warnings.length}):`));
    for (const finding of warnings.slice(0, 30)) {
      console.log(pc.yellow(`  [${finding.component}] ${finding.message}`));
    }
    if (warnings.length > 30) {
      console.log(pc.yellow(`  ... and ${warnings.length - 30} more warnings`));
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.log(pc.red(`Errors (${errors.length}):`));
    for (const finding of errors) {
      console.log(pc.red(`  [${finding.component}] ${finding.message}`));
    }
    console.log('');
  }

  if (!result.passed) {
    console.log(
      pc.red(`CEM sync validation failed with ${errors.length} error(s)\n`)
    );
  }
}

/**
 * Turn a sync result into an exit code and a verdict, via the shared guard
 * vocabulary.
 *
 * Errors found by either half fail outright. Otherwise the verdict turns on
 * whether the manifest half ran: only a run where both halves were verified
 * may print an unqualified pass.
 */
export function summarizeSync(
  result: SyncResult,
  options: { allowSkip?: boolean } = {}
): GuardSummary {
  const errors = result.findings.filter((f) => f.severity === 'error');

  return summarizeGuard(
    {
      passed: result.passed,
      findings: errors.map((f) => ({
        check: f.category,
        component: f.component,
        message: f.message,
      })),
      cem: result.cem,
    },
    {
      allowSkip: options.allowSkip ?? false,
      label: 'Prop-value, attribute and deprecation drift',
      passHeadline: 'CEM sync validation passed!',
      fixHint:
        'Install the Web Awesome Pro package so the manifest half can compare\n' +
        'every registry enum, attribute and deprecation against it\n' +
        '(pnpm setup:npmrc, then install docs deps).',
    }
  );
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

async function main() {
  try {
    const result = await validateCemSync();
    printResults(result);

    const summary = summarizeSync(result, { allowSkip: skipPermitted() });
    const paint =
      summary.exitCode !== 0 ? pc.red : summary.verified ? pc.green : pc.yellow;
    console.log(paint(summary.headline));
    if (summary.detail) console.log(summary.detail);
    console.log('');

    process.exit(summary.exitCode);
  } catch (error) {
    console.error(pc.red('Fatal error during CEM sync validation:'));
    console.error(error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
