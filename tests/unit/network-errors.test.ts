/**
 * Network and Dependency Error Tests
 *
 * Tests for src/errors/network.ts error classes
 */

import { describe, it, expect } from 'vitest';
import {
  DependencyInstallError,
  PackageNotFoundError,
  NetworkError,
  AuthenticationError,
  RegistryError,
} from '../../src/errors/network.js';

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

describe('PackageNotFoundError', () => {
  it('creates error with package name only', () => {
    const err = new PackageNotFoundError('missing-pkg');
    expect(err.message).toContain('missing-pkg');
    expect(err.suggestions[0].title).toBe('Check package name');
  });

  it('creates error with registry info', () => {
    const err = new PackageNotFoundError(
      'missing-pkg',
      'https://npm.example.com'
    );
    expect(
      err.suggestions[0].steps.some((s: string) =>
        s.includes('npm.example.com')
      )
    ).toBe(true);
  });
});

describe('NetworkError', () => {
  it('creates error with URL and cause', () => {
    const cause = new Error('ECONNREFUSED');
    const err = new NetworkError('https://api.github.com/repos', cause);
    expect(err.message).toContain('api.github.com');
    expect(err.suggestions[0].title).toBe('Check your network');
  });
});

describe('AuthenticationError', () => {
  it('creates error for generic service', () => {
    const err = new AuthenticationError('npm registry', 401);
    expect(err.suggestions).toHaveLength(1);
    expect(err.suggestions[0].title).toBe('Check your credentials');
  });

  it('creates error for webawesome service with extra suggestion', () => {
    const err = new AuthenticationError(
      'awesome.me npm registry',
      401,
      'token expired'
    );
    expect(err.suggestions).toHaveLength(2);
    expect(err.suggestions[1].title).toBe('Get a new Web Awesome token');
  });

  it('creates error without message', () => {
    const err = new AuthenticationError('service', 403);
    expect(
      err.suggestions[0].steps.some((s: string) => s.includes('403'))
    ).toBe(true);
  });
});

describe('RegistryError', () => {
  it('creates error with status code', () => {
    const cause = new Error('timeout');
    const err = new RegistryError(
      'https://registry.npmjs.org',
      'fetch',
      cause,
      503
    );
    expect(err.message).toContain('registry.npmjs.org');
    expect(
      err.suggestions[0].steps.some((s: string) => s.includes('503'))
    ).toBe(true);
  });

  it('creates error without status code', () => {
    const cause = new Error('DNS failure');
    const err = new RegistryError('https://example.com', 'connect', cause);
    expect(
      err.suggestions[0].steps.every((s: string) => !s.includes('Status code'))
    ).toBe(true);
  });
});
