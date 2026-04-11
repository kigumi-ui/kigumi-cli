/**
 * Tier Consistency Tests
 *
 * Cross-file validation that the tier system is consistent across:
 * - src/utils/registry.ts (every component has a valid `tier` field)
 * - templates/**\/*.hbs (no hardcoded package imports — must use {{{importPath}}})
 *
 * NOTE: Previously this file also checked drift between `TIER_RESTRICTIONS.components.pro`
 * and the registry, and between `PRO_COMPONENTS` (in `src/schemas/tier.ts`) and
 * `TIER_RESTRICTIONS`. Those checks were removed as part of the `tier-filter-registry-sync`
 * spec (2026-04-09): the hardcoded `TIER_RESTRICTIONS.components` list was deleted
 * in favor of reading `component.tier` directly from the registry. Drift between
 * the filter and the registry is now impossible by construction.
 *
 * `src/schemas/tier.ts` still exists with its own stale `PRO_COMPONENTS` list,
 * but it is unused at runtime. A follow-up spec (`cleanup-dead-tier-schema`)
 * will remove it.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '../..');
const TEMPLATES_DIR = join(ROOT_DIR, 'templates');

/**
 * Recursively collect all .hbs files in a directory
 */
function collectHbsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHbsFiles(fullPath));
    } else if (entry.name.endsWith('.hbs')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('tier consistency', () => {
  describe('registry tier field completeness', () => {
    it('every component in LOCAL_REGISTRY has a valid tier field', () => {
      for (const [key, component] of Object.entries(LOCAL_REGISTRY)) {
        expect(
          component.tier,
          `Component "${key}" is missing a tier field`
        ).toBeDefined();
        expect(
          ['free', 'pro'],
          `Component "${key}" has invalid tier: ${component.tier}`
        ).toContain(component.tier);
      }
    });
  });

  describe('template import paths', () => {
    it('no template contains hardcoded free package import', () => {
      const reactTemplates = collectHbsFiles(join(TEMPLATES_DIR, 'react'));
      const vueTemplates = collectHbsFiles(join(TEMPLATES_DIR, 'vue'));
      const allTemplates = [...reactTemplates, ...vueTemplates];

      const violations: string[] = [];

      for (const filePath of allTemplates) {
        const content = readFileSync(filePath, 'utf-8');
        // Match literal @awesome.me/webawesome (not followed by -pro)
        // but exclude Handlebars expressions like {{{importPath}}}
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip lines that are Handlebars import expressions
          if (line.includes('{{{importPath}}}')) continue;

          if (
            line.includes(WEB_AWESOME_FREE_PACKAGE) &&
            !line.includes(WEB_AWESOME_PRO_PACKAGE)
          ) {
            const relativePath = filePath.replace(ROOT_DIR + '/', '');
            violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(
        violations,
        `Templates contain hardcoded "${WEB_AWESOME_FREE_PACKAGE}" instead of {{{importPath}}}:\n${violations.join('\n')}`
      ).toEqual([]);
    });

    it('no template contains hardcoded pro package import', () => {
      const reactTemplates = collectHbsFiles(join(TEMPLATES_DIR, 'react'));
      const vueTemplates = collectHbsFiles(join(TEMPLATES_DIR, 'vue'));
      const allTemplates = [...reactTemplates, ...vueTemplates];

      const violations: string[] = [];

      for (const filePath of allTemplates) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('{{{importPath}}}')) continue;

          if (line.includes(WEB_AWESOME_PRO_PACKAGE)) {
            const relativePath = filePath.replace(ROOT_DIR + '/', '');
            violations.push(`${relativePath}:${i + 1}: ${line.trim()}`);
          }
        }
      }

      expect(
        violations,
        `Templates contain hardcoded "${WEB_AWESOME_PRO_PACKAGE}" instead of {{{importPath}}}:\n${violations.join('\n')}`
      ).toEqual([]);
    });
  });

  describe('registry importPath format', () => {
    it('all importPath values use the free package base (tier-agnostic)', () => {
      const violations: string[] = [];

      for (const [key, component] of Object.entries(LOCAL_REGISTRY)) {
        if (component.importPath.includes(WEB_AWESOME_PRO_PACKAGE)) {
          violations.push(
            `"${key}": importPath uses pro package directly: ${component.importPath}`
          );
        }
      }

      expect(
        violations,
        `Registry entries should use "${WEB_AWESOME_FREE_PACKAGE}" as base importPath (tier switching is handled at generation time):\n${violations.join('\n')}`
      ).toEqual([]);
    });

    it('all importPath values follow the expected pattern', () => {
      const importPathPattern =
        /^@awesome\.me\/webawesome\/dist\/components\/[\w-]+\/[\w-]+\.js$/;

      const violations: string[] = [];

      for (const [key, component] of Object.entries(LOCAL_REGISTRY)) {
        if (!importPathPattern.test(component.importPath)) {
          violations.push(
            `"${key}": importPath does not match expected pattern: ${component.importPath}`
          );
        }
      }

      expect(
        violations,
        `Registry entries have unexpected importPath format:\n${violations.join('\n')}`
      ).toEqual([]);
    });
  });
});
