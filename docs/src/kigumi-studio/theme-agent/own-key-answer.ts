import { createAnthropic } from '@ai-sdk/anthropic';
import {
  convertToModelMessages,
  createUIMessageStream,
  streamText,
  type LanguageModel,
  type UIMessageChunk,
} from 'ai';
import {
  THEME_AGENT_MODEL,
  themeAgentTurn,
} from '../../../trigger/theme-agent-turn';
import { THEME_AGENT_STATUS } from './constants';
import { themeAgentSnapshotSchema } from './custom-theme';
import type { ThemeAgentMessage } from './message';

// The own-key path's answer, loaded as its own chunk only once an own key
// is saved (`loadOwnKeyAnswer()`): the AI SDK, the Anthropic provider and
// the answer loop with its system prompt never reach a visitor without one.

/**
 * The model the trigger.dev task answers with, called with the own key.
 * Anthropic refuses a browser request without the
 * `anthropic-dangerous-direct-browser-access` header, which the provider
 * does not send itself (ADR 0017).
 */
export function anthropicModel(apiKey: string): LanguageModel {
  const anthropic = createAnthropic({
    apiKey,
    headers: { 'anthropic-dangerous-direct-browser-access': 'true' },
  });
  return anthropic(THEME_AGENT_MODEL);
}

interface OwnKeyAnswerOptions {
  model: LanguageModel;
  messages: ThemeAgentMessage[];
  /** The snapshot the message carries, as the task's `clientData`. */
  metadata: unknown;
  abortSignal: AbortSignal | undefined;
}

/** The error's own message: in the browser there is nothing to hide it from. */
function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * One answer in the browser: `themeAgentTurn()` with the task's model,
 * thinking and effort, streamed as the chat renders the task's answers,
 * transient status steps included.
 */
export async function ownKeyAnswer({
  model,
  messages,
  metadata,
  abortSignal,
}: OwnKeyAnswerOptions): Promise<ReadableStream<UIMessageChunk>> {
  const snapshot = themeAgentSnapshotSchema.parse(metadata);
  const modelMessages = await convertToModelMessages(messages);
  return createUIMessageStream<ThemeAgentMessage>({
    onError: errorText,
    execute: ({ writer }) => {
      // Transient: the chat shows the step while it lasts, the transcript keeps none.
      const status = (step: string) =>
        writer.write({ type: 'data-status', data: { step }, transient: true });
      status(THEME_AGENT_STATUS.drafting);
      const result = themeAgentTurn({
        streamText,
        model,
        messages: modelMessages,
        snapshot,
        onStatus: status,
        abortSignal,
      });
      writer.merge(result.toUIMessageStream({ onError: errorText }));
    },
  });
}
