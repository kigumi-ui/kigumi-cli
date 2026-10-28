import { describe, it, expect } from 'vitest';
import { contrastResults, formatRatio } from '../theme-agent/contrast';
import { resultText } from '../components/console/contrast-result-text';
import type { CustomTheme } from '../theme-agent/custom-theme';

function theme(light: Record<string, string>): CustomTheme {
  return { light, dark: {}, shadowComponents: [], customCSS: '' };
}

function lightResult(t: CustomTheme, foreground: string, background: string) {
  const result = contrastResults(t).find(
    (candidate) =>
      candidate.mode === 'light' &&
      candidate.foreground === foreground &&
      candidate.background === background
  );
  if (!result) throw new Error('pair not found');
  return result;
}

describe('The Accessibility tab: what each result says', () => {
  it('says a passing pair passes', () => {
    const result = lightResult(
      theme({ '--wa-color-text-normal': '#1a1a1a' }),
      '--wa-color-text-normal',
      '--wa-color-surface-raised'
    );
    expect(resultText(result)).toBe('Passes');
  });

  it('says a pair under its minimum fails', () => {
    const result = lightResult(
      theme({ '--wa-color-text-quiet': '#949494' }),
      '--wa-color-text-quiet',
      '--wa-color-surface-raised'
    );
    expect(resultText(result)).toBe('Fails');
  });

  it('says a translucent background is translucent, not unresolved', () => {
    const result = lightResult(
      theme({ '--wa-color-surface-raised': 'rgb(255 255 255 / 50%)' }),
      '--wa-color-text-normal',
      '--wa-color-surface-raised'
    );
    expect(result.ratio).toBeNull();
    expect(resultText(result)).toBe(
      'Fails: the background is translucent, so its contrast depends on what lies under it'
    );
  });

  it('says a colour it cannot resolve could not be resolved', () => {
    const result = lightResult(
      theme({ '--wa-color-surface-raised': 'color(display-p3 1 1 1)' }),
      '--wa-color-text-normal',
      '--wa-color-surface-raised'
    );
    expect(resultText(result)).toBe('Fails: a colour could not be resolved');
  });
});

describe('formatRatio: never rounded up to a pass', () => {
  it.each([
    [4.4999, '4.49:1'],
    [4.5, '4.50:1'],
    [3.0399, '3.03:1'],
    [21, '21.00:1'],
  ])('shows %f as %s', (ratio, shown) => {
    expect(formatRatio(ratio)).toBe(shown);
  });
});
