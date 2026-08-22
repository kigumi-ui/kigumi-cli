import { describe, expect, it } from 'vitest';
import {
  checkChangesetFormat,
  stripFrontmatter,
} from '../../../scripts/validate-changesets.js';

const WITH_HEADER = `---
'kigumi': patch
---

### Fixed

- **Some scope.** What was broken and what changed.
`;

// Real-world shape of the 8 changesets that produced an empty v0.27.0
// CHANGELOG.md entry: plain bold-prose with no ### Category header.
const NO_HEADER = `---
'kigumi': patch
---

**Some scope.** What was broken and what changed.
`;

const EMPTY_BODY = `---
'kigumi': patch
---
`;

describe('stripFrontmatter', () => {
  it('removes the frontmatter block, leaving only the summary', () => {
    expect(stripFrontmatter(WITH_HEADER).trim()).toBe(
      '### Fixed\n\n- **Some scope.** What was broken and what changed.'
    );
  });
});

describe('checkChangesetFormat', () => {
  it('passes a changeset with a valid category header', () => {
    expect(checkChangesetFormat('fix-scope.md', WITH_HEADER)).toBeNull();
  });

  it('rejects a changeset with no category header', () => {
    const error = checkChangesetFormat('fix-scope.md', NO_HEADER);
    expect(error).toContain('fix-scope.md');
    expect(error).toContain('missing a Keep a Changelog category header');
  });

  it('rejects a changeset with an empty body', () => {
    const error = checkChangesetFormat('empty.md', EMPTY_BODY);
    expect(error).toContain('empty.md');
    expect(error).toContain('empty');
  });

  it('accepts any of the documented Keep a Changelog categories', () => {
    for (const category of [
      'Breaking Changes',
      'Added',
      'Changed',
      'Fixed',
      'Deprecated',
      'Removed',
      'Security',
    ]) {
      const content = `---\n'kigumi': patch\n---\n\n### ${category}\n\n- **Scope.** Description.\n`;
      expect(checkChangesetFormat('x.md', content)).toBeNull();
    }
  });
});
