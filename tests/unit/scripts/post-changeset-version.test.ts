import { describe, expect, it } from 'vitest';
import { check as prettierCheck } from 'prettier';
import {
  bumpAgentsVersion,
  parseLatestVersion,
  rewriteChangelog,
  tidyBlankLines,
} from '../../../scripts/post-changeset-version.js';

const TODAY = '2026-05-02';

const CHANGELOG_FIXTURE = `# Changelog

## 0.20.0

### Major Changes

- abc1234: Drop legacy tier schema entirely.

### Minor Changes

- def5678: Add Vue Phase 6 component coverage.

### Patch Changes

- ### Added
  - New \`kigumi audit\` subcommand for theme drift detection.

- ### Changed
  - 1357acf: Default Toast placement is now \`top-end\`.

- ### Fixed
  - 9876abc: Tier sync race when switching from free to pro mid-run.
  - Markdown component now respects sanitize prop in SSR.

- ### Removed
  - Vestigial \`legacyImports\` config field.

## [0.19.2] - 2026-04-30

### Fixed

- Earlier release entry kept verbatim below the new one.
`;

const NO_HEADER_FIXTURE = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
`;

const BAD_VERSION_FIXTURE = `# Changelog

## 1.2-rc

### Added

- broken header
`;

// Real-world shape produced by @changesets/cli/changelog when several
// changesets are released together and each summary LEADS with a category
// header: the short commit hash sits on the SAME line as the header,
// e.g. "- 91101c4: ### Changed". Regression fixture for the bug where every
// changeset's leading category section was dropped/mislabelled.
const MULTI_CHANGESET_HASH_FIXTURE = `# Changelog

## 0.22.0

### Minor Changes

- 91101c4: ### Changed

  - **Enum A corrected.**
  - **Enum B corrected.**

  ### Fixed

  - **CEM resolution fix.**

- 5a3a665: ### Changed

  - **Web Awesome upgraded to 3.6.0.**

  ### Added

  - **New form-control sizes.**

## [0.21.0] - 2026-06-21

### Added

- Prior entry kept verbatim.
`;

// Real-world shape of a changeset written as plain prose with no ### Category
// header at all (the pattern that produced a fully empty v0.27.0 CHANGELOG.md
// entry: 8 changesets were authored this way and their content vanished).
const NO_CATEGORY_HEADER_FIXTURE = `# Changelog

## 0.27.0

### Patch Changes

- **Cached registry files now expire.** Stale copies no longer stick around forever.
- **\`theme install\` accepts local registry paths.** Relative and absolute paths now work.

## [0.26.0] - 2026-07-02

### Fixed

- Prior entry kept verbatim.
`;

// Real-world shape of a changeset whose body is MULTI-LINE prose: separate
// paragraphs and a fenced code block. Every blank line used to be dropped,
// which glued paragraphs together and stripped the blank lines around the
// fence -- the exact shape prettier rejected on the 1.0.0 release PR.
const MULTILINE_BODY_FIXTURE = `# Changelog

## 1.0.0

### Patch Changes

- abc1234: ### Fixed

  \`kigumi init\` no longer writes \`baseUrl\` into your \`tsconfig.json\`.

  TypeScript removed it in 7.0, so a fresh project's first \`tsc\` run failed:

  \`\`\`
  error TS5102: Option 'baseUrl' has been removed.
  \`\`\`

  The \`@/*\` alias resolves without it, so nothing else changes.

- def5678: ### Fixed

  A second entry that must not glue onto the first one.

- 9990000: ### Removed

  A later category so a trailing blank in Fixed shows at the section join.

## [0.27.0] - 2026-08-18

### Fixed

- Prior entry kept verbatim.
`;

describe('rewriteChangelog', () => {
  it('reformats a fresh changesets entry to Keep-a-Changelog', () => {
    expect(rewriteChangelog(CHANGELOG_FIXTURE, TODAY)).toMatchSnapshot();
  });

  it('throws when no version header is present', () => {
    expect(() => rewriteChangelog(NO_HEADER_FIXTURE, TODAY)).toThrow(
      /No version header/
    );
  });

  it('throws when the version header is unparseable', () => {
    expect(() => rewriteChangelog(BAD_VERSION_FIXTURE, TODAY)).toThrow(
      /Could not parse version/
    );
  });

  it('preserves leading category sections when the commit hash shares the header line', () => {
    const result = rewriteChangelog(MULTI_CHANGESET_HASH_FIXTURE, '2026-06-25');

    // No malformed category-header-as-bullet survives.
    expect(result).not.toMatch(/^- ###/m);
    // Every changeset's leading "### Changed" section is kept and merged.
    expect(result).toContain('Enum A corrected.');
    expect(result).toContain('Enum B corrected.');
    expect(result).toContain('Web Awesome upgraded to 3.6.0.');
    // Sections from non-leading positions are still grouped correctly.
    expect(result).toContain('New form-control sizes.');
    expect(result).toContain('CEM resolution fix.');
    // Keep-a-Changelog category order: Added before Changed before Fixed.
    const added = result.indexOf('### Added');
    const changed = result.indexOf('### Changed');
    const fixed = result.indexOf('### Fixed');
    expect(added).toBeGreaterThan(-1);
    expect(changed).toBeGreaterThan(added);
    expect(fixed).toBeGreaterThan(changed);
    // The Changed bucket holds all three changed entries, not the Fixed bucket.
    const changedBlock = result.slice(changed, fixed);
    expect(changedBlock).toContain('Enum A corrected.');
    expect(changedBlock).toContain('Web Awesome upgraded to 3.6.0.');
  });

  it('preserves blank lines inside a multi-line entry body', () => {
    const result = rewriteChangelog(MULTILINE_BODY_FIXTURE, '2026-09-10');

    // A fenced code block must keep the blank line on each side, otherwise
    // prettier --check fails on the generated CHANGELOG.md.
    expect(result).toMatch(/\n\n```\nerror TS5102/);
    expect(result).toMatch(/has been removed\.\n```\n\n/);

    // Paragraphs within one entry stay separated.
    expect(result).toMatch(/tsconfig\.json`\.\n\n/);

    // Two separate entries do not run together.
    expect(result).toMatch(
      /nothing else changes\.\n\nA second entry that must not glue/
    );

    // No blank line may open a category section, and none may be left
    // dangling at its end -- a trailing blank shows up as a triple newline
    // where the next `### ` section is joined on.
    expect(result).not.toMatch(/### \w+\n\n\n/);
    expect(result).not.toMatch(/\n\n\n/);
    expect(result).toMatch(
      /glue onto the first one\.\n\n### Removed\n\nA later category/
    );
  });

  it('falls back to Changed instead of dropping content with no category header', () => {
    const result = rewriteChangelog(NO_CATEGORY_HEADER_FIXTURE, '2026-08-18');

    // Regression: this content used to vanish entirely (empty v0.27.0 entry).
    expect(result).toContain('Cached registry files now expire.');
    expect(result).toContain('`theme install` accepts local registry paths.');
    expect(result).toContain('### Changed');
  });
});

// The generated CHANGELOG.md is committed by the release bot and then checked
// by `pnpm run format:check` in CI. Asserting the real prettier contract here
// keeps that failure in the unit lane, where it is cheap, instead of on the
// release PR, where it blocks a publish.
describe('generated changelog is prettier-clean', () => {
  const cases: Array<[string, string]> = [
    ['a standard multi-changeset entry', CHANGELOG_FIXTURE],
    ['hash-on-header-line changesets', MULTI_CHANGESET_HASH_FIXTURE],
    ['category-less prose changesets', NO_CATEGORY_HEADER_FIXTURE],
    ['multi-line bodies with a code fence', MULTILINE_BODY_FIXTURE],
  ];

  for (const [name, fixture] of cases) {
    it(`formats ${name} to prettier's markdown style`, async () => {
      const result = rewriteChangelog(fixture, TODAY);
      await expect(prettierCheck(result, { parser: 'markdown' })).resolves.toBe(
        true
      );
    });
  }
});

// `tidyBlankLines` is the whole of the blank-line policy, and the rules it
// balances pull against each other: some blanks must survive, others must not.
// Rather than hand-pick cases and hope they cover the interactions, enumerate
// EVERY sequence up to length 7 over an alphabet of {blank, prose, bullet} --
// 3,280 inputs -- and assert the invariants hold for all of them.
//
// It is a test-only export (see tests/AGENTS.md, "Internals Exported for Test
// Coverage"): it has no caller outside `parseCategories`, and is exported so
// these invariants can be asserted against the real function, not a copy.
describe('tidyBlankLines invariants (test-only export)', () => {
  const ALPHABET = ['', 'prose', '- bullet'];

  function* allInputs(maxLen: number): Generator<string[]> {
    for (let len = 0; len <= maxLen; len++) {
      const total = ALPHABET.length ** len;
      for (let n = 0; n < total; n++) {
        const arr: string[] = [];
        let k = n;
        for (let d = 0; d < len; d++) {
          arr.push(ALPHABET[k % ALPHABET.length]!);
          k = Math.floor(k / ALPHABET.length);
        }
        yield arr;
      }
    }
  }

  const isBlank = (l: string) => !l.trim();
  const isBullet = (l: string | undefined) => /^\s*- /.test(l ?? '');

  it('holds for every sequence up to length 7', () => {
    let checked = 0;
    const failures: string[] = [];

    const fail = (msg: string, input: string[], out: string[]) => {
      if (failures.length < 5) {
        failures.push(
          `${msg}\n  in:  ${JSON.stringify(input)}\n  out: ${JSON.stringify(out)}`
        );
      }
    };

    for (const input of allInputs(7)) {
      const out = tidyBlankLines(input);
      checked++;

      // A section never opens on a blank line.
      if (out.length > 0 && isBlank(out[0]!)) fail('leading blank', input, out);

      // A section never closes on a blank line. This is the invariant that
      // makes a separate trailing-trim pass unnecessary.
      if (out.length > 0 && isBlank(out[out.length - 1]!)) {
        fail('trailing blank', input, out);
      }

      for (let i = 1; i < out.length; i++) {
        // Blanks are collapsed to at most one, so prettier never sees a run.
        if (isBlank(out[i]!) && isBlank(out[i - 1]!)) {
          fail('stacked blanks', input, out);
        }
        // Rule 1: two single-line bullets stay tight.
        if (isBlank(out[i]!) && isBullet(out[i - 1]) && isBullet(out[i + 1])) {
          fail('bullets separated', input, out);
        }
      }

      // Non-blank content is never dropped, duplicated, or reordered. Only
      // the blank lines between them are up for negotiation.
      expect(out.filter((l) => !isBlank(l))).toEqual(
        input.filter((l) => !isBlank(l))
      );
    }

    expect(failures, failures.join('\n\n')).toEqual([]);
    // Sum of 3^len for len 0..7.
    expect(checked).toBe(3280);
  });
});

describe('parseLatestVersion', () => {
  it('extracts the first changesets version header', () => {
    expect(parseLatestVersion(CHANGELOG_FIXTURE)).toBe('0.20.0');
  });

  it('throws when no version header is present', () => {
    expect(() => parseLatestVersion(NO_HEADER_FIXTURE)).toThrow(
      /No version header/
    );
  });
});

describe('bumpAgentsVersion', () => {
  const AGENTS_LINE =
    '**Version**: 0.19.2 | **Stack**: TypeScript, Commander, Zod';

  it('rewrites the version while preserving the rest of the line', () => {
    expect(bumpAgentsVersion(AGENTS_LINE, '0.20.0')).toBe(
      '**Version**: 0.20.0 | **Stack**: TypeScript, Commander, Zod'
    );
  });

  it('is a no-op when the version already matches', () => {
    expect(bumpAgentsVersion(AGENTS_LINE, '0.19.2')).toBe(AGENTS_LINE);
  });

  it('leaves text without a Version line unchanged', () => {
    const text = '# AGENTS\n\nNo version marker here.\n';
    expect(bumpAgentsVersion(text, '0.20.0')).toBe(text);
  });
});
