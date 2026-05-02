/**
 * showPostInstallInstructions Tests
 *
 * Unit-tests the post-install instructions branch in src/commands/init/index.ts:
 * - Vite default vs Pro vs Vue
 * - Next.js App Router vs Pages Router (with custom utilsDir / stylesDir)
 * - depsInstalled flag controls whether install + Pro-token steps appear
 *
 * No @clack/prompts mock needed: this function is purely informational.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { showPostInstallInstructions } from '../../src/commands/init/index.js';
import { createTestOutput } from './_helpers/output.js';
import { createTestKigumiConfig } from './_helpers/kigumi-config.js';
import type { OutputInterface } from '../../src/output/types.js';

function collectMessages(output: OutputInterface): string[] {
  const infoCalls = (output.info as ReturnType<typeof import('vitest').vi.fn>)
    .mock.calls;
  const logCalls = (output.log as ReturnType<typeof import('vitest').vi.fn>)
    .mock.calls;
  return [...infoCalls.flat(), ...logCalls.flat()].map((arg) =>
    typeof arg === 'string' ? arg : String(arg)
  );
}

describe('showPostInstallInstructions', () => {
  let output: OutputInterface;

  beforeEach(() => {
    output = createTestOutput();
  });

  describe('Vite + free + react + ts (default)', () => {
    it('emits the main-entry import step and omits Next/Vue/Pro-only steps', () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
      });

      showPostInstallInstructions(output, config, 'npm', false, 'free');

      const messages = collectMessages(output);
      expect(messages).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Import Kigumi in your main entry file'),
        ])
      );
      expect(
        messages.some((m) =>
          m.includes('Wrap your root layout with KigumiProvider')
        )
      ).toBe(false);
      expect(
        messages.some((m) =>
          m.includes('Wire Kigumi into your Pages Router entry')
        )
      ).toBe(false);
      expect(messages.some((m) => m.includes('Remove default styles'))).toBe(
        false
      );
      // No Pro-token step in free tier.
      expect(
        messages.some((m) =>
          m.includes('Ensure Pro token is configured globally')
        )
      ).toBe(false);
    });
  });

  describe('Vite + pro + react + ts', () => {
    it('emits the Pro-token step before the install step when deps are not installed', () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
      });

      showPostInstallInstructions(output, config, 'npm', false, 'pro');

      const messages = collectMessages(output);
      const proTokenIdx = messages.findIndex((m) =>
        m.includes('Ensure Pro token is configured globally')
      );
      const installIdx = messages.findIndex((m) =>
        m.includes('Install dependencies')
      );

      expect(proTokenIdx).toBeGreaterThanOrEqual(0);
      expect(installIdx).toBeGreaterThanOrEqual(0);
      expect(proTokenIdx).toBeLessThan(installIdx);
    });
  });

  describe('Vite + free + vue + ts', () => {
    it('emits the "Remove default styles" step pointing at src/style.css', () => {
      const config = createTestKigumiConfig({
        framework: 'vue',
        typescript: true,
      });

      showPostInstallInstructions(output, config, 'npm', true, 'free');

      const messages = collectMessages(output);
      expect(messages).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Remove default styles'),
        ])
      );
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('src/style.css')])
      );
    });
  });

  describe('Next + App Router + react', () => {
    it('emits the KigumiProvider wrapping step with the @/app/providers import', () => {
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
      });

      showPostInstallInstructions(
        output,
        config,
        'npm',
        true,
        'free',
        true,
        'app'
      );

      const messages = collectMessages(output);
      expect(messages).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Wrap your root layout with KigumiProvider'),
        ])
      );
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('@/app/providers')])
      );
      // Pages Router copy must be absent.
      expect(
        messages.some((m) =>
          m.includes('Wire Kigumi into your Pages Router entry')
        )
      ).toBe(false);
    });
  });

  describe('Next + Pages Router + react with custom dirs', () => {
    it('emits Pages Router instructions using @/styles + @/lib aliases', () => {
      // Custom directory layout drives toKigumiAlias output.
      const config = createTestKigumiConfig({
        framework: 'react',
        typescript: true,
        stylesDir: 'src/styles',
        utilsDir: 'src/lib',
      });

      showPostInstallInstructions(
        output,
        config,
        'npm',
        true,
        'free',
        true,
        'pages'
      );

      const messages = collectMessages(output);
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('@/styles/layers.css')])
      );
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('@/styles/theme.css')])
      );
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('@/lib/kigumi')])
      );
      // App Router copy must be absent.
      expect(
        messages.some((m) =>
          m.includes('Wrap your root layout with KigumiProvider')
        )
      ).toBe(false);
    });
  });

  describe('depsInstalled = true', () => {
    it('omits the Pro-token-setup step and the "Install dependencies" step', () => {
      const config = createTestKigumiConfig({ framework: 'react' });

      showPostInstallInstructions(output, config, 'npm', true, 'pro');

      const messages = collectMessages(output);
      expect(
        messages.some((m) =>
          m.includes('Ensure Pro token is configured globally')
        )
      ).toBe(false);
      expect(messages.some((m) => m.includes('Install dependencies:'))).toBe(
        false
      );
      // But project structure + theme info still emitted.
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('Generated Files')])
      );
      expect(messages).toEqual(
        expect.arrayContaining([expect.stringContaining('Theme Configuration')])
      );
    });
  });
});
