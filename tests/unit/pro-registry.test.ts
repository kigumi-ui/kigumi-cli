/**
 * Pro Registry Override Tests
 *
 * KIGUMI_PRO_REGISTRY names a registry that serves the Pro package instead of
 * Cloudsmith. Every Pro constant derives from it, so the line `init` writes,
 * the npmrc key a token is read from and the key npm authenticates with all
 * move together. CI relies on that: the Pro consumer suites point it at a
 * local registry and run `init` the way a Pro user does.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NPM_PRO_REGISTRY_DEFAULT,
  PRO_REGISTRY_ENV_KEY,
  resolveProRegistry,
} from '../../src/constants.js';

describe('resolveProRegistry', () => {
  it.each<[string | undefined, string]>([
    [undefined, 'unset'],
    ['', 'empty'],
    ['   ', 'blank'],
    ['localhost:4873', 'no protocol'],
    ['ftp://mirror.example.com', 'not http(s)'],
    ['https://', 'no host'],
  ])('falls back to Cloudsmith for %j (%s)', (value) => {
    expect(resolveProRegistry(value)).toBe(NPM_PRO_REGISTRY_DEFAULT);
  });

  it.each([
    ['http://127.0.0.1:4873', 'http://127.0.0.1:4873'],
    ['http://127.0.0.1:4873/', 'http://127.0.0.1:4873'],
    [' https://npm.example.com/wa-pro// ', 'https://npm.example.com/wa-pro'],
  ])('uses %j as %j', (value, expected) => {
    expect(resolveProRegistry(value)).toBe(expected);
  });
});

describe('KIGUMI_PRO_REGISTRY wiring', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadWith(value: string) {
    vi.stubEnv(PRO_REGISTRY_ENV_KEY, value);
    vi.resetModules();
    return {
      constants: await import('../../src/constants.js'),
      npmrc: await import('../../src/utils/npmrc.js'),
    };
  }

  it('moves the registry, its nerf dart and the auth key together', async () => {
    const { constants } = await loadWith('http://127.0.0.1:4873/');

    expect(constants.NPM_PRO_REGISTRY).toBe('http://127.0.0.1:4873');
    expect(constants.NPM_PRO_REGISTRY_DART).toBe('//127.0.0.1:4873/');
    expect(constants.NPM_PRO_AUTH_TOKEN_KEY).toBe(
      '//127.0.0.1:4873/:_authToken'
    );
  });

  it('writes the override into the Pro project .npmrc', async () => {
    const { npmrc } = await loadWith('http://127.0.0.1:4873');

    expect(npmrc.mergeProjectNpmrc('', 'pro', false)).toBe(
      '@awesome.me:registry=http://127.0.0.1:4873\n'
    );
  });

  it('reads the Pro token from the override registry key only', async () => {
    const { npmrc } = await loadWith('http://127.0.0.1:4873');
    const token = 'a1B2c3D4e5F6g7H8';

    expect(
      npmrc.proRegistryToken(`//127.0.0.1:4873/:_authToken=${token}\n`, {})
    ).toBe(token);
    expect(
      npmrc.proRegistryToken(
        `//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${token}\n`,
        {}
      )
    ).toBeNull();
  });

  it('leaves the Free registry line alone', async () => {
    const { npmrc } = await loadWith('http://127.0.0.1:4873');

    expect(npmrc.mergeProjectNpmrc('', 'free', false)).toBe(
      '@awesome.me:registry=https://registry.npmjs.org/\n'
    );
  });
});
