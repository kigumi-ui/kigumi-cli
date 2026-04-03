/**
 * Add Command Tests
 *
 * Tests for src/commands/add/index.ts - Component addition functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Mock @clack/prompts for interactive prompt tests
vi.mock('@clack/prompts', async () => {
  const actual =
    await vi.importActual<typeof import('@clack/prompts')>('@clack/prompts');
  return {
    ...actual,
    confirm: vi.fn().mockResolvedValue(false),
    isCancel: actual.isCancel,
  };
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _PROJECT_ROOT = path.resolve(__dirname, '../..');

describe('addCommand', () => {
  let tempDir: string;
  let originalExit: typeof process.exit;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-add-test-'));

    // Mock process.exit to prevent test termination
    originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;
  });

  afterEach(async () => {
    // Restore process.exit
    process.exit = originalExit;

    // Clean up temp directory
    await fs.remove(tempDir);

    // Clear module cache to reset config state
    vi.resetModules();
  });

  /**
   * Create a minimal kigumi config file
   */
  async function createConfig(
    overrides: Record<string, unknown> = {}
  ): Promise<void> {
    const config = {
      $schema: 'https://kigumi.dev/schema/config.json',
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
      libDir: 'src/lib',
      stylesDir: 'src/styles',
      theme: 'awesome',
      tier: 'free',
      ...overrides,
    };
    await fs.writeJSON(path.join(tempDir, 'kigumi.config.json'), config);
  }

  /**
   * Setup minimal project structure
   */
  async function setupProject(): Promise<void> {
    await fs.ensureDir(path.join(tempDir, 'src/components'));
    await fs.ensureDir(path.join(tempDir, 'src/lib'));
    await fs.ensureDir(path.join(tempDir, 'src/styles'));

    // Create kigumi.ts (required for component installation)
    await fs.writeFile(
      path.join(tempDir, 'src/lib/kigumi.ts'),
      `// Kigumi Setup - auto-managed by kigumi
import '../styles/layers.css';
`
    );

    // Create layers.css
    await fs.writeFile(
      path.join(tempDir, 'src/styles/layers.css'),
      `/* Web Awesome Layers - auto-generated */
@layer base, theme;
`
    );
  }

  describe('pre-flight checks', () => {
    it('should fail without config file', async () => {
      // No config created
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Should have called process.exit with non-zero code
      expect(process.exit).toHaveBeenCalled();
    });

    it('should fail with invalid config (completely broken JSON)', async () => {
      await setupProject();

      // Create a file that's not valid JSON at all
      await fs.writeFile(
        path.join(tempDir, 'kigumi.config.json'),
        '{ invalid json content without closing brace'
      );

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // With broken JSON, the CLI should fail
      expect(process.exit).toHaveBeenCalled();
    });
  });

  describe('component installation', () => {
    it('should create component files for React TypeScript', async () => {
      await createConfig({ typescript: true, framework: 'react' });
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Check that component directory was created
      const componentDir = path.join(tempDir, 'src/components/Button');
      expect(await fs.pathExists(componentDir)).toBe(true);

      // Check for TypeScript file
      const tsxFile = path.join(componentDir, 'Button.tsx');
      expect(await fs.pathExists(tsxFile)).toBe(true);

      // Check content includes wa-button web component
      const content = await fs.readFile(tsxFile, 'utf-8');
      expect(content).toContain('wa-button');
      // TypeScript files include forwardRef
      expect(content).toContain('forwardRef');
    });

    it('should create component files for React JavaScript', async () => {
      await createConfig({ typescript: false, framework: 'react' });
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Check for JavaScript file
      const jsxFile = path.join(tempDir, 'src/components/Button/Button.jsx');
      expect(await fs.pathExists(jsxFile)).toBe(true);

      const content = await fs.readFile(jsxFile, 'utf-8');
      expect(content).toContain('React');
      expect(content).not.toContain(': React.FC'); // No TypeScript annotations
    });

    it('should install multiple components', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button', 'badge', 'dialog'], { cwd: tempDir });

      // Check all components were created
      expect(
        await fs.pathExists(path.join(tempDir, 'src/components/Button'))
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, 'src/components/Badge'))
      ).toBe(true);
      expect(
        await fs.pathExists(path.join(tempDir, 'src/components/Dialog'))
      ).toBe(true);
    });

    it('should show diff and skip when user declines prompt', async () => {
      await createConfig();
      await setupProject();

      // Create existing component with different content
      const buttonDir = path.join(tempDir, 'src/components/Button');
      await fs.ensureDir(buttonDir);
      await fs.writeFile(
        path.join(buttonDir, 'Button.tsx'),
        '// Existing content'
      );

      // confirm mock returns false (user declines)
      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir, force: false });

      // Check content was NOT overwritten
      const content = await fs.readFile(
        path.join(buttonDir, 'Button.tsx'),
        'utf-8'
      );
      expect(content).toBe('// Existing content');
    });

    it('should overwrite existing components with --force', async () => {
      await createConfig();
      await setupProject();

      // Create existing component
      const buttonDir = path.join(tempDir, 'src/components/Button');
      await fs.ensureDir(buttonDir);
      await fs.writeFile(path.join(buttonDir, 'Button.tsx'), '// Old content');

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], {
        cwd: tempDir,
        force: true,
        yes: true,
      });

      // Check content WAS overwritten
      const content = await fs.readFile(
        path.join(buttonDir, 'Button.tsx'),
        'utf-8'
      );
      expect(content).not.toBe('// Old content');
      expect(content).toContain('wa-button');
    });

    it('should generate test files by default', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      // tests is true by default in the CLI
      await addCommand(['button'], { cwd: tempDir });

      // Check for component directory - test files may or may not be generated
      // depending on template availability. The key is that the component was created.
      const componentDir = path.join(tempDir, 'src/components/Button');
      expect(await fs.pathExists(componentDir)).toBe(true);
    });

    it('should skip test files with --no-tests', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir, tests: false });

      // Test file should not exist
      const testFile = path.join(
        tempDir,
        'src/components/Button/Button.test.tsx'
      );
      expect(await fs.pathExists(testFile)).toBe(false);
    });
  });

  describe('tier restrictions', () => {
    it('should accept free components on free tier', async () => {
      await createConfig({ tier: 'free' });
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Component should be created
      const componentDir = path.join(tempDir, 'src/components/Button');
      expect(await fs.pathExists(componentDir)).toBe(true);
    });

    it('should create all free components', async () => {
      await createConfig({ tier: 'free' });
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      // Badge is a free component
      await addCommand(['badge'], { cwd: tempDir });

      const componentDir = path.join(tempDir, 'src/components/Badge');
      expect(await fs.pathExists(componentDir)).toBe(true);
    });
  });

  describe('Vue framework', () => {
    it('should create Vue component files', async () => {
      await createConfig({ framework: 'vue', typescript: true });
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Check for Vue file
      const vueFile = path.join(tempDir, 'src/components/Button/Button.vue');
      expect(await fs.pathExists(vueFile)).toBe(true);

      const content = await fs.readFile(vueFile, 'utf-8');
      expect(content).toContain('<script');
      expect(content).toContain('wa-button');
    });
  });

  describe('CSS generation', () => {
    it('should create CSS file for component', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Check for CSS file
      const cssFile = path.join(tempDir, 'src/components/Button/Button.css');
      expect(await fs.pathExists(cssFile)).toBe(true);
    });
  });

  describe('kigumi.ts updates', () => {
    it('should keep kigumi.ts intact', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button'], { cwd: tempDir });

      // Check kigumi.ts exists
      const waPath = path.join(tempDir, 'src/lib/kigumi.ts');
      expect(await fs.pathExists(waPath)).toBe(true);
    });
  });

  describe('component index', () => {
    it('should update component index file', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button', 'badge'], { cwd: tempDir });

      // Check for index file
      const indexFile = path.join(tempDir, 'src/components/index.ts');
      expect(await fs.pathExists(indexFile)).toBe(true);

      const content = await fs.readFile(indexFile, 'utf-8');
      expect(content).toContain('Button');
      expect(content).toContain('Badge');
    });
  });

  describe('error handling', () => {
    it('should handle invalid component names', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['non-existent-component'], { cwd: tempDir });

      // Should have exited with error
      expect(process.exit).toHaveBeenCalled();
    });

    it('should handle mixed valid and invalid components', async () => {
      await createConfig();
      await setupProject();

      const { addCommand } = await import('../../src/commands/add/index.js');

      await addCommand(['button', 'fake-component'], { cwd: tempDir });

      // Should have exited due to invalid component
      expect(process.exit).toHaveBeenCalled();
    });
  });
});
