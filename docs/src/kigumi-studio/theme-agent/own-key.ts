import type { LanguageModel } from 'ai';
import type { ThemeAgentTransport } from '../components/theme-agent/ThemeAgentChat';

// The own key: an Anthropic API key the user enters in the Theme Agent's
// settings. With one, the Theme Agent runs in the browser and calls
// Anthropic directly (ADR 0017). Kept in the tab's sessionStorage, like the
// conversation (ADR 0014): closing the tab forgets it.

const OWN_KEY_KEY = 'kigumi-studio-theme-agent-own-key';

const KEY_PREFIX = 'sk-ant-api';
// Anthropic's API keys are 108 characters today; the range leaves room for
// a format change without letting a truncated paste through.
const MIN_KEY_LENGTH = 90;
const MAX_KEY_LENGTH = 250;

/**
 * Why `value` is not shaped like an Anthropic API key, or `undefined` when
 * it is. Only the form is checked: a wrong key is found by Anthropic, whose
 * 401 the browser cannot read (ADR 0017).
 */
export function ownKeyProblem(value: string): string | undefined {
  const key = value.trim();
  if (!key) return 'Enter an Anthropic API key.';
  if (!key.startsWith(KEY_PREFIX)) {
    return `An Anthropic API key starts with ${KEY_PREFIX}.`;
  }
  if (!/^[A-Za-z0-9_-]+$/.test(key)) {
    return 'An Anthropic API key holds only letters, digits, hyphens and underscores; check what you pasted.';
  }
  if (key.length < MIN_KEY_LENGTH) {
    return 'This is too short for an Anthropic API key; check that you pasted all of it.';
  }
  if (key.length > MAX_KEY_LENGTH) {
    return 'This is longer than an Anthropic API key; check that you pasted only the key.';
  }
  return undefined;
}

/** The own key this tab saved, `null` without one or without storage. */
export function loadOwnKey(): string | null {
  try {
    return sessionStorage.getItem(OWN_KEY_KEY);
  } catch {
    // Storage blocked: no key was saved.
    return null;
  }
}

/** Keep `key` for this tab. `false` when storage is blocked: nothing kept. */
export function saveOwnKey(key: string): boolean {
  try {
    sessionStorage.setItem(OWN_KEY_KEY, key);
    return true;
  } catch (err) {
    console.warn('Own key not kept for the tab:', err);
    return false;
  }
}

export function removeOwnKey(): void {
  try {
    sessionStorage.removeItem(OWN_KEY_KEY);
  } catch {
    // Storage blocked: nothing was saved to remove.
  }
}

/**
 * The answer loop, the AI SDK and the Anthropic provider, in their own
 * chunk: fetched only once an own key is saved.
 */
export function loadOwnKeyAnswer() {
  return import('./own-key-answer');
}

interface OwnKeyTransportOptions {
  /** Replaces the Anthropic model, for the interaction stories. */
  model?: LanguageModel;
}

/**
 * The Theme Agent transport for an own key: each message is answered in the
 * browser by `themeAgentTurn()`, the trigger.dev task's answer loop, and
 * streamed in the shape the task streams. The key is read from the tab when
 * a message is sent, so replacing it keeps the conversation. Nothing outside
 * the tab writes the answer, so there is no session to close and nothing to
 * resume.
 */
export function ownKeyTransport({
  model,
}: OwnKeyTransportOptions = {}): ThemeAgentTransport {
  return {
    getSession: () => undefined,
    reconnectToStream: async () => null,
    sendMessages: async ({ messages, metadata, abortSignal }) => {
      const { ownKeyAnswer, anthropicModel } = await loadOwnKeyAnswer();
      const key = loadOwnKey();
      const answerModel = model ?? (key ? anthropicModel(key) : null);
      if (!answerModel) throw new Error('No Anthropic API key is saved.');
      return ownKeyAnswer({
        model: answerModel,
        messages,
        metadata,
        abortSignal,
      });
    },
  };
}
