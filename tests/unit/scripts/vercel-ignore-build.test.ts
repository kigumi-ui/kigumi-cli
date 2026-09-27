import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  isRelevant,
  isSkippedBranch,
  relevantFiles,
} from '../../../scripts/vercel-ignore-build.mjs';

const ROOT = join(import.meta.dirname, '..', '..', '..');

describe('vercel-ignore-build', () => {
  // [file, builds landing (docs), builds storybook]
  const cases: [string, boolean, boolean][] = [
    // Storybook-only surfaces
    ['docs/src/stories/Button.stories.tsx', false, true],
    ['docs/.storybook/preview.ts', false, true],
    ['docs/storybook/public/logo.svg', false, true],
    // Shared docs/src surfaces
    ['docs/src/components/ui/Button/Button.tsx', true, true],
    ['docs/src/kigumi-studio/lib/css-generator.ts', true, true],
    ['docs/src/styles/tokens.css', true, true],
    ['docs/public/og-image.png', true, true],
    ['docs/package.json', true, true],
    ['docs/pnpm-lock.yaml', true, true],
    // Landing-only surfaces
    ['docs/index.html', true, false],
    ['docs/vercel.json', true, false],
    ['CHANGELOG.md', true, false],
    ['package.json', true, false],
    ['llms.txt', true, false],
    ['.claude/skills/kigumi-react/SKILL.md', true, false],
    ['.claude/skills/shared/react-api-surface.md', true, false],
    ['scripts/publish-skills.mjs', true, false],
    // Pipeline: both
    ['scripts/vercel-ignore-build.mjs', true, true],
    ['scripts/setup-npmrc.mjs', true, true],
    // An unknown new docs/ directory builds by default
    ['docs/new-thing/page.tsx', true, true],
    // Not visible anywhere
    [
      'docs/adr/0001-event-types-are-never-inferred-from-names.md',
      false,
      false,
    ],
    ['docs/agents/domain.md', false, false],
    ['docs/README.md', false, false],
    ['docs/.storybook-test/main.ts', false, false],
    ['docs/vitest.storybook.config.ts', false, false],
    ['docs/eslint.config.js', false, false],
    ['docs/src/kigumi-studio/__tests__/css-parser.test.ts', false, false],
    ['docs/.env.example', false, false],
    ['.claude/skills/release/SKILL.md', false, false],
    ['src/commands/add/index.ts', false, false],
    ['templates/react/Button/Button.tsx', false, false],
    ['tests/unit/tier.test.ts', false, false],
    ['.github/workflows/ci.yml', false, false],
    ['pnpm-lock.yaml', false, false],
    ['AGENTS.md', false, false],
  ];

  it.each(cases)('%s -> docs %s, storybook %s', (file, docs, storybook) => {
    expect(isRelevant('docs', file)).toBe(docs);
    expect(isRelevant('storybook', file)).toBe(storybook);
  });

  it('skips a CLI-only change set for both projects', () => {
    const files = [
      'src/utils/registry.ts',
      'templates/vue/Button/Button.vue',
      'AGENTS.md',
    ];
    expect(relevantFiles('docs', files)).toEqual([]);
    expect(relevantFiles('storybook', files)).toEqual([]);
  });

  it('returns only the files that trigger the build', () => {
    const files = [
      'src/index.ts',
      'docs/src/stories/Card.stories.tsx',
      'CHANGELOG.md',
    ];
    expect(relevantFiles('docs', files)).toEqual(['CHANGELOG.md']);
    expect(relevantFiles('storybook', files)).toEqual([
      'docs/src/stories/Card.stories.tsx',
    ]);
  });

  it('never deploys dependabot branches, but does deploy the release PR', () => {
    expect(isSkippedBranch('dependabot/npm_and_yarn/vite-7.1.0')).toBe(true);
    expect(isSkippedBranch('changeset-release/main')).toBe(false);
    expect(isSkippedBranch('main')).toBe(false);
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
    const config = JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as {
      ignoreCommand?: string;
    };
    expect(config.ignoreCommand).toBe(command);
  });
});
