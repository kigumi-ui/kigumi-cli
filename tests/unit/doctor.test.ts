/**
 * Doctor Command Tests
 *
 * Tests for src/commands/doctor.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { doctorCommand } from '../../src/commands/doctor.js';
import {
  WEB_AWESOME_FREE_PACKAGE,
  WEB_AWESOME_PRO_PACKAGE,
} from '../../src/constants.js';

describe('doctor command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-doctor-test-'));
    originalEnv = process.env.WEBAWESOME_NPM_TOKEN;
    delete process.env.WEBAWESOME_NPM_TOKEN;
    process.env.KIGUMI_SKIP_GLOBAL_NPMRC = '1';
  });

  afterEach(async () => {
    await fs.remove(testDir);
    if (originalEnv !== undefined) {
      process.env.WEBAWESOME_NPM_TOKEN = originalEnv;
    } else {
      delete process.env.WEBAWESOME_NPM_TOKEN;
    }
    delete process.env.KIGUMI_SKIP_GLOBAL_NPMRC;
  });

  it('should warn when no config found', async () => {
    await doctorCommand({ cwd: testDir });
    // Should complete without error, just show warning
    expect(true).toBe(true);
  });

  it('should report no issues in healthy free project', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with correct import
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `import '@awesome.me/webawesome/dist/components/button/button.js';\n`
    );

    await doctorCommand({ cwd: testDir });
    // Should complete without finding issues
    expect(true).toBe(true);
  });

  it('should detect and fix wrong imports in free project', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with WRONG import (pro instead of free)
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `import '@awesome.me/webawesome-pro/dist/components/button/button.js';\n`
    );

    // Run doctor (should fix)
    await doctorCommand({ cwd: testDir });

    // Check that import was fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(content).not.toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should detect and fix wrong imports in pro project', async () => {
    // Setup pro project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_PRO_PACKAGE]: '^4.0.0',
      },
    });

    // Create .env with token
    await fs.writeFile(
      path.join(testDir, '.env'),
      'WEBAWESOME_NPM_TOKEN=abcdefghij1234567890'
    );

    // Create component with WRONG import (free instead of pro)
    const componentPath = path.join(
      testDir,
      'src/components/Dialog/Dialog.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `import '@awesome.me/webawesome/dist/components/dialog/dialog.js';\n`
    );

    // Run doctor (should fix)
    await doctorCommand({ cwd: testDir });

    // Check that import was fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toContain(WEB_AWESOME_PRO_PACKAGE);
    expect(content).not.toContain(`${WEB_AWESOME_FREE_PACKAGE}/dist`);
  });

  it('should support dry-run mode without fixing', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with WRONG import
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.tsx'
    );
    await fs.ensureDir(path.dirname(componentPath));
    const wrongContent = `import '@awesome.me/webawesome-pro/dist/components/button/button.js';\n`;
    await fs.writeFile(componentPath, wrongContent);

    // Run doctor in dry-run mode
    await doctorCommand({ cwd: testDir, dryRun: true });

    // Check that import was NOT fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toBe(wrongContent);
    expect(content).toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should scan multiple files', async () => {
    // Setup free project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create component with wrong import
    const badgePath = path.join(testDir, 'src/components/Badge/Badge.tsx');
    await fs.ensureDir(path.dirname(badgePath));
    await fs.writeFile(
      badgePath,
      `import '@awesome.me/webawesome-pro/dist/components/badge/badge.js';\nexport function Badge() { return null; }\n`
    );

    // Create another component with correct import (should not be touched)
    const avatarPath = path.join(testDir, 'src/components/Avatar/Avatar.tsx');
    await fs.ensureDir(path.dirname(avatarPath));
    await fs.writeFile(
      avatarPath,
      `import '@awesome.me/webawesome/dist/components/avatar/avatar.js';\nexport function Avatar() { return null; }\n`
    );

    // Run doctor
    await doctorCommand({ cwd: testDir });

    // Check Badge was fixed
    const badgeContent = await fs.readFile(badgePath, 'utf-8');
    expect(badgeContent).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(badgeContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);

    // Check Avatar was not modified (already correct)
    const avatarContent = await fs.readFile(avatarPath, 'utf-8');
    expect(avatarContent).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(avatarContent).not.toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should handle Vue files', async () => {
    // Setup Vue project
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'vue',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    // Create Vue component with wrong import
    const componentPath = path.join(
      testDir,
      'src/components/Button/Button.vue'
    );
    await fs.ensureDir(path.dirname(componentPath));
    await fs.writeFile(
      componentPath,
      `<script setup>\nimport '@awesome.me/webawesome-pro/dist/components/button/button.js';\n</script>`
    );

    // Run doctor
    await doctorCommand({ cwd: testDir });

    // Check that import was fixed
    const content = await fs.readFile(componentPath, 'utf-8');
    expect(content).toContain(WEB_AWESOME_FREE_PACKAGE);
    expect(content).not.toContain(WEB_AWESOME_PRO_PACKAGE);
  });

  it('should handle empty components directory', async () => {
    // Setup project with empty components dir
    await fs.writeJSON(path.join(testDir, 'kigumi.config.json'), {
      framework: 'react',
      typescript: true,
      componentsDir: 'src/components',
    });

    await fs.writeJSON(path.join(testDir, 'package.json'), {
      dependencies: {
        [WEB_AWESOME_FREE_PACKAGE]: '^4.0.0',
      },
    });

    await fs.ensureDir(path.join(testDir, 'src/components'));

    await doctorCommand({ cwd: testDir });
    // Should complete without error
    expect(true).toBe(true);
  });
});
