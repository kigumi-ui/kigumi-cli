/**
 * npmrc Tests
 *
 * src/utils/npmrc.ts decides which Web Awesome Pro credential npm and pnpm
 * see, and writes the project .npmrc lines Kigumi owns. The Pro registry
 * authenticates only through an npmrc: a token in WEBAWESOME_NPM_TOKEN
 * reaches the package manager through a `${WEBAWESOME_NPM_TOKEN}` reference,
 * never on its own (issue #160).
 */

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ENV_TOKEN_REFERENCE,
  NPM_PRO_AUTH_TOKEN_KEY,
} from '../../src/constants.js';
import {
  mergeProjectNpmrc,
  proRegistryToken,
  readsTokenFromEnv,
  readUserNpmrc,
  tokenReferenceUnset,
  userNpmrcPath,
  writeProjectNpmrc,
} from '../../src/utils/npmrc.js';

const PRO_REGISTRY_LINE =
  '@awesome.me:registry=https://npm.cloudsmith.io/fortawesome/webawesome-pro';
const FREE_REGISTRY_LINE = '@awesome.me:registry=https://registry.npmjs.org/';
const REFERENCE_LINE =
  '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${WEBAWESOME_NPM_TOKEN}';

describe('NPM_PRO_AUTH_TOKEN_KEY / ENV_TOKEN_REFERENCE', () => {
  it('name the key the Pro setup docs tell users to set, and the variable', () => {
    expect(NPM_PRO_AUTH_TOKEN_KEY).toBe(
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken'
    );
    expect(ENV_TOKEN_REFERENCE).toBe('${WEBAWESOME_NPM_TOKEN}');
  });
});

describe('proRegistryToken', () => {
  it('reads the token from the Pro registry _authToken line', () => {
    expect(
      proRegistryToken(
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=abcdef123456\n',
        {}
      )
    ).toBe('abcdef123456');
  });

  it('accepts the key without the trailing slash', () => {
    expect(
      proRegistryToken(
        '//npm.cloudsmith.io/fortawesome/webawesome-pro:_authToken=abcdef123456\n',
        {}
      )
    ).toBe('abcdef123456');
  });

  it('walks up to a host-level token, as npm does', () => {
    expect(
      proRegistryToken(
        '//npm.cloudsmith.io/:_authToken=host-token-123456\n',
        {}
      )
    ).toBe('host-token-123456');
  });

  it('prefers the most specific path over the host', () => {
    const content = [
      '//npm.cloudsmith.io/:_authToken=host-token-123456',
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=path-token-123456',
    ].join('\n');
    expect(proRegistryToken(content, {})).toBe('path-token-123456');
  });

  it('stops at the most specific path with any auth, like npm', () => {
    // npm uses basic auth for this path and never looks at the host token.
    const content = [
      '//npm.cloudsmith.io/:_authToken=host-token-123456',
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_auth=dXNlcjpwYXNz',
    ].join('\n');
    expect(proRegistryToken(content, {})).toBeNull();
  });

  it('ignores commented-out lines', () => {
    const content = [
      '# //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=commented-123456',
      '; //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=commented-123456',
    ].join('\n');
    expect(proRegistryToken(content, {})).toBeNull();
  });

  it('ignores the token of another registry', () => {
    expect(
      proRegistryToken(
        '//registry.npmjs.org/:_authToken=npm-token-1234567\n',
        {}
      )
    ).toBeNull();
  });

  it('takes the last of two lines for the same key', () => {
    const content = [
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=first-token-123',
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=second-token-123',
    ].join('\n');
    expect(proRegistryToken(content, {})).toBe('second-token-123');
  });

  it('expands a ${VAR} reference from the environment', () => {
    expect(
      proRegistryToken(`${REFERENCE_LINE}\n`, {
        WEBAWESOME_NPM_TOKEN: 'env-token-123456',
      })
    ).toBe('env-token-123456');
  });

  it('has no token when the referenced variable is unset', () => {
    // npm would send the literal "${WEBAWESOME_NPM_TOKEN}"; it is not a token.
    expect(proRegistryToken(`${REFERENCE_LINE}\n`, {})).toBeNull();
  });

  it('rejects a token shorter than the minimum length', () => {
    expect(
      proRegistryToken(
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=short\n',
        {}
      )
    ).toBeNull();
  });

  it('reads CRLF files and trims whitespace around key and value', () => {
    expect(
      proRegistryToken(
        '  //npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken = crlf-token-123456  \r\nother=1\r\n',
        {}
      )
    ).toBe('crlf-token-123456');
  });
});

describe('readsTokenFromEnv', () => {
  it('is true when the Pro auth line references WEBAWESOME_NPM_TOKEN', () => {
    expect(readsTokenFromEnv(`${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`)).toBe(
      true
    );
  });

  it('is false for a registry-only .npmrc', () => {
    expect(readsTokenFromEnv(`${PRO_REGISTRY_LINE}\n`)).toBe(false);
  });

  it('is false when the auth line holds a literal token', () => {
    expect(
      readsTokenFromEnv(
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=literal-123456\n'
      )
    ).toBe(false);
  });
});

describe('mergeProjectNpmrc', () => {
  describe('pro', () => {
    it('writes the registry and the token reference into a new file', () => {
      expect(mergeProjectNpmrc('', 'pro', true)).toBe(
        `${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`
      );
    });

    it('writes the registry only when the reference is not wanted', () => {
      expect(mergeProjectNpmrc('', 'pro', false)).toBe(
        `${PRO_REGISTRY_LINE}\n`
      );
    });

    it('keeps every line it does not own, in place', () => {
      const existing = [
        '# team settings',
        'engine-strict=true',
        '@acme:registry=https://npm.acme.example/',
        '//npm.acme.example/:_authToken=${ACME_TOKEN}',
        '',
      ].join('\n');

      expect(mergeProjectNpmrc(existing, 'pro', true)).toBe(
        [
          '# team settings',
          'engine-strict=true',
          '@acme:registry=https://npm.acme.example/',
          '//npm.acme.example/:_authToken=${ACME_TOKEN}',
          PRO_REGISTRY_LINE,
          REFERENCE_LINE,
          '',
        ].join('\n')
      );
    });

    it('replaces the scope registry in place and puts the reference after it', () => {
      const existing = [
        'engine-strict=true',
        FREE_REGISTRY_LINE,
        'save-exact=true',
        '',
      ].join('\n');

      expect(mergeProjectNpmrc(existing, 'pro', true)).toBe(
        [
          'engine-strict=true',
          PRO_REGISTRY_LINE,
          REFERENCE_LINE,
          'save-exact=true',
          '',
        ].join('\n')
      );
    });

    it('never replaces or duplicates a Pro auth line the project already has', () => {
      const existing = [
        PRO_REGISTRY_LINE,
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${MY_OWN_VAR}',
        '',
      ].join('\n');

      expect(mergeProjectNpmrc(existing, 'pro', true)).toBe(existing);
    });

    it('keeps an existing reference line when the user config holds the token', () => {
      // A team committed the reference; one developer's ~/.npmrc does not
      // take it back out.
      const existing = `${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`;
      expect(mergeProjectNpmrc(existing, 'pro', false)).toBe(existing);
    });

    it('counts host-level and basic auth as auth the project already has', () => {
      for (const authLine of [
        '//npm.cloudsmith.io/:_authToken=${CLOUDSMITH_TOKEN}',
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_auth=dXNlcjpwYXNz',
      ]) {
        const existing = `${PRO_REGISTRY_LINE}\n${authLine}\n`;
        expect(mergeProjectNpmrc(existing, 'pro', true)).toBe(existing);
      }
    });

    it('is idempotent', () => {
      const once = mergeProjectNpmrc('engine-strict=true\n', 'pro', true);
      expect(mergeProjectNpmrc(once, 'pro', true)).toBe(once);
    });

    it('keeps CRLF line endings', () => {
      expect(mergeProjectNpmrc('engine-strict=true\r\n', 'pro', true)).toBe(
        `engine-strict=true\r\n${PRO_REGISTRY_LINE}\r\n${REFERENCE_LINE}\r\n`
      );
    });

    it('collapses duplicate scope registry lines into one', () => {
      const existing = `${FREE_REGISTRY_LINE}\n${PRO_REGISTRY_LINE}\n`;
      expect(mergeProjectNpmrc(existing, 'pro', false)).toBe(
        `${PRO_REGISTRY_LINE}\n`
      );
    });
  });

  describe('free', () => {
    it('points the scope at the public registry', () => {
      expect(mergeProjectNpmrc('', 'free', true)).toBe(
        `${FREE_REGISTRY_LINE}\n`
      );
    });

    it('drops the token reference, which nothing reads on Free', () => {
      // With WEBAWESOME_NPM_TOKEN unset, pnpm ignores the whole .npmrc,
      // public registry line included.
      expect(
        mergeProjectNpmrc(
          `${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`,
          'free',
          true
        )
      ).toBe(`${FREE_REGISTRY_LINE}\n`);
    });

    it('keeps a Pro auth line the user wrote with their own value', () => {
      const own =
        '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=${MY_OWN_VAR}';
      expect(mergeProjectNpmrc(`${own}\n`, 'free', true)).toBe(
        `${own}\n${FREE_REGISTRY_LINE}\n`
      );
    });
  });
});

describe('userNpmrcPath / readUserNpmrc', () => {
  let homeDir: string;

  beforeEach(async () => {
    homeDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-npmrc-home-'))
    );
    vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.remove(homeDir);
  });

  it('is ~/.npmrc by default', () => {
    expect(userNpmrcPath({})).toBe(path.join(homeDir, '.npmrc'));
  });

  it('follows npm_config_userconfig in either spelling, as npm and pnpm do', () => {
    expect(userNpmrcPath({ npm_config_userconfig: '/ci/lower.npmrc' })).toBe(
      '/ci/lower.npmrc'
    );
    expect(userNpmrcPath({ NPM_CONFIG_USERCONFIG: '/ci/upper.npmrc' })).toBe(
      '/ci/upper.npmrc'
    );
  });

  it('is null when KIGUMI_SKIP_GLOBAL_NPMRC is set', () => {
    expect(userNpmrcPath({ KIGUMI_SKIP_GLOBAL_NPMRC: '1' })).toBeNull();
  });

  it('reads the file userNpmrcPath names, and an empty string without one', async () => {
    expect(await readUserNpmrc({})).toBe('');

    const userconfig = path.join(homeDir, 'ci.npmrc');
    await fs.writeFile(userconfig, 'save-exact=true\n');
    expect(await readUserNpmrc({ NPM_CONFIG_USERCONFIG: userconfig })).toBe(
      'save-exact=true\n'
    );
  });
});

describe('writeProjectNpmrc', () => {
  let projectDir: string;
  let userconfig: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };
    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-npmrc-project-'))
    );
    userconfig = path.join(
      projectDir,
      '..',
      `${path.basename(projectDir)}.user-npmrc`
    );
    delete process.env.KIGUMI_SKIP_GLOBAL_NPMRC;
    delete process.env.npm_config_userconfig;
    delete process.env.WEBAWESOME_NPM_TOKEN;
    process.env.NPM_CONFIG_USERCONFIG = userconfig;
  });

  afterEach(async () => {
    process.env = originalEnv;
    await fs.remove(projectDir);
    await fs.remove(userconfig);
  });

  const readProjectNpmrc = () =>
    fs.readFile(path.join(projectDir, '.npmrc'), 'utf-8');

  it('references WEBAWESOME_NPM_TOKEN when the user config has no Pro token', async () => {
    process.env.WEBAWESOME_NPM_TOKEN = 'env-token-123456';

    const result = await writeProjectNpmrc(projectDir, 'pro');

    expect(await readProjectNpmrc()).toBe(
      `${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`
    );
    expect(result).toEqual({ changed: true, readsTokenFromEnv: true });
  });

  it('writes the registry only when the user config already holds the Pro token', async () => {
    // A project line would take precedence over it; with the variable unset,
    // npm would send the literal reference and pnpm would drop the file.
    await fs.writeFile(
      userconfig,
      '//npm.cloudsmith.io/fortawesome/webawesome-pro/:_authToken=user-token-123456\n'
    );

    const result = await writeProjectNpmrc(projectDir, 'pro');

    expect(await readProjectNpmrc()).toBe(`${PRO_REGISTRY_LINE}\n`);
    expect(result).toEqual({ changed: true, readsTokenFromEnv: false });
  });

  it('references WEBAWESOME_NPM_TOKEN when no token is found anywhere', async () => {
    await writeProjectNpmrc(projectDir, 'pro');
    expect(await readProjectNpmrc()).toBe(
      `${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`
    );
  });

  it('reports no change and leaves the file alone when it is already right', async () => {
    const content = `engine-strict=true\n${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`;
    await fs.writeFile(path.join(projectDir, '.npmrc'), content);
    const before = (await fs.stat(path.join(projectDir, '.npmrc'))).mtimeMs;

    const result = await writeProjectNpmrc(projectDir, 'pro');

    expect(result).toEqual({ changed: false, readsTokenFromEnv: true });
    expect(await readProjectNpmrc()).toBe(content);
    expect((await fs.stat(path.join(projectDir, '.npmrc'))).mtimeMs).toBe(
      before
    );
  });

  it('writes the public registry on Free and never a reference', async () => {
    const result = await writeProjectNpmrc(projectDir, 'free');
    expect(await readProjectNpmrc()).toBe(`${FREE_REGISTRY_LINE}\n`);
    expect(result).toEqual({ changed: true, readsTokenFromEnv: false });
  });
});

describe('tokenReferenceUnset', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = fs.realpathSync(
      await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-npmrc-unset-'))
    );
  });

  afterEach(async () => {
    await fs.remove(projectDir);
  });

  const writeNpmrc = (content: string) =>
    fs.writeFile(path.join(projectDir, '.npmrc'), content);

  it('is true when .npmrc reads WEBAWESOME_NPM_TOKEN and it is unset', async () => {
    await writeNpmrc(`${PRO_REGISTRY_LINE}\n${REFERENCE_LINE}\n`);
    expect(await tokenReferenceUnset(projectDir, {})).toBe(true);
  });

  it('is true when the variable is too short to be a token', async () => {
    await writeNpmrc(`${REFERENCE_LINE}\n`);
    expect(
      await tokenReferenceUnset(projectDir, { WEBAWESOME_NPM_TOKEN: 'short' })
    ).toBe(true);
  });

  it('is false when the variable is set', async () => {
    await writeNpmrc(`${REFERENCE_LINE}\n`);
    expect(
      await tokenReferenceUnset(projectDir, {
        WEBAWESOME_NPM_TOKEN: 'env-token-123456',
      })
    ).toBe(false);
  });

  it('is false for a registry-only .npmrc, and without one', async () => {
    expect(await tokenReferenceUnset(projectDir, {})).toBe(false);
    await writeNpmrc(`${PRO_REGISTRY_LINE}\n`);
    expect(await tokenReferenceUnset(projectDir, {})).toBe(false);
  });
});
