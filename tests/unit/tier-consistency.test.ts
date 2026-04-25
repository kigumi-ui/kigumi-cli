/**
 * Tier Consistency Tests
 *
 * Cross-file validation that the tier system is consistent across:
 * - src/utils/registry.ts (every component has a valid `tier` field)
 * - templates/** (no template hardcodes the Pro package — the runtime tier
 *   swap rewrites the Free package on demand; baking Pro in would silently
 *   break Free-tier users)
 *
 * NOTE: Previously this file also checked drift between `TIER_RESTRICTIONS.components.pro`
 * and the registry, and between `PRO_COMPONENTS` and
 * `TIER_RESTRICTIONS`. Those checks were removed as part of the `tier-filter-registry-sync`
 * spec (2026-04-09): the hardcoded `TIER_RESTRICTIONS.components` list was deleted
 * in favor of reading `component.tier` directly from the registry. Drift between
 * the filter and the registry is now impossible by construction.
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

const TEMPLATE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue']);

/**
 * Recursively collect all framework source files in a directory.
 * Excludes CSS (no imports) and any leftover docs.
 */
function collectTemplateFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTemplateFiles(fullPath));
    } else if (entry.isFile()) {
      const dot = entry.name.lastIndexOf('.');
      if (dot >= 0 && TEMPLATE_EXTENSIONS.has(entry.name.slice(dot))) {
        files.push(fullPath);
      }
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
    it('no template hardcodes the Pro package import', () => {
      // Templates ship with the Free package as the canonical baseline.
      // The runtime tier swap (`materializeTemplate`) rewrites Free → Pro
      // for Pro-tier projects. A literal Pro import in any template would
      // silently break Free-tier users (they'd try to import a package
      // they don't have installed).
      const reactTemplates = collectTemplateFiles(join(TEMPLATES_DIR, 'react'));
      const vueTemplates = collectTemplateFiles(join(TEMPLATES_DIR, 'vue'));
      const angularTemplates = collectTemplateFiles(
        join(TEMPLATES_DIR, 'angular')
      );
      const allTemplates = [
        ...reactTemplates,
        ...vueTemplates,
        ...angularTemplates,
      ];

      const violations: string[] = [];

      for (const filePath of allTemplates) {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(WEB_AWESOME_PRO_PACKAGE)) {
            const relativePath = filePath.replace(ROOT_DIR + '/', '');
            violations.push(`${relativePath}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      }

      expect(
        violations,
        `Templates must not hardcode "${WEB_AWESOME_PRO_PACKAGE}" — the runtime tier swap handles Pro:\n${violations.join('\n')}`
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
