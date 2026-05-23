/**
 * Protects: PR #130 (F-094, F-097, F-102, F-103, F-116)
 * Bug: A malicious or sloppy community registry.json could escape the
 *      registry root via path traversal in component file paths, slip
 *      through the version field with non-semver strings, or surface as a
 *      plain Error swallowed at higher layers — losing the source URL.
 * Fix: f23bfe930 (#130) — safePathSchema rejects parent-traversal/absolute/
 *      empty/backslash segments; semver.valid replaces the version regex so
 *      pre-release and build metadata are accepted; validateCommunityRegistry
 *      throws CommunityRegistryInvalidError with the source URL.
 *
 * Why "logical invariant" rather than literal git revert: the schema lives
 * in a single file; reverting the whole PR mechanically is straightforward
 * but the invariants below are more durable (they survive future cosmetic
 * refactors of the schema layout).
 */

import { describe, it, expect } from 'vitest';
import {
  componentFilesSchema,
  communityRegistrySchema,
  validateCommunityRegistry,
} from '../../../src/schemas/community-registry.js';
import { CommunityRegistryInvalidError } from '../../../src/errors/community-registry.js';

const validRegistry = {
  name: 'test',
  version: '1.0.0',
  frameworks: ['react'],
};

describe('PR #130 / F-094: safe-path schema rejects traversal segments', () => {
  it.each([
    ['absolute path', '/etc/passwd'],
    ['parent traversal', '../escape'],
    ['nested parent traversal', 'src/../../escape'],
    ['empty segment', 'src//file.tsx'],
    ['backslash separator', 'src\\file.tsx'],
    ['single-dot segment', './file.tsx'],
  ])('rejects %s', (_label, badPath) => {
    const result = componentFilesSchema.safeParse({ component: badPath });
    expect(result.success).toBe(false);
  });

  it('accepts a normal relative path', () => {
    const result = componentFilesSchema.safeParse({
      component: 'src/components/Button.tsx',
    });
    expect(result.success).toBe(true);
  });
});

describe('PR #130 / F-102: registry version field accepts full semver', () => {
  it.each([
    ['plain semver', '1.0.0'],
    ['pre-release semver', '1.0.0-beta.1'],
    ['build-metadata semver', '1.0.0+build.5'],
    ['pre-release plus build', '1.0.0-rc.2+sha.abcdef'],
  ])('accepts %s', (_label, version) => {
    const result = communityRegistrySchema.safeParse({
      ...validRegistry,
      version,
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['plain string', 'one'],
    ['range', '^1.0.0'],
    ['no patch', '1.0'],
    ['empty', ''],
  ])('rejects %s', (_label, version) => {
    const result = communityRegistrySchema.safeParse({
      ...validRegistry,
      version,
    });
    expect(result.success).toBe(false);
  });
});

describe('PR #130 / F-097: validateCommunityRegistry throws typed error with URL', () => {
  it('attaches the source url to CommunityRegistryInvalidError', () => {
    const url = 'https://example.com/registry.json';
    expect(() => validateCommunityRegistry({ name: 'x' }, url)).toThrow(
      CommunityRegistryInvalidError
    );
    try {
      validateCommunityRegistry({ name: 'x' }, url);
    } catch (err) {
      expect(err).toBeInstanceOf(CommunityRegistryInvalidError);
      const message = (err as Error).message;
      expect(message).toContain(url);
    }
  });
});
