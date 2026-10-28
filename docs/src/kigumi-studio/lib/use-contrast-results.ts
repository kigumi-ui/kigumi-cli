import { useMemo } from 'react';
import { useStudio } from '../contexts/StudioContext';
import { contrastResults, type ContrastResult } from '../theme-agent/contrast';
import { customThemeOf } from '../theme-agent/custom-theme';

/**
 * Every checked contrast pair of the custom theme as it is now, both modes,
 * recomputed on every change to its values: by hand, a preset, a generated
 * palette or the Theme Agent. Read at render time, never stored.
 */
export function useContrastResults(): ContrastResult[] {
  const { values } = useStudio();
  // Only the values reach the preview's colours: shadows and custom CSS
  // play no part in the check.
  return useMemo(
    () => contrastResults(customThemeOf(values, [], null)),
    [values]
  );
}
