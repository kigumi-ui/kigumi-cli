/**
 * Network and Dependency Error Tests
 *
 * Tests for src/errors/network.ts error classes
 */

import { describe, it, expect } from 'vitest';
import { DependencyInstallError } from '../../src/errors/network.js';

describe('DependencyInstallError', () => {
  it('creates error for registry mismatch (pnpm)', () => {
    const cause = new Error('ERR_PNPM_REGISTRIES_MISMATCH something');
    const err = new DependencyInstallError(
      '@awesome.me/webawesome-pro',
      'pnpm',
      cause
    );
    expect(err.message).toContain('Failed to install dependency');
    expect(err.suggestions[0].title).toBe(
      'Registry configuration mismatch detected'
    );
    expect(
      err.suggestions[0].steps.some((s: string) => s.includes('pnpm-lock.yaml'))
    ).toBe(true);
  });

  it('creates error for registry mismatch (yarn)', () => {
    const cause = new Error('REGISTRIES_MISMATCH');
    const err = new DependencyInstallError('pkg', 'yarn', cause);
    expect(
      err.suggestions[0].steps.some((s: string) => s.includes('yarn.lock'))
    ).toBe(true);
  });

  it('creates error for registry mismatch (npm)', () => {
    const cause = new Error('ERR_PNPM_REGISTRIES_MISMATCH');
    const err = new DependencyInstallError('pkg', 'npm', cause);
    expect(
      err.suggestions[0].steps.some((s: string) =>
        s.includes('package-lock.json')
      )
    ).toBe(true);
  });

  it('creates error for 401 auth error', () => {
    const err = new DependencyInstallError(
      '@awesome.me/webawesome-pro',
      'pnpm',
      undefined,
      401
    );
    expect(err.suggestions[0].title).toBe('Authentication required');
  });

  it('creates error for 403 auth error', () => {
    const err = new DependencyInstallError('pkg', 'npm', undefined, 403);
    expect(err.suggestions[0].title).toBe('Authentication required');
  });

  it('creates error for 404 not found', () => {
    const err = new DependencyInstallError(
      'nonexistent-pkg',
      'pnpm',
      undefined,
      404
    );
    expect(err.suggestions[0].title).toBe('Package not found');
  });

  it('creates generic error without status code', () => {
    const err = new DependencyInstallError('pkg', 'pnpm');
    expect(err.suggestions[0].title).toBe('Installation failed');
    expect(err.suggestions[1].title).toBe('Try manual installation');
  });

  it('creates generic error with cause', () => {
    const cause = new Error('some network timeout');
    const err = new DependencyInstallError('pkg', 'npm', cause);
    expect(err.suggestions[0].title).toBe('Installation failed');
    expect(
      err.suggestions[1].steps.some((s: string) => s.includes('npm install'))
    ).toBe(true);
  });

  it('uses "add" for non-npm package managers in manual install suggestion', () => {
    const err = new DependencyInstallError('pkg', 'pnpm');
    expect(
      err.suggestions[1].steps.some((s: string) => s.includes('pnpm add'))
    ).toBe(true);
  });
});
