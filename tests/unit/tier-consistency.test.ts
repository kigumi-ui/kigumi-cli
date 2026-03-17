/**
 * Tier Consistency Tests
 *
 * Cross-file validation that the tier system is consistent across:
 * - src/utils/registry.ts (component tier field)
 * - src/utils/tier-restrictions.ts (TIER_RESTRICTIONS.components.pro)
 * - src/schemas/tier.ts (PRO_COMPONENTS constant)
 * - templates/**\/*.hbs (importPath usage)
 *
 * These tests catch drift between the multiple sources of tier truth
 * that the disabled validate:changes tier check was meant to catch.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { TIER_RESTRICTIONS } from '../../src/utils/tier-restrictions.js';
import { PRO_COMPONENTS } from '../../src/schemas/tier.js';
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

  describe('tier-restrictions coverage', () => {
    // TIER_RESTRICTIONS uses user-facing group names (e.g., "charts", "toast")
    // while the registry uses technical keys (e.g., "chart", "bar-chart", "toast-item").
    // Some TIER_RESTRICTIONS entries (e.g., "data-grid", "date-picker", "video")
    // may not yet be in the registry (planned pro components).

    /**
     * Check if a registry component is covered by TIER_RESTRICTIONS,
     * either directly or through a parent/group relationship.
     */
    function isCoveredByRestrictions(
      componentKey: string,
      restrictionsProSet: Set<string>
    ): boolean {
      // Direct match
      if (restrictionsProSet.has(componentKey)) return true;

      // Sub-component: this component is a dependency of a restricted parent
      for (const [key, def] of Object.entries(LOCAL_REGISTRY)) {
        if (
          restrictionsProSet.has(key) &&
          def.dependencies.includes(componentKey)
        ) {
          return true;
        }
      }

      // Sub-component: this component depends on a restricted parent
      const deps = LOCAL_REGISTRY[componentKey]?.dependencies ?? [];
      if (deps.some((dep) => restrictionsProSet.has(dep))) return true;

      // Group match: "chart" covered by "charts", "bar-chart" covered by "charts"
      // Note: this naive pluralization only works for component names (e.g., charts->chart)
      for (const restricted of restrictionsProSet) {
        const base = restricted.replace(/s$/, '');
        if (componentKey === base || componentKey.endsWith(`-${base}`))
          return true;
      }

      return false;
    }

    it('every pro registry component is covered by TIER_RESTRICTIONS', () => {
      const restrictionsProSet = new Set(TIER_RESTRICTIONS.components.pro);
      const registryProComponents = Object.entries(LOCAL_REGISTRY)
        .filter(([, def]) => def.tier === 'pro')
        .map(([key]) => key);

      const uncovered = registryProComponents.filter(
        (c) => !isCoveredByRestrictions(c, restrictionsProSet)
      );

      expect(
        uncovered,
        `Pro registry components not covered by TIER_RESTRICTIONS: ${uncovered.join(', ')}`
      ).toEqual([]);
    });

    it('TIER_RESTRICTIONS pro entries with registry matches are marked pro', () => {
      for (const restricted of TIER_RESTRICTIONS.components.pro) {
        const directMatch = LOCAL_REGISTRY[restricted];
        if (directMatch) {
          expect(
            directMatch.tier,
            `TIER_RESTRICTIONS lists "${restricted}" as pro, but registry has tier="${directMatch.tier}"`
          ).toBe('pro');
        }
        // Entries without a direct registry match (e.g., "data-grid", "video")
        // are planned pro components not yet implemented in the registry
      }
    });
  });

  describe('schemas/tier.ts PRO_COMPONENTS sync', () => {
    // PRO_COMPONENTS in schemas/tier.ts is used for user-facing validation.
    // It should be a subset of TIER_RESTRICTIONS (both are user-facing lists).
    // Some TIER_RESTRICTIONS entries may not be in PRO_COMPONENTS if the schema
    // validates at a different granularity.

    it('every PRO_COMPONENTS entry is also in TIER_RESTRICTIONS', () => {
      const restrictionsProSet = new Set(TIER_RESTRICTIONS.components.pro);

      const missing = [...PRO_COMPONENTS].filter(
        (c) => !restrictionsProSet.has(c)
      );

      expect(
        missing,
        `PRO_COMPONENTS has entries not in TIER_RESTRICTIONS: ${missing.join(', ')}`
      ).toEqual([]);
    });

    it('TIER_RESTRICTIONS pro entries are a superset of PRO_COMPONENTS', () => {
      const schemaProSet = new Set(PRO_COMPONENTS as readonly string[]);

      // Every TIER_RESTRICTIONS entry should either be in PRO_COMPONENTS
      // or be a recently added pro component not yet in the schema
      const missing = TIER_RESTRICTIONS.components.pro.filter(
        (c) => !schemaProSet.has(c)
      );

      expect(
        missing,
        `TIER_RESTRICTIONS has pro entries not in PRO_COMPONENTS (schema may need update): ${missing.join(', ')}`
      ).toEqual([]);
    });

    it('every PRO_COMPONENTS entry with a registry match is marked pro', () => {
      for (const proComponent of PRO_COMPONENTS) {
        const directMatch = LOCAL_REGISTRY[proComponent];
        if (directMatch) {
          expect(
            directMatch.tier,
            `PRO_COMPONENTS entry "${proComponent}" is not marked pro in registry`
          ).toBe('pro');
        }
        // Entries without direct match (e.g., "charts" -> "chart") or
        // not yet in registry (e.g., "data-grid") are acceptable
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
