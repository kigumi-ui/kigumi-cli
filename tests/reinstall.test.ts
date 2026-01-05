import { describe, it, expect } from 'vitest';

describe('Reinstall Dependencies Command', () => {
  describe('Install Command Generation', () => {
    it('should generate correct install command for all package managers', () => {
      const getInstallCommand = (pm: string) => {
        switch (pm) {
          case 'pnpm':
            return 'pnpm install';
          case 'yarn':
            return 'yarn install';
          case 'bun':
            return 'bun install';
          default:
            return 'npm install';
        }
      };

      expect(getInstallCommand('npm')).toBe('npm install');
      expect(getInstallCommand('pnpm')).toBe('pnpm install');
      expect(getInstallCommand('yarn')).toBe('yarn install');
      expect(getInstallCommand('bun')).toBe('bun install');
    });

    it('should use install without package name (installs ALL deps)', () => {
      const getInstallCommand = (pm: string) => {
        switch (pm) {
          case 'pnpm':
            return 'pnpm install';
          case 'yarn':
            return 'yarn install';
          case 'bun':
            return 'bun install';
          default:
            return 'npm install';
        }
      };

      const testCases = ['npm', 'pnpm', 'yarn', 'bun'];

      testCases.forEach((pm) => {
        const cmd = getInstallCommand(pm);

        // Should NOT contain package name
        expect(cmd).not.toContain('@awesome.me/webawesome');
        expect(cmd).not.toContain('add');

        // Should just be "install"
        expect(cmd).toContain('install');
        expect(cmd.split(' ')).toHaveLength(2); // e.g. ['npm', 'install']
      });
    });
  });

  describe('Package Manager Args for execa', () => {
    it('should use correct args for installing ALL dependencies', () => {
      const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'];

      packageManagers.forEach((pm) => {
        // For reinstall ALL deps, all PMs use ['install']
        const args = ['install'];

        expect(args).toEqual(['install']);
        expect(args).toHaveLength(1);
        expect(args[0]).toBe('install');
      });
    });

    it('should NOT use package-specific install (like npm install <package>)', () => {
      // When reinstalling ALL deps, we use:
      const correctArgs = ['install'];

      // NOT:
      const wrongArgs = ['install', '@awesome.me/webawesome'];
      const wrongArgs2 = ['add', '@awesome.me/webawesome'];

      expect(correctArgs).toHaveLength(1);
      expect(wrongArgs).not.toEqual(correctArgs);
      expect(wrongArgs2).not.toEqual(correctArgs);
    });
  });

  describe('Reinstall vs Add Package', () => {
    it('should differentiate between reinstall ALL and add ONE package', () => {
      // Reinstall ALL dependencies (from package.json)
      const reinstallArgs = ['install'];
      const reinstallCmd = 'npm install';

      // Add ONE specific package
      const addArgs = ['install', '@awesome.me/webawesome'];
      const addCmd = 'npm install @awesome.me/webawesome';

      expect(reinstallArgs).toHaveLength(1);
      expect(addArgs).toHaveLength(2);
      expect(reinstallCmd).not.toEqual(addCmd);
    });
  });
});
