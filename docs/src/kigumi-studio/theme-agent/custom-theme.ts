import { z } from 'zod';

// Shared by the browser and the trigger.dev task (docs/trigger).

/**
 * The custom theme being edited: every sidebar value per mode, as Studio
 * stores it (sliders without their unit), plus the components that get a
 * shadow (`className` values from `SHADOW_COMPONENTS`).
 */
export interface CustomTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
  shadowComponents: string[];
}

export const customThemeSchema = z.object({
  light: z.record(z.string(), z.string()),
  dark: z.record(z.string(), z.string()),
  shadowComponents: z.array(z.string()),
});

export type ThemeAgentMode = 'light' | 'dark';

export const THEME_AGENT_MODES: readonly ThemeAgentMode[] = ['light', 'dark'];

/** One string per shadow component list; order and duplicates do not count. */
export function componentListKey(list: string[]): string {
  return [...new Set(list)].sort().join('\n');
}

/**
 * What every message to the Theme Agent carries. The task trusts it alone for
 * current values, never its memory of earlier turns.
 */
export interface ThemeAgentSnapshot {
  theme: CustomTheme;
  /**
   * Values the user locked in the sidebar: CSS custom properties, and
   * `shadowComponents` for the shadow component list.
   */
  locked: string[];
}

export const themeAgentSnapshotSchema = z.object({
  theme: customThemeSchema,
  // A page from before locks sends none; the task is deployed by hand, so
  // it may be newer than the page talking to it.
  locked: z.array(z.string()).default([]),
});

export function cloneTheme(theme: CustomTheme): CustomTheme {
  return {
    light: { ...theme.light },
    dark: { ...theme.dark },
    shadowComponents: [...theme.shadowComponents],
  };
}

/**
 * The task's `clientDataSchema`. trigger.dev also parses a run's boot and
 * preload payloads with it, and those carry no message, so no snapshot. A
 * message without one is refused in the task's `run`.
 */
export const themeAgentClientDataSchema = themeAgentSnapshotSchema.optional();
