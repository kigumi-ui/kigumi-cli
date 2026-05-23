/**
 * Protects: PR #134 / F-064 (Cluster B)
 * Bug: kigumi.config.json grew an `aliases` map that drove `resolveImportBase`
 *      logic but never had any documented user opt-in. Configs that omitted
 *      aliases inherited a hardcoded fallback; configs that set custom
 *      aliases silently changed import behaviour for diff/update without any
 *      mention in upgrade notes. The schema accepted both shapes silently.
 * Fix: 5450e2775 (#134) — drop the `aliases` field from the schema and
 *      rewrite resolveImportBase to compute `toKigumiAlias(componentsDir)`
 *      directly from the directory the user already configured. Cluster A's
 *      `.strict()` follow-up makes the rejection visible (rather than
 *      silently stripping `aliases`).
 *
 * Two invariants this regression guards:
 *   1. The strict schema rejects `aliases` so re-introducing the field by
 *      accident is loud, not silent.
 *   2. `toKigumiAlias` deterministically maps `componentsDir` to its `@/`
 *      alias for both `src/` and root layouts; this is the substitute
 *      `resolveImportBase` consumed.
 */

import { describe, it, expect } from 'vitest';
import { kigumiConfigSchema } from '../../../src/schemas/config.js';
import { toKigumiAlias } from '../../../src/utils/project-config.js';

const baseConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
};

describe('PR #134 / F-064: aliases removal — strict schema rejects the field', () => {
  it('rejects an aliases map at the top level', () => {
    const result = kigumiConfigSchema.safeParse({
      ...baseConfig,
      aliases: { '@/components': './src/components' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts the canonical config shape (no aliases)', () => {
    expect(kigumiConfigSchema.safeParse(baseConfig).success).toBe(true);
  });
});

describe('PR #134 / F-064: toKigumiAlias replaces the alias map for src + root layouts', () => {
  it.each([
    ['src layout components', 'src/components', '@/components'],
    ['src layout utils', 'src/lib', '@/lib'],
    ['root layout components', 'components', '@/components'],
    ['root layout utils', 'lib', '@/lib'],
    ['nested src layout', 'src/assets/css', '@/assets/css'],
  ])('%s: %s → %s', (_label, dir, expected) => {
    expect(toKigumiAlias(dir)).toBe(expected);
  });
});
