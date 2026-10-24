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
 * Values named per mode by CSS custom property (a mode-independent value is
 * listed in both), plus whether the shadow component list is one of them.
 */
export interface ThemeValueSet {
  light: string[];
  dark: string[];
  shadowComponents: boolean;
}

const themeValueSetSchema = z.object({
  light: z.array(z.string()),
  dark: z.array(z.string()),
  shadowComponents: z.boolean(),
});

/**
 * What every message to the Theme Agent carries. The task trusts it alone for
 * current values, never its memory of earlier turns.
 */
export interface ThemeAgentSnapshot {
  theme: CustomTheme;
  /** Values the user set by hand during this conversation, kept ones included. */
  handSet: ThemeValueSet;
  /** Hand-set values the user chose to keep when the agent asked to change them. */
  kept: ThemeValueSet;
}

// A tab opened before hand-set values existed sends neither list; the task
// is deployed by hand, so it may be newer than the page talking to it.
const noValues = () => ({ light: [], dark: [], shadowComponents: false });

export const themeAgentSnapshotSchema = z.object({
  theme: customThemeSchema,
  handSet: themeValueSetSchema.default(noValues),
  kept: themeValueSetSchema.default(noValues),
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
