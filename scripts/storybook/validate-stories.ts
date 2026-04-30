/* eslint-disable no-console */
/**
 * Story Validation Script
 *
 * Validates that all Storybook stories are consistent with
 * the component registry and component metadata.
 *
 * Usage: npx tsx scripts/storybook/validate-stories.ts
 */

import fs from 'fs';
import path from 'path';
import { buildAllStoryData } from './story-data.js';

const STORIES_DIR = path.resolve(import.meta.dirname, '../../docs/src/stories');

interface ValidationError {
  component: string;
  file: string;
  type: 'missing-story' | 'missing-argtypes' | 'wa-event-ref' | 'wrong-default';
  message: string;
}

function validateStories(): ValidationError[] {
  const errors: ValidationError[] = [];
  const allStoryData = buildAllStoryData();

  for (const [key, storyData] of allStoryData) {
    const storyFile = path.join(
      STORIES_DIR,
      `${storyData.componentName}.stories.tsx`
    );

    // 1. Check story file exists
    if (!fs.existsSync(storyFile)) {
      errors.push({
        component: key,
        file: storyFile,
        type: 'missing-story',
        message: `Missing story file for component "${storyData.componentName}"`,
      });
      continue;
    }

    const content = fs.readFileSync(storyFile, 'utf-8');

    // 2. Check for wa-* event references in JSDoc comments
    // Extract JSDoc block above const meta
    const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\/\s*\nconst meta/);
    if (jsdocMatch) {
      const jsdoc = jsdocMatch[0];
      // Match wa-* event names like `wa-tab-show`, `wa-hide`, etc.
      // Exclude CSS variable references (var(--wa-*)) and CSS class names (wa-stack, wa-heading-*)
      const waEventRefs = jsdoc.match(/`wa-[a-z]+-[a-z]+(?:-[a-z]+)*`/g);
      if (waEventRefs) {
        for (const ref of waEventRefs) {
          errors.push({
            component: key,
            file: storyFile,
            type: 'wa-event-ref',
            message: `JSDoc references Web Awesome event ${ref} instead of React prop name`,
          });
        }
      }
    }

    // 3. Check that registry props are in argTypes
    for (const [argName, argType] of Object.entries(storyData.argTypes)) {
      // Skip hidden args
      if (argType.table?.disable) continue;

      // Check if argType key appears in the file's argTypes section
      const escapedName = argName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const argTypePattern = new RegExp(`['"]?${escapedName}['"]?\\s*:\\s*\\{`);

      // For events, also check the action pattern: onShow: { action: 'show' }
      const actionPattern = new RegExp(
        `['"]?${escapedName}['"]?\\s*:\\s*\\{\\s*action:`
      );

      if (!argTypePattern.test(content) && !actionPattern.test(content)) {
        errors.push({
          component: key,
          file: storyFile,
          type: 'missing-argtypes',
          message: `Missing argType "${argName}" (expected from ${argType.table?.category || 'registry'})`,
        });
      }
    }
  }

  return errors;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const errors = validateStories();

if (errors.length === 0) {
  console.log('✓ All stories are valid and in sync with registry/metadata.');
  process.exit(0);
}

// Group errors by type
const byType = new Map<string, ValidationError[]>();
for (const error of errors) {
  const list = byType.get(error.type) || [];
  list.push(error);
  byType.set(error.type, list);
}

console.log(`\n✗ Found ${errors.length} validation error(s):\n`);

for (const [type, typeErrors] of byType) {
  console.log(`── ${type} (${typeErrors.length}) ──`);
  for (const err of typeErrors) {
    console.log(`  ${err.component}: ${err.message}`);
  }
  console.log();
}

process.exit(1);
