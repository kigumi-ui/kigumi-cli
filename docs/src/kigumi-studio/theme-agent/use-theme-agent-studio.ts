import { useCallback, useEffect, useRef } from 'react';
import { useStudio } from '../contexts/StudioContext';
import type { LockedValues } from '../lib/locks';
import { THEME_AGENT_MODES, type CustomTheme } from './custom-theme';

/**
 * The Theme Agent's thin adapter onto Studio: read the custom theme and its
 * locked values as the sidebar has them now, and apply a custom theme
 * through Studio's own value-setting path. `setLocked` is Studio's own, for
 * "Unlock and apply" and for Undo locking again what that unlocked.
 */
export function useThemeAgentStudio() {
  const {
    values,
    shadowComponents,
    lockedValues,
    importValues,
    setShadowComponents,
    setLocked,
  } = useStudio();

  // Read at event time (send, answer finished), not at render time.
  const latest = useRef({ values, shadowComponents, lockedValues });
  useEffect(() => {
    latest.current = { values, shadowComponents, lockedValues };
  }, [values, shadowComponents, lockedValues]);

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

  const locked = useCallback(
    (): LockedValues => latest.current.lockedValues,
    []
  );

  const applyTheme = useCallback(
    (theme: CustomTheme) => {
      const now = currentTheme();
      const imported: Record<string, { light?: string; dark?: string }> = {};
      for (const mode of THEME_AGENT_MODES) {
        for (const [cssVar, value] of Object.entries(theme[mode])) {
          if (now[mode][cssVar] === value) continue;
          // Both modes: importValues copies a light-only value into dark
          // for a mode-independent property.
          imported[cssVar] = {
            light: theme.light[cssVar],
            dark: theme.dark[cssVar],
          };
        }
      }
      importValues(imported);
      setShadowComponents([...theme.shadowComponents]);
    },
    [currentTheme, importValues, setShadowComponents]
  );

  return { currentTheme, locked, applyTheme, setLocked };
}
