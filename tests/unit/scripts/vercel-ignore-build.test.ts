import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join, matchesGlob } from 'node:path';
import {
  buildReasons,
  isLandingFile,
  isSkippedBranch,
} from '../../../scripts/vercel-ignore-build.mjs';

const ROOT = join(import.meta.dirname, '..', '..', '..');

interface VercelConfig {
  ignoreCommand?: string;
  git?: { deploymentEnabled?: boolean | Record<string, boolean> };
}

function readConfig(file: string): VercelConfig {
  return JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as VercelConfig;
}

/**
 * Vercel's documented rule for `git.deploymentEnabled`: keys are minimatch
 * patterns, an unmatched branch deploys, and a branch that matches several
 * keys deploys when at least one of them is true.
 */
function deploys(config: VercelConfig, branch: string): boolean {
  const enabled = config.git?.deploymentEnabled;
  if (enabled === undefined) return true;
  if (typeof enabled === 'boolean') return enabled;
  const matched = Object.entries(enabled).filter(([pattern]) =>
    matchesGlob(branch, pattern)
  );
  return matched.length === 0 || matched.some(([, value]) => value);
}

describe('vercel-ignore-build', () => {
  // [file, changes what kigumi.style shows]
  const cases: [string, boolean][] = [
    // Landing page and Studio
    ['docs/index.html', true],
    ['docs/vercel.json', true],
    ['docs/src/App.tsx', true],
    ['docs/src/components/landing/Hero.tsx', true],
    ['docs/src/components/ui/Button/Button.tsx', true],
    ['docs/src/kigumi-studio/lib/css-generator.ts', true],
    ['docs/src/styles/tokens.css', true],
    ['docs/public/og-image.png', true],
    ['docs/api/theme-agent.ts', true],
    ['docs/package.json', true],
    ['docs/pnpm-lock.yaml', true],
    // An unknown new docs/ directory builds by default
    ['docs/new-thing/page.tsx', true],
    // Served from outside docs/
    ['llms.txt', true],
    ['.claude/skills/kigumi-react/SKILL.md', true],
    ['.claude/skills/kigumi-theme/references/css-variables.md', true],
    ['.claude/skills/shared/react-api-surface.md', true],
    ['scripts/publish-skills.mjs', true],
    // Pipeline
    ['scripts/vercel-ignore-build.mjs', true],
    ['scripts/setup-npmrc.mjs', true],
    // Storybook only: stories, its config, and what only stories import
    ['docs/src/stories/Button.stories.tsx', false],
    ['docs/.storybook/preview.ts', false],
    ['docs/storybook/vercel.json', false],
    ['docs/storybook/public/logo.svg', false],
    ['docs/src/components/changelog/ChangelogContent.tsx', false],
    ['docs/src/components/roadmap/RoadmapBoard.tsx', false],
    ['docs/src/components/storybook/StorybookComponentGrid.tsx', false],
    ['docs/src/assets/components/button.png', false],
    ['CHANGELOG.md', false],
    // The version counts through buildReasons, not as a file
    ['package.json', false],
    // Shipped elsewhere or never
    ['docs/trigger/theme-agent-turn.ts', false],
    ['docs/trigger.config.ts', false],
    ['docs/eval/theme-agent-scenarios.ts', false],
    ['.claude/skills/kigumi-theme/evals/evals.json', false],
    ['.claude/skills/kigumi-theme/evals/files/theme.css', false],
    // Not visible anywhere
    ['docs/adr/0001-event-types-are-never-inferred-from-names.md', false],
    ['docs/agents/domain.md', false],
    ['docs/README.md', false],
    ['docs/src/kigumi-studio/AGENTS.md', false],
    ['docs/.storybook-test/main.ts', false],
    ['docs/vitest.storybook.config.ts', false],
    ['docs/eslint.config.js', false],
    ['docs/src/kigumi-studio/__tests__/css-parser.test.ts', false],
    ['docs/api/_lib/theme-agent-session.test.ts', false],
    ['docs/.env.example', false],
    ['.claude/skills/release/SKILL.md', false],
    ['src/commands/add/index.ts', false],
    ['templates/react/Button/Button.tsx', false],
    ['tests/unit/tier.test.ts', false],
    ['.github/workflows/ci.yml', false],
    ['pnpm-lock.yaml', false],
    ['AGENTS.md', false],
  ];

  it.each(cases)('%s -> kigumi.style %s', (file, landing) => {
    expect(isLandingFile(file)).toBe(landing);
  });

  it('builds docs for the files kigumi.style shows, and for a release', () => {
    const files = [
      'src/index.ts',
      'docs/src/stories/Card.stories.tsx',
      'docs/src/kigumi-studio/KigumiStudio.tsx',
      'package.json',
    ];
    expect(buildReasons('docs', files, false)).toEqual([
      'docs/src/kigumi-studio/KigumiStudio.tsx',
    ]);
    expect(
      buildReasons('docs', ['src/index.ts', 'package.json'], true)
    ).toEqual(['package.json (CLI version)']);
    expect(
      buildReasons('docs', ['src/index.ts', 'package.json'], false)
    ).toEqual([]);
  });

  it('builds storybook only for a release, whatever else changed', () => {
    const files = [
      'docs/src/stories/Card.stories.tsx',
      'docs/.storybook/preview.ts',
      'docs/src/components/ui/Card/Card.tsx',
      'CHANGELOG.md',
    ];
    expect(buildReasons('storybook', files, false)).toEqual([]);
    expect(
      buildReasons('storybook', ['CHANGELOG.md', 'package.json'], true)
    ).toEqual(['package.json (CLI version)']);
  });

  it('never deploys dependabot or release branches', () => {
    expect(isSkippedBranch('dependabot/npm_and_yarn/vite-7.1.0')).toBe(true);
    expect(isSkippedBranch('changeset-release/main')).toBe(true);
    expect(
      isSkippedBranch('changesets-ghcommit-temp/changeset-release/main')
    ).toBe(true);
    expect(isSkippedBranch('main')).toBe(false);
    expect(isSkippedBranch('feat/theme-agent')).toBe(false);
    expect(isSkippedBranch('')).toBe(false);
  });

  // The script must be wired into both Vercel projects, with paths that
  // resolve from each project's Root Directory.
  it.each([
    ['docs/vercel.json', 'node ../scripts/vercel-ignore-build.mjs docs'],
    [
      'docs/storybook/vercel.json',
      'node ../../scripts/vercel-ignore-build.mjs storybook',
    ],
  ])('%s declares the ignoreCommand', (file, command) => {
    expect(readConfig(file).ignoreCommand).toBe(command);
  });

  // A deployment the ignore step skips still counts against the quota, so
  // these branches must not create one at all.
  const docs = readConfig('docs/vercel.json');
  const storybook = readConfig('docs/storybook/vercel.json');
  it.each([
    ['main', true, true],
    ['feat/theme-agent', true, false],
    ['issue-202-brand-on-colour', true, false],
    ['changeset-release/main', false, false],
    ['changesets-ghcommit-temp/changeset-release/main', false, false],
    ['dependabot/npm_and_yarn/vite-7.1.0', false, false],
  ])(
    '%s -> docs deployment %s, storybook deployment %s',
    (branch, docsDeploys, storybookDeploys) => {
      expect(deploys(docs, branch)).toBe(docsDeploys);
      expect(deploys(storybook, branch)).toBe(storybookDeploys);
    }
  );

  // Vercel deletes what a project's .vercelignore lists right after cloning,
  // and a project without its own falls back to the repository root's.
  // Without .git the ignore step cannot diff and builds every time.
  it.each(['docs', 'docs/storybook'])(
    'the %s project keeps .git for the ignore step',
    (dir) => {
      const own = join(ROOT, dir, '.vercelignore');
      const file = existsSync(own) ? own : join(ROOT, '.vercelignore');
      const patterns = readFileSync(file, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.replace(/^\/+|\/+$/g, ''));
      for (const path of ['.git', '.git/HEAD']) {
        expect(
          patterns.filter((pattern) => matchesGlob(path, pattern))
        ).toEqual([]);
      }
    }
  );
});
