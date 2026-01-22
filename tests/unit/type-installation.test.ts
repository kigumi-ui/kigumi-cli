import { describe, it, expect } from 'vitest';

describe('Type Installation Logic', () => {
  // Helper function to simulate dependency calculation
  function calculateDependencies(
    config: { framework: string; typescript: boolean },
    tier: 'free' | 'pro'
  ): { dependencies: string[]; devDependencies: string[] } {
    const packageName =
      tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';
    const dependencies = [packageName];
    const devDependencies: string[] = [];

    // Framework-specific dependencies (mirroring installer.ts logic)
    if (config.framework === 'react') {
      dependencies.push('clsx');

      // Add React types for TypeScript projects
      if (config.typescript) {
        devDependencies.push('@types/react', '@types/react-dom');
      }
    }

    return { dependencies, devDependencies };
  }

  describe('React TypeScript Projects', () => {
    it('should install types for TypeScript React projects', () => {
      const config = { framework: 'react', typescript: true };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'free'
      );

      expect(dependencies).toContain('@awesome.me/webawesome');
      expect(dependencies).toContain('clsx');
      expect(devDependencies).toContain('@types/react');
      expect(devDependencies).toContain('@types/react-dom');
    });

    it('should install types for Pro TypeScript React projects', () => {
      const config = { framework: 'react', typescript: true };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'pro'
      );

      expect(dependencies).toContain('@awesome.me/webawesome-pro');
      expect(devDependencies).toContain('@types/react');
      expect(devDependencies).toContain('@types/react-dom');
    });
  });

  describe('React JavaScript Projects', () => {
    it('should NOT install types for JavaScript projects', () => {
      const config = { framework: 'react', typescript: false };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'free'
      );

      expect(dependencies).toContain('@awesome.me/webawesome');
      expect(dependencies).toContain('clsx');
      expect(devDependencies).not.toContain('@types/react');
      expect(devDependencies).not.toContain('@types/react-dom');
    });

    it('should NOT install types for Pro JavaScript projects', () => {
      const config = { framework: 'react', typescript: false };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'pro'
      );

      expect(dependencies).toContain('@awesome.me/webawesome-pro');
      expect(devDependencies).not.toContain('@types/react');
    });
  });

  describe('Other Frameworks', () => {
    it('should NOT install React types for Vue projects', () => {
      const config = { framework: 'vue', typescript: true };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'free'
      );

      expect(dependencies).toContain('@awesome.me/webawesome');
      expect(dependencies).not.toContain('clsx');
      expect(devDependencies).not.toContain('@types/react');
    });

    it('should NOT install React types for Svelte projects', () => {
      const config = { framework: 'svelte', typescript: true };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'free'
      );

      expect(dependencies).toContain('@awesome.me/webawesome');
      expect(dependencies).not.toContain('clsx');
      expect(devDependencies).not.toContain('@types/react');
    });
  });

  describe('Tier Independence', () => {
    it('should install same types for both tiers', () => {
      const config = { framework: 'react', typescript: true };

      const free = calculateDependencies(config, 'free');
      const pro = calculateDependencies(config, 'pro');

      // Both should have types in devDependencies
      expect(free.devDependencies).toContain('@types/react');
      expect(pro.devDependencies).toContain('@types/react');

      // Different packages in dependencies
      expect(free.dependencies).toContain('@awesome.me/webawesome');
      expect(pro.dependencies).toContain('@awesome.me/webawesome-pro');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown framework gracefully', () => {
      const config = { framework: 'unknown', typescript: true };
      const { dependencies, devDependencies } = calculateDependencies(
        config,
        'free'
      );

      // Should only have base package
      expect(dependencies).toContain('@awesome.me/webawesome');
      expect(dependencies).not.toContain('clsx');
      expect(devDependencies).not.toContain('@types/react');
    });
  });
});
