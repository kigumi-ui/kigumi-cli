/**
 * Config Schema Validation Tests
 *
 * Tests for src/schemas/config.ts schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  mergeWithDefaults,
  DEFAULT_CONFIG,
  kigumiConfigSchema,
} from '../../src/schemas/config.js';
import { ConfigInvalidError } from '../../src/errors/config.js';

const validConfig = {
  framework: 'react',
  typescript: true,
  componentsDir: 'src/components/ui',
  theme: {
    selected: 'awesome',
    palette: 'default',
    brandColor: 'blue',
  },
};

describe('validateConfig', () => {
  it('validates a minimal valid config', () => {
    const result = validateConfig(validConfig);
    expect(result.framework).toBe('react');
    expect(result.typescript).toBe(true);
  });

  it('validates config with all optional fields', () => {
    const result = validateConfig({
      ...validConfig,
      utilsDir: 'src/lib',
      stylesDir: 'src/styles',
      webAwesome: { version: '3.2.1' },
      registries: [{ url: 'https://github.com/user/repo', name: 'my-reg' }],
      installedComponents: {
        button: { source: 'builtin' },
      },
      installedThemes: {
        studio: {
          source: 'community',
          registryUrl: 'https://github.com/user/repo',
        },
      },
    });
    expect(result.registries).toHaveLength(1);
    expect(result.installedComponents?.button.source).toBe('builtin');
    expect(result.installedThemes?.studio.source).toBe('community');
  });

  it('validates vue framework', () => {
    const result = validateConfig({ ...validConfig, framework: 'vue' });
    expect(result.framework).toBe('vue');
  });

  it('rejects svelte framework', () => {
    let thrown: unknown;
    try {
      validateConfig({ ...validConfig, framework: 'svelte' });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(ConfigInvalidError);
    const errors = (thrown as ConfigInvalidError).context.details
      ?.errors as string[];
    expect(errors).toEqual(
      expect.arrayContaining([expect.stringContaining('framework')])
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Must be one of: react, vue, angular'),
      ])
    );
  });

  it('validates angular framework', () => {
    const result = validateConfig({ ...validConfig, framework: 'angular' });
    expect(result.framework).toBe('angular');
  });

  it('throws on invalid framework', () => {
    expect(() =>
      validateConfig({ ...validConfig, framework: 'ember' })
    ).toThrow('Configuration file is invalid');
  });

  it('throws on missing framework', () => {
    const { framework: _, ...noFramework } = validConfig;
    expect(() => validateConfig(noFramework)).toThrow();
  });

  it('throws on non-boolean typescript', () => {
    expect(() => validateConfig({ ...validConfig, typescript: 'yes' })).toThrow(
      'Configuration file is invalid'
    );
  });

  it('throws on empty componentsDir', () => {
    expect(() => validateConfig({ ...validConfig, componentsDir: '' })).toThrow(
      'Configuration file is invalid'
    );
  });

  it('throws on missing theme', () => {
    const { theme: _, ...noTheme } = validConfig;
    expect(() => validateConfig(noTheme)).toThrow();
  });

  it('throws on empty theme.selected', () => {
    expect(() =>
      validateConfig({
        ...validConfig,
        theme: { ...validConfig.theme, selected: '' },
      })
    ).toThrow();
  });

  it('throws on invalid registry URL', () => {
    expect(() =>
      validateConfig({
        ...validConfig,
        registries: [{ url: 'not-a-url' }],
      })
    ).toThrow();
  });

  it('throws on null input', () => {
    expect(() => validateConfig(null)).toThrow();
  });

  it('throws on string input', () => {
    expect(() => validateConfig('not an object')).toThrow();
  });
});

describe('mergeWithDefaults', () => {
  it('returns default config when given empty object', () => {
    const result = mergeWithDefaults({});
    expect(result.framework).toBe(DEFAULT_CONFIG.framework);
    expect(result.theme.selected).toBe(DEFAULT_CONFIG.theme.selected);
  });

  it('overrides framework', () => {
    const result = mergeWithDefaults({ framework: 'vue' });
    expect(result.framework).toBe('vue');
    expect(result.componentsDir).toBe(DEFAULT_CONFIG.componentsDir);
  });

  it('deep merges theme', () => {
    const result = mergeWithDefaults({
      theme: { selected: 'brutalist', palette: 'default', brandColor: 'red' },
    });
    expect(result.theme.selected).toBe('brutalist');
  });

  it('deep merges webAwesome', () => {
    const result = mergeWithDefaults({ webAwesome: { version: '4.0.0' } });
    expect(result.webAwesome?.version).toBe('4.0.0');
  });
});

describe('kigumiConfigSchema edge cases', () => {
  it('accepts config with empty registries array', () => {
    const result = kigumiConfigSchema.parse({ ...validConfig, registries: [] });
    expect(result.registries).toEqual([]);
  });
});
