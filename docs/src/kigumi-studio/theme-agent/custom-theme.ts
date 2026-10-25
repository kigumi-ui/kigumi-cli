import { z } from 'zod';
import { parseLocks, type LockedValues } from '../lib/locks';

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
  /** Values the user locked in the sidebar, per mode. */
  locked: LockedValues;
  /**
   * What Studio did with the agent's last answer, which the task cannot see:
   * applied, nothing applied, refused (with why), or undone by the user,
   * and the locked values it held. Absent before the first answer.
   */
  previous?: PreviousAnswer;
}

export interface PreviousAnswer {
  status: 'applied' | 'unchanged' | 'rejected' | 'undone';
  /**
   * The locked values it proposed that Studio did not change, as
   * `describeLocks()` writes them.
   */
  held: string[];
  /** Why Studio refused it. */
  errors: string[];
}

const previousAnswerSchema = z.object({
  status: z.enum(['applied', 'unchanged', 'rejected', 'undone']),
  held: z.array(z.string()),
  errors: z.array(z.string()),
});

export const themeAgentSnapshotSchema = z.object({
  theme: customThemeSchema,
  previous: previousAnswerSchema.optional(),
  // The task is deployed by hand, so the page talking to it may be older
  // and send no locks, or another shape. Anything unreadable lists no locks
  // in the prompt, and the page still holds what it locked.
  locked: z.unknown().optional().transform(parseLocks),
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
