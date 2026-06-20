/**
 * Init Installer Tests
 *
 * Tests for src/commands/init/installer.ts:
 * - installDependencies() - Install Web Awesome and framework dependencies
 * - cleanupOldPackage() - Remove old package after tier migration
 * - createStoreErrorMessage() - pnpm store error message
 * - createLockfileErrorMessage() - lockfile error message
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import type { OutputInterface, OutputSpinner } from '../../src/output/types.js';
import type { KigumiConfig } from '../../src/schemas/config.js';

// Mock execa before importing the module under test
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Mock token utils to avoid file system side effects in token detection
vi.mock('../../src/utils/token.js', () => ({
  detectProTokenSync: vi.fn(() => null),
  getTokenSourceSync: vi.fn(() => null),
  describeTokenSource: vi.fn((source: string | null) => source ?? 'unknown'),
}));

function createMockOutput(): OutputInterface {
  const spinnerMock: OutputSpinner = {
    start: vi.fn(),
    message: vi.fn(),
    stop: vi.fn(),
    error: vi.fn(),
  };

  return {
    intro: vi.fn(),
    outro: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    note: vi.fn(),
    spinner: vi.fn(() => spinnerMock),
    log: vi.fn(),
  };
}

function createConfig(overrides: Partial<KigumiConfig> = {}): KigumiConfig {
  return {
    framework: 'react',
    typescript: true,
    componentsDir: 'src/components/ui',
    utilsDir: 'src/lib',
    stylesDir: 'src/styles',
    theme: {
      selected: 'default',
      palette: 'default',
      brandColor: 'blue',
    },
    ...overrides,
  };
}

describe('installDependencies', () => {
  let tempDir: string;
  let mockOutput: OutputInterface;
  let mockExeca: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-installer-test-')
    );
    mockOutput = createMockOutput();

    // Get the mocked execa
    const execaModule = await import('execa');
    mockExeca = execaModule.execa as unknown as ReturnType<typeof vi.fn>;
    mockExeca.mockReset();

    // Default: execa succeeds for all calls
    mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it('should install free tier package with npm', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig(),
      tier: 'free',
      packageManager: 'npm',
      output: mockOutput,
    });

    // First call: lockfile check (install --frozen-lockfile)
    // Second call: main install
    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'npm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'install' &&
        !(call[1] as string[]).includes('--frozen-lockfile')
    );

    expect(installCalls.length).toBeGreaterThanOrEqual(1);
    const mainInstallArgs = installCalls[0][1] as string[];
    expect(mainInstallArgs).toContain('install');
    expect(mainInstallArgs).toContain('@awesome.me/webawesome');
  });

  it('should install pro tier package with pnpm', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig(),
      tier: 'pro',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'add'
    );

    expect(installCalls.length).toBeGreaterThanOrEqual(1);
    const mainInstallArgs = installCalls[0][1] as string[];
    expect(mainInstallArgs).toContain('add');
    expect(mainInstallArgs).toContain('@awesome.me/webawesome-pro');
  });

  it('should use "add" command for pnpm and yarn', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    for (const pm of ['pnpm', 'yarn'] as const) {
      mockExeca.mockReset();
      mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: pm,
        output: mockOutput,
      });

      const addCalls = mockExeca.mock.calls.filter(
        (call: unknown[]) =>
          call[0] === pm &&
          Array.isArray(call[1]) &&
          (call[1] as string[])[0] === 'add'
      );
      expect(addCalls.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should use "install" command for npm', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig(),
      tier: 'free',
      packageManager: 'npm',
      output: mockOutput,
    });

    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'npm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'install' &&
        !(call[1] as string[]).includes('--frozen-lockfile')
    );
    expect(installCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should pin Web Awesome exactly via --save-exact (npm)', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ webAwesome: { version: '3.5.0' } }),
      tier: 'free',
      packageManager: 'npm',
      output: mockOutput,
    });

    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'npm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'install' &&
        !(call[1] as string[]).includes('--frozen-lockfile')
    );
    expect(installCalls.length).toBeGreaterThanOrEqual(1);
    expect(installCalls[0][1] as string[]).toContain('--save-exact');
  });

  it('should pin Web Awesome exactly via --save-exact (pnpm)', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ webAwesome: { version: '3.5.0' } }),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'add' &&
        !(call[1] as string[]).includes('-D')
    );
    expect(installCalls.length).toBeGreaterThanOrEqual(1);
    expect(installCalls[0][1] as string[]).toContain('--save-exact');
  });

  it('should include clsx for React framework', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ framework: 'react' }),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'add' &&
        !(call[1] as string[]).includes('-D')
    );

    expect(installCalls.length).toBeGreaterThanOrEqual(1);
    expect(installCalls[0][1] as string[]).toContain('clsx');
  });

  it('should not include clsx for Vue framework', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ framework: 'vue' }),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const installCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[])[0] === 'add' &&
        !(call[1] as string[]).includes('-D')
    );

    expect(installCalls.length).toBeGreaterThanOrEqual(1);
    expect(installCalls[0][1] as string[]).not.toContain('clsx');
  });

  it('should install React type definitions as devDependencies for React TS', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ framework: 'react', typescript: true }),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const devInstallCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('-D')
    );

    expect(devInstallCalls.length).toBe(1);
    const devArgs = devInstallCalls[0][1] as string[];
    expect(devArgs).toContain('@types/react');
    expect(devArgs).toContain('@types/react-dom');
  });

  it('should not install type definitions for non-TypeScript React', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ framework: 'react', typescript: false }),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const devInstallCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('-D')
    );

    expect(devInstallCalls.length).toBe(0);
  });

  it('should not install type definitions for Vue framework', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig({ framework: 'vue', typescript: true }),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const devInstallCalls = mockExeca.mock.calls.filter(
      (call: unknown[]) =>
        call[0] === 'pnpm' &&
        Array.isArray(call[1]) &&
        (call[1] as string[]).includes('-D')
    );

    expect(devInstallCalls.length).toBe(0);
  });

  it('should stop spinner on success', async () => {
    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    await installDependencies({
      cwd: tempDir,
      config: createConfig(),
      tier: 'free',
      packageManager: 'pnpm',
      output: mockOutput,
    });

    const spinnerInstance = (mockOutput.spinner as ReturnType<typeof vi.fn>)
      .mock.results[0].value as OutputSpinner;
    expect(spinnerInstance.stop).toHaveBeenCalledWith('Dependencies installed');
  });

  describe('error handling', () => {
    it('should throw DependencyInstallError on install failure', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      // Make lockfile check pass, but main install fail
      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('install failed'), {
            exitCode: 1,
            stderr: 'something went wrong',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);
    });

    it('should retry with --legacy-peer-deps on npm ERESOLVE error', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('peer conflict'), {
            exitCode: 1,
            stderr:
              'npm error code ERESOLVE\nnpm error ERESOLVE could not resolve',
            stdout: '',
          })
        )
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }); // retry succeeds

      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: 'npm',
        output: mockOutput,
      });

      // Verify retry included --legacy-peer-deps
      const retryCalls = mockExeca.mock.calls.filter(
        (call: unknown[]) =>
          call[0] === 'npm' &&
          Array.isArray(call[1]) &&
          (call[1] as string[]).includes('--legacy-peer-deps')
      );
      expect(retryCalls.length).toBe(1);
      expect(mockOutput.warn).toHaveBeenCalledWith(
        expect.stringContaining('--legacy-peer-deps')
      );
    });

    it('should not retry with --legacy-peer-deps for non-npm package managers', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('conflict'), {
            exitCode: 1,
            stderr: 'ERESOLVE could not resolve',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);
    });

    it('should throw if npm ERESOLVE retry also fails', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('peer conflict'), {
            exitCode: 1,
            stderr: 'npm error code ERESOLVE',
            stdout: '',
          })
        )
        .mockRejectedValueOnce(
          Object.assign(new Error('still fails'), {
            exitCode: 1,
            stderr: 'some other error',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'npm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);
    });

    it('should detect pnpm store version mismatch and throw', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('store error'), {
            exitCode: 1,
            stderr: 'ERR_PNPM_UNEXPECTED_STORE some details',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);

      expect(mockOutput.error).toHaveBeenCalledWith(
        expect.stringContaining('pnpm store version mismatch')
      );
      expect(mockOutput.note).toHaveBeenCalledWith(
        'Store compatibility issue',
        expect.stringContaining('pnpm')
      );
    });

    it('should detect lockfile compatibility issue during install and throw', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check passes
        .mockRejectedValueOnce(
          Object.assign(new Error('lockfile error'), {
            exitCode: 1,
            stderr: 'not compatible with current pnpm version',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);

      expect(mockOutput.error).toHaveBeenCalledWith(
        expect.stringContaining('incompatible lockfile')
      );
    });

    it('should detect 401 auth error for pro tier and show token guidance', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('auth failed'), {
            exitCode: 1,
            stderr: '401 Unauthorized',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'pro',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);

      expect(mockOutput.error).toHaveBeenCalledWith(
        'Authentication failed for Pro package'
      );
      expect(mockOutput.note).toHaveBeenCalledWith(
        'Pro token required',
        expect.stringContaining('WEBAWESOME_NPM_TOKEN')
      );
    });

    it('should not show pro token guidance for 401 on free tier', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('auth failed'), {
            exitCode: 1,
            stderr: '401 Unauthorized',
            stdout: '',
          })
        );

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow();

      // Should NOT show pro token guidance
      expect(mockOutput.error).not.toHaveBeenCalledWith(
        'Authentication failed for Pro package'
      );
    });

    it('should show spinner error on install failure', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');

      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(
          Object.assign(new Error('fail'), {
            exitCode: 1,
            stderr: 'generic error',
            stdout: '',
          })
        );

      try {
        await installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        });
      } catch {
        // Expected
      }

      const spinnerInstance = (mockOutput.spinner as ReturnType<typeof vi.fn>)
        .mock.results[0].value as OutputSpinner;
      expect(spinnerInstance.error).toHaveBeenCalledWith('Installation failed');
    });

    it('should handle non-execa errors gracefully', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const { DependencyInstallError } =
        await import('../../src/errors/index.js');

      // Throw a plain error without exitCode/stderr (non-execa error)
      mockExeca
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
        .mockRejectedValueOnce(new Error('unexpected error'));

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow(DependencyInstallError);
    });
  });

  describe('lockfile compatibility pre-check', () => {
    it('should throw when pre-check detects incompatible lockfile', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');

      // Create lockfile so the check runs
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfile: 1');

      // Lockfile check returns incompatibility
      mockExeca.mockResolvedValueOnce({
        stdout: '',
        stderr: 'not compatible with current pnpm version',
        exitCode: 1,
      });

      await expect(
        installDependencies({
          cwd: tempDir,
          config: createConfig(),
          tier: 'free',
          packageManager: 'pnpm',
          output: mockOutput,
        })
      ).rejects.toThrow('Incompatible pnpm lockfile');

      expect(mockOutput.warn).toHaveBeenCalledWith(
        'Incompatible lockfile detected'
      );
    });

    it('should proceed when lockfile is compatible', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');

      // Create lockfile
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), 'lockfile: 1');

      // Lockfile check succeeds (no incompatibility pattern)
      mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: 'pnpm',
        output: mockOutput,
      });

      // Should not warn about incompatible lockfile
      expect(mockOutput.warn).not.toHaveBeenCalled();
    });

    it('should proceed when no lockfile exists', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');

      // No lockfile created
      mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: 'pnpm',
        output: mockOutput,
      });

      expect(mockOutput.warn).not.toHaveBeenCalled();
    });
  });

  describe('pro tier token handling', () => {
    it('should set env token when pro tier and token available', async () => {
      const { installDependencies } =
        await import('../../src/commands/init/installer.js');
      const tokenModule = await import('../../src/utils/token.js');
      const detectProTokenSyncMock =
        tokenModule.detectProTokenSync as ReturnType<typeof vi.fn>;
      detectProTokenSyncMock.mockReturnValue('test-pro-token-value');

      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'pro',
        packageManager: 'pnpm',
        output: mockOutput,
      });

      // Find the main install call (not the lockfile check)
      const installCalls = mockExeca.mock.calls.filter(
        (call: unknown[]) =>
          call[0] === 'pnpm' &&
          Array.isArray(call[1]) &&
          (call[1] as string[])[0] === 'add'
      );

      expect(installCalls.length).toBeGreaterThanOrEqual(1);
      const execaOptions = installCalls[0][2] as {
        env: Record<string, string>;
      };
      expect(execaOptions.env.WEBAWESOME_NPM_TOKEN).toBe(
        'test-pro-token-value'
      );

      // Restore
      detectProTokenSyncMock.mockReturnValue(null);
    });
  });
});

describe('cleanupOldPackage', () => {
  let tempDir: string;
  let mockOutput: OutputInterface;
  let mockExeca: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-cleanup-test-'));
    mockOutput = createMockOutput();

    const execaModule = await import('execa');
    mockExeca = execaModule.execa as unknown as ReturnType<typeof vi.fn>;
    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
  });

  afterEach(async () => {
    await fs.remove(tempDir);
    vi.restoreAllMocks();
  });

  it('should skip cleanup when package.json does not exist', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );

    // Should not call execa at all
    expect(mockExeca).not.toHaveBeenCalled();
  });

  it('should skip cleanup when old package is not in dependencies', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      dependencies: { react: '^18.0.0' },
    });

    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );

    expect(mockExeca).not.toHaveBeenCalled();
  });

  it('should uninstall old free package when present in dependencies', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      dependencies: { '@awesome.me/webawesome': '^3.2.1' },
    });

    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );

    expect(mockExeca).toHaveBeenCalledWith(
      'pnpm',
      ['remove', '@awesome.me/webawesome'],
      expect.objectContaining({ cwd: tempDir })
    );
  });

  it('should uninstall old pro package when present', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      dependencies: { '@awesome.me/webawesome-pro': '^3.2.1' },
    });

    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome-pro',
      'npm',
      mockOutput
    );

    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['uninstall', '@awesome.me/webawesome-pro'],
      expect.objectContaining({ cwd: tempDir })
    );
  });

  it('should use "uninstall" for npm and "remove" for pnpm/yarn', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    const packageJson = {
      dependencies: { '@awesome.me/webawesome': '^3.2.1' },
    };

    // npm -> uninstall
    await fs.writeJSON(path.join(tempDir, 'package.json'), packageJson);
    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'npm',
      mockOutput
    );
    expect(mockExeca).toHaveBeenCalledWith(
      'npm',
      ['uninstall', '@awesome.me/webawesome'],
      expect.objectContaining({ cwd: tempDir })
    );

    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

    // pnpm -> remove
    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );
    expect(mockExeca).toHaveBeenCalledWith(
      'pnpm',
      ['remove', '@awesome.me/webawesome'],
      expect.objectContaining({ cwd: tempDir })
    );

    mockExeca.mockReset();
    mockExeca.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

    // yarn -> remove
    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'yarn',
      mockOutput
    );
    expect(mockExeca).toHaveBeenCalledWith(
      'yarn',
      ['remove', '@awesome.me/webawesome'],
      expect.objectContaining({ cwd: tempDir })
    );
  });

  it('should show spinner during cleanup', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      dependencies: { '@awesome.me/webawesome': '^3.2.1' },
    });

    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );

    expect(mockOutput.spinner).toHaveBeenCalledWith(
      'Removing old package: @awesome.me/webawesome'
    );
    const spinnerInstance = (mockOutput.spinner as ReturnType<typeof vi.fn>)
      .mock.results[0].value as OutputSpinner;
    expect(spinnerInstance.stop).toHaveBeenCalledWith(
      'Removed old package: @awesome.me/webawesome'
    );
  });

  it('should warn but not throw when uninstall fails', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    await fs.writeJSON(path.join(tempDir, 'package.json'), {
      dependencies: { '@awesome.me/webawesome': '^3.2.1' },
    });

    mockExeca.mockRejectedValueOnce(new Error('uninstall failed'));

    // Should not throw
    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );

    const spinnerInstance = (mockOutput.spinner as ReturnType<typeof vi.fn>)
      .mock.results[0].value as OutputSpinner;
    expect(spinnerInstance.error).toHaveBeenCalledWith(
      'Failed to remove old package: @awesome.me/webawesome'
    );
    expect(mockOutput.warn).toHaveBeenCalledWith(
      expect.stringContaining('Could not remove')
    );
  });

  it('should silently handle errors reading package.json', async () => {
    const { cleanupOldPackage } =
      await import('../../src/commands/init/installer.js');

    // Write invalid JSON
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      'not valid json {{{{'
    );

    // Should not throw
    await cleanupOldPackage(
      tempDir,
      '@awesome.me/webawesome',
      'pnpm',
      mockOutput
    );

    expect(mockOutput.log).toHaveBeenCalledWith(
      expect.stringContaining('Package cleanup skipped')
    );
  });
});

describe('createStoreErrorMessage', () => {
  it('should include cwd in message', async () => {
    // createStoreErrorMessage is not exported, but it's used internally.
    // We test it indirectly via the store error path in installDependencies.
    // The test for "detect pnpm store version mismatch" above covers this.
    // Here we verify the note message content.

    const execaModule = await import('execa');
    const mockExeca = execaModule.execa as unknown as ReturnType<typeof vi.fn>;
    const mockOutput = createMockOutput();

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-store-msg-')
    );

    mockExeca.mockReset();
    mockExeca
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check
      .mockRejectedValueOnce(
        Object.assign(new Error('store error'), {
          exitCode: 1,
          stderr: 'ERR_PNPM_UNEXPECTED_STORE',
          stdout: '',
        })
      );

    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    try {
      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: 'pnpm',
        output: mockOutput,
      });
    } catch {
      // Expected
    }

    expect(mockOutput.note).toHaveBeenCalledWith(
      'Store compatibility issue',
      expect.stringContaining(tempDir)
    );
    expect(mockOutput.note).toHaveBeenCalledWith(
      'Store compatibility issue',
      expect.stringContaining('rm -rf node_modules pnpm-lock.yaml')
    );

    await fs.remove(tempDir);
  });
});

describe('createLockfileErrorMessage', () => {
  it('should include package manager name and lockfile path in message', async () => {
    const execaModule = await import('execa');
    const mockExeca = execaModule.execa as unknown as ReturnType<typeof vi.fn>;
    const mockOutput = createMockOutput();

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-lockfile-msg-')
    );

    // Create lockfile so the path is generated
    await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');

    mockExeca.mockReset();
    mockExeca
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lockfile check passes
      .mockRejectedValueOnce(
        Object.assign(new Error('lockfile issue'), {
          exitCode: 1,
          stderr: 'ignoring broken lockfile at /path/pnpm-lock.yaml',
          stdout: '',
        })
      );

    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    try {
      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: 'pnpm',
        output: mockOutput,
      });
    } catch {
      // Expected
    }

    expect(mockOutput.note).toHaveBeenCalledWith(
      'Lockfile compatibility issue',
      expect.stringContaining('pnpm lockfile is incompatible')
    );
    expect(mockOutput.note).toHaveBeenCalledWith(
      'Lockfile compatibility issue',
      expect.stringContaining('rm pnpm-lock.yaml && pnpm install')
    );

    await fs.remove(tempDir);
  });

  it('should generate correct command for npm lockfile error', async () => {
    const execaModule = await import('execa');
    const mockExeca = execaModule.execa as unknown as ReturnType<typeof vi.fn>;
    const mockOutput = createMockOutput();

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'kigumi-lockfile-npm-')
    );

    await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{}');

    mockExeca.mockReset();
    mockExeca
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
      .mockRejectedValueOnce(
        Object.assign(new Error('lockfile issue'), {
          exitCode: 1,
          stderr: 'lockfile v3 version incompatible',
          stdout: '',
        })
      );

    const { installDependencies } =
      await import('../../src/commands/init/installer.js');

    try {
      await installDependencies({
        cwd: tempDir,
        config: createConfig(),
        tier: 'free',
        packageManager: 'npm',
        output: mockOutput,
      });
    } catch {
      // Expected
    }

    expect(mockOutput.note).toHaveBeenCalledWith(
      'Lockfile compatibility issue',
      expect.stringContaining('rm package-lock.json && npm install')
    );

    await fs.remove(tempDir);
  });
});
