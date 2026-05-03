/**
 * List Command Tests
 *
 * Tests for src/commands/list.ts
 *
 * Cluster S, F-126: rewritten to use vi.spyOn on the tier module
 * instead of a module-level mock for src/utils/tier.js. The tests need
 * both call-shape assertions (forwards cwd) and per-test return-value
 * control (free vs pro), so vi.spyOn keeps the test shape intact while
 * letting the rest of the tier module run real.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listCommand } from '../../src/commands/list.js';
import * as registry from '../../src/utils/registry.js';
import * as tier from '../../src/utils/tier.js';

describe('list command', () => {
  let consoleOutput: string[];
  let detectTierSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleOutput = [];
    detectTierSpy = vi.spyOn(tier, 'detectTier').mockResolvedValue('pro');
    // Mock console output to capture output
    vi.spyOn(process.stdout, 'write').mockImplementation((str: unknown) => {
      consoleOutput.push(typeof str === 'string' ? str : String(str));
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
      detectTierSpy.mockResolvedValue('free');

      await listCommand();

      const output = consoleOutput.join('');
      // At least one Pro component should be rendered with the (Pro) prefix
      expect(output).toContain('(Pro)');
    });

    it('shows Pro count in summary on Free tier', async () => {
      detectTierSpy.mockResolvedValue('free');

      await listCommand();

      const output = consoleOutput.join('');
      expect(output).toContain('Pro');
      expect(output).toContain('require Web Awesome Pro token');
    });

    it('does not show (Pro) prefix on Pro tier', async () => {
      detectTierSpy.mockResolvedValue('pro');

      await listCommand();

      const output = consoleOutput.join('');
      expect(output).not.toContain('(Pro)');
    });

    it('forwards cwd option to detectTier', async () => {
      await listCommand({ cwd: '/fake/project/path' });

      expect(detectTierSpy).toHaveBeenCalledWith('/fake/project/path');
    });
  });
});
