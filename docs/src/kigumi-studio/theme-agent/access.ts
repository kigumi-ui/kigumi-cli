import { THEME_AGENT_COOKIE } from './constants';

/**
 * Whether the access cookie is present: without an own key, the Theme Agent
 * then answers on the trigger.dev task, and locks apply. Presence is enough
 * here: this only decides what is shown. The Vercel Function checks the
 * cookie's value before any run starts.
 */
export function hasThemeAgentAccess(cookie: string): boolean {
  return cookie
    .split(';')
    .some((pair) => pair.trim().startsWith(`${THEME_AGENT_COOKIE}=`));
}
