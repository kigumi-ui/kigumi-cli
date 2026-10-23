// Shared by the browser, the Vercel Function (docs/api) and the trigger.dev
// task (docs/trigger), so the three cannot drift apart. Plain values only:
// this file is compiled for the browser and for Node.

/**
 * The access cookie. Its presence shows the Theme Agent in Studio; the Vercel
 * Function compares its value with `THEME_AGENT_ACCESS_KEY`. Set by hand.
 */
export const THEME_AGENT_COOKIE = 'kigumi-theme-agent';

/** The trigger.dev `chat.agent` task id. */
export const THEME_AGENT_TASK_ID = 'theme-agent';

/** The Vercel Function that starts chat sessions and mints their tokens. */
export const THEME_AGENT_ENDPOINT = '/api/theme-agent';

/** The tool the Theme Agent proposes a custom theme with. */
export const THEME_AGENT_PROPOSE_TOOL = 'propose_theme';

/** Status steps the task streams while it works, shown in the chat. */
export const THEME_AGENT_STATUS = {
  drafting: 'Drafting…',
} as const;
