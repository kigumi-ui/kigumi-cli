/**
 * Post-changeset-version Tests
 *
 * The release flow bumps package.json, then this script drags the hand-written
 * version markers along. llms.txt was not covered, so every release shipped a
 * release PR that failed `validate:generated-fresh` check E until someone
 * hand-edited it.
 *
 * The dangerous part is that llms.txt carries TWO "version" keys: the CLI's own
 * version, and Web Awesome's nested inside a `package` object. Only the first
 * may move. These tests pin that down.
 */

import { describe, it, expect } from 'vitest';
import {
  bumpAgentsVersion,
  bumpLlmsVersion,
} from '../../scripts/post-changeset-version.js';

/** The shape of the sample payload as it appears in llms.txt. */
const SAMPLE = `Output schema:
\`\`\`json
{
  "version": "0.27.0",
  "tier": "free",
  "package": { "package": "@awesome.me/webawesome", "version": "3.10.0" },
  "components": ["Button"]
}
\`\`\``;

describe('bumpLlmsVersion', () => {
  it('bumps the CLI version', () => {
    expect(bumpLlmsVersion(SAMPLE, '0.27.1')).toContain('"version": "0.27.1"');
  });

  it('leaves the nested Web Awesome version alone', () => {
    // The whole point: a greedy replace would rewrite WA's version too, which
    // tracks Web Awesome, not the CLI.
    const out = bumpLlmsVersion(SAMPLE, '0.27.1');

    expect(out).toContain(
      '"package": { "package": "@awesome.me/webawesome", "version": "3.10.0" }'
    );
  });

  it('rewrites exactly one version key', () => {
    const out = bumpLlmsVersion(SAMPLE, '0.99.0');

    expect(out.match(/"version":\s*"0\.99\.0"/g)).toHaveLength(1);
  });

  it('is idempotent', () => {
    const once = bumpLlmsVersion(SAMPLE, '0.27.1');

    expect(bumpLlmsVersion(once, '0.27.1')).toBe(once);
  });

  it('handles prerelease versions', () => {
    expect(bumpLlmsVersion(SAMPLE, '1.0.0-beta.1')).toContain(
      '"version": "1.0.0-beta.1"'
    );
  });

  it('leaves text without a version key untouched', () => {
    const text = 'no version key here';

    expect(bumpLlmsVersion(text, '0.27.1')).toBe(text);
  });
});

describe('bumpAgentsVersion', () => {
  it('bumps the version marker', () => {
    const line = '**Version**: 0.27.0 | **Stack**: TypeScript';

    expect(bumpAgentsVersion(line, '0.27.1')).toBe(
      '**Version**: 0.27.1 | **Stack**: TypeScript'
    );
  });

  it('handles prerelease versions', () => {
    const line = '**Version**: 1.0.0-beta.1 | **Stack**: TypeScript';

    expect(bumpAgentsVersion(line, '1.0.0')).toBe(
      '**Version**: 1.0.0 | **Stack**: TypeScript'
    );
  });
});
