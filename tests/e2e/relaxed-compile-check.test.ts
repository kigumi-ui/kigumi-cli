/**
 * The relaxed generate-then-tsc integration check stays until a later
 * ticket removes it (issue #73). Kept out of the consumer tracer: that
 * file proves init + add --all + strict tsc, and this one only pins the
 * older check.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

const RELAXED_COMPILE_CHECK = path.resolve(
  __dirname,
  '../integration/compile-check.test.ts'
);

describe('relaxed integration compile check', () => {
  it('is still present, with strict mode off', async () => {
    const source = await fs.readFile(RELAXED_COMPILE_CHECK, 'utf8');
    expect(source).toContain(
      'strict: false, // Relax strict mode for generated code'
    );
  });
});
