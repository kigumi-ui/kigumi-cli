import { describe, it, expect } from 'vitest';
import { lineDiff } from '../theme-agent/css-diff';

describe('custom CSS diff', () => {
  it('marks the lines removed and added, keeping the unchanged ones', () => {
    expect(
      lineDiff(
        '.Button { text-transform: uppercase; }\n.Card { gap: 0; }',
        '.Button { text-transform: uppercase; }\n.Card::part(base) { border: none; }'
      )
    ).toEqual([
      { kind: 'same', text: '.Button { text-transform: uppercase; }' },
      { kind: 'removed', text: '.Card { gap: 0; }' },
      { kind: 'added', text: '.Card::part(base) { border: none; }' },
    ]);
  });

  it('shows everything as added when there was no custom CSS', () => {
    expect(lineDiff('', '.Card { gap: 0; }')).toEqual([
      { kind: 'added', text: '.Card { gap: 0; }' },
    ]);
  });

  it('shows everything as removed when the proposal removes the custom CSS', () => {
    expect(lineDiff('.Card { gap: 0; }', '')).toEqual([
      { kind: 'removed', text: '.Card { gap: 0; }' },
    ]);
  });

  it('keeps a line that moved past an insertion', () => {
    expect(lineDiff('a\nb\nc', 'a\nx\nb\nc').map((l) => l.kind)).toEqual([
      'same',
      'added',
      'same',
      'same',
    ]);
  });
});
