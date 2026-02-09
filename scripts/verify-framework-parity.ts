#!/usr/bin/env tsx
/**
 * Framework Parity Verifier
 *
 * Verifies that React and Vue templates have the same feature coverage:
 * - Same events exposed
 * - Same methods exposed
 * - Both complete according to metadata
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const REACT_TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'react');
const VUE_TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'vue');

interface ParityResult {
  component: string;
  hasParity: boolean;
  issues: string[];
  reactComplete: boolean;
  vueComplete: boolean;
}

/**
 * Convert event name to React prop name
 */
function toReactEventName(eventName: string): string {
  const parts = eventName.split('-');
  const camelCase = parts
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
  return 'on' + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Check if React template has event
 */
function reactHasEvent(content: string, eventName: string): boolean {
  const reactEventName = toReactEventName(eventName);
  const eventPattern = new RegExp(`${reactEventName}\\s*\\?\\s*:\\s*\\(`);
  return eventPattern.test(content);
}

/**
 * Check if Vue template has event
 */
function vueHasEvent(content: string, eventName: string): boolean {
  const eventPattern = new RegExp(`'${eventName}'\\s*:\\s*\\[event:`);
  return eventPattern.test(content);
}

/**
 * Check if React template has method
 */
function reactHasMethod(content: string, methodName: string): boolean {
  const methodPattern = new RegExp(`\\b${methodName}\\s*[:,(]`);
  return methodPattern.test(content);
}

/**
 * Check if Vue template has method
 */
function vueHasMethod(content: string, methodName: string): boolean {
  const methodPattern = new RegExp(`\\b${methodName}\\s*:`);
  return methodPattern.test(content);
}

/**
 * Check parity for a single component
 */
async function checkComponentParity(
  componentName: string
): Promise<ParityResult> {
  const componentKey = componentName
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const metadata = COMPONENT_METADATA[componentKey];

  if (!metadata) {
    return {
      component: componentName,
      hasParity: true,
      issues: [],
      reactComplete: true,
      vueComplete: true,
    };
  }

  const reactPath = path.join(
    REACT_TEMPLATES_DIR,
    componentName,
    `${componentName}.tsx.hbs`
  );
  const vuePath = path.join(
    VUE_TEMPLATES_DIR,
    componentName,
    `${componentName}.vue.hbs`
  );

  if (!(await fs.pathExists(reactPath)) || !(await fs.pathExists(vuePath))) {
    return {
      component: componentName,
      hasParity: false,
      issues: ['Template missing'],
      reactComplete: false,
      vueComplete: false,
    };
  }

  const reactContent = await fs.readFile(reactPath, 'utf-8');
  const vueContent = await fs.readFile(vuePath, 'utf-8');

  const issues: string[] = [];
  let reactComplete = true;
  let vueComplete = true;

  // Check events
  for (const event of metadata.events) {
    const reactHas = reactHasEvent(reactContent, event.name);
    const vueHas = vueHasEvent(vueContent, event.name);

    if (!reactHas) {
      issues.push(`React missing event: ${event.name}`);
      reactComplete = false;
    }
    if (!vueHas) {
      issues.push(`Vue missing event: ${event.name}`);
      vueComplete = false;
    }
  }

  // Check methods
  for (const method of metadata.methods) {
    const reactHas = reactHasMethod(reactContent, method.name);
    const vueHas = vueHasMethod(vueContent, method.name);

    if (!reactHas) {
      issues.push(`React missing method: ${method.name}`);
      reactComplete = false;
    }
    if (!vueHas) {
      issues.push(`Vue missing method: ${method.name}`);
      vueComplete = false;
    }
  }

  return {
    component: componentName,
    hasParity: issues.length === 0,
    issues,
    reactComplete,
    vueComplete,
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Checking React vs Vue framework parity...\n');

  // Get all component directories (use React as reference)
  const componentDirs = await fs.readdir(REACT_TEMPLATES_DIR);
  const results: ParityResult[] = [];

  for (const dir of componentDirs) {
    const stat = await fs.stat(path.join(REACT_TEMPLATES_DIR, dir));
    if (stat.isDirectory()) {
      const result = await checkComponentParity(dir);
      results.push(result);
    }
  }

  // Separate with parity and without
  const withParity = results.filter((r) => r.hasParity);
  const withoutParity = results.filter((r) => !r.hasParity);

  // Generate report
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Framework Parity Report (React vs Vue)');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`✅ FULL PARITY: ${withParity.length} components\n`);
  withParity.slice(0, 10).forEach((r) => {
    const metadata =
      COMPONENT_METADATA[
        r.component
          .toLowerCase()
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase()
      ];
    const eventCount = metadata?.events.length || 0;
    const methodCount = metadata?.methods.length || 0;
    console.log(
      `   ✓ ${r.component.padEnd(20)} (${eventCount} events, ${methodCount} methods)`
    );
  });
  if (withParity.length > 10) {
    console.log(`   ... and ${withParity.length - 10} more\n`);
  } else {
    console.log();
  }

  if (withoutParity.length > 0) {
    console.log(`⚠️  PARITY ISSUES: ${withoutParity.length} components\n`);
    withoutParity.forEach((r) => {
      console.log(`   ⚠ ${r.component.padEnd(20)} - ${r.issues.join(', ')}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(
    `Summary: ${withParity.length}/${results.length} have full parity (${Math.round((withParity.length / results.length) * 100)}%)`
  );
  console.log('═══════════════════════════════════════════════════════════\n');

  // Count completeness
  const reactCompleteCount = results.filter((r) => r.reactComplete).length;
  const vueCompleteCount = results.filter((r) => r.vueComplete).length;

  console.log(
    `React: ${reactCompleteCount}/${results.length} complete (${Math.round((reactCompleteCount / results.length) * 100)}%)`
  );
  console.log(
    `Vue:   ${vueCompleteCount}/${results.length} complete (${Math.round((vueCompleteCount / results.length) * 100)}%)\n`
  );

  if (withoutParity.length > 0) {
    console.log('💡 Fix templates to achieve full framework parity');
    process.exit(1);
  } else {
    console.log('✅ React and Vue templates have full parity!');
  }
}

main().catch(console.error);
