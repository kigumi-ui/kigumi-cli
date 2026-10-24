import { useCallback, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
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
 * editing path counts (sidebar controls, section resets, import). An apply
 * commits synchronously, and only what it writes, in that commit, is left
 * out.
 */
export function useThemeAgentStudio(conversation: ThemeAgentConversation) {
  const { values, shadowComponents, importValues, setShadowComponents } =
    useStudio();

  // Read at event time (send, answer finished), not at render time.
  const latest = useRef({ values, shadowComponents });
  const previous = useRef<CustomTheme>(toTheme(values, shadowComponents));
  // While an apply commits: what it writes, by `mode cssVar` (or the shadow
  // list key). Empty at every other time, so nothing an apply leaves behind
  // can swallow a later hand edit.
  const applying = useRef<ReadonlySet<string>>(new Set());

  // A layout effect runs inside the commit, so inside applyTheme's flushSync.
  useLayoutEffect(() => {
    latest.current = { values, shadowComponents };
    const now = toTheme(values, shadowComponents);
    const before = previous.current;
    previous.current = now;

    for (const mode of THEME_AGENT_MODES) {
      for (const [cssVar, value] of Object.entries(now[mode])) {
        if (before[mode][cssVar] === value) continue;
        if (!applying.current.has(`${mode} ${cssVar}`)) {
          conversation.userEdited(cssVar, mode);
        }
      }
    }
    if (
      componentListKey(now.shadowComponents) !==
        componentListKey(before.shadowComponents) &&
      !applying.current.has(SHADOW_COMPONENTS_KEY)
    ) {
      conversation.userEditedShadowComponents();
    }
  }, [values, shadowComponents, conversation]);

  const currentTheme = useCallback(
    (): CustomTheme =>
      toTheme(latest.current.values, latest.current.shadowComponents),
    []
  );

  const applyTheme = useCallback(
    (theme: CustomTheme) => {
      const now = currentTheme();
      const writes = new Set<string>();
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
          writes.add(`light ${cssVar}`).add(`dark ${cssVar}`);
        }
      }
      if (
        componentListKey(theme.shadowComponents) !==
        componentListKey(now.shadowComponents)
      ) {
        writes.add(SHADOW_COMPONENTS_KEY);
      }
      applying.current = writes;
      try {
        flushSync(() => {
          importValues(imported);
          setShadowComponents([...theme.shadowComponents]);
        });
      } finally {
        applying.current = new Set();
      }
    },
    [currentTheme, importValues, setShadowComponents]
  );

  return { currentTheme, applyTheme };
}
