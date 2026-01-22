import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

describe('Test Setup Detection', () => {
  const testDir = '/tmp/kigumi-test-detection';

  // Helper function that mimics ComponentInstaller.checkTestSetup()
  async function checkTestSetup(testCwd: string): Promise<boolean> {
    try {
      const packageJsonPath = path.join(testCwd, 'package.json');
      if (!(await fs.pathExists(packageJsonPath))) {
        return false;
      }

      const packageJson = await fs.readJSON(packageJsonPath);

      // Check for Vitest or Jest
      const hasVitest = !!(
        packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest
      );

      const hasJest = !!(
        packageJson.devDependencies?.jest || packageJson.dependencies?.jest
      );

      // Check for testing-library
      const hasTestingLibrary = !!(
        packageJson.devDependencies?.['@testing-library/react'] ||
        packageJson.dependencies?.['@testing-library/react']
      );

      return (hasVitest || hasJest) && hasTestingLibrary;
    } catch {
      return false;
    }
  }

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('Vitest Detection', () => {
    it('should detect Vitest + testing-library in devDependencies', async () => {
      const packageJson = {
        devDependencies: {
          vitest: '^1.0.0',
          '@testing-library/react': '^14.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(true);
    });

    it('should detect Vitest in dependencies (unusual but valid)', async () => {
      const packageJson = {
        dependencies: {
          vitest: '^1.0.0',
          '@testing-library/react': '^14.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(true);
    });

    it('should return false if only Vitest (no testing-library)', async () => {
      const packageJson = {
        devDependencies: {
          vitest: '^1.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(false);
    });
  });

  describe('Jest Detection', () => {
    it('should detect Jest + testing-library', async () => {
      const packageJson = {
        devDependencies: {
          jest: '^29.0.0',
          '@testing-library/react': '^14.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(true);
    });

    it('should return false if only Jest (no testing-library)', async () => {
      const packageJson = {
        devDependencies: {
          jest: '^29.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(false);
    });
  });

  describe('Testing Library Detection', () => {
    it('should return false if only testing-library (no test runner)', async () => {
      const packageJson = {
        devDependencies: {
          '@testing-library/react': '^14.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(false);
    });

    it('should detect testing-library in dependencies', async () => {
      const packageJson = {
        devDependencies: {
          vitest: '^1.0.0',
        },
        dependencies: {
          '@testing-library/react': '^14.0.0',
        },
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing package.json gracefully', async () => {
      const result = await checkTestSetup(testDir);
      expect(result).toBe(false); // No crash
    });

    it('should handle empty package.json', async () => {
      await fs.writeJSON(path.join(testDir, 'package.json'), {});

      const result = await checkTestSetup(testDir);
      expect(result).toBe(false);
    });

    it('should handle malformed package.json gracefully', async () => {
      await fs.writeFile(path.join(testDir, 'package.json'), '{ invalid json');

      const result = await checkTestSetup(testDir);
      expect(result).toBe(false); // Should not crash
    });

    it('should handle package.json without dependencies', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      };

      await fs.writeJSON(path.join(testDir, 'package.json'), packageJson);

      const result = await checkTestSetup(testDir);
      expect(result).toBe(false);
    });
  });
});
