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
import { runsOnPushToMain } from '../../../scripts/validate-cache-keys.js';

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
});
