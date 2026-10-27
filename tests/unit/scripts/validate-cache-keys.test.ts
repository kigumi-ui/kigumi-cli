/**
 * Shared Cache Key Validation Tests
 *
 * Tests for scripts/validate-cache-keys.ts.
 *
 * The rule guards a cross-workflow agreement whose failure is invisible: CI
 * still passes and silently re-downloads. So the tests feed the matcher
 * workflow sources that disagree, rather than asserting against the current
 * pair, which would pass even if the rule stopped matching.
 */

import { describe, it, expect } from 'vitest';
import {
  compareCacheDefinition,
  runnerOfCachingJob,
  runsOnPushToMain,
} from '../../../scripts/validate-cache-keys.js';

describe('validate:cache-keys', () => {
  describe('runsOnPushToMain', () => {
    it('accepts a workflow that pushes to main', () => {
      const source = [
        'name: Cache Warm',
        '',
        'on:',
        '  push:',
        '    branches: [main]',
        '',
        'permissions:',
        '  contents: read',
        '',
        'jobs:',
        '  warm:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(true);
    });

    it('accepts a push trigger carrying a paths filter', () => {
      // The real workflow filters on paths, so the branch line is not the
      // last line of the block.
      const source = [
        'name: Cache Warm',
        '',
        'on:',
        '  push:',
        '    branches: [main]',
        '    paths:',
        "      - 'docs/pnpm-lock.yaml'",
        '  workflow_dispatch:',
        '',
        'jobs:',
        '  warm:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(true);
    });

    it('rejects a pull-request-only workflow', () => {
      // This is the bug the guard exists for: a cache saved here is scoped to
      // the PR ref and no other branch can read it.
      const source = [
        'name: CI',
        '',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        '',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(false);
    });

    it('does not mistake a pull_request branch filter for a push one', () => {
      // Both triggers carry `branches: [main]`. A rule that searched the whole
      // `on:` block would call this safe when nothing writes on main.
      const source = [
        'name: CI',
        '',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        '  schedule:',
        "    - cron: '0 6 * * 1'",
        '',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(false);
    });

    it('rejects a push trigger scoped to another branch', () => {
      const source = [
        'name: Preview',
        '',
        'on:',
        '  push:',
        '    branches: [develop]',
        '',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(false);
    });

    it('accepts main listed alongside other branches', () => {
      const source = [
        'name: Preview',
        '',
        'on:',
        '  push:',
        '    branches: [develop, main]',
        '',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(true);
    });

    it('does not match a branch name that merely contains main', () => {
      const source = [
        'name: Preview',
        '',
        'on:',
        '  push:',
        '    branches: [maintenance]',
        '',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
      ].join('\n');

      expect(runsOnPushToMain(source)).toBe(false);
    });
  });

  describe('runner agreement', () => {
    const cache = {
      name: 'Playwright browsers',
      producer: 'cache-warm.yml',
      consumer: 'ci.yml',
      keyPattern: /key:\s*(playwright-chromium-\$\{\{[^}]*\}\})/,
      pathPattern: /path:\s*(\S*ms-playwright\S*)/,
    };
    const workflow = (runner: string, other = 'ubuntu-latest') =>
      [
        'jobs:',
        '  lint:',
        `    runs-on: ${other}`,
        '  browsers:',
        `    runs-on: ${runner}`,
        '    steps:',
        '      - uses: actions/cache@v4',
        '        with:',
        '          path: ~/.cache/ms-playwright',
        "          key: playwright-chromium-${{ hashFiles('x') }}",
        '',
      ].join('\n');

    it('reads the runner of the job that holds the key, not a neighbour', () => {
      expect(
        runnerOfCachingJob(workflow('ubuntu-24.04'), cache.keyPattern)
      ).toBe('ubuntu-24.04');
    });

    it('passes when writer and reader share a runner', () => {
      expect(
        compareCacheDefinition(
          cache,
          workflow('ubuntu-24.04'),
          workflow('ubuntu-24.04', 'ubuntu-24.04')
        )
      ).toEqual([]);
    });

    it('fails when the runners differ', () => {
      const findings = compareCacheDefinition(
        cache,
        workflow('ubuntu-24.04'),
        workflow('ubuntu-latest')
      );
      expect(findings).toHaveLength(1);
      expect(findings[0].message).toContain('Runner drift');
    });

    it('fails when a runner cannot be read', () => {
      const findings = compareCacheDefinition(
        cache,
        workflow('ubuntu-24.04'),
        workflow('ubuntu-24.04').replace('    runs-on: ubuntu-24.04\n', '')
      );
      expect(findings.map((f) => f.message).join()).toContain('Runner missing');
    });
  });
});
