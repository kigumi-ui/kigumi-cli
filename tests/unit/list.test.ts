/**
 * List Command Tests
 *
 * Tests for src/commands/list.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listCommand } from '../../src/commands/list.js';
import * as registry from '../../src/utils/registry.js';
import * as tier from '../../src/utils/tier.js';

vi.mock('../../src/utils/tier.js', () => ({
  detectTier: vi.fn().mockResolvedValue('pro'),
  detectTierSync: vi.fn().mockReturnValue('pro'),
  getWebAwesomePackage: vi.fn((t: string) =>
    t === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome'
  ),
}));

describe('list command', () => {
  let consoleOutput: string[];

  beforeEach(() => {
    consoleOutput = [];
    vi.mocked(tier.detectTier).mockResolvedValue('pro');
    // Mock console output to capture output
    vi.spyOn(process.stdout, 'write').mockImplementation((str: unknown) => {
      consoleOutput.push(str.toString());
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should list all available components', async () => {
    await listCommand();

    const output = consoleOutput.join('');

    // Should show intro
    expect(output).toContain('kigumi list');

    // Should show categories
    expect(output).toContain('Form Controls'); // Category
    expect(output).toContain('Display'); // Category
    expect(output).toContain('Layout'); // Category
  });

  it('should display components grouped by category', async () => {
    const components = registry.getAllComponents();

    await listCommand();

    const output = consoleOutput.join('');

    // Check that at least some components are listed
    const componentNames = Object.keys(components);
    const someComponentsListed = componentNames.some((name) =>
      output.includes(name)
    );

    expect(someComponentsListed).toBe(true);
  });

  it('should show total component count', async () => {
    const components = registry.getAllComponents();
    const totalCount = Object.keys(components).length;

    await listCommand();

    const output = consoleOutput.join('');

    // Should show total
    expect(output).toContain('Total:');
    expect(output).toContain(`${totalCount}`);
  });

  it('should show help text for adding components', async () => {
    await listCommand();

    const output = consoleOutput.join('');

    // Should show hint about add command
    expect(output).toContain('npx kigumi add');
  });

  it('should sort components alphabetically within categories', async () => {
    const components = registry.getAllComponents();

    await listCommand();

    // Verify components in same category are sorted
    const output = consoleOutput.join('');

    // Get components from a known category
    const displayComponents = Object.entries(components)
      .filter(([, comp]) => comp.category === 'Display')
      .map(([key]) => key)
      .sort();

    if (displayComponents.length >= 2) {
      // Check order in output
      const firstIdx = output.indexOf(displayComponents[0]);
      const secondIdx = output.indexOf(displayComponents[1]);

      expect(firstIdx).toBeLessThan(secondIdx);
    }
  });

  describe('tier-aware rendering', () => {
    it('shows Pro components dimmed with (Pro) prefix on Free tier', async () => {
      vi.mocked(tier.detectTier).mockResolvedValue('free');

      await listCommand();

      const output = consoleOutput.join('');
      // At least one Pro component should be rendered with the (Pro) prefix
      expect(output).toContain('(Pro)');
    });

    it('shows Pro count in summary on Free tier', async () => {
      vi.mocked(tier.detectTier).mockResolvedValue('free');

      await listCommand();

      const output = consoleOutput.join('');
      expect(output).toContain('Pro');
      expect(output).toContain('require Web Awesome Pro token');
    });

    it('does not show (Pro) prefix on Pro tier', async () => {
      vi.mocked(tier.detectTier).mockResolvedValue('pro');

      await listCommand();

      const output = consoleOutput.join('');
      expect(output).not.toContain('(Pro)');
    });

    it('forwards cwd option to detectTier', async () => {
      await listCommand({ cwd: '/fake/project/path' });

      expect(tier.detectTier).toHaveBeenCalledWith('/fake/project/path');
    });
  });
});
