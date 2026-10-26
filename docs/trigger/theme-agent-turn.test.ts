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
    customCSS: '.Button { text-transform: uppercase; }',
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
    customCSS: true,
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

  it.each([
    [
      'a url()',
      '.Card { background: url(https://example.com/x.png); }',
      'customCSS: url() loads a resource and is not allowed',
    ],
    [
      'a literal colour',
      '.Card::part(header) { border-bottom: 1px solid #d4d4d4; }',
      '.Card::part(header) border-bottom: \\"#d4d4d4\\" is a colour literal',
    ],
  ])(
    'sends custom CSS with %s back to the model and accepts the corrected one',
    async (_name, refused, error) => {
      const corrected =
        '.Card::part(header) { border-bottom: 1px solid var(--wa-color-surface-border); }';
      const model = new MockLanguageModelV4({
        doStream: [
          proposalStep('call-1', { light: {}, dark: {}, customCSS: refused }),
          proposalStep('call-2', { light: {}, dark: {}, customCSS: corrected }),
          textStep('A rule under the card header; no value draws one.'),
        ],
      });

      const result = themeAgentTurn({ streamText, model, messages, snapshot });
      await result.consumeStream();

      expect(model.doStreamCalls).toHaveLength(3);
      const [rejected, accepted] = toolResults(model);
      expect(JSON.stringify(rejected)).toContain('"accepted":false');
      expect(JSON.stringify(rejected)).toContain(error);
      expect(JSON.stringify(accepted)).toContain('"accepted":true');
    }
  );

  it("accepts the user's own rules the subset would refuse, carried over unchanged", async () => {
    const own = '.Button { color: #ff0000; }';
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: {},
          dark: {},
          customCSS: `${own}\n.Card::part(base) { border: none; }`,
        }),
        textStep('No value removes a card border.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: { ...snapshot, theme: { ...snapshot.theme, customCSS: own } },
    });
    await result.consumeStream();

    const [output] = toolResults(model);
    expect(JSON.stringify(output)).toContain('"accepted":true');
  });

  it('tells the model its custom CSS is locked when the user locked it', async () => {
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: {},
          dark: {},
          customCSS: '.Card::part(base) { border: none; }',
        }),
        textStep('Your custom CSS is locked.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: lockedSnapshot,
    });
    await result.consumeStream();

    const [output] = toolResults(model);
    expect(JSON.stringify(output)).toContain('"accepted":true');
    expect(JSON.stringify(output)).toMatch(/"locked":\[[^\]]*"customCSS"/);
  });

  it('gives the model the current custom CSS and how it may write custom CSS', async () => {
    const text = await systemPrompt(snapshot);
    expect(text).toContain('.Button { text-transform: uppercase; }');
    const rules = text.slice(text.indexOf('Custom CSS'));
    // Only when no value can express it, said in the explanation.
    expect(rules).toMatch(/only for what no value[^.]*can express/);
    expect(rules).toMatch(/explanation says why no value could/);
    // Always the whole text, never a patch.
    expect(rules).toMatch(/complete custom CSS/);
    // Kigumi wrapper classes or wa-* tags for the host, ::part() inside.
    expect(rules).toMatch(/Kigumi wrapper class/);
    expect(rules).toMatch(/wa-\*/);
    expect(rules).toMatch(/::part\(\)/);
    expect(rules).toMatch(/var\(--wa-\*\)/);
    expect(text).not.toMatch(/no custom CSS\)/);
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

  it('leaves the model room to answer after it thinks', async () => {
    // At 4096 output tokens a custom CSS request spent the whole step
    // thinking: no text, no proposal, finish for the length limit.
    const model = new MockLanguageModelV4({ doStream: [textStep('Hello.')] });

    const result = themeAgentTurn({ streamText, model, messages, snapshot });
    await result.consumeStream();

    const [call] = model.doStreamCalls;
    expect(call.maxOutputTokens).toBeGreaterThanOrEqual(16_000);
    expect(call.providerOptions?.anthropic).toMatchObject({
      thinking: { type: 'adaptive' },
      effort: 'medium',
    });
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
      /Locked values[^\n]*\n- --wa-color-brand\n- --wa-color-surface-default \(dark mode\)\n- shadowComponents\n- customCSS\n/
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
    // A bare "improve" after that report still got a general theme change
    // and no brand: the eval's locked-brand-improve-fill scenario.
    expect(brand).toMatch(
      /a short request to improve or fix[^.]*right after an answer that reported a failing brand fill pair asks for that fix/
    );
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

  it('gives the model what the user changed while its last answer was written', async () => {
    const text = await systemPrompt({
      ...snapshot,
      previous: {
        status: 'applied',
        held: [],
        edited: ['--wa-color-surface-default (dark mode)'],
        errors: [],
      },
    });
    expect(text).toMatch(
      /changed by the user while you answered[^\n]*--wa-color-surface-default \(dark mode\)/i
    );
  });
});

describe('Theme Agent turn: contrast a locked value causes', () => {
  /** Light quiet text at 2.3:1, locked with all three light surfaces. */
  const paleAndLocked: ThemeAgentSnapshot = {
    ...snapshot,
    theme: {
      ...snapshot.theme,
      light: unreadableProposal.light,
      dark: unreadableProposal.dark,
    },
    locked: {
      ...NO_LOCKS,
      light: [
        '--wa-color-surface-raised',
        '--wa-color-surface-default',
        '--wa-color-surface-lowered',
        '--wa-color-text-quiet',
      ],
    },
  };
  type LockedOutput = ProposeOutput & {
    locked: string[];
    lockedContrast: string[];
  };

  it('asks the model once to propose the locked value that fixes a pair, which Studio holds', async () => {
    const steps: string[] = [];
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: { '--wa-border-radius-scale': '2' },
          dark: {},
        }),
        proposalStep('call-2', {
          light: { '--wa-color-text-quiet': '#595959' },
          dark: {},
        }),
        textStep('Quiet text is locked; unlock and apply the darker one.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: paleAndLocked,
      onStatus: (step) => steps.push(step),
    });
    await result.consumeStream();

    const [first, second] = toolResults(model).map(
      (o) => (o as { value: LockedOutput }).value
    );
    expect(first.correctContrast).toBe(true);
    expect(first.lockedContrast.join('\n')).toContain(
      'Light mode, quiet text on the raised surface'
    );
    expect(first.lockedContrast[0]).toMatch(
      /locked: --wa-color-text-quiet, --wa-color-surface-raised/
    );
    // The fix is held, so the pair still fails in the browser, but the
    // model has proposed what fixes it: no further round.
    expect(second.correctContrast).toBe(false);
    expect(second.locked).toEqual(['--wa-color-text-quiet (light mode)']);
    expect(model.doStreamCalls).toHaveLength(3);
  });

  it('needs no correction round when a held value already fixes the pair', async () => {
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
      snapshot: {
        ...paleAndLocked,
        locked: { ...NO_LOCKS, light: ['--wa-color-text-quiet'] },
      },
    });
    await result.consumeStream();

    const [output] = toolResults(model).map(
      (o) => (o as { value: LockedOutput }).value
    );
    expect(output.contrast.join('\n')).toContain(
      'quiet text on the raised surface'
    );
    expect(output.correctContrast).toBe(false);
    expect(output.lockedContrast).toEqual([]);
  });

  it('counts a fix held by an earlier proposal of the same answer', async () => {
    // The first proposal holds the light quiet text fix and makes the dark
    // quiet text fail; the correction fixes only dark.
    const model = new MockLanguageModelV4({
      doStream: [
        proposalStep('call-1', {
          light: { '--wa-color-text-quiet': '#595959' },
          dark: { '--wa-color-text-quiet': '#404040' },
        }),
        proposalStep('call-2', {
          light: {},
          dark: { '--wa-color-text-quiet': '#b0b0b0' },
        }),
        textStep('Done.'),
      ],
    });

    const result = themeAgentTurn({
      streamText,
      model,
      messages,
      snapshot: paleAndLocked,
    });
    await result.consumeStream();

    const [first, second] = toolResults(model).map(
      (o) => (o as { value: LockedOutput }).value
    );
    expect(first.correctContrast).toBe(true);
    expect(first.lockedContrast).toEqual([]);
    expect(second.correctContrast).toBe(false);
  });
});
