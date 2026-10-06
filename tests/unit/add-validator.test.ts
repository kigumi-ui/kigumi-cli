/**
 * Add Validator Tests
 *
 * Tests for src/commands/add/validator.ts
 */

import { describe, it, expect, vi } from 'vitest';
import { validateComponents } from '../../src/commands/add/validator.js';
import { getOutput } from '../../src/output/index.js';
import { ValidationError } from '../../src/errors/validation.js';
import { TierRestrictionError } from '../../src/errors/tier.js';

describe('add validator', () => {
  const output = getOutput();

  describe('validateComponents', () => {
    it('should pass validation for valid free components', async () => {
      const components = ['button', 'input', 'dialog'];

      await expect(
        validateComponents(components, 'free', output)
      ).resolves.not.toThrow();
    });

    it('should pass validation for free components with pro tier', async () => {
      const components = ['button', 'input', 'dialog'];

      await expect(
        validateComponents(components, 'pro', output)
      ).resolves.not.toThrow();
    });

    it('should pass validation for pro components with pro tier', async () => {
      const components = ['combobox', 'file-input'];

      await expect(
        validateComponents(components, 'pro', output)
      ).resolves.not.toThrow();
    });

    it('should throw ValidationError for non-existent components', async () => {
      const components = ['non-existent-component', 'another-fake'];

      await expect(
        validateComponents(components, 'free', output)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw TierRestrictionError for pro components with free tier', async () => {
      const components = ['combobox']; // Pro-only component

      await expect(
        validateComponents(components, 'free', output)
      ).rejects.toThrow(TierRestrictionError);
    });

    it('should throw TierRestrictionError for multiple pro components with free tier', async () => {
      const components = ['combobox', 'file-input', 'number-input']; // Pro-only components

      await expect(
        validateComponents(components, 'free', output)
      ).rejects.toThrow(TierRestrictionError);
    });

    it('should allow empty component list', async () => {
      const components: string[] = [];

      await expect(
        validateComponents(components, 'free', output)
      ).resolves.not.toThrow();
    });

    it('should normalize component case', async () => {
      const components = ['Button']; // Will be normalized to 'button'

      // Registry normalizes case, so this should NOT throw
      await expect(
        validateComponents(components, 'free', output)
      ).resolves.not.toThrow();
    });

    it('should validate mixed valid and invalid components', async () => {
      const components = ['button', 'non-existent', 'dialog'];

      await expect(
        validateComponents(components, 'free', output)
      ).rejects.toThrow(ValidationError);
    });

    it('should validate all pro-only components correctly', async () => {
      // All actual pro-only components in registry
      const proComponents = [
        'combobox',
        'file-input',
        'number-input',
        'sparkline',
      ];

      // Should fail with free tier
      for (const component of proComponents) {
        await expect(
          validateComponents([component], 'free', output)
        ).rejects.toThrow(TierRestrictionError);
      }

      // Should pass with pro tier
      for (const component of proComponents) {
        await expect(
          validateComponents([component], 'pro', output)
        ).resolves.not.toThrow();
      }
    });

    it('points the Pro warning at kigumi init, not .env', async () => {
      const warning = vi.spyOn(output, 'warning');
      try {
        await expect(
          validateComponents(['combobox'], 'free', output)
        ).rejects.toThrow(TierRestrictionError);

        const text = String(warning.mock.calls[0]?.[0]);
        expect(text).toContain('kigumi init');
        expect(text).not.toContain('.env');
      } finally {
        warning.mockRestore();
      }
    });

    it('should provide helpful error message for tier restriction', async () => {
      const components = ['combobox'];

      try {
        await validateComponents(components, 'free', output);
        expect.fail('Should have thrown TierRestrictionError');
      } catch (error) {
        expect(error).toBeInstanceOf(TierRestrictionError);
        if (error instanceof TierRestrictionError) {
          expect(error.message.toLowerCase()).toContain('pro');
          expect(error.message).toContain('Combobox');
        }
      }
    });

    it('should validate duplicate component names', async () => {
      const components = ['button', 'button', 'dialog'];

      // Should not throw - duplicates are allowed (will be deduplicated later)
      await expect(
        validateComponents(components, 'free', output)
      ).resolves.not.toThrow();
    });
  });
});
