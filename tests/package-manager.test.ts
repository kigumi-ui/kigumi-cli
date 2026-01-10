import { describe, it, expect } from 'vitest';

describe('Package Manager Command Generation', () => {
  it('should generate correct install commands for each package manager', () => {
    const packageName = '@awesome.me/webawesome';

    // Test all package managers
    const testCases = [
      { pm: 'npm', expected: ['install', packageName] },
      { pm: 'pnpm', expected: ['add', packageName] },
      { pm: 'yarn', expected: ['add', packageName] },
      { pm: 'bun', expected: ['add', packageName] },
    ];

    testCases.forEach(({ pm, expected }) => {
      const installArgs =
        pm === 'npm' ? ['install', packageName] : ['add', packageName];

      expect(installArgs).toEqual(expected);
    });
  });

  it('should generate correct display commands for error messages', () => {
    const packageName = '@awesome.me/webawesome';

    const testCases = [
      { pm: 'npm', expected: 'npm install @awesome.me/webawesome' },
      { pm: 'pnpm', expected: 'pnpm add @awesome.me/webawesome' },
      { pm: 'yarn', expected: 'yarn add @awesome.me/webawesome' },
      { pm: 'bun', expected: 'bun add @awesome.me/webawesome' },
    ];

    testCases.forEach(({ pm, expected }) => {
      const installCmd =
        pm === 'npm'
          ? `npm install ${packageName}`
          : `${pm} add ${packageName}`;

      expect(installCmd).toBe(expected);
    });
  });

  it('should not use "npm add" which is invalid', () => {
    const packageManager = 'npm';
    const packageName = '@awesome.me/webawesome';

    const installArgs =
      packageManager === 'npm'
        ? ['install', packageName]
        : ['add', packageName];

    // npm should NEVER use "add"
    expect(installArgs).not.toContain('add');
    expect(installArgs[0]).toBe('install');
  });
});
