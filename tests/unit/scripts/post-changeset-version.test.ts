import { describe, expect, it } from 'vitest';
import {
  bumpAgentsVersion,
  parseLatestVersion,
  rewriteChangelog,
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
