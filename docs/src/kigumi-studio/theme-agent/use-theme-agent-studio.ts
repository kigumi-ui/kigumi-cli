import { useCallback, useEffect, useRef } from 'react';
import { useStudio } from '../contexts/StudioContext';
import type { CustomTheme } from './custom-theme';

/**
 * The Theme Agent's thin adapter onto Studio: read the custom theme as the
 * sidebar has it now, and apply one through Studio's own value-setting path.
 */
export function useThemeAgentStudio() {
  const { values, shadowComponents, importValues, setShadowComponents } =
    useStudio();

  // Read at event time (send, answer finished), not at render time.
  const latest = useRef({ values, shadowComponents });
  useEffect(() => {
    latest.current = { values, shadowComponents };
  }, [values, shadowComponents]);

  const currentTheme = useCallback((): CustomTheme => {
    const theme: CustomTheme = {
      light: {},
      dark: {},
      shadowComponents: [...latest.current.shadowComponents],
    };
    for (const [cssVar, value] of Object.entries(latest.current.values)) {
      theme.light[cssVar] = value.light;
      theme.dark[cssVar] = value.dark;
    }
    return theme;
  }, []);

  const applyTheme = useCallback(
    (theme: CustomTheme) => {
      const imported: Record<string, { light?: string; dark?: string }> = {};
      for (const [cssVar, value] of Object.entries(theme.light)) {
        imported[cssVar] = { ...imported[cssVar], light: value };
      }
      for (const [cssVar, value] of Object.entries(theme.dark)) {
        imported[cssVar] = { ...imported[cssVar], dark: value };
      }
      importValues(imported);
      setShadowComponents([...theme.shadowComponents]);
    },
    [importValues, setShadowComponents]
  );

  return { currentTheme, applyTheme };
}
