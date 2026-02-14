import { describe, it, expect } from 'vitest';
import { filenameToDisplayName } from '../lib/preset-loader';

describe('filenameToDisplayName', () => {
  it('converts kebab-case to title case', () => {
    expect(filenameToDisplayName('neo-brutalism')).toBe('Neo Brutalism');
  });

  it('handles single word names', () => {
    expect(filenameToDisplayName('monochrome')).toBe('Monochrome');
  });

  it('handles multi-word names', () => {
    expect(filenameToDisplayName('warm-earth')).toBe('Warm Earth');
  });

  it('handles three-word names', () => {
    expect(filenameToDisplayName('deep-ocean-blue')).toBe('Deep Ocean Blue');
  });
});
