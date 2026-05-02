import { describe, expect, it } from 'vitest';
import { rewriteChangelog } from '../../../scripts/post-changeset-version.js';

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
});
