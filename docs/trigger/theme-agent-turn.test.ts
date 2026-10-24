import { describe, it, expect } from 'vitest';
import { simulateReadableStream, streamText, type ModelMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { themeAgentTurn, MAX_PROPOSAL_ATTEMPTS } from './theme-agent-turn';
import { THEME_AGENT_PROPOSE_TOOL } from '../src/kigumi-studio/theme-agent/constants';
import type { ThemeAgentSnapshot } from '../src/kigumi-studio/theme-agent/custom-theme';

type StreamResult = Extract<
  NonNullable<ConstructorParameters<typeof MockLanguageModelV4>[0]>['doStream'],
  unknown[]
>[number];

const usage = {
  inputTokens: {
    total: 1,
    noCache: 1,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 1, text: 1, reasoning: undefined },
};

function proposalStep(id: string, proposal: unknown): StreamResult {
  return {
    stream: simulateReadableStream({
      chunks: [
        {
          type: 'tool-call',
          toolCallId: id,
          toolName: THEME_AGENT_PROPOSE_TOOL,
          input: JSON.stringify(proposal),
        },
        {
          type: 'finish',
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
        },
      ],
    }),
  };
}

function textStep(text: string): StreamResult {
  return {
    stream: simulateReadableStream({
      chunks: [
        { type: 'text-start', id: 'text-1' },
        { type: 'text-delta', id: 'text-1', delta: text },
        { type: 'text-end', id: 'text-1' },
        {
          type: 'finish',
          finishReason: { unified: 'stop', raw: undefined },
          usage,
        },
      ],
    }),
  };
}

const snapshot: ThemeAgentSnapshot = {
  theme: {
    light: {
      '--wa-color-brand': '#0071ec',
      '--wa-color-surface-default': '#fafaf9',
    },
    dark: {
      '--wa-color-brand': '#0071ec',
      '--wa-color-surface-default': '#1c1917',
    },
    shadowComponents: ['Card'],
  },
};

const messages: ModelMessage[] = [
  { role: 'user', content: 'Calm fintech theme, brand #0891b2' },
];

/** Every tool result the model was shown, in order. */
function toolResults(model: MockLanguageModelV4): unknown[] {
  const last = model.doStreamCalls.at(-1);
  return (last?.prompt ?? [])
    .filter((message) => message.role === 'tool')
    .flatMap((message) => message.content)
    .map((part) => (part.type === 'tool-result' ? part.output : undefined));
}

describe('Theme Agent turn', () => {
  it('sends an invalid proposal back to the model and accepts the corrected one', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: {
            '--wa-color-brand': '#0891b2',
            '--wa-color-primary': '#0891b2',
          },
          dark: {},
        }),
        proposalStep('call-2', {
          light: { '--wa-color-brand': '#0891b2' },
          dark: {},
        }),
        textStep('A calm teal brand.'),
      ],
    });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    expect(model.doStreamCalls).toHaveLength(3);
    const [rejected, accepted] = toolResults(model);
    expect(JSON.stringify(rejected)).toContain(
      '--wa-color-primary: not a Studio property'
    );
    expect(JSON.stringify(rejected)).toContain('"accepted":false');
    expect(JSON.stringify(accepted)).toContain('"accepted":true');
    expect(await result.text).toContain('A calm teal brand.');
  });

  it('sends a proposal with custom CSS back to the model', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: { '--wa-color-brand': '#0891b2' },
          dark: {},
          customCSS: 'body { color: red }',
        }),
        textStep('Sorry.'),
      ],
    });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    expect(model.doStreamCalls).toHaveLength(2);
    const [rejected] = toolResults(model);
    expect(JSON.stringify(rejected)).toContain('customCSS');
    expect(JSON.stringify(rejected)).not.toContain('"accepted":true');
  });

  it(`stops after ${MAX_PROPOSAL_ATTEMPTS} rejected proposals`, async () => {
    const model = new MockLanguageModelV4({
      doStream: async () =>
        proposalStep('call', {
          light: { '--wa-color-primary': '#0891b2' },
          dark: {},
        }),
    });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    // One more step than attempts, so the model can explain after the last.
    expect(model.doStreamCalls.length).toBeLessThanOrEqual(
      MAX_PROPOSAL_ATTEMPTS + 1
    );
  });

  it("gives the model the snapshot's current values", async () => {
    const model = new MockLanguageModelV4({ doStream: [textStep('Hello.')] });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    const prompt = JSON.stringify(model.doStreamCalls[0].prompt);
    expect(prompt).toContain('#1c1917');
    expect(prompt).toContain('#fafaf9');
  });
});
