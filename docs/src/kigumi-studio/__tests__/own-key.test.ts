import { describe, expect, it } from 'vitest';
import { ownKeyProblem } from '../theme-agent/own-key';

describe('ownKeyProblem', () => {
  it('accepts a key whatever it starts with, so a new Anthropic prefix still works', () => {
    const key = `another-prefix-placeholder-${'x'.repeat(80)}`;
    expect(ownKeyProblem(key)).toBeUndefined();
  });
});
