import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { THEME_AGENT_COOKIE } from '../../src/kigumi-studio/theme-agent/constants.js';

/**
 * `start` creates the session (and its first run) for a chat id; `refresh`
 * only mints a new token for it. The chat id becomes a trigger.dev session
 * external id and a token scope, so it is held to a plain id alphabet.
 */
const SessionRequestSchema = z.object({
  intent: z.enum(['start', 'refresh']),
  chatId: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
});

/** The trigger.dev calls the access gate guards. Stubbed in tests. */
export interface ThemeAgentSessions {
  /** Start (or resume) the chat session for `chatId`, triggering its run. */
  start(chatId: string): Promise<{ publicAccessToken: string }>;
  /** Mint a fresh session-scoped token for an existing chat session. */
  refreshToken(chatId: string): Promise<string>;
}

export interface ThemeAgentSessionDeps {
  /** `THEME_AGENT_ACCESS_KEY`. Unset refuses every request. */
  accessKey: string | undefined;
  sessions: ThemeAgentSessions;
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const pair of header.split(';')) {
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    if (pair.slice(0, separator).trim() !== name) continue;
    const raw = pair.slice(separator + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      // A malformed escape is not the key either; compare the raw value.
      return raw;
    }
  }
  return undefined;
}

/**
 * Constant-time comparison. Both sides are hashed first so that inputs of
 * different lengths take the same path and `timingSafeEqual` never throws.
 */
function matchesAccessKey(candidate: string, accessKey: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(candidate), digest(accessKey));
}

function unauthorized(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * The Theme Agent's only server endpoint. Refuses any request whose access
 * cookie does not match `THEME_AGENT_ACCESS_KEY` before touching trigger.dev,
 * so nobody without the key can start a paid run.
 */
export async function handleThemeAgentSession(
  request: Request,
  { accessKey, sessions }: ThemeAgentSessionDeps
): Promise<Response> {
  const cookie = readCookie(request, THEME_AGENT_COOKIE);
  if (
    !accessKey ||
    cookie === undefined ||
    !matchesAccessKey(cookie, accessKey)
  ) {
    return unauthorized();
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    // Not JSON at all; answered like any other malformed body below.
    json = undefined;
  }
  const parsed = SessionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  const body = parsed.data;
  try {
    const publicAccessToken =
      body.intent === 'refresh'
        ? await sessions.refreshToken(body.chatId)
        : (await sessions.start(body.chatId)).publicAccessToken;
    return Response.json({ publicAccessToken });
  } catch (error) {
    // Only a caller holding the access key gets this far, so the reason is
    // safe to return; it is also logged for the Vercel function logs.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Theme Agent ${body.intent} failed:`, error);
    return Response.json(
      { error: `trigger.dev refused the request: ${reason}` },
      { status: 502 }
    );
  }
}
