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
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';
import { findCustomElementsJsonSync } from './find-cem.js';

// ── Types ───────────────────────────────────────────────────────────────────

interface SyncFinding {
  component: string;
  category: 'missing-from-registry' | 'missing-from-cem' | 'prop-value-drift';
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
const INTENTIONALLY_UNWRAPPED: ReadonlySet<string> = new Set([
  // WA 3.7.0 additions; wrappers triaged wontfix-unless-recurring (PR #208).
  'video',
  'video-playlist',
  // Superseded for Kigumi's purposes by known-date/time-input wrappers;
  // full date-picker/date-input wrappers are a separate scoped effort.
  'date-picker',
  'date-input',
]);

interface SyncResult {
  passed: boolean;
  findings: SyncFinding[];
  stats: {
    cemComponents: number;
    registryComponents: number;
    onlyInCem: number;
    onlyInRegistry: number;
    synced: number;
    propValueDrift: number;
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

/**
 * Build a `wa-<tag>` → { attrName → type.text } map from the raw CEM. Returns
 * an empty map when the CEM is unreachable (docs/ deps not installed), so the
 * prop-value check degrades to a no-op rather than failing.
 */
function getCemAttributeTypes(): Map<
  string,
  Record<string, string | undefined>
> {
  const out = new Map<string, Record<string, string | undefined>>();
  const cemPath = findCustomElementsJsonSync();
  if (!cemPath) return out;

  const cem = JSON.parse(fs.readFileSync(cemPath, 'utf8')) as {
    modules?: Array<{
      declarations?: Array<{
        customElement?: boolean;
        tagName?: string;
        attributes?: Array<{ name: string; type?: { text?: string } }>;
      }>;
    }>;
  };

  for (const mod of cem.modules ?? []) {
    for (const dec of mod.declarations ?? []) {
      if (!dec.customElement || !dec.tagName) continue;
      out.set(
        dec.tagName,
        Object.fromEntries(
          (dec.attributes ?? []).map((a) => [a.name, a.type?.text])
        )
      );
    }
  }
  return out;
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

// ── Main ────────────────────────────────────────────────────────────────────

export function validateCemSync(): SyncResult {
  const cemKeys = getCemKeys();
  const registryMap = getRegistryMap();
  const cemAttrTypes = getCemAttributeTypes();

  const findings = [
    ...checkComponentPresence(cemKeys, registryMap),
    ...checkPropValueDrift(registryMap, cemAttrTypes),
  ];
  const onlyInCem = findings.filter(
    (f) => f.category === 'missing-from-registry'
  ).length;
  const onlyInRegistry = findings.filter(
    (f) => f.category === 'missing-from-cem'
  ).length;
  const propValueDrift = findings.filter(
    (f) => f.category === 'prop-value-drift'
  ).length;
  const synced = [...registryMap.keys()].filter((k) => cemKeys.has(k)).length;

  return {
    passed: !findings.some((f) => f.severity === 'error'),
    findings,
    stats: {
      cemComponents: cemKeys.size,
      registryComponents: registryMap.size,
      onlyInCem,
      onlyInRegistry,
      synced,
      propValueDrift,
    },
  };
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: SyncResult): void {
  console.log(pc.cyan('\nValidating CEM-to-Registry sync...\n'));

  console.log(pc.bold('Statistics:'));
  console.log(`  CEM components:      ${result.stats.cemComponents}`);
  console.log(`  Registry components: ${result.stats.registryComponents}`);
  console.log(`  Synced:              ${result.stats.synced}`);
  console.log(`  Only in CEM:         ${result.stats.onlyInCem}`);
  console.log(`  Only in Registry:    ${result.stats.onlyInRegistry}`);
  console.log(`  Prop-value drift:    ${result.stats.propValueDrift}`);
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

  if (result.passed) {
    console.log(pc.green('CEM sync validation passed!\n'));
  } else {
    console.log(
      pc.red(`CEM sync validation failed with ${errors.length} error(s)\n`)
    );
  }
}

// ── CLI Entry ───────────────────────────────────────────────────────────────

async function main() {
  try {
    const result = validateCemSync();
    printResults(result);
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error(pc.red('Fatal error during CEM sync validation:'));
    console.error(error);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
