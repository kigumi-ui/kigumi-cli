import { useCallback, useEffect, useRef } from 'react';
import { useStudio } from '../contexts/StudioContext';
import type { ThemeValue } from '../lib/defaults';
import type { ThemeAgentConversation } from './conversation';
import {
  componentListKey,
  THEME_AGENT_MODES,
  type CustomTheme,
} from './custom-theme';
import { SHADOW_COMPONENTS_KEY } from './proposal';

function toTheme(
  values: Record<string, ThemeValue>,
  shadowComponents: string[]
): CustomTheme {
  const theme: CustomTheme = {
    light: {},
    dark: {},
    shadowComponents: [...shadowComponents],
  };
  for (const [cssVar, value] of Object.entries(values)) {
    theme.light[cssVar] = value.light;
    theme.dark[cssVar] = value.dark;
  }
  return theme;
}

/**
 * The Theme Agent's thin adapter onto Studio: read the custom theme as the
 * sidebar has it now, apply one through Studio's own value-setting path, and
 * report every other change to the conversation as a user edit. Edits are
 * found by comparing each committed theme with the one before, so every
 * editing path counts (sidebar controls, section resets, import), and the
 * Theme Agent's own changes are left out by value.
 */
export function useThemeAgentStudio(conversation: ThemeAgentConversation) {
  const { values, shadowComponents, importValues, setShadowComponents } =
    useStudio();

  // Read at event time (send, answer finished), not at render time.
  const latest = useRef({ values, shadowComponents });
  const previous = useRef<CustomTheme>(toTheme(values, shadowComponents));
  // What applyTheme is about to write, per mode and custom property (or the
  // shadow list): seen in the next commit, it is not a user edit.
  const pending = useRef(new Map<string, string>());

  useEffect(() => {
    latest.current = { values, shadowComponents };
    const now = toTheme(values, shadowComponents);
    const before = previous.current;
    previous.current = now;

    let landed = false;
    const isApplied = (key: string, value: string) => {
      if (pending.current.get(key) !== value) return false;
      landed = true;
      return true;
    };
    for (const mode of THEME_AGENT_MODES) {
      for (const [cssVar, value] of Object.entries(now[mode])) {
        if (before[mode][cssVar] === value) continue;
        if (!isApplied(`${mode} ${cssVar}`, value)) {
          conversation.userEdited(cssVar, mode);
        }
      }
    }
    const list = componentListKey(now.shadowComponents);
    if (
      list !== componentListKey(before.shadowComponents) &&
      !isApplied(SHADOW_COMPONENTS_KEY, list)
    ) {
      conversation.userEditedShadowComponents();
    }
    // An apply lands in one commit; nothing of it is still to come.
    if (landed) pending.current.clear();
  }, [values, shadowComponents, conversation]);

  const currentTheme = useCallback(
    (): CustomTheme =>
      toTheme(latest.current.values, latest.current.shadowComponents),
    []
  );

  const applyTheme = useCallback(
    (theme: CustomTheme) => {
      const now = toTheme(
        latest.current.values,
        latest.current.shadowComponents
      );
      // A new apply supersedes anything an earlier one left unseen.
      pending.current.clear();
      const imported: Record<string, { light?: string; dark?: string }> = {};
      for (const mode of THEME_AGENT_MODES) {
        for (const [cssVar, value] of Object.entries(theme[mode])) {
          if (now[mode][cssVar] === value) continue;
          pending.current.set(`${mode} ${cssVar}`, value);
          // Both modes: importValues copies a light-only value into dark
          // for a mode-independent property.
          imported[cssVar] = {
            light: theme.light[cssVar],
            dark: theme.dark[cssVar],
          };
        }
      }
      const list = componentListKey(theme.shadowComponents);
      if (list !== componentListKey(now.shadowComponents)) {
        pending.current.set(SHADOW_COMPONENTS_KEY, list);
      }
      importValues(imported);
      setShadowComponents([...theme.shadowComponents]);
    },
    [importValues, setShadowComponents]
  );

  return { currentTheme, applyTheme };
}
