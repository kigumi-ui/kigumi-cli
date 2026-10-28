import type { ContrastResult } from '../../theme-agent/contrast';

/**
 * A pair's result in words, which carry it without the icon or colour: why a
 * pair with no ratio fails, too. With both colours resolved, the missing ratio
 * is a translucent background, whose contrast depends on what lies under it.
 */
export function resultText(result: ContrastResult): string {
  if (result.passes) return 'Passes';
  if (result.ratio !== null) return 'Fails';
  return result.foregroundSwatch && result.backgroundSwatch
    ? 'Fails: the background is translucent, so its contrast depends on what lies under it'
    : 'Fails: a colour could not be resolved';
}
