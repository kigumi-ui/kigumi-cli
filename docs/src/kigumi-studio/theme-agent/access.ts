import { THEME_AGENT_COOKIE } from './constants';

/**
 * Whether the Theme Agent entry point should render. Presence of the access
 * cookie is enough here: this only decides what is shown. The Vercel Function
 * checks the cookie's value before any run starts.
 */
export function hasThemeAgentAccess(cookie: string): boolean {
  return cookie
    .split(';')
    .some((pair) => pair.trim().startsWith(`${THEME_AGENT_COOKIE}=`));
}
