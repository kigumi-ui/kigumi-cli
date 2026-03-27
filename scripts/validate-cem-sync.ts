#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CEM-to-Registry Sync Checker
 *
 * PURPOSE: Detects drift between Web Awesome's custom-elements.json (via component-metadata.ts)
 * and the local component registry. Reports events, slots, and methods that are
 * present in one source but missing from the other.
 *
 * NOTE: Props are not checked because CEM metadata only contains events, slots, and methods.
 * Props live exclusively in registry.ts and are validated by validate:registry instead.
 *
 * CHECKS:
 * - Components in CEM metadata but not in registry
 * - Components in registry but not in CEM metadata
 * - Events in CEM but missing from registry
 * - Slots in CEM but missing from registry
 * - Methods in CEM but missing from registry
 *
 * USAGE:
 *   pnpm validate:cem-sync
 *   node scripts/validate-cem-sync.ts
 */

import { fileURLToPath } from 'url';
import pc from 'picocolors';
import {
  COMPONENT_METADATA,
  type ComponentMetadata,
} from '../src/utils/component-metadata.js';
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';

// ── Types ───────────────────────────────────────────────────────────────────

interface SyncFinding {
  component: string;
  category:
    | 'missing-from-registry'
    | 'missing-from-cem'
    | 'event-drift'
    | 'slot-drift'
    | 'method-drift';
  severity: 'error' | 'warning';
  message: string;
}

interface SyncResult {
  passed: boolean;
  findings: SyncFinding[];
  stats: {
    cemComponents: number;
    registryComponents: number;
    onlyInCem: number;
    onlyInRegistry: number;
    synced: number;
    eventDrifts: number;
    slotDrifts: number;
    methodDrifts: number;
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalize a registry key to match CEM key format.
 * Registry uses both plain keys (button) and quoted keys ('button-group').
 * CEM metadata uses tag name without 'wa-' prefix (button, button-group).
 */
function registryKeyToCemKey(registryKey: string): string {
  return registryKey.toLowerCase();
}

/**
 * Build a lookup of CEM keys from the metadata.
 * CEM keys are the object keys in COMPONENT_METADATA (e.g., 'icon', 'checkbox', 'button').
 */
function getCemKeys(): Set<string> {
  return new Set(Object.keys(COMPONENT_METADATA));
}

/**
 * Build a lookup from registry, mapping normalized keys to definitions.
 */
function getRegistryMap(): Map<string, ComponentDefinition> {
  const components = getAllComponents();
  const map = new Map<string, ComponentDefinition>();
  for (const [key, def] of Object.entries(components)) {
    map.set(registryKeyToCemKey(key), def);
  }
  return map;
}

// ── Comparison Functions ────────────────────────────────────────────────────

function checkComponentPresence(
  cemKeys: Set<string>,
  registryMap: Map<string, ComponentDefinition>
): SyncFinding[] {
  const findings: SyncFinding[] = [];

  // Components in CEM but not in registry
  for (const cemKey of cemKeys) {
    if (!registryMap.has(cemKey)) {
      findings.push({
        component: cemKey,
        category: 'missing-from-registry',
        severity: 'warning',
        message: `wa-${cemKey} exists in CEM metadata but has no registry entry`,
      });
    }
  }

  // Components in registry but not in CEM
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

function checkEventSync(
  cemKey: string,
  cemData: ComponentMetadata,
  registryDef: ComponentDefinition
): SyncFinding[] {
  const findings: SyncFinding[] = [];

  if (!cemData.events.length) return findings;
  if (!registryDef.events) {
    findings.push({
      component: cemKey,
      category: 'event-drift',
      severity: 'warning',
      message: `CEM has ${cemData.events.length} event(s) but registry has no events defined: ${cemData.events.map((e) => e.name).join(', ')}`,
    });
    return findings;
  }

  const registryEventNames = new Set(registryDef.events.map((e) => e.name));
  const cemEventNames = new Set(cemData.events.map((e) => e.name));

  // Events in CEM but not in registry
  for (const cemEvent of cemData.events) {
    if (!registryEventNames.has(cemEvent.name)) {
      findings.push({
        component: cemKey,
        category: 'event-drift',
        severity: 'warning',
        message: `Event '${cemEvent.name}' in CEM but missing from registry`,
      });
    }
  }

  // Events in registry but not in CEM (possibly removed upstream)
  for (const regEvent of registryDef.events) {
    if (!cemEventNames.has(regEvent.name)) {
      findings.push({
        component: cemKey,
        category: 'event-drift',
        severity: 'error',
        message: `Event '${regEvent.name}' in registry but not in CEM (possibly removed upstream)`,
      });
    }
  }

  return findings;
}

function checkSlotSync(
  cemKey: string,
  cemData: ComponentMetadata,
  registryDef: ComponentDefinition
): SyncFinding[] {
  const findings: SyncFinding[] = [];

  if (!cemData.slots.length) return findings;
  if (!registryDef.slots) {
    findings.push({
      component: cemKey,
      category: 'slot-drift',
      severity: 'warning',
      message: `CEM has ${cemData.slots.length} slot(s) but registry has no slots defined: ${cemData.slots.map((s) => s.name || '(default)').join(', ')}`,
    });
    return findings;
  }

  const registrySlotNames = new Set(registryDef.slots.map((s) => s.name));
  const cemSlotNames = new Set(cemData.slots.map((s) => s.name));

  for (const cemSlot of cemData.slots) {
    if (!registrySlotNames.has(cemSlot.name)) {
      findings.push({
        component: cemKey,
        category: 'slot-drift',
        severity: 'warning',
        message: `Slot '${cemSlot.name || '(default)'}' in CEM but missing from registry`,
      });
    }
  }

  for (const regSlot of registryDef.slots) {
    if (!cemSlotNames.has(regSlot.name)) {
      findings.push({
        component: cemKey,
        category: 'slot-drift',
        severity: 'error',
        message: `Slot '${regSlot.name || '(default)'}' in registry but not in CEM (possibly removed upstream)`,
      });
    }
  }

  return findings;
}

function checkMethodSync(
  cemKey: string,
  cemData: ComponentMetadata,
  registryDef: ComponentDefinition
): SyncFinding[] {
  const findings: SyncFinding[] = [];

  if (!cemData.methods.length) return findings;
  if (!registryDef.methods) {
    findings.push({
      component: cemKey,
      category: 'method-drift',
      severity: 'warning',
      message: `CEM has ${cemData.methods.length} method(s) but registry has no methods defined: ${cemData.methods.map((m) => m.name).join(', ')}`,
    });
    return findings;
  }

  const registryMethodNames = new Set(registryDef.methods.map((m) => m.name));
  const cemMethodNames = new Set(cemData.methods.map((m) => m.name));

  for (const cemMethod of cemData.methods) {
    if (!registryMethodNames.has(cemMethod.name)) {
      findings.push({
        component: cemKey,
        category: 'method-drift',
        severity: 'warning',
        message: `Method '${cemMethod.name}' in CEM but missing from registry`,
      });
    }
  }

  for (const regMethod of registryDef.methods) {
    if (!cemMethodNames.has(regMethod.name)) {
      findings.push({
        component: cemKey,
        category: 'method-drift',
        severity: 'error',
        message: `Method '${regMethod.name}' in registry but not in CEM (possibly removed upstream)`,
      });
    }
  }

  return findings;
}

// ── Main ────────────────────────────────────────────────────────────────────

export function validateCemSync(): SyncResult {
  const cemKeys = getCemKeys();
  const registryMap = getRegistryMap();

  const result: SyncResult = {
    passed: true,
    findings: [],
    stats: {
      cemComponents: cemKeys.size,
      registryComponents: registryMap.size,
      onlyInCem: 0,
      onlyInRegistry: 0,
      synced: 0,
      eventDrifts: 0,
      slotDrifts: 0,
      methodDrifts: 0,
    },
  };

  // 1. Check component presence
  const presenceFindings = checkComponentPresence(cemKeys, registryMap);
  result.findings.push(...presenceFindings);
  result.stats.onlyInCem = presenceFindings.filter(
    (f) => f.category === 'missing-from-registry'
  ).length;
  result.stats.onlyInRegistry = presenceFindings.filter(
    (f) => f.category === 'missing-from-cem'
  ).length;

  // 2. For components present in both, check event/slot/method sync
  for (const [cemKey, cemData] of Object.entries(COMPONENT_METADATA)) {
    const registryDef = registryMap.get(cemKey);
    if (!registryDef) continue;

    result.stats.synced++;

    const eventFindings = checkEventSync(cemKey, cemData, registryDef);
    const slotFindings = checkSlotSync(cemKey, cemData, registryDef);
    const methodFindings = checkMethodSync(cemKey, cemData, registryDef);

    result.findings.push(...eventFindings, ...slotFindings, ...methodFindings);
    result.stats.eventDrifts += eventFindings.length;
    result.stats.slotDrifts += slotFindings.length;
    result.stats.methodDrifts += methodFindings.length;
  }

  // Only errors (not warnings) cause failure
  result.passed = !result.findings.some((f) => f.severity === 'error');

  return result;
}

// ── Output ──────────────────────────────────────────────────────────────────

function printResults(result: SyncResult): void {
  console.log(pc.cyan('\nValidating CEM-to-Registry sync...\n'));

  console.log(pc.bold('Statistics:'));
  console.log(`  CEM components:      ${result.stats.cemComponents}`);
  console.log(`  Registry components:  ${result.stats.registryComponents}`);
  console.log(`  Synced:              ${result.stats.synced}`);
  console.log(`  Only in CEM:         ${result.stats.onlyInCem}`);
  console.log(`  Only in Registry:    ${result.stats.onlyInRegistry}`);

  if (
    result.stats.eventDrifts ||
    result.stats.slotDrifts ||
    result.stats.methodDrifts
  ) {
    console.log('');
    console.log(pc.bold('API Drift:'));
    if (result.stats.eventDrifts)
      console.log(`  Event drifts:   ${result.stats.eventDrifts}`);
    if (result.stats.slotDrifts)
      console.log(`  Slot drifts:    ${result.stats.slotDrifts}`);
    if (result.stats.methodDrifts)
      console.log(`  Method drifts:  ${result.stats.methodDrifts}`);
  }
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

// Only run when executed directly, not when imported
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
