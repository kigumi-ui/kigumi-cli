/** One line of a diff: in both texts, only in the old one, or only in the new. */
export interface DiffLine {
  kind: 'same' | 'removed' | 'added';
  text: string;
}

function lines(text: string): string[] {
  return text === '' ? [] : text.split('\n');
}

/**
 * The line diff from `was` to `now`, as a held custom CSS change shows it:
 * the longest run of common lines kept, the rest removed, then added.
 */
export function lineDiff(was: string, now: string): DiffLine[] {
  const a = lines(was);
  const b = lines(now);
  // common[i][j]: the longest common subsequence of a[i..] and b[j..].
  const common = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      common[i][j] =
        a[i] === b[j]
          ? common[i + 1][j + 1] + 1
          : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }
  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      diff.push({ kind: 'same', text: a[i] });
      i++;
      j++;
    } else if (common[i + 1][j] >= common[i][j + 1]) {
      diff.push({ kind: 'removed', text: a[i++] });
    } else {
      diff.push({ kind: 'added', text: b[j++] });
    }
  }
  while (i < a.length) diff.push({ kind: 'removed', text: a[i++] });
  while (j < b.length) diff.push({ kind: 'added', text: b[j++] });
  return diff;
}
