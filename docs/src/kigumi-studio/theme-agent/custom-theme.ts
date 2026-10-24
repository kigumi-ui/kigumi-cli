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

/**
 * What every message to the Theme Agent carries. The task trusts it alone for
 * current values, never its memory of earlier turns.
 */
export interface ThemeAgentSnapshot {
  theme: CustomTheme;
}

export const themeAgentSnapshotSchema = z.object({
  theme: customThemeSchema,
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
