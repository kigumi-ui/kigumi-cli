import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import {
  configureVitePathAliases,
  configureTSConfig,
} from '../../src/utils/project-config.js';
import { getOutput } from '../../src/output/index.js';

describe('Edge Cases and Boundary Conditions', () => {
  const testDir = '/tmp/kigumi-edge-cases';
  const output = getOutput();

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('Missing Files', () => {
    it('should handle missing vite.config gracefully', async () => {
      const result = await configureVitePathAliases(testDir, output);
      expect(result).toBe(false); // No crash, returns false
    });

    it('should handle missing tsconfig.app.json gracefully', async () => {
      const result = await configureTSConfig(testDir, output);
      expect(result).toBe(false);
    });
  });

  describe('Malformed Files', () => {
    it('should handle malformed vite.config', async () => {
      const malformed = `export default { plugins: [react()] `; // Missing closing brace

      await fs.writeFile(path.join(testDir, 'vite.config.ts'), malformed);

      const result = await configureVitePathAliases(testDir, output);
      expect(result).toBe(false); // Should skip gracefully
    });

    it('should handle vite.config without defineConfig', async () => {
      const noDefineConfig = `export default {
  plugins: [react()],
}`;

      await fs.writeFile(path.join(testDir, 'vite.config.ts'), noDefineConfig);

      const result = await configureVitePathAliases(testDir, output);
      expect(result).toBe(false); // Can't parse, skip gracefully
    });

    it('should throw on malformed JSON in tsconfig', async () => {
      await fs.writeFile(
        path.join(testDir, 'tsconfig.app.json'),
        '{ invalid json syntax'
      );

      // readJSONWithComments will throw on invalid JSON
      await expect(configureTSConfig(testDir, output)).rejects.toThrow();
    });
  });

  describe('Empty Files', () => {
    it('should handle empty vite.config', async () => {
      await fs.writeFile(path.join(testDir, 'vite.config.ts'), '');

      const result = await configureVitePathAliases(testDir, output);
      expect(result).toBe(false);
    });

    it('should handle empty tsconfig.app.json', async () => {
      await fs.writeJSON(path.join(testDir, 'tsconfig.app.json'), {});

      const result = await configureTSConfig(testDir, output);
      expect(result).toBe(true); // Should add paths to empty config

      const updated = await fs.readJSON(
        path.join(testDir, 'tsconfig.app.json')
      );
      expect(updated.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] });
    });
  });

  describe('Large Files', () => {
    it('should handle large vite.config efficiently', async () => {
      // Generate large config with many plugins
      const largeConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
${Array.from({ length: 100 }, (_, i) => `import plugin${i} from 'plugin${i}'`).join('\n')}

export default defineConfig({
  plugins: [
    react(),
    ${Array.from({ length: 100 }, (_, i) => `plugin${i}()`).join(',\n    ')}
  ],
})`;

      await fs.writeFile(path.join(testDir, 'vite.config.ts'), largeConfig);

      const startTime = Date.now();
      const result = await configureVitePathAliases(testDir, output);
      const duration = Date.now() - startTime;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds

      const updated = await fs.readFile(
        path.join(testDir, 'vite.config.ts'),
        'utf-8'
      );
      expect(updated).toContain('resolve:');
    });

    it('should handle large tsconfig efficiently', async () => {
      const largeTsconfig = {
        compilerOptions: {
          target: 'ES2022',
          lib: Array.from({ length: 50 }, (_, i) => `lib${i}`),
          types: Array.from({ length: 50 }, (_, i) => `type${i}`),
        },
      };

      await fs.writeJSON(
        path.join(testDir, 'tsconfig.app.json'),
        largeTsconfig
      );

      const startTime = Date.now();
      const result = await configureTSConfig(testDir, output);
      const duration = Date.now() - startTime;

      expect(result).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete in < 2 seconds
    });
  });
});
