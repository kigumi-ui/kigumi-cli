/**
 * Add Command Integration Tests
 *
 * Tests the add command with various scenarios
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { ComponentInstaller } from '../../src/commands/add/installer.js';
import { validateComponents } from '../../src/commands/add/validator.js';
import type { KigumiConfig } from '../../src/utils/config.js';
import type { OutputInterface } from '../../src/output/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DIR = path.join(__dirname, '../../.test-output/add');

// Mock output interface
const mockOutput: OutputInterface = {
  intro: () => {},
  outro: () => {},
  info: () => {},
  success: () => {},
  warning: () => {},
  error: () => {},
  note: () => {},
  log: () => {},
  spinner: (_message: string) => ({
    start: () => {},
    message: () => {},
    stop: () => {},
    error: () => {},
  }),
};

describe('Add Command Integration', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('Component Installation', () => {
    it('should install a single component successfully', async () => {
      const projectDir = path.join(TEST_DIR, 'single-component');
      await fs.ensureDir(projectDir);

      // Create config
      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      // Create necessary directories
      await fs.ensureDir(path.join(projectDir, 'src/components/ui'));
      await fs.ensureDir(path.join(projectDir, 'src/lib'));

      // Create webawesome.ts
      await fs.writeFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        '// Import Web Awesome components (registers web components)\n'
      );

      // Install button component
      const installer = new ComponentInstaller(projectDir, config, mockOutput);
      const results = await installer.installComponents(['button'], {
        overwrite: false,
        types: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].name).toBe('button');

      // Verify component files created
      const buttonTsxExists = await fs.pathExists(
        path.join(projectDir, 'src/components/ui/Button/Button.tsx')
      );
      const buttonCssExists = await fs.pathExists(
        path.join(projectDir, 'src/components/ui/Button/Button.css')
      );

      expect(buttonTsxExists).toBe(true);
      expect(buttonCssExists).toBe(true);
    });

    it('should install multiple components', async () => {
      const projectDir = path.join(TEST_DIR, 'multiple-components');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await fs.ensureDir(path.join(projectDir, 'src/components/ui'));
      await fs.ensureDir(path.join(projectDir, 'src/lib'));
      await fs.writeFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        '// Import Web Awesome components (registers web components)\n'
      );

      const installer = new ComponentInstaller(projectDir, config, mockOutput);
      const results = await installer.installComponents(
        ['button', 'input', 'card'],
        {
          overwrite: false,
          types: true,
        }
      );

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);

      // Verify all components created
      const buttonExists = await fs.pathExists(
        path.join(projectDir, 'src/components/ui/Button/Button.tsx')
      );
      const inputExists = await fs.pathExists(
        path.join(projectDir, 'src/components/ui/Input/Input.tsx')
      );
      const cardExists = await fs.pathExists(
        path.join(projectDir, 'src/components/ui/Card/Card.tsx')
      );

      expect(buttonExists).toBe(true);
      expect(inputExists).toBe(true);
      expect(cardExists).toBe(true);
    });

    it('should fail when component already exists without overwrite flag', async () => {
      const projectDir = path.join(TEST_DIR, 'duplicate-component');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await fs.ensureDir(path.join(projectDir, 'src/components/ui/Button'));
      await fs.ensureDir(path.join(projectDir, 'src/lib'));
      await fs.writeFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        '// Import Web Awesome components (registers web components)\n'
      );

      // Create existing component
      await fs.writeFile(
        path.join(projectDir, 'src/components/ui/Button/Button.tsx'),
        'export const Button = () => <button>Existing</button>;'
      );

      const installer = new ComponentInstaller(projectDir, config, mockOutput);
      const results = await installer.installComponents(['button'], {
        overwrite: false,
        types: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('already exists');
    });

    it('should overwrite component when overwrite flag is true', async () => {
      const projectDir = path.join(TEST_DIR, 'overwrite-component');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await fs.ensureDir(path.join(projectDir, 'src/components/ui/Button'));
      await fs.ensureDir(path.join(projectDir, 'src/lib'));
      await fs.writeFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        '// Import Web Awesome components (registers web components)\n'
      );

      // Create existing component
      await fs.writeFile(
        path.join(projectDir, 'src/components/ui/Button/Button.tsx'),
        'export const Button = () => <button>Existing</button>;'
      );

      const installer = new ComponentInstaller(projectDir, config, mockOutput);
      const results = await installer.installComponents(['button'], {
        overwrite: true,
        types: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);

      // Verify component was overwritten
      const buttonContent = await fs.readFile(
        path.join(projectDir, 'src/components/ui/Button/Button.tsx'),
        'utf-8'
      );
      expect(buttonContent).not.toContain('Existing');
    });
  });

  describe('Component Validation', () => {
    it('should validate free tier components', async () => {
      await expect(
        validateComponents(['button', 'input', 'card'], 'free', mockOutput)
      ).resolves.toBeUndefined();
    });

    it.skip('should reject pro components for free tier', async () => {
      await expect(
        validateComponents(['data-grid'], 'free', mockOutput)
      ).rejects.toThrow();
    });

    it.skip('should accept pro components for pro tier', async () => {
      await expect(
        validateComponents(['data-grid', 'page'], 'pro', mockOutput)
      ).resolves.toBeUndefined();
    });

    it('should reject invalid component names', async () => {
      await expect(
        validateComponents(['invalid-component'], 'free', mockOutput)
      ).rejects.toThrow();
    });
  });

  describe('WebAwesome Import Updates', () => {
    it('should add component import to webawesome.ts', async () => {
      const projectDir = path.join(TEST_DIR, 'import-update');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await fs.ensureDir(path.join(projectDir, 'src/components/ui'));
      await fs.ensureDir(path.join(projectDir, 'src/lib'));
      await fs.writeFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        '// Import Web Awesome components (registers web components)\n'
      );

      const installer = new ComponentInstaller(projectDir, config, mockOutput);
      await installer.installComponents(['button'], {
        overwrite: false,
        types: true,
      });

      // Verify import was added
      const webawesomeContent = await fs.readFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        'utf-8'
      );

      expect(webawesomeContent).toContain(
        "import '@awesome.me/webawesome/dist/components/button/button.js';"
      );
    });

    it('should not duplicate imports', async () => {
      const projectDir = path.join(TEST_DIR, 'no-duplicate-imports');
      await fs.ensureDir(projectDir);

      const config: KigumiConfig = {
        framework: 'react',
        typescript: true,
        componentsDir: 'src/components/ui',
        utilsDir: 'src/lib',
        theme: {
          selected: 'default',
          palette: 'default',
          brandColor: 'blue',
        },
        webAwesome: {
          tier: 'free',
        },
      };

      await fs.ensureDir(path.join(projectDir, 'src/components/ui'));
      await fs.ensureDir(path.join(projectDir, 'src/lib'));
      await fs.writeFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        "// Import Web Awesome components (registers web components)\nimport '@awesome.me/webawesome/dist/components/button/button.js';\n"
      );

      const installer = new ComponentInstaller(projectDir, config, mockOutput);
      await installer.installComponents(['button'], {
        overwrite: true,
        types: true,
      });

      const webawesomeContent = await fs.readFile(
        path.join(projectDir, 'src/lib/webawesome.ts'),
        'utf-8'
      );

      // Count occurrences of button import
      const matches = webawesomeContent.match(/button\/button\.js/g);
      expect(matches).toHaveLength(1);
    });
  });
});
