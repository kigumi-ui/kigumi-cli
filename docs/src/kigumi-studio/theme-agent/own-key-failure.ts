// Why an answer on the own-key path failed, as the chat reports it. An
// invalid key gets a 401 without CORS headers, so the browser sees a failed
// fetch and cannot tell a wrong key from a lost connection (ADR 0017); only
// an error whose status the browser can read gets its own reason.
//
// The answer runs in its own chunk and reaches the chat as an error stream
// chunk, which carries only text: `ownKeyFailureText()` encodes the failure
// there and `ownKeyFailure()` reads it back in the chat.

export interface OwnKeyFailure {
  /** What happened, and whether to wait or what to do. */
  message: string;
  /** Whether the fix is likely in the settings: the chat offers a button. */
  settings: boolean;
}

const UNANSWERED: OwnKeyFailure = {
  message:
    'Anthropic did not answer. Likely causes: a wrong API key, no credit left on your Anthropic account, or a lost connection. Once it is fixed, send your message again.',
  settings: true,
};

const PREFIX = 'kigumi-own-key-failure:';

/** The status and Anthropic's message, when the browser could read them. */
function readableError(
  error: unknown
): { status: number; reason: string } | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  // The AI SDK's RetryError: the last attempt says why.
  if ('lastError' in error) return readableError(error.lastError);
  // An APICallError, or the plain error object of an error event mid-stream.
  if (!('statusCode' in error) || typeof error.statusCode !== 'number') {
    return undefined;
  }
  const reason =
    'message' in error && typeof error.message === 'string'
      ? error.message.trim().replace(/\.$/, '')
      : '';
  return { status: error.statusCode, reason };
}

function failure(error: unknown): OwnKeyFailure {
  const readable = readableError(error);
  if (!readable) return UNANSWERED;
  const { status, reason } = readable;
  const because = reason ? `: ${reason}.` : '.';
  if (status === 429) {
    return {
      message: `Anthropic is rate limiting your API key${because} Wait a minute, then send your message again.`,
      settings: false,
    };
  }
  if (status === 529 || status === 503) {
    return {
      message: `Anthropic is overloaded right now${because} Wait a few minutes, then send your message again.`,
      settings: false,
    };
  }
  if (status >= 500) {
    return {
      message: `Anthropic could not answer${because} Wait a moment, then send your message again.`,
      settings: false,
    };
  }
  if (status === 401 || status === 403) {
    return {
      message: `Anthropic refused your API key${because} Check the key in the settings, then send your message again.`,
      settings: true,
    };
  }
  return {
    message: `Anthropic refused the request${because} Fix what it names, then send your message again.`,
    settings: false,
  };
}

/** The error chunk's text for a failed own-key answer. */
export function ownKeyFailureText(error: unknown): string {
  return PREFIX + JSON.stringify(failure(error));
}

/**
 * The failure `ownKeyFailureText()` encoded in `error`. Any other error on
 * the own-key path, a chunk that did not load for one, is a failure the
 * browser could not read.
 */
export function ownKeyFailure(error: Error): OwnKeyFailure {
  if (!error.message.startsWith(PREFIX)) return UNANSWERED;
  try {
    const decoded: unknown = JSON.parse(error.message.slice(PREFIX.length));
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'message' in decoded &&
      typeof decoded.message === 'string' &&
      'settings' in decoded &&
      typeof decoded.settings === 'boolean'
    ) {
      return { message: decoded.message, settings: decoded.settings };
    }
  } catch {
    // Not the encoding: reported as unreadable below.
  }
  return UNANSWERED;
}
