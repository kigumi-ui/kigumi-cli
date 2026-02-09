#!/usr/bin/env tsx
/**
 * React Template Verifier
 *
 * Verifies that React templates have complete coverage of:
 * - Events (in Props interface)
 * - Methods (in Ref interface and useImperativeHandle)
 * - Event listeners (in useEffect)
 *
 * Generates a report showing complete vs incomplete templates.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const REACT_TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'react');

interface VerificationResult {
  component: string;
  complete: boolean;
  missingEvents: string[];
  missingMethods: string[];
  missingEventListeners: string[];
  totalEvents: number;
  totalMethods: number;
}

/**
 * Convert event name to React prop name
 * e.g., 'wa-show' → 'onWaShow', 'blur' → 'onBlur'
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
 * Verify a single React component template
 */
async function verifyReactTemplate(
  componentName: string
): Promise<VerificationResult> {
  const componentKey = componentName
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const metadata = COMPONENT_METADATA[componentKey];

  if (!metadata) {
    console.warn(`⚠️  No metadata found for ${componentName}`);
    return {
      component: componentName,
      complete: true,
      missingEvents: [],
      missingMethods: [],
      missingEventListeners: [],
      totalEvents: 0,
      totalMethods: 0,
    };
  }

  const templatePath = path.join(
    REACT_TEMPLATES_DIR,
    componentName,
    `${componentName}.tsx.hbs`
  );

  if (!(await fs.pathExists(templatePath))) {
    console.warn(`⚠️  Template not found: ${templatePath}`);
    return {
      component: componentName,
      complete: false,
      missingEvents: metadata.events.map((e) => e.name),
      missingMethods: metadata.methods.map((m) => m.name),
      missingEventListeners: metadata.events.map((e) => e.name),
      totalEvents: metadata.events.length,
      totalMethods: metadata.methods.length,
    };
  }

  const templateContent = await fs.readFile(templatePath, 'utf-8');

  // Check for missing events in Props interface
  const missingEvents: string[] = [];
  for (const event of metadata.events) {
    const reactEventName = toReactEventName(event.name);
    // Check if event prop is defined in interface
    const eventPropPattern = new RegExp(`${reactEventName}\\s*\\?\\s*:\\s*\\(`);
    if (!eventPropPattern.test(templateContent)) {
      missingEvents.push(event.name);
    }
  }

  // Check for missing methods in Ref interface and useImperativeHandle
  const missingMethods: string[] = [];
  for (const method of metadata.methods) {
    // Check if method is in useImperativeHandle or Ref interface
    const methodPattern = new RegExp(`\\b${method.name}\\s*[:,(]`);
    if (!methodPattern.test(templateContent)) {
      missingMethods.push(method.name);
    }
  }

  // Check for missing event listeners in useEffect
  const missingEventListeners: string[] = [];
  for (const event of metadata.events) {
    const listenerPattern = new RegExp(
      `addEventListener\\s*\\(\\s*['"]${event.name}['"]`
    );
    if (!listenerPattern.test(templateContent)) {
      missingEventListeners.push(event.name);
    }
  }

  const complete =
    missingEvents.length === 0 &&
    missingMethods.length === 0 &&
    missingEventListeners.length === 0;

  return {
    component: componentName,
    complete,
    missingEvents,
    missingMethods,
    missingEventListeners,
    totalEvents: metadata.events.length,
    totalMethods: metadata.methods.length,
  };
}

/**
 * Main verification
 */
async function main() {
  console.log('🔍 Verifying React templates...\n');

  // Get all component directories
  const componentDirs = await fs.readdir(REACT_TEMPLATES_DIR);
  const results: VerificationResult[] = [];

  for (const dir of componentDirs) {
    const stat = await fs.stat(path.join(REACT_TEMPLATES_DIR, dir));
    if (stat.isDirectory()) {
      const result = await verifyReactTemplate(dir);
      results.push(result);
    }
  }

  // Separate complete and incomplete
  const complete = results.filter((r) => r.complete);
  const incomplete = results.filter((r) => !r.complete);

  // Sort incomplete by total missing (events + methods)
  incomplete.sort((a, b) => {
    const totalMissingA =
      a.missingEvents.length +
      a.missingMethods.length +
      a.missingEventListeners.length;
    const totalMissingB =
      b.missingEvents.length +
      b.missingMethods.length +
      b.missingEventListeners.length;
    return totalMissingB - totalMissingA;
  });

  // Generate report
  console.log('═══════════════════════════════════════════════════════════');
  console.log('React Template Verification Report');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`✅ COMPLETE: ${complete.length} components\n`);
  complete.slice(0, 10).forEach((r) => {
    console.log(
      `   ✓ ${r.component.padEnd(20)} (${r.totalEvents} events, ${r.totalMethods} methods)`
    );
  });
  if (complete.length > 10) {
    console.log(`   ... and ${complete.length - 10} more\n`);
  } else {
    console.log();
  }

  if (incomplete.length > 0) {
    console.log(`⚠️  INCOMPLETE: ${incomplete.length} components\n`);
    incomplete.forEach((r) => {
      const missing: string[] = [];
      if (r.missingEvents.length > 0) {
        missing.push(`Events: ${r.missingEvents.join(', ')}`);
      }
      if (r.missingMethods.length > 0) {
        missing.push(`Methods: ${r.missingMethods.join(', ')}`);
      }
      if (r.missingEventListeners.length > 0) {
        const listenersNotInEvents = r.missingEventListeners.filter(
          (l) => !r.missingEvents.includes(l)
        );
        if (listenersNotInEvents.length > 0) {
          missing.push(`Listeners: ${listenersNotInEvents.join(', ')}`);
        }
      }

      console.log(
        `   ⚠ ${r.component.padEnd(20)} - Missing: ${missing.join(' | ')}`
      );
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(
    `Summary: ${complete.length}/${results.length} complete (${Math.round((complete.length / results.length) * 100)}%)`
  );
  console.log('═══════════════════════════════════════════════════════════\n');

  if (incomplete.length > 0) {
    console.log(
      '💡 To fix incomplete templates, add missing events/methods from component-metadata.ts'
    );
    process.exit(1);
  } else {
    console.log('✅ All React templates are complete!');
  }
}

main().catch(console.error);
