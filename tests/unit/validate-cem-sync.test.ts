/**
 * CEM Sync Validation Tests
 *
 * Tests for scripts/validate-cem-sync.ts — verifies that every component in
 * CEM has a registry entry and vice versa.
 *
 * NOTE: These run against the current project state. If the registry or CEM
 * changes, assertions may need updating.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCemSync,
  parseStringEnum,
  allowlistedKeysInRegistry,
  checkAttributeDrift,
  isAllowlistedAttribute,
  GLOBAL_ATTRIBUTE_ALLOWLIST,
  type AttributeAllowlistEntry,
  type AttributePolicy,
} from '../../scripts/validate-cem-sync.js';
import type { ComponentDefinition } from '../../src/utils/registry/types.js';

describe('validate:cem-sync', () => {
  it('should return a valid result structure', async () => {
    const result = await validateCemSync();

    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('stats');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('should report non-zero CEM and registry component counts', async () => {
    const result = await validateCemSync();

    expect(result.stats.metadataComponents).toBeGreaterThan(0);
    expect(result.stats.registryComponents).toBeGreaterThan(0);
  });

  it('should have synced components when both sources are populated', async () => {
    const result = await validateCemSync();

    expect(result.stats.synced).toBeGreaterThan(0);
  });

  it('should categorize all findings with valid severity and category', async () => {
    const result = await validateCemSync();

    for (const finding of result.findings) {
      expect(['error', 'warning']).toContain(finding.severity);
      expect(finding.component).toBeTruthy();
      expect(finding.message).toBeTruthy();
      expect([
        'missing-from-registry',
        'missing-from-cem',
        'prop-value-drift',
        'allowlisted-but-wrapped',
        'attribute-missing-from-registry',
        'stale-allowlist-entry',
      ]).toContain(finding.category);
    }
  });

  it('should pass when no error-severity findings exist', async () => {
    const result = await validateCemSync();

    const errors = result.findings.filter((f) => f.severity === 'error');
    expect(result.passed).toBe(errors.length === 0);
  });

  it('onlyInCem stat matches count of missing-from-registry findings', async () => {
    const result = await validateCemSync();

    const missing = result.findings.filter(
      (f) => f.category === 'missing-from-registry'
    ).length;
    expect(result.stats.onlyInCem).toBe(missing);
  });

  it('onlyInRegistry stat matches count of missing-from-cem findings', async () => {
    const result = await validateCemSync();

    const missing = result.findings.filter(
      (f) => f.category === 'missing-from-cem'
    ).length;
    expect(result.stats.onlyInRegistry).toBe(missing);
  });

  it('propValueDrift stat matches count of prop-value-drift findings', async () => {
    const result = await validateCemSync();

    const drift = result.findings.filter(
      (f) => f.category === 'prop-value-drift'
    ).length;
    expect(result.stats.propValueDrift).toBe(drift);
  });

  it('reports whether the prop-value half actually ran', async (ctx) => {
    // Every assertion above holds just as well when no manifest was read --
    // which is how the silent no-op survived. This one asserts the premise the
    // others depend on, so a run that compared nothing cannot look like a run
    // that compared everything.
    const result = await validateCemSync();

    if (!result.cem.usable) {
      // No complete manifest here (fresh clone, no Pro install). That is a
      // legitimate environment, but it must surface as a skip, never as a
      // silent pass.
      ctx.skip();
      return;
    }

    expect(result.cem.outcome).toBe('complete');
    expect(result.cem.reason).toMatch(/\d+ components/);
  });
});

describe('parseStringEnum (prop-value drift discriminator)', () => {
  it('parses a pure string-literal union into its members', () => {
    expect(parseStringEnum("'small' | 'medium' | 'large'")).toEqual([
      'small',
      'medium',
      'large',
    ]);
  });

  it('recognises the widened WA 3.6.0 size union', () => {
    expect(
      parseStringEnum(
        "'xs' | 's' | 'm' | 'l' | 'xl' | 'small' | 'medium' | 'large'"
      )
    ).toEqual(['xs', 's', 'm', 'l', 'xl', 'small', 'medium', 'large']);
  });

  it('returns null for open-ended (non-enum) types', () => {
    expect(parseStringEnum('string')).toBeNull();
    expect(parseStringEnum('number')).toBeNull();
    expect(parseStringEnum(undefined)).toBeNull();
  });

  it('returns null for mixed unions that are not all string literals', () => {
    // A union mixing a literal with an open type is not a closed enum.
    expect(parseStringEnum("'small' | string")).toBeNull();
    expect(parseStringEnum("boolean | 'auto'")).toBeNull();
  });

  it('handles double-quoted literals', () => {
    expect(parseStringEnum('"a" | "b"')).toEqual(['a', 'b']);
  });
});

describe('allowlistedKeysInRegistry', () => {
  it('returns allowlist keys that also appear in the registry', () => {
    expect(
      allowlistedKeysInRegistry(
        ['video', 'button', 'data-grid'],
        new Set(['video', 'date-picker'])
      )
    ).toEqual(['video']);
  });

  it('returns empty when the allowlist and registry are disjoint', () => {
    expect(
      allowlistedKeysInRegistry(
        ['button', 'input'],
        new Set(['data-grid', 'date-picker'])
      )
    ).toEqual([]);
  });
});

/**
 * The one rule for "this CEM attribute needs no registry prop", shared by
 * checkAttributeDrift and the Angular function harness (issue #77), where it
 * decides which CEM attributes a Template may leave without an @Input().
 */
describe('isAllowlistedAttribute', () => {
  const policy: AttributePolicy = {
    global: new Set(['dir']),
    perComponent: { widget: { href: { kind: 'backfill', reason: 'fixture' } } },
  };

  it.each([
    ['dir', true],
    ['with-footer', true],
    ['href', true],
    ['target', false],
  ])('widget.%s -> %s', (attribute, expected) => {
    expect(isAllowlistedAttribute('widget', attribute, policy)).toBe(expected);
  });

  it("does not apply one component's entry to another", () => {
    expect(isAllowlistedAttribute('gadget', 'href', policy)).toBe(false);
  });
});

describe('checkAttributeDrift', () => {
  function makeDef(props: ComponentDefinition['props']): ComponentDefinition {
    return {
      name: 'Widget',
      tagName: 'wa-widget',
      category: 'Test',
      description: 'Fixture component',
      dependencies: [],
      files: {},
      props,
      importPath: '@awesome.me/webawesome/dist/components/widget/widget.js',
      tier: 'free',
    };
  }

  function policy(
    perComponent: AttributePolicy['perComponent'] = {}
  ): AttributePolicy {
    return { global: GLOBAL_ATTRIBUTE_ALLOWLIST, perComponent };
  }

  const backfill: AttributeAllowlistEntry = {
    kind: 'backfill',
    reason: 'fixture',
  };

  it('warns on a CEM attribute with no matching registry prop', () => {
    const findings = checkAttributeDrift(
      new Map([['widget', makeDef([])]]),
      new Map([['wa-widget', { href: 'string' }]]),
      policy()
    );

    expect(findings).toEqual([
      {
        component: 'widget',
        category: 'attribute-missing-from-registry',
        severity: 'warning',
        message: expect.stringContaining('"href"'),
      },
    ]);
  });

  it('does not warn on the shipped globally allowlisted attributes', () => {
    const findings = checkAttributeDrift(
      new Map([['widget', makeDef([])]]),
      new Map([
        ['wa-widget', { dir: 'string', lang: 'string', 'did-ssr': undefined }],
      ]),
      policy()
    );

    expect(findings).toEqual([]);
  });

  it('does not warn on a with-* SSR slot hint', () => {
    const findings = checkAttributeDrift(
      new Map([['widget', makeDef([])]]),
      new Map([['wa-widget', { 'with-label': 'boolean' }]]),
      policy()
    );

    expect(findings).toEqual([]);
  });

  it('does not warn on a per-component allowlisted attribute', () => {
    const findings = checkAttributeDrift(
      new Map([['tab', makeDef([])]]),
      new Map([['wa-tab', { role: 'string' }]]),
      policy({
        tab: { role: { kind: 'intentional', reason: 'managed internally' } },
      })
    );

    expect(findings).toEqual([]);
  });

  it('matches a CEM attribute present under the kebab-cased prop name', () => {
    const findings = checkAttributeDrift(
      new Map([['widget', makeDef([{ name: 'autoFocus', type: 'boolean' }])]]),
      new Map([['wa-widget', { 'auto-focus': 'boolean' }]]),
      policy()
    );

    expect(findings).toEqual([]);
  });

  it('matches a camelCase CEM attribute to the prop of the same name', () => {
    // Lit properties without an explicit `attribute:` option appear in the CEM
    // under their camelCase property name, e.g. wa-dropdown-item's submenuOpen.
    const findings = checkAttributeDrift(
      new Map([
        ['dropdown-item', makeDef([{ name: 'submenuOpen', type: 'boolean' }])],
      ]),
      new Map([['wa-dropdown-item', { submenuOpen: 'boolean' }]]),
      policy()
    );

    expect(findings).toEqual([]);
  });

  it('allowlists a camelCase CEM attribute under its kebab-cased key', () => {
    const findings = checkAttributeDrift(
      new Map([['dropdown-item', makeDef([])]]),
      new Map([['wa-dropdown-item', { submenuOpen: 'boolean' }]]),
      policy({ 'dropdown-item': { 'submenu-open': backfill } })
    );

    expect(findings).toEqual([]);
  });

  it('quotes a missing camelCase attribute as the CEM spells it', () => {
    const findings = checkAttributeDrift(
      new Map([['dropdown-item', makeDef([])]]),
      new Map([['wa-dropdown-item', { submenuOpen: 'boolean' }]]),
      policy()
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].message).toContain('"submenuOpen"');
  });

  it('does not treat an inherited object key as an allowlist entry', () => {
    const findings = checkAttributeDrift(
      new Map([['widget', makeDef([])]]),
      new Map([['wa-widget', { constructor: 'string' }]]),
      policy()
    );

    expect(findings.map((f) => f.category)).toEqual([
      'attribute-missing-from-registry',
    ]);
  });

  describe('stale allowlist entries', () => {
    function staleFindings(
      registry: Array<[string, ComponentDefinition]>,
      cem: Array<[string, Record<string, string | undefined>]>,
      perComponent: AttributePolicy['perComponent']
    ) {
      return checkAttributeDrift(
        new Map(registry),
        new Map(cem),
        policy(perComponent)
      );
    }

    const staleError = (component: string, text: string) => ({
      component,
      category: 'stale-allowlist-entry',
      severity: 'error',
      message: expect.stringContaining(text),
    });

    it('errors when the registry now surfaces the attribute', () => {
      const findings = staleFindings(
        [['dropdown-item', makeDef([{ name: 'href', type: 'string' }])]],
        [['wa-dropdown-item', { href: 'string' }]],
        { 'dropdown-item': { href: backfill } }
      );

      expect(findings).toEqual([
        staleError('dropdown-item', 'registry now has a matching prop'),
      ]);
    });

    it('errors when a camelCase CEM attribute is surfaced but still allowlisted', () => {
      // The #101/#102 backfill path: add the prop, forget the allowlist entry.
      const findings = staleFindings(
        [
          [
            'dropdown-item',
            makeDef([{ name: 'submenuOpen', type: 'boolean' }]),
          ],
        ],
        [['wa-dropdown-item', { submenuOpen: 'boolean' }]],
        { 'dropdown-item': { 'submenu-open': backfill } }
      );

      expect(findings).toEqual([
        staleError('dropdown-item', 'registry now has a matching prop'),
      ]);
    });

    it('errors when the CEM no longer declares the attribute', () => {
      const findings = staleFindings(
        [['widget', makeDef([])]],
        [['wa-widget', {}]],
        { widget: { removed: backfill } }
      );

      expect(findings).toEqual([
        staleError('widget', 'declares no such attribute'),
      ]);
    });

    it('errors on a key that is not kebab-cased, instead of warning forever', () => {
      const findings = staleFindings(
        [['dropdown-item', makeDef([])]],
        [['wa-dropdown-item', { submenuOpen: 'boolean' }]],
        { 'dropdown-item': { submenuOpen: backfill } }
      );

      expect(findings).toEqual([
        {
          component: 'dropdown-item',
          category: 'attribute-missing-from-registry',
          severity: 'warning',
          message: expect.stringContaining('"submenuOpen"'),
        },
        staleError('dropdown-item', 'declares no such attribute'),
      ]);
    });

    it('errors when the component is missing from the CEM', () => {
      const findings = staleFindings([['widget', makeDef([])]], [], {
        widget: { href: backfill },
      });

      expect(findings).toEqual([
        staleError('widget', 'declares no such attribute'),
      ]);
    });

    it('errors when the component is not in the registry', () => {
      const findings = staleFindings([], [['wa-gone', { href: 'string' }]], {
        gone: { href: backfill },
      });

      expect(findings).toEqual([
        staleError('gone', 'not a registry component'),
      ]);
    });
  });
});
