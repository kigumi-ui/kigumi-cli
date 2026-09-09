/**
 * Error Classes Tests
 *
 * Tests for src/errors/ - All error classes and handleError utility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  UnknownError,
  UserCancelledError,
  ErrorCode,
  handleError,
} from '../../src/errors/index.js';
import {
  ConfigNotFoundError,
  ConfigInvalidError,
} from '../../src/errors/config.js';
import { ValidationError } from '../../src/errors/validation.js';
import {
  TierRestrictionError,
  ProThemeRequiredError,
} from '../../src/errors/tier.js';
import { LayersCssRewriteError } from '../../src/errors/layers-css.js';
import type { OutputInterface } from '../../src/output/types.js';

describe('Error Classes', () => {
  describe('KigumiError base class', () => {
    // Use a concrete subclass for testing base functionality
    it('should have correct error code', () => {
      const error = new ConfigNotFoundError('/test/path');
      expect(error.code).toBe(ErrorCode.CONFIG_NOT_FOUND);
    });

    it('should have correct exit code based on error code range', () => {
      // Config errors (100-199) -> exit code 1
      const configError = new ConfigNotFoundError('/test');
      expect(configError.exitCode).toBe(1);

      // Validation errors (200-299) -> exit code 2
      const validationError = new ValidationError('field', 'value');
      expect(validationError.exitCode).toBe(2);

      // Tier errors (300-399) -> exit code 3
      const tierError = new TierRestrictionError('feature', 'pro', 'free');
      expect(tierError.exitCode).toBe(3);

      // File system errors (400-499) -> exit code 4
      const fileError = new LayersCssRewriteError(
        '/layers.css',
        '@webawesome/free',
        '@webawesome/pro',
        'default'
      );
      expect(fileError.exitCode).toBe(4);
    });

    it('should format error message correctly', () => {
      const error = new LayersCssRewriteError(
        '/path/to/layers.css',
        '@webawesome/free',
        '@webawesome/pro',
        'default'
      );
      const formatted = error.format();

      expect(formatted).toContain('Cannot migrate layers.css automatically');
      expect(formatted).toContain('/path/to/layers.css');
    });

    it('should include context details in formatted output', () => {
      const error = new ConfigInvalidError(['Missing field: framework']);
      const formatted = error.format();

      expect(formatted).toContain('Missing field: framework');
    });

    it('should format suggestions as numbered list', () => {
      const error = new ConfigNotFoundError('/test/path');
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('1.');
      expect(suggestions).toContain('kigumi init');
    });

    it('should convert to JSON', () => {
      const error = new ConfigNotFoundError('/test');
      const json = error.toJSON();

      expect(json).toHaveProperty('name');
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('exitCode');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('context');
      expect(json).toHaveProperty('suggestions');
    });

    it('should preserve Error.name as class name', () => {
      const error = new ConfigNotFoundError('/test');
      expect(error.name).toBe('ConfigNotFoundError');
    });
  });

  describe('UserCancelledError', () => {
    it('should have exit code 0', () => {
      const error = new UserCancelledError();
      expect(error.exitCode).toBe(0);
    });

    it('should have default message', () => {
      const error = new UserCancelledError();
      expect(error.message).toBe('Operation cancelled by user');
    });

    it('should accept custom message', () => {
      const error = new UserCancelledError('User pressed Ctrl+C');
      expect(error.message).toBe('User pressed Ctrl+C');
    });
  });

  describe('ConfigNotFoundError', () => {
    it('should have exit code 1', () => {
      const error = new ConfigNotFoundError('/project');
      expect(error.exitCode).toBe(1);
    });

    it('should include cwd in context', () => {
      const error = new ConfigNotFoundError('/my/project');
      expect(error.context.details?.cwd).toBe('/my/project');
    });

    it('should suggest running kigumi init', () => {
      const error = new ConfigNotFoundError('/test');
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('kigumi init');
    });

    it('should list searched files with the current config filename', () => {
      const error = new ConfigNotFoundError('/test');
      const files = error.context.details?.searchedFiles as string[];

      expect(files).toContain('kigumi.config.json');
      expect(files).not.toContain('kigumi-components.json');
    });

    it('should reference kigumi.config.json in suggestions, not the old name', () => {
      const error = new ConfigNotFoundError('/test');
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('kigumi.config.json');
      expect(suggestions).not.toContain('kigumi-components.json');
    });
  });

  describe('ConfigInvalidError', () => {
    it('should list all validation errors', () => {
      const errors = [
        'Missing field: framework',
        'Invalid value: tier must be "free" or "pro"',
      ];
      const error = new ConfigInvalidError(errors);
      const formatted = error.format();

      expect(formatted).toContain('Missing field: framework');
      expect(formatted).toContain('Invalid value: tier');
    });

    it('should include filePath in context when provided', () => {
      const error = new ConfigInvalidError(['error'], '/path/to/config.json');
      expect(error.context.details?.filePath).toBe('/path/to/config.json');
    });
  });

  describe('ValidationError', () => {
    it('should have exit code 2', () => {
      const error = new ValidationError('field', 'value');
      expect(error.exitCode).toBe(2);
    });

    it('should include field and value in formatted output', () => {
      const error = new ValidationError('componentName', 'invalid-comp');
      const formatted = error.format();

      expect(formatted).toContain('componentName');
      expect(formatted).toContain('invalid-comp');
    });

    it('should list valid values when provided', () => {
      const error = new ValidationError('tier', 'premium', ['free', 'pro']);
      const formatted = error.format();

      expect(formatted).toContain('free');
      expect(formatted).toContain('pro');
    });
  });

  describe('TierRestrictionError', () => {
    it('should have exit code 3', () => {
      const error = new TierRestrictionError('charts', 'pro', 'free');
      expect(error.exitCode).toBe(3);
    });

    it('should include feature name', () => {
      const error = new TierRestrictionError('data-grid', 'pro', 'free');
      expect(error.message).toContain('data-grid');
    });

    it('should suggest upgrading to Pro', () => {
      const error = new TierRestrictionError('feature', 'pro', 'free');
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('Pro');
      expect(suggestions).toContain('webawesome.com/pro');
    });

    it('should reference the current env var name, not the old WA_TOKEN', () => {
      const error = new TierRestrictionError('feature', 'pro', 'free');
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('WEBAWESOME_NPM_TOKEN');
      expect(suggestions).not.toContain('WA_TOKEN=');
    });
  });

  describe('ProThemeRequiredError', () => {
    it('should list free themes', () => {
      const error = new ProThemeRequiredError('mercury', [
        'awesome',
        'dawn',
        'dusk',
      ]);
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('awesome');
      expect(suggestions).toContain('dawn');
      expect(suggestions).toContain('dusk');
    });

    it('should reference current env var and config file names', () => {
      const error = new ProThemeRequiredError('mercury', ['awesome']);
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('WEBAWESOME_NPM_TOKEN');
      expect(suggestions).toContain('kigumi.config.json');
      expect(suggestions).not.toContain('WA_TOKEN=');
      expect(suggestions).not.toContain('kigumi-components.json');
    });
  });

  describe('UnknownError', () => {
    it('should suggest reporting the issue', () => {
      const error = new UnknownError('Something went wrong');
      const suggestions = error.formatSuggestions();

      expect(suggestions).toContain('report');
      expect(suggestions).toContain('github.com');
    });

    describe('UnknownError.from()', () => {
      it('should return KigumiError as-is', () => {
        const original = new ConfigNotFoundError('/test');
        const wrapped = UnknownError.from(original);

        expect(wrapped).toBe(original);
      });

      it('should wrap Error instances', () => {
        const original = new Error('Regular error');
        const wrapped = UnknownError.from(original);

        expect(wrapped).toBeInstanceOf(UnknownError);
        expect(wrapped.message).toContain('Regular error');
      });

      it('should wrap string errors', () => {
        const wrapped = UnknownError.from('String error message');

        expect(wrapped).toBeInstanceOf(UnknownError);
        expect(wrapped.message).toContain('String error message');
      });

      it('should wrap null/undefined', () => {
        const wrappedNull = UnknownError.from(null);
        const wrappedUndefined = UnknownError.from(undefined);

        expect(wrappedNull).toBeInstanceOf(UnknownError);
        expect(wrappedUndefined).toBeInstanceOf(UnknownError);
      });

      it('should preserve original error as cause', () => {
        const original = new Error('Original');
        const wrapped = UnknownError.from(original);

        expect(wrapped.context.cause).toBe(original);
      });
    });
  });

  describe('handleError', () => {
    let mockExit: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      mockExit.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should call output.error with formatted message', () => {
      const mockOutput: Partial<OutputInterface> = {
        error: vi.fn(),
        note: vi.fn(),
      };

      const error = new ConfigNotFoundError('/test');

      try {
        handleError(error, mockOutput as OutputInterface);
      } catch {
        // Expected: process.exit is mocked to throw
      }

      expect(mockOutput.error).toHaveBeenCalled();
    });

    it('should output suggestions via output.note', () => {
      const mockOutput: Partial<OutputInterface> = {
        error: vi.fn(),
        note: vi.fn(),
      };

      const error = new ConfigNotFoundError('/test');

      try {
        handleError(error, mockOutput as OutputInterface);
      } catch {
        // Expected
      }

      expect(mockOutput.note).toHaveBeenCalledWith(
        'How to fix',
        expect.any(String)
      );
    });

    it('should exit with correct code for KigumiError', () => {
      const mockOutput: Partial<OutputInterface> = {
        error: vi.fn(),
        note: vi.fn(),
      };

      const error = new TierRestrictionError('feature', 'pro', 'free');

      try {
        handleError(error, mockOutput as OutputInterface);
      } catch {
        // Expected
      }

      expect(mockExit).toHaveBeenCalledWith(3);
    });

    it('should wrap unknown errors via UnknownError.from', () => {
      const mockOutput: Partial<OutputInterface> = {
        error: vi.fn(),
        note: vi.fn(),
      };

      const plainError = new Error('Plain error');

      try {
        handleError(plainError, mockOutput as OutputInterface);
      } catch {
        // Expected
      }

      expect(mockOutput.error).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(1); // Unknown errors have exit code 1
    });

    it('should fallback to console when no output provided', () => {
      const error = new ConfigNotFoundError('/test');

      try {
        handleError(error);
      } catch {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not call output.note if no suggestions', () => {
      const mockOutput: Partial<OutputInterface> = {
        error: vi.fn(),
        note: vi.fn(),
      };

      // UserCancelledError is constructed without suggestions, so
      // formatSuggestions() returns '' and the note branch is skipped.
      const error = new UserCancelledError();

      try {
        handleError(error, mockOutput as OutputInterface);
      } catch {
        // handleError calls process.exit, which the mock throws on
      }

      expect(mockOutput.error).toHaveBeenCalled();
      expect(mockOutput.note).not.toHaveBeenCalled();
    });
  });
});
