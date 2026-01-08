/**
 * Configuration Schema Tests
 */

import { describe, it, expect } from 'vitest';
import {
  kigumiConfigSchema,
  frameworkSchema,
  tierSchema,
  themeConfigSchema,
  webAwesomeConfigSchema,
  validateConfig,
  validatePartialConfig,
  mergeWithDefaults,
  DEFAULT_CONFIG,
} from '../../../src/schemas/config.js';

describe('frameworkSchema', () => {
  it('should accept valid frameworks', () => {
    expect(frameworkSchema.parse('react')).toBe('react');
    expect(frameworkSchema.parse('vue')).toBe('vue');
    expect(frameworkSchema.parse('svelte')).toBe('svelte');
    expect(frameworkSchema.parse('angular')).toBe('angular');
  });

  it('should reject invalid frameworks', () => {
    expect(() => frameworkSchema.parse('ember')).toThrow();
    expect(() => frameworkSchema.parse('nextjs')).toThrow();
    expect(() => frameworkSchema.parse('')).toThrow();
  });
});

describe('tierSchema', () => {
  it('should accept valid tiers', () => {
    expect(tierSchema.parse('free')).toBe('free');
    expect(tierSchema.parse('pro')).toBe('pro');
  });

  it('should reject invalid tiers', () => {
    expect(() => tierSchema.parse('premium')).toThrow();
    expect(() => tierSchema.parse('enterprise')).toThrow();
    expect(() => tierSchema.parse('')).toThrow();
  });
});

describe('themeConfigSchema', () => {
  it('should accept valid theme config', () => {
    const config = {
      selected: 'awesome',
      palette: 'default',
      brandColor: 'blue',
    };

    const result = themeConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should reject empty strings', () => {
    expect(() =>
      themeConfigSchema.parse({
        selected: '',
        palette: 'default',
        brandColor: 'blue',
      })
    ).toThrow(/Theme name cannot be empty/);
  });

  it('should reject missing fields', () => {
    expect(() =>
      themeConfigSchema.parse({
        selected: 'awesome',
        // Missing palette and brandColor
      })
    ).toThrow();
  });
});

describe('webAwesomeConfigSchema', () => {
  it('should accept valid config', () => {
    const config = {
      tier: 'free' as const,
      version: '^3.1.0',
    };

    const result = webAwesomeConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should accept optional fields', () => {
    const config = {
      tier: 'pro' as const,
      version: '^3.1.0',
      tokenEnvVar: 'WA_TOKEN',
      cdnUrl: 'https://cdn.example.com',
    };

    const result = webAwesomeConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should reject invalid URL', () => {
    expect(() =>
      webAwesomeConfigSchema.parse({
        tier: 'pro',
        cdnUrl: 'not-a-url',
      })
    ).toThrow(/Must be a valid URL/);
  });
});

describe('kigumiConfigSchema', () => {
  it('should accept valid complete config', () => {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components/ui',
      utilsDir: 'src/lib',
      theme: {
        selected: 'awesome',
        palette: 'default',
        brandColor: 'blue',
      },
      aliases: {
        '@/components': './src/components',
      },
      webAwesome: {
        tier: 'free',
        version: '^3.1.0',
      },
    };

    const result = kigumiConfigSchema.parse(config);
    expect(result).toEqual(config);
  });

  it('should accept minimal config', () => {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
    };

    const result = kigumiConfigSchema.parse(config);
    expect(result.framework).toBe('react');
    expect(result.typescript).toBe(true);
  });

  it('should reject invalid framework', () => {
    const config = {
      ...DEFAULT_CONFIG,
      framework: 'invalid',
    };

    expect(() => kigumiConfigSchema.parse(config)).toThrow();
  });

  it('should reject non-boolean typescript', () => {
    const config = {
      ...DEFAULT_CONFIG,
      typescript: 'yes',
    };

    expect(() => kigumiConfigSchema.parse(config)).toThrow(/boolean/);
  });

  it('should reject empty componentsDir', () => {
    const config = {
      ...DEFAULT_CONFIG,
      componentsDir: '',
    };

    expect(() => kigumiConfigSchema.parse(config)).toThrow(/cannot be empty/);
  });
});

describe('validateConfig', () => {
  it('should validate valid config', () => {
    const config = {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
    };

    const result = validateConfig(config);
    expect(result.framework).toBe('react');
  });

  it('should throw on invalid config', () => {
    const config = {
      framework: 'invalid',
      typescript: true,
      componentsDir: 'src/components',
    };

    expect(() => validateConfig(config)).toThrow(/validation failed/);
  });

  it('should include validation errors in message', () => {
    const config = {
      framework: 'react',
      typescript: 'not-a-boolean', // Invalid type
      componentsDir: '', // Empty string
      theme: {
        selected: 'default',
        palette: 'default',
        brandColor: 'blue',
      },
    };

    expect(() => validateConfig(config)).toThrow(/validation failed/);
  });
});

describe('validatePartialConfig', () => {
  it('should validate partial config', () => {
    const partial = {
      framework: 'vue',
    };

    const result = validatePartialConfig(partial);
    expect(result.framework).toBe('vue');
  });

  it('should accept empty object', () => {
    const result = validatePartialConfig({});
    expect(result).toEqual({});
  });

  it('should reject invalid partial', () => {
    const partial = {
      framework: 'invalid',
    };

    expect(() => validatePartialConfig(partial)).toThrow();
  });
});

describe('mergeWithDefaults', () => {
  it('should merge with defaults', () => {
    const partial = {
      framework: 'vue' as const,
    };

    const result = mergeWithDefaults(partial);

    expect(result.framework).toBe('vue');
    expect(result.typescript).toBe(DEFAULT_CONFIG.typescript);
    expect(result.componentsDir).toBe(DEFAULT_CONFIG.componentsDir);
  });

  it('should deep merge theme config', () => {
    const partial = {
      framework: 'react' as const,
      typescript: true,
      componentsDir: 'src/components',
      theme: {
        selected: 'custom',
        palette: 'default',
        brandColor: 'blue',
      },
    };

    const result = mergeWithDefaults(partial);

    expect(result.theme.selected).toBe('custom');
    expect(result.theme.palette).toBe('default');
  });

  it('should return full valid config', () => {
    const partial = {};

    const result = mergeWithDefaults(partial);

    // Should be valid according to schema
    expect(() => kigumiConfigSchema.parse(result)).not.toThrow();
  });
});

describe('DEFAULT_CONFIG', () => {
  it('should be valid according to schema', () => {
    expect(() => kigumiConfigSchema.parse(DEFAULT_CONFIG)).not.toThrow();
  });

  it('should have expected structure', () => {
    expect(DEFAULT_CONFIG.framework).toBe('react');
    expect(DEFAULT_CONFIG.typescript).toBe(true);
    expect(DEFAULT_CONFIG.componentsDir).toBe('src/components/ui');
    expect(DEFAULT_CONFIG.theme).toBeDefined();
    expect(DEFAULT_CONFIG.webAwesome).toBeDefined();
  });
});
