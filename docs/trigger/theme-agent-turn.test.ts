import { describe, it, expect } from 'vitest';
import { simulateReadableStream, streamText, type ModelMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import {
  themeAgentTurn,
  MAX_CONTRAST_CORRECTIONS,
  MAX_PROPOSAL_ATTEMPTS,
} from './theme-agent-turn';
import {
  THEME_AGENT_PROPOSE_TOOL,
  THEME_AGENT_STATUS,
} from '../src/kigumi-studio/theme-agent/constants';
import type { ThemeAgentSnapshot } from '../src/kigumi-studio/theme-agent/custom-theme';
import { NO_LOCKS } from '../src/kigumi-studio/lib/locks';

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
  locked: NO_LOCKS,
};

/** The user locked the brand, the dark surface and the shadow component list. */
const lockedSnapshot: ThemeAgentSnapshot = {
  ...snapshot,
  locked: {
    light: ['--wa-color-brand'],
    dark: ['--wa-color-brand', '--wa-color-surface-default'],
    shadowComponents: true,
  },
};

/** The system prompt the model gets for one turn with `turnSnapshot`. */
async function systemPrompt(turnSnapshot: ThemeAgentSnapshot): Promise<string> {
  const model = new MockLanguageModelV4({ doStream: [textStep('Hello.')] });
  const result = themeAgentTurn({
    streamText,
    model,
    messages,
    snapshot: turnSnapshot,
  });
  await result.consumeStream();
  const system = model.doStreamCalls[0].prompt.find(
    (message) => message.role === 'system'
  );
  return typeof system?.content === 'string' ? system.content : '';
}

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

  it("gives the model the snapshot's locked values, per mode", async () => {
    const text = await systemPrompt(lockedSnapshot);
    expect(text).toMatch(
      /Locked values[^\n]*\n- --wa-color-brand\n- --wa-color-surface-default \(dark mode\)\n- shadowComponents\n/
    );
  });

  it('asks the model to propose a locked value the message asks for, so Studio can hold it', async () => {
    // Told never to propose a locked value, the model never did, nothing was
    // held, and "Unlock and apply" never appeared under an answer.
    const text = await systemPrompt(lockedSnapshot);
    const locked = text.slice(text.indexOf('Locked values'));
    expect(locked).toMatch(/unless the latest message asks/);
    expect(locked).toMatch(/propose that change anyway/);
    expect(locked).not.toMatch(/never propose/i);
  });

  it('lets the model change the brand when the user asks to fix the brand fill', async () => {
    // "never to fix contrast" kept the model from proposing a locked brand
    // when the user asked to improve the brand fill warning: nothing was
    // held, so no Unlock and apply.
    const text = await systemPrompt(lockedSnapshot);
    const brand = text
      .split('\n')
      .find((line) => line.includes("brand colour is the user's"));
    expect(brand).toMatch(/asks to fix a failing brand fill pair/);
    expect(brand).toMatch(/never on your own to fix contrast/);
  });

  it('tells the model an earlier held change can no longer be applied from the chat', async () => {
    // The model sent the user up to an older answer whose button was gone.
    const text = await systemPrompt(lockedSnapshot);
    expect(text).toMatch(/offered only under your latest answer/);
    expect(text).toMatch(/propose it again/);
  });
});

/** Every value the contrast check reads, readable in both modes. */
const readableProposal = {
  light: {
    '--wa-color-brand': '#7c3aed',
    '--wa-color-surface-raised': '#fdfdfd',
    '--wa-color-surface-default': '#fafafa',
    '--wa-color-surface-lowered': '#f2f2f2',
    '--wa-color-text-normal': '#1a1a1a',
    '--wa-color-text-quiet': '#595959',
    '--wa-color-text-link': '#0050b3',
    '--wa-form-control-background-color': '#fdfdfd',
    '--wa-form-control-border-color': '#767676',
  },
  dark: {
    '--wa-color-surface-raised': '#1e1e1e',
    '--wa-color-surface-default': '#181818',
    '--wa-color-surface-lowered': '#101010',
    '--wa-color-text-normal': '#f0f0f0',
    '--wa-color-text-quiet': '#b0b0b0',
    '--wa-color-text-link': '#8cb4ff',
    '--wa-form-control-background-color': '#181818',
    '--wa-form-control-border-color': '#8a8a8a',
  },
};

/** The same, with quiet text at 2.3:1 on the light surfaces. */
const unreadableProposal = {
  light: { ...readableProposal.light, '--wa-color-text-quiet': '#aaaaaa' },
  dark: readableProposal.dark,
};

type ProposeOutput = {
  accepted: boolean;
  contrast: string[];
  correctContrast: boolean;
};

describe('Theme Agent turn: contrast', () => {
  it('accepts a readable proposal without a correction round', async () => {
    const steps: string[] = [];
    const model = new MockLanguageModelV4({
      doStream: [proposalStep('call-1', readableProposal), textStep('Done.')],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot,
      onStatus: (step) => steps.push(step),
    });
    await result.consumeStream();

    expect(model.doStreamCalls).toHaveLength(2);
    expect(toolResults(model)).toEqual([
      expect.objectContaining({
        value: expect.objectContaining({ accepted: true, contrast: [] }),
      }),
    ]);
    expect(steps).toContain(THEME_AGENT_STATUS.checking);
    expect(steps).not.toContain(THEME_AGENT_STATUS.fixing);
  });

  it('sends contrast violations back and takes the correction', async () => {
    const steps: string[] = [];
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', unreadableProposal),
        proposalStep('call-2', {
          light: { '--wa-color-text-quiet': '#595959' },
          dark: {},
        }),
        textStep('Darker quiet text.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot,
      onStatus: (step) => steps.push(step),
    });
    await result.consumeStream();

    const [first, second] = toolResults(model).map(
      (output) => (output as { value: ProposeOutput }).value
    );
    expect(first.correctContrast).toBe(true);
    expect(first.contrast.join('\n')).toContain(
      'Light mode, quiet text on the raised surface: 2.'
    );
    // The correction is checked on top of the first proposal.
    expect(second).toMatchObject({ contrast: [], correctContrast: false });
    expect(steps).toContain(THEME_AGENT_STATUS.fixing);
  });

  it(`stops correcting after ${MAX_CONTRAST_CORRECTIONS} rounds and returns the violations`, async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', unreadableProposal),
        proposalStep('call-2', unreadableProposal),
        proposalStep('call-3', unreadableProposal),
        textStep('Quiet text is still too light.'),
      ],
    });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    const outputs = toolResults(model).map(
      (output) => (output as { value: ProposeOutput }).value
    );
    expect(outputs.map((output) => output.correctContrast)).toEqual([
      true,
      true,
      false,
    ]);
    const last = outputs.at(-1);
    expect(last?.accepted).toBe(true);
    expect(last?.contrast.join('\n')).toContain(
      'quiet text on the raised surface'
    );
    expect(await result.text).toContain('still too light');
  });

  it('refuses a proposal after the corrections are used up', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', unreadableProposal),
        proposalStep('call-2', unreadableProposal),
        proposalStep('call-3', unreadableProposal),
        // Told to stop proposing, the model proposes anyway.
        proposalStep('call-4', {
          light: { '--wa-color-brand': '#dc2626' },
          dark: {},
        }),
        textStep('Done.'),
      ],
    });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    const outputs = toolResults(model).map(
      (output) => (output as { value: ProposeOutput }).value
    );
    expect(outputs.map((output) => output.accepted)).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('reports a failing brand fill without a correction round', async () => {
    // Only the brand fill fails: Studio derives it from the brand at a fixed
    // lightness, so the only fix is another brand hue, the user's choice.
    const greenBrand = {
      light: { ...readableProposal.light, '--wa-color-brand': '#16a34a' },
      dark: readableProposal.dark,
    };
    const steps: string[] = [];
    const model = new MockLanguageModelV4({
      doStream: [proposalStep('call-1', greenBrand), textStep('Green brand.')],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot,
      onStatus: (step) => steps.push(step),
    });
    await result.consumeStream();

    expect(model.doStreamCalls).toHaveLength(2);
    const [output] = toolResults(model).map(
      (o) => (o as { value: ProposeOutput }).value
    );
    expect(output.correctContrast).toBe(false);
    expect(output.contrast.join('\n')).toContain('text on the brand fill');
    expect(steps).not.toContain(THEME_AGENT_STATUS.fixing);
  });

  it('checks contrast on what lands, without the locked values', async () => {
    // The proposal would fix the quiet text, but the user locked it: the
    // browser keeps the failing value, so the task must not report a pass.
    const pale = {
      ...snapshot,
      theme: {
        ...snapshot.theme,
        light: {
          ...readableProposal.light,
          '--wa-color-text-quiet': '#aaaaaa',
        },
        dark: readableProposal.dark,
      },
      locked: { ...NO_LOCKS, light: ['--wa-color-text-quiet'] },
    };
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: { '--wa-color-text-quiet': '#595959' },
          dark: {},
        }),
        textStep('Locked.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: pale,
    });
    await result.consumeStream();

    const [output] = toolResults(model).map(
      (o) => (o as { value: ProposeOutput }).value
    );
    expect(output.contrast.join('\n')).toContain(
      'Light mode, quiet text on the raised surface'
    );
  });

  it('tells the model which values of its proposal are locked and will not change', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: { '--wa-color-brand': '#2f8f4e' },
          dark: {},
          shadowComponents: ['Card'],
        }),
        textStep('The brand is locked.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: lockedSnapshot,
    });
    await result.consumeStream();

    const [output] = toolResults(model).map(
      (o) => (o as { value: ProposeOutput & { locked: string[] } }).value
    );
    expect(output.accepted).toBe(true);
    expect(output.locked).toEqual(['--wa-color-brand', 'shadowComponents']);
  });

  it('gives the model what Studio did with its last answer', async () => {
    const model = new MockLanguageModelV4({ doStream: [textStep('Sorry.')] });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: {
        ...snapshot,
        previous: {
          status: 'rejected',
          held: ['--wa-color-brand'],
          errors: ['proposal: Unrecognized key: "reasons"'],
        },
      },
    });
    await result.consumeStream();

    const system = model.doStreamCalls[0].prompt.find(
      (message) => message.role === 'system'
    );
    const text = typeof system?.content === 'string' ? system.content : '';
    expect(text).toContain('proposal: Unrecognized key: "reasons"');
    expect(text).toMatch(/last answer:\n- [^\n]*refused/i);
    expect(text).toMatch(/not changed[^\n]*--wa-color-brand/);
  });
});
