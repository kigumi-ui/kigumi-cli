/**
 * Community Registry Tests
 *
 * Tests for schemas/community-registry.ts, utils/github-fetcher.ts,
 * utils/registry-cache.ts, and errors/community-registry.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  communityRegistrySchema,
  validateCommunityRegistry,
  validateRegistryDependencies,
  type CommunityRegistry,
} from '../../src/schemas/community-registry.js';
import { resolveRegistrySource } from '../../src/utils/registry-resolver.js';
import type { KigumiConfig } from '../../src/schemas/config.js';
import {
  parseGitHubUrl,
  parseRegistrySource,
  buildRawUrl,
  fetchFile,
  fetchRegistryJson,
  type GitHubRegistrySource,
  type LocalRegistrySource,
} from '../../src/utils/github-fetcher.js';
import {
  CommunityRegistryNotFoundError,
  CommunityRegistryInvalidError,
  CommunityComponentNotFoundError,
  FrameworkMismatchError,
  CircularDependencyError,
  PathTraversalError,
} from '../../src/errors/community-registry.js';
import { ErrorCode } from '../../src/errors/base.js';

// =============================================================================
// Schema Validation Tests
// =============================================================================

describe('communityRegistrySchema', () => {
  const validRegistry = {
    name: 'awesome-extras',
    description: 'Extra components',
    author: 'Jane Doe',
    version: '1.0.0',
    frameworks: ['react'],
    components: {
      'data-table': {
        name: 'DataTable',
        description: 'A data table',
        category: 'Data Display',
        dependencies: [],
        files: {
          react: {
            component: 'components/react/DataTable/DataTable.tsx',
            css: 'components/react/DataTable/DataTable.css',
          },
        },
      },
    },
    themes: {
      cyberpunk: {
        name: 'Cyberpunk',
        description: 'Neon dark theme',
        files: {
          css: 'themes/cyberpunk/theme.css',
          variables: 'themes/cyberpunk/variables.css',
        },
        extends: 'default',
      },
    },
  };

  it('validates a complete registry', () => {
    const result = communityRegistrySchema.safeParse(validRegistry);
    expect(result.success).toBe(true);
  });

  it('validates a minimal registry', () => {
    const minimal = {
      name: 'test',
      version: '0.1.0',
      frameworks: ['vue'],
    };
    const result = communityRegistrySchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.components).toEqual({});
      expect(result.data.themes).toEqual({});
    }
  });

  it('rejects missing name', () => {
    const invalid = { ...validRegistry, name: undefined };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid semver version', () => {
    const invalid = { ...validRegistry, version: '^1.0.0' };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects two-segment version', () => {
    const invalid = { ...validRegistry, version: '1.0' };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts pre-release semver versions (F-102)', () => {
    const valid = { ...validRegistry, version: '1.0.0-beta.1' };
    const result = communityRegistrySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts semver with build metadata (F-102)', () => {
    const valid = { ...validRegistry, version: '1.0.0+build.1' };
    const result = communityRegistrySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects parent-traversal path in component file (F-094)', () => {
    const invalid = {
      ...validRegistry,
      components: {
        bad: {
          name: 'Bad',
          files: {
            react: { component: '../../etc/passwd', extras: [] },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects absolute path in component file (F-094)', () => {
    const invalid = {
      ...validRegistry,
      components: {
        bad: {
          name: 'Bad',
          files: {
            react: { component: '/etc/passwd', extras: [] },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects backslash in component file path (F-094)', () => {
    const invalid = {
      ...validRegistry,
      components: {
        bad: {
          name: 'Bad',
          files: {
            react: { component: 'foo\\bar.tsx', extras: [] },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects parent-traversal in extras (F-094)', () => {
    const invalid = {
      ...validRegistry,
      components: {
        bad: {
          name: 'Bad',
          files: {
            react: {
              component: 'src/Bad.tsx',
              extras: ['../../etc/passwd'],
            },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects single-dot segment in component file path', () => {
    const invalid = {
      ...validRegistry,
      components: {
        bad: {
          name: 'Bad',
          files: {
            react: { component: 'src/./Bad.tsx', extras: [] },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects bare "." as component file path', () => {
    const invalid = {
      ...validRegistry,
      components: {
        bad: {
          name: 'Bad',
          files: {
            react: { component: '.', extras: [] },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts valid kigumiVersion semver', () => {
    const valid = { ...validRegistry, kigumiVersion: '0.19.0' };
    const result = communityRegistrySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts pre-release kigumiVersion', () => {
    const valid = { ...validRegistry, kigumiVersion: '1.0.0-beta.1' };
    const result = communityRegistrySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects non-semver kigumiVersion', () => {
    const invalid = { ...validRegistry, kigumiVersion: 'latest' };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty kigumiVersion', () => {
    const invalid = { ...validRegistry, kigumiVersion: '' };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty frameworks array', () => {
    const invalid = { ...validRegistry, frameworks: [] };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid framework value', () => {
    const invalid = { ...validRegistry, frameworks: ['blazor'] };
    const result = communityRegistrySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates component with extras', () => {
    const registry = {
      ...validRegistry,
      components: {
        'data-table': {
          name: 'DataTable',
          files: {
            react: {
              component: 'c/DataTable.tsx',
              extras: ['c/useSort.ts', 'c/types.ts'],
            },
          },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(registry);
    expect(result.success).toBe(true);
  });

  it('validates component with peerDependencies', () => {
    const registry = {
      ...validRegistry,
      components: {
        chart: {
          name: 'Chart',
          files: {
            react: { component: 'c/Chart.tsx' },
          },
          peerDependencies: { recharts: '^2.0.0' },
        },
      },
    };
    const result = communityRegistrySchema.safeParse(registry);
    expect(result.success).toBe(true);
  });
});

describe('validateCommunityRegistry', () => {
  it('returns validated registry for valid data', () => {
    const data = {
      name: 'test',
      version: '1.0.0',
      frameworks: ['react'],
    };
    const result = validateCommunityRegistry(
      data,
      'https://example.com/registry'
    );
    expect(result.name).toBe('test');
    expect(result.components).toEqual({});
  });

  it('throws CommunityRegistryInvalidError for invalid data (F-097)', () => {
    expect(() =>
      validateCommunityRegistry({ name: '' }, 'https://example.com/registry')
    ).toThrow(CommunityRegistryInvalidError);
  });

  it('attaches the source url to the typed error (F-097)', () => {
    try {
      validateCommunityRegistry({ name: '' }, 'https://example.com/registry');
      throw new Error('expected validateCommunityRegistry to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CommunityRegistryInvalidError);
      const typed = error as CommunityRegistryInvalidError;
      expect(typed.context.details).toMatchObject({
        url: 'https://example.com/registry',
      });
    }
  });
});

describe('validateRegistryDependencies', () => {
  it('returns empty array for valid dependencies', () => {
    const registry: CommunityRegistry = {
      name: 'test',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        button: {
          name: 'Button',
          dependencies: [],
          files: { react: { component: 'Button.tsx', extras: [] } },
        },
        'icon-button': {
          name: 'IconButton',
          dependencies: ['button'],
          files: { react: { component: 'IconButton.tsx', extras: [] } },
        },
      },
      themes: {},
    };
    const errors = validateRegistryDependencies(registry);
    expect(errors).toEqual([]);
  });

  it('returns errors for missing dependency', () => {
    const registry: CommunityRegistry = {
      name: 'test',
      version: '1.0.0',
      frameworks: ['react'],
      components: {
        'icon-button': {
          name: 'IconButton',
          dependencies: ['button'],
          files: { react: { component: 'IconButton.tsx', extras: [] } },
        },
      },
      themes: {},
    };
    const errors = validateRegistryDependencies(registry);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('button');
    expect(errors[0]).toContain('icon-button');
  });
});

// =============================================================================
// GitHub URL Parsing Tests
// =============================================================================

describe('parseGitHubUrl', () => {
  it('parses standard GitHub URL', () => {
    const result = parseGitHubUrl('https://github.com/user/my-registry');
    expect(result.owner).toBe('user');
    expect(result.repo).toBe('my-registry');
    expect(result.branch).toBe('main');
    expect(result.url).toBe('https://github.com/user/my-registry');
  });

  it('parses URL with branch', () => {
    const result = parseGitHubUrl(
      'https://github.com/user/my-registry/tree/develop'
    );
    expect(result.branch).toBe('develop');
  });

  it('parses URL without protocol', () => {
    const result = parseGitHubUrl('github.com/user/repo');
    expect(result.owner).toBe('user');
    expect(result.repo).toBe('repo');
  });

  it('strips trailing slashes', () => {
    const result = parseGitHubUrl('https://github.com/user/repo/');
    expect(result.owner).toBe('user');
    expect(result.repo).toBe('repo');
  });

  it('throws for non-GitHub URL', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/user/repo')).toThrow(
      'Only GitHub URLs are supported'
    );
  });

  it('throws for non-GitHub hostname', () => {
    expect(() => parseGitHubUrl('not-a-url')).toThrow(
      'Only GitHub URLs are supported'
    );
  });

  it('throws for URL without repo', () => {
    expect(() => parseGitHubUrl('https://github.com/user')).toThrow(
      'Invalid GitHub repository URL'
    );
  });
});

describe('parseRegistrySource', () => {
  it('parses a relative path starting with ../ as a local source', () => {
    const result = parseRegistrySource('../kigumi-react');
    expect(result.kind).toBe('local');
    if (result.kind === 'local') {
      expect(result.absolutePath).toBe(
        path.resolve(process.cwd(), '../kigumi-react')
      );
      expect(result.url).toBe(result.absolutePath);
    }
  });

  it('parses a relative path starting with ./ as a local source', () => {
    const result = parseRegistrySource('./fixtures/registry');
    expect(result.kind).toBe('local');
    if (result.kind === 'local') {
      expect(result.absolutePath).toBe(
        path.resolve(process.cwd(), './fixtures/registry')
      );
    }
  });

  it('parses an absolute path as a local source', () => {
    const result = parseRegistrySource('/tmp/some-registry');
    expect(result.kind).toBe('local');
    if (result.kind === 'local') {
      expect(result.absolutePath).toBe('/tmp/some-registry');
    }
  });

  it('parses a tilde path as a local source resolved against $HOME', () => {
    const result = parseRegistrySource('~/projects/kigumi-vue');
    expect(result.kind).toBe('local');
    if (result.kind === 'local') {
      expect(result.absolutePath).toBe(
        path.join(os.homedir(), 'projects/kigumi-vue')
      );
    }
  });

  it('parses a GitHub URL as a github source', () => {
    const result = parseRegistrySource('https://github.com/user/repo');
    expect(result.kind).toBe('github');
    if (result.kind === 'github') {
      expect(result.owner).toBe('user');
      expect(result.repo).toBe('repo');
    }
  });

  it('parses github.com/user/repo without protocol as a github source', () => {
    const result = parseRegistrySource('github.com/user/repo');
    expect(result.kind).toBe('github');
  });

  it('resolves relative paths against an explicit baseDir option', () => {
    const result = parseRegistrySource('../sibling', { baseDir: '/tmp/here' });
    expect(result.kind).toBe('local');
    if (result.kind === 'local') {
      expect(result.absolutePath).toBe('/tmp/sibling');
    }
  });
});

describe('fetchFile (local source)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-fetch-local-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('reads a file from the local source directory', async () => {
    await fs.writeFile(path.join(tmpDir, 'hello.txt'), 'hello world');
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    const content = await fetchFile(source, 'hello.txt');
    expect(content).toBe('hello world');
  });

  it('reads a nested file relative to absolutePath', async () => {
    await fs.ensureDir(path.join(tmpDir, 'src/components'));
    await fs.writeFile(
      path.join(tmpDir, 'src/components/Foo.tsx'),
      'export const Foo = () => null;'
    );
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    const content = await fetchFile(source, 'src/components/Foo.tsx');
    expect(content).toBe('export const Foo = () => null;');
  });

  it('throws when the local file does not exist', async () => {
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    await expect(fetchFile(source, 'missing.json')).rejects.toThrow(
      /missing\.json/
    );
  });

  it('strips a leading slash from the file path', async () => {
    await fs.writeFile(path.join(tmpDir, 'a.txt'), 'A');
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    const content = await fetchFile(source, '/a.txt');
    expect(content).toBe('A');
  });

  it('throws PathTraversalError for parent-directory traversal (F-103)', async () => {
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    await expect(fetchFile(source, '../../etc/passwd')).rejects.toBeInstanceOf(
      PathTraversalError
    );
  });

  it('throws PathTraversalError for an absolute escape path (F-103)', async () => {
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    await expect(fetchFile(source, '/../../etc/passwd')).rejects.toBeInstanceOf(
      PathTraversalError
    );
  });

  it('does not match a sibling directory with a shared prefix (F-103)', async () => {
    // Sanity check: tmpDir + 'sibling' should not be reachable even when its
    // resolved path shares the registry root prefix as a substring.
    const sibling = `${tmpDir}-sibling`;
    await fs.ensureDir(sibling);
    await fs.writeFile(path.join(sibling, 'leak.txt'), 'leak');
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    try {
      await expect(
        fetchFile(source, `../${path.basename(sibling)}/leak.txt`)
      ).rejects.toBeInstanceOf(PathTraversalError);
    } finally {
      await fs.remove(sibling);
    }
  });
});

describe('fetchRegistryJson (local source)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-fetch-reg-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('reads and validates registry.json from a local source', async () => {
    const registry = {
      $schema: 'https://kigumi.style/schemas/community-registry.json',
      name: 'local-test-registry',
      version: '0.1.0',
      frameworks: ['react'],
      components: {
        button: {
          name: 'Button',
          dependencies: [],
          files: { react: { component: 'Button.tsx', extras: [] } },
        },
      },
    };
    await fs.writeJSON(path.join(tmpDir, 'registry.json'), registry, {
      spaces: 2,
    });

    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    const result = await fetchRegistryJson(source);
    expect(result.name).toBe('local-test-registry');
    expect(result.frameworks).toEqual(['react']);
  });

  it('throws CommunityRegistryNotFoundError-style for missing registry.json', async () => {
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    await expect(fetchRegistryJson(source)).rejects.toThrow(/registry\.json/);
  });

  it('warns when CLI version is below the registry kigumiVersion (F-116)', async () => {
    const registry = {
      name: 'too-new',
      version: '1.0.0',
      kigumiVersion: '99.0.0',
      frameworks: ['react'],
    };
    await fs.writeJSON(path.join(tmpDir, 'registry.json'), registry, {
      spaces: 2,
    });
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    const warnings: string[] = [];
    const output = {
      warn: (msg: string) => warnings.push(msg),
    } as unknown as Parameters<typeof fetchRegistryJson>[1];

    const result = await fetchRegistryJson(source, output);
    expect(result.name).toBe('too-new');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('99.0.0');
  });

  it('does not warn when CLI version satisfies kigumiVersion (F-116)', async () => {
    const registry = {
      name: 'compat',
      version: '1.0.0',
      kigumiVersion: '0.0.1',
      frameworks: ['react'],
    };
    await fs.writeJSON(path.join(tmpDir, 'registry.json'), registry, {
      spaces: 2,
    });
    const source: LocalRegistrySource = {
      kind: 'local',
      url: tmpDir,
      absolutePath: tmpDir,
    };
    const warnings: string[] = [];
    const output = {
      warn: (msg: string) => warnings.push(msg),
    } as unknown as Parameters<typeof fetchRegistryJson>[1];

    await fetchRegistryJson(source, output);
    expect(warnings).toHaveLength(0);
  });
});

describe('buildRawUrl', () => {
  it('builds correct raw URL', () => {
    const source: GitHubRegistrySource = {
      kind: 'github',
      url: 'https://github.com/user/repo',
      owner: 'user',
      repo: 'repo',
      branch: 'main',
    };
    const url = buildRawUrl(source, 'registry.json');
    expect(url).toBe(
      'https://raw.githubusercontent.com/user/repo/main/registry.json'
    );
  });

  it('strips leading slash from file path', () => {
    const source: GitHubRegistrySource = {
      kind: 'github',
      url: 'https://github.com/user/repo',
      owner: 'user',
      repo: 'repo',
      branch: 'develop',
    };
    const url = buildRawUrl(source, '/components/Button.tsx');
    expect(url).toBe(
      'https://raw.githubusercontent.com/user/repo/develop/components/Button.tsx'
    );
  });
});

// =============================================================================
// Error Classes Tests
// =============================================================================

describe('Community registry errors', () => {
  it('CommunityRegistryNotFoundError has correct code', () => {
    const error = new CommunityRegistryNotFoundError(
      'https://github.com/user/repo'
    );
    expect(error.code).toBe(ErrorCode.REGISTRY_ERROR);
    expect(error.message).toContain('user/repo');
    expect(error.suggestions).toHaveLength(1);
  });

  it('CommunityRegistryInvalidError includes validation errors', () => {
    const error = new CommunityRegistryInvalidError(
      'https://github.com/user/repo',
      ['name: Required', 'version: Invalid']
    );
    expect(error.code).toBe(ErrorCode.REGISTRY_ERROR);
    expect(error.formatSuggestions()).toContain('name: Required');
  });

  it('CommunityComponentNotFoundError shows available components', () => {
    const error = new CommunityComponentNotFoundError('foo', 'my-reg', [
      'bar',
      'baz',
    ]);
    expect(error.code).toBe(ErrorCode.INVALID_COMPONENT);
    expect(error.formatSuggestions()).toContain('bar, baz');
  });

  it('FrameworkMismatchError shows framework info', () => {
    const error = new FrameworkMismatchError('my-reg', ['react'], 'vue');
    expect(error.code).toBe(ErrorCode.INVALID_FRAMEWORK);
    expect(error.formatSuggestions()).toContain('vue');
    expect(error.formatSuggestions()).toContain('react');
  });

  it('FrameworkMismatchError suggests --cross-framework as a resolution path', () => {
    const error = new FrameworkMismatchError('my-reg', ['react'], 'vue');
    const suggestions = error.formatSuggestions();
    expect(suggestions).toContain('--cross-framework');
    // Mentions the staging directory so users know where files land
    expect(suggestions).toContain('.kigumi/foreign');
  });

  it('CircularDependencyError shows cycle', () => {
    const error = new CircularDependencyError(['a', 'b', 'c', 'a']);
    expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(error.message).toContain('a → b → c → a');
  });
});

// =============================================================================
// Registry Add Component / Add Theme (registry.json manipulation)
// =============================================================================

describe('registry add-component (registry.json update)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-'));
    // Create a minimal registry
    const registry: CommunityRegistry = {
      name: 'test-reg',
      version: '0.1.0',
      frameworks: ['react'],
      components: {},
      themes: {},
    };
    await fs.writeJSON(path.join(tmpDir, 'registry.json'), registry, {
      spaces: 2,
    });
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('adds a component entry to registry.json', async () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = (await fs.readJSON(registryPath)) as CommunityRegistry;

    // Simulate what add-component does
    registry.components['button'] = {
      name: 'Button',
      description: 'A button component',
      category: 'Actions',
      dependencies: [],
      files: {
        react: {
          component: 'components/react/Button/Button.tsx',
          css: 'components/react/Button/Button.css',
          extras: [],
        },
      },
    };

    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    // Re-read and validate
    const updated = await fs.readJSON(registryPath);
    const result = communityRegistrySchema.safeParse(updated);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.components).toHaveProperty('button');
      expect(result.data.components['button'].name).toBe('Button');
      expect(result.data.components['button'].files.react.component).toBe(
        'components/react/Button/Button.tsx'
      );
    }
  });

  it('preserves existing components when adding new ones', async () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = (await fs.readJSON(registryPath)) as CommunityRegistry;

    // Add first component
    registry.components['button'] = {
      name: 'Button',
      dependencies: [],
      files: { react: { component: 'Button.tsx', extras: [] } },
    };
    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    // Add second component
    const updated = (await fs.readJSON(registryPath)) as CommunityRegistry;
    updated.components['card'] = {
      name: 'Card',
      dependencies: [],
      files: { react: { component: 'Card.tsx', extras: [] } },
    };
    await fs.writeJSON(registryPath, updated, { spaces: 2 });

    const final = (await fs.readJSON(registryPath)) as CommunityRegistry;
    expect(Object.keys(final.components)).toHaveLength(2);
    expect(final.components).toHaveProperty('button');
    expect(final.components).toHaveProperty('card');
  });

  it('supports component dependencies referencing existing keys', async () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = (await fs.readJSON(registryPath)) as CommunityRegistry;

    registry.components['button'] = {
      name: 'Button',
      dependencies: [],
      files: { react: { component: 'Button.tsx', extras: [] } },
    };
    registry.components['dialog'] = {
      name: 'Dialog',
      dependencies: ['button'],
      files: { react: { component: 'Dialog.tsx', extras: [] } },
    };

    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    const depErrors = validateRegistryDependencies(registry);
    expect(depErrors).toEqual([]);
  });
});

describe('registry add-theme (registry.json update)', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kigumi-reg-'));
    const registry: CommunityRegistry = {
      name: 'test-reg',
      version: '0.1.0',
      frameworks: ['react'],
      components: {},
      themes: {},
    };
    await fs.writeJSON(path.join(tmpDir, 'registry.json'), registry, {
      spaces: 2,
    });
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it('adds a theme entry to registry.json', async () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = (await fs.readJSON(registryPath)) as CommunityRegistry;

    registry.themes['dark-mode'] = {
      name: 'Dark Mode',
      description: 'A dark theme',
      files: {
        css: 'themes/dark-mode/theme.css',
        variables: 'themes/dark-mode/variables.css',
      },
      extends: 'default',
    };

    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    const updated = await fs.readJSON(registryPath);
    const result = communityRegistrySchema.safeParse(updated);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.themes).toHaveProperty('dark-mode');
      expect(result.data.themes['dark-mode'].name).toBe('Dark Mode');
      expect(result.data.themes['dark-mode'].files.css).toBe(
        'themes/dark-mode/theme.css'
      );
      expect(result.data.themes['dark-mode'].files.variables).toBe(
        'themes/dark-mode/variables.css'
      );
      expect(result.data.themes['dark-mode'].extends).toBe('default');
    }
  });

  it('adds a minimal theme (CSS only, no variables)', async () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = (await fs.readJSON(registryPath)) as CommunityRegistry;

    registry.themes['simple'] = {
      name: 'Simple',
      files: { css: 'themes/simple.css' },
    };

    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    const updated = await fs.readJSON(registryPath);
    const result = communityRegistrySchema.safeParse(updated);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.themes['simple'].files.variables).toBeUndefined();
      expect(result.data.themes['simple'].extends).toBeUndefined();
    }
  });

  it('preserves components when adding themes', async () => {
    const registryPath = path.join(tmpDir, 'registry.json');
    const registry = (await fs.readJSON(registryPath)) as CommunityRegistry;

    // Add a component first
    registry.components['button'] = {
      name: 'Button',
      dependencies: [],
      files: { react: { component: 'Button.tsx', extras: [] } },
    };
    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    // Now add a theme
    const updated = (await fs.readJSON(registryPath)) as CommunityRegistry;
    updated.themes['neo'] = {
      name: 'Neo',
      files: { css: 'themes/neo.css' },
    };
    await fs.writeJSON(registryPath, updated, { spaces: 2 });

    const final = (await fs.readJSON(registryPath)) as CommunityRegistry;
    expect(Object.keys(final.components)).toHaveLength(1);
    expect(Object.keys(final.themes)).toHaveLength(1);
  });
});

// ─── resolveRegistrySource ──────────────────────────────────────────────────

describe('resolveRegistrySource', () => {
  const baseConfig = {
    framework: 'react',
    typescript: true,
    componentsDir: 'src/components/ui',
    utilsDir: 'src/lib',
    stylesDir: 'src/styles',
    theme: { selected: 'default', palette: 'default', brandColor: 'blue' },
    registries: [
      { url: 'https://github.com/user/my-registry', name: 'my-registry' },
      { url: 'https://github.com/other/cool-stuff', name: 'cool-stuff' },
    ],
  } as KigumiConfig;

  it('passes through full URLs unchanged', () => {
    const result = resolveRegistrySource(
      'https://github.com/user/repo',
      baseConfig
    );
    expect(result).toBe('https://github.com/user/repo');
  });

  it('passes through short GitHub URLs (containing "/")', () => {
    const result = resolveRegistrySource('github.com/user/repo', baseConfig);
    expect(result).toBe('github.com/user/repo');
  });

  it('resolves a saved registry name to its URL', () => {
    const result = resolveRegistrySource('my-registry', baseConfig);
    expect(result).toBe('https://github.com/user/my-registry');
  });

  it('resolves names case-insensitively', () => {
    const result = resolveRegistrySource('My-Registry', baseConfig);
    expect(result).toBe('https://github.com/user/my-registry');
  });

  it('throws when name is not found', () => {
    expect(() => resolveRegistrySource('nonexistent', baseConfig)).toThrow(
      'Registry "nonexistent" not found'
    );
  });

  it('throws with guidance when no registries are configured', () => {
    const emptyConfig = { ...baseConfig, registries: [] } as KigumiConfig;
    expect(() => resolveRegistrySource('foo', emptyConfig)).toThrow(
      'kigumi registry connect'
    );
  });
});
