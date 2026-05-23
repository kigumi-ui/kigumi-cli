/**
 * Protects: Cluster A (PR #152) — kigumiConfigSchema `.strict()` decision.
 * Fix: 0d6671ba ("feat(config): rewrite load/validate/save lifecycle (cluster A)")
 * Bug: Pre-strict, the kigumi config schema silently stripped unknown
 *      top-level keys (`framwork: 'react'` typo, `theme.secondaryColor`,
 *      legacy `aliases` map). Users believed their config was applied; the
 *      defaults silently won. The single most user-confusing config error
 *      class on file before Cluster A.
 * Fix: kigumiConfigSchema, themeConfigSchema, and webAwesomeConfigSchema
 *      all declare `.strict()` so unknown keys raise ConfigInvalidError
 *      with the exact key + location.
 *
 * Companion to `pr-130-community-registry-hardening.test.ts` (which covers
 * the registry-side path/version refinements). The community registry
 * schema is intentionally _not_ strict (it accepts forward-compat fields
 * an external registry author may want to add).
 */

import { describe, it, expect } from 'vitest';
import { kigumiConfigSchema } from '../../../src/schemas/config.js';

const validKigumiConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components',
  utilsDir: 'src/lib',
  stylesDir: 'src/styles',
  theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
};

describe('Cluster A: kigumiConfigSchema strict mode', () => {
  it('rejects unknown top-level key (`framwork` typo)', () => {
    const result = kigumiConfigSchema.safeParse({
      ...validKigumiConfig,
      framwork: 'react',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown nested theme key', () => {
    const result = kigumiConfigSchema.safeParse({
      ...validKigumiConfig,
      theme: { ...validKigumiConfig.theme, secondaryColor: '#ff0' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects the legacy `aliases` field (Cluster B / F-064 removal)', () => {
    const result = kigumiConfigSchema.safeParse({
      ...validKigumiConfig,
      aliases: { '@/components': './src/components' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts the canonical shape', () => {
    expect(kigumiConfigSchema.safeParse(validKigumiConfig).success).toBe(true);
  });
});
