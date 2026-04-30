import type { KigumiConfig } from '../../../src/schemas/config.js';

export function createTestKigumiConfig(
  overrides: Partial<KigumiConfig> = {}
): KigumiConfig {
  return {
    framework: 'react',
    typescript: true,
    componentsDir: '@/components/ui',
    theme: { selected: 'default', palette: 'default', brandColor: '#000' },
    ...overrides,
  };
}
