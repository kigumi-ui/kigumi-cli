import { useCallback, useEffect, useRef } from 'react';
import { useStudio } from '../contexts/StudioContext';
import { THEME_MODES, type LockedValues } from '../lib/locks';
import { customThemeOf, type CustomTheme } from './custom-theme';

/**
 * The Theme Agent's thin adapter onto Studio: read the custom theme and its
 * locked values as the sidebar has them now, and apply a custom theme
 * through Studio's own value-setting path. `setLocked` is Studio's own, for
 * "Unlock and apply" and for Undo locking again what that unlocked.
 * `lockedValues` is the render-time value, for what the chat shows;
 * `onThemeReplaced` tells when the whole theme is replaced, which ends the
 * conversation.
 */
export function useThemeAgentStudio() {
  const {
    values,
    shadowComponents,
    customCSS,
    lockedValues,
    importValues,
    setShadowComponents,
    setCustomCSS,
    setLocked,
    onThemeReplaced,
  } = useStudio();

  // Read at event time (send, answer finished), not at render time.
  const latest = useRef({ values, shadowComponents, customCSS, lockedValues });
  useEffect(() => {
    latest.current = { values, shadowComponents, customCSS, lockedValues };
  }, [values, shadowComponents, customCSS, lockedValues]);

  const currentTheme = useCallback(
    (): CustomTheme =>
      customThemeOf(
        latest.current.values,
        latest.current.shadowComponents,
        latest.current.customCSS
      ),
    []
  );

  const locked = useCallback(
    (): LockedValues => latest.current.lockedValues,
    []
  );

  const applyTheme = useCallback(
    (theme: CustomTheme) => {
      const now = currentTheme();
      const imported: Record<string, { light?: string; dark?: string }> = {};
      for (const mode of THEME_MODES) {
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
      if (theme.customCSS !== now.customCSS) {
        setCustomCSS(theme.customCSS || null);
      }
    },
    [currentTheme, importValues, setShadowComponents, setCustomCSS]
  );

  return {
    currentTheme,
    locked,
    lockedValues,
    applyTheme,
    setLocked,
    onThemeReplaced,
  };
}
