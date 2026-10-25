import { describe, it, expect } from 'vitest';
import { createThemeAgentConversation } from '../theme-agent/conversation';
import {
  themeAgentClientDataSchema,
  type CustomTheme,
} from '../theme-agent/custom-theme';

/** Studio's out-of-the-box custom theme, written out from the sidebar defaults. */
function studioDefaults(): CustomTheme {
  return {
    light: {
      '--wa-color-brand': '#0071ec',
      '--wa-color-surface-default': '#ffffff',
      '--wa-color-text-normal': '#1b1d26',
      '--wa-font-family-body': 'ui-sans-serif, system-ui, sans-serif',
      '--wa-border-radius-scale': '1',
      '--wa-transition-fast': '75',
    },
    dark: {
      '--wa-color-brand': '#0071ec',
      '--wa-color-surface-default': '#101219',
      '--wa-color-text-normal': '#f1f2f3',
      '--wa-font-family-body': 'ui-sans-serif, system-ui, sans-serif',
      '--wa-border-radius-scale': '1',
      '--wa-transition-fast': '75',
    },
    shadowComponents: [],
  };
}

describe('Theme Agent conversation: snapshot', () => {
  it('sends the custom theme as it is when the message is sent, both modes', () => {
    const conversation = createThemeAgentConversation();
    const theme = studioDefaults();
    theme.dark['--wa-color-surface-default'] = '#202020';

    const snapshot = conversation.messageSent(theme, []);
    theme.dark['--wa-color-surface-default'] = '#303030';

    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#202020');
    expect(snapshot.theme.light['--wa-color-surface-default']).toBe('#ffffff');
  });
});

describe('Theme Agent conversation: apply', () => {
  it('applies a valid proposal on top of the current custom theme', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-brand': '#0891b2',
            '--wa-color-surface-default': '#f8fafc',
          },
          dark: { '--wa-color-surface-default': '#0f172a' },
          shadowComponents: ['Card', 'Button'],
        },
      ],
      studioDefaults(),
      []
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.light['--wa-color-surface-default']).toBe('#f8fafc');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#0f172a');
    // Untouched values stay as they were.
    expect(outcome.theme.light['--wa-color-text-normal']).toBe('#1b1d26');
    expect(outcome.theme.dark['--wa-color-text-normal']).toBe('#f1f2f3');
    expect(outcome.theme.shadowComponents).toEqual(['Card', 'Button']);
  });

  it('applies a mode-independent value named once to both modes', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      studioDefaults(),
      []
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.light['--wa-color-brand']).toBe('#0891b2');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#0891b2');
    // No shadow list in the proposal: the current one stays.
    expect(outcome.theme.shadowComponents).toEqual([]);
  });
});

describe('Theme Agent conversation: rejected proposals', () => {
  const refused: Array<[string, unknown, string]> = [
    [
      'a property the sidebar does not offer',
      { light: { '--wa-color-brand-fill-loud': '#0891b2' }, dark: {} },
      'light --wa-color-brand-fill-loud: not a Studio property',
    ],
    [
      'a font outside the font list',
      {
        light: { '--wa-font-family-body': "'Comic Sans MS', cursive" },
        dark: {},
      },
      `light --wa-font-family-body: "'Comic Sans MS', cursive" is not a font from Studio's font list`,
    ],
    [
      'a shadow component outside the list',
      { light: {}, dark: {}, shadowComponents: ['Card', 'Navbar'] },
      `shadowComponents: "Navbar" is not in Studio's list`,
    ],
    [
      'a malformed colour',
      { light: {}, dark: { '--wa-color-surface-default': 'red' } },
      'dark --wa-color-surface-default: "red" is not a colour written #rrggbb',
    ],
    [
      'a slider value out of range',
      { light: { '--wa-border-radius-scale': '7' }, dark: {} },
      'light --wa-border-radius-scale: 7 is outside 0 to 3',
    ],
    [
      'a select value the sidebar does not list',
      { light: { '--wa-border-style': 'wavy' }, dark: {} },
      'light --wa-border-style: "wavy" is not one of: solid, dashed, dotted, double, groove, ridge, none',
    ],
    [
      'custom CSS',
      { light: {}, dark: {}, customCSS: '.Card { color: red }' },
      'proposal: Unrecognized key: "customCSS"',
    ],
    [
      'different light and dark values for a mode-independent property',
      {
        light: { '--wa-color-brand': '#0891b2' },
        dark: { '--wa-color-brand': '#22d3ee' },
      },
      '--wa-color-brand: the same in both modes, but light is "#0891b2" and dark is "#22d3ee"',
    ],
    ['a proposal that is not an object', 'make it blue', 'proposal: '],
  ];

  it.each(refused)('refuses %s and applies nothing', (_, proposal, error) => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);

    const outcome = conversation.answerReceived(
      'answer-1',
      [proposal],
      studioDefaults(),
      []
    );

    expect(outcome.applied).toBe(false);
    if (outcome.applied) return;
    expect(outcome.errors.some((e) => e.startsWith(error))).toBe(true);
    expect(conversation.answerStatus('answer-1')).toBe('rejected');
    expect(conversation.undo('answer-1', studioDefaults())).toBeUndefined();
  });

  it('refuses the whole proposal when one value is invalid', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-brand': '#0891b2',
            '--wa-color-surface-default': 'hsl(0 0% 100%)',
          },
          dark: {},
        },
      ],
      studioDefaults(),
      []
    );
    expect(outcome).toEqual({
      applied: false,
      errors: [
        'light --wa-color-surface-default: "hsl(0 0% 100%)" is not a colour written #rrggbb',
      ],
    });
  });

  it('accepts a slider value written with its unit, stored without it', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-transition-fast': '100ms' }, dark: {} }],
      studioDefaults(),
      []
    );
    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.light['--wa-transition-fast']).toBe('100');
    expect(outcome.theme.dark['--wa-transition-fast']).toBe('100');
  });
});

describe('Theme Agent conversation: undo', () => {
  it('restores the custom theme as it was before the answer', () => {
    const conversation = createThemeAgentConversation();
    const before = studioDefaults();
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: { '--wa-color-surface-default': '#f8fafc' },
          dark: { '--wa-color-surface-default': '#0f172a' },
          shadowComponents: ['Card'],
        },
      ],
      before,
      []
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    expect(conversation.undo('answer-1', outcome.theme)).toEqual(
      studioDefaults()
    );
    expect(conversation.answerStatus('answer-1')).toBe('undone');
    // One step: a second undo has nothing left to restore.
    expect(conversation.undo('answer-1', studioDefaults())).toBeUndefined();
  });

  it('undoing an earlier answer reverts only its own values and leaves a later answer', () => {
    const conversation = createThemeAgentConversation();
    const first = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2' }, dark: {} }],
      studioDefaults(),
      []
    );
    if (!first.applied) throw new Error('first answer was not applied');
    const second = conversation.answerReceived(
      'answer-2',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      first.theme,
      []
    );
    if (!second.applied) throw new Error('second answer was not applied');

    const undone = conversation.undo('answer-1', second.theme);
    expect(undone?.light['--wa-border-radius-scale']).toBe('1');
    expect(undone?.light['--wa-color-brand']).toBe('#0891b2');
    expect(conversation.answerStatus('answer-1')).toBe('undone');
    expect(conversation.answerStatus('answer-2')).toBe('applied');
  });

  it('undo leaves a value the user changed after the answer', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: { '--wa-color-brand': '#0891b2' },
          dark: { '--wa-color-surface-default': '#0f172a' },
        },
      ],
      studioDefaults(),
      []
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    // The user tunes the answer's dark surface and the dark text by hand.
    const tuned = structuredClone(outcome.theme);
    tuned.dark['--wa-color-surface-default'] = '#111827';
    tuned.dark['--wa-color-text-normal'] = '#e5e7eb';

    const undone = conversation.undo('answer-1', tuned);

    expect(undone?.light['--wa-color-brand']).toBe('#0071ec');
    expect(undone?.dark['--wa-color-brand']).toBe('#0071ec');
    expect(undone?.dark['--wa-color-surface-default']).toBe('#111827');
    expect(undone?.dark['--wa-color-text-normal']).toBe('#e5e7eb');
  });

  it('applies the same answer only once', () => {
    const conversation = createThemeAgentConversation();
    const proposal = { light: { '--wa-border-radius-scale': '2' }, dark: {} };
    const first = conversation.answerReceived(
      'answer-1',
      [proposal],
      studioDefaults(),
      []
    );
    if (!first.applied) throw new Error('answer was not applied');
    // Delivered again, after it was applied: the record of "before" must not
    // move to the theme that already contains the answer.
    conversation.answerReceived('answer-1', [proposal], first.theme, []);

    expect(conversation.undo('answer-1', first.theme)).toEqual(
      studioDefaults()
    );
  });
});

describe('Theme Agent conversation: refinement', () => {
  it('a second answer starts from the current theme, hand edits included', () => {
    const conversation = createThemeAgentConversation();
    const first = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      studioDefaults(),
      []
    );
    if (!first.applied) throw new Error('first answer was not applied');

    // The user tunes the dark surface by hand, then asks for a warmer brand.
    const edited = structuredClone(first.theme);
    edited.dark['--wa-color-surface-default'] = '#1a1410';
    const snapshot = conversation.messageSent(edited, []);
    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    const second = conversation.answerReceived(
      'answer-2',
      [{ light: { '--wa-color-brand': '#d97706' }, dark: {} }],
      edited,
      []
    );
    expect(second.applied).toBe(true);
    if (!second.applied) return;
    expect(second.theme.light['--wa-color-brand']).toBe('#d97706');
    expect(second.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    // Undo of the second answer goes back to the hand-edited theme.
    expect(conversation.undo('answer-2', second.theme)).toEqual(edited);
  });
});

describe('Theme Agent conversation: accessibility', () => {
  it('applies a correction on top of the proposal it corrects', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-brand': '#7c3aed',
            '--wa-color-text-quiet': '#949494',
          },
          dark: { '--wa-color-surface-default': '#18181b' },
        },
        // The correction names only the value it fixes.
        { light: { '--wa-color-text-quiet': '#595959' }, dark: {} },
      ],
      studioDefaults(),
      []
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.light['--wa-color-brand']).toBe('#7c3aed');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#7c3aed');
    expect(outcome.theme.light['--wa-color-text-quiet']).toBe('#595959');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#18181b');
  });

  it('applies an answer that still fails contrast and lists what fails', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-surface-raised': '#fefefe',
            '--wa-color-text-quiet': '#aaaaaa',
          },
          dark: {},
        },
      ],
      studioDefaults(),
      []
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.light['--wa-color-text-quiet']).toBe('#aaaaaa');
    const quietOnRaised = outcome.violations.find(
      (v) =>
        v.foreground === '--wa-color-text-quiet' &&
        v.background === '--wa-color-surface-raised'
    );
    expect(quietOnRaised).toMatchObject({ mode: 'light', minimum: 4.5 });
    // #aaaaaa on #fefefe is 2.3:1.
    expect(quietOnRaised?.ratio).toBeCloseTo(2.3, 1);
    expect(conversation.answerViolations('answer-1')).toEqual(
      outcome.violations
    );

    // Once undone, the answer's theme is gone, and so are its warnings.
    conversation.undo('answer-1', outcome.theme);
    expect(conversation.answerViolations('answer-1')).toEqual([]);
  });

  it('checks the theme as applied, hand edits made during the run included', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);
    const current = studioDefaults();
    // Edited in the sidebar while the answer was on its way.
    current.dark['--wa-color-surface-raised'] = '#f5f5f5';

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2' }, dark: {} }],
      current,
      []
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.violations).toContainEqual(
      expect.objectContaining({
        mode: 'dark',
        foreground: '--wa-color-text-normal',
        background: '--wa-color-surface-raised',
      })
    );
  });
});

describe('Theme Agent snapshot schema', () => {
  it('lets a run boot before the first message, which carries no snapshot', () => {
    // trigger.dev parses the run's boot and preload payloads with the same
    // schema; they never carry a message's metadata.
    expect(themeAgentClientDataSchema.safeParse(undefined).success).toBe(true);
  });

  it('accepts a snapshot from a page that predates locks', () => {
    const parsed = themeAgentClientDataSchema.safeParse({
      theme: studioDefaults(),
    });
    expect(parsed.success && parsed.data?.locked).toEqual([]);
  });

  it('accepts the snapshot a message carries and refuses a malformed one', () => {
    const snapshot = createThemeAgentConversation().messageSent(
      studioDefaults(),
      []
    );
    expect(themeAgentClientDataSchema.safeParse(snapshot).success).toBe(true);
    expect(
      themeAgentClientDataSchema.safeParse({ theme: { light: {} } }).success
    ).toBe(false);
  });
});

describe('Theme Agent conversation: locked values', () => {
  const warmer = {
    light: {
      '--wa-color-brand': '#d64228',
      '--wa-color-surface-default': '#fdf6ec',
    },
    dark: { '--wa-color-surface-default': '#241a12' },
    shadowComponents: ['Card'],
  };

  it('changes everything when nothing is locked', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      []
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#d64228');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(outcome.theme.shadowComponents).toEqual(['Card']);
    expect(outcome.held).toEqual([]);
  });

  it('never changes a locked value and holds what the answer proposed for it', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      ['--wa-color-brand', '--wa-color-surface-default']
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    // A locked value is locked in both modes.
    expect(outcome.theme.light['--wa-color-brand']).toBe('#0071ec');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#0071ec');
    expect(outcome.theme.light['--wa-color-surface-default']).toBe('#ffffff');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#101219');
    expect(outcome.theme.shadowComponents).toEqual(['Card']);
    expect(outcome.held).toEqual([
      {
        kind: 'value',
        cssVar: '--wa-color-brand',
        proposed: { light: '#d64228', dark: '#d64228' },
      },
      {
        kind: 'value',
        cssVar: '--wa-color-surface-default',
        proposed: { light: '#fdf6ec', dark: '#241a12' },
      },
    ]);
    expect(conversation.heldChanges('answer-1').held).toBe(true);
  });

  it('a value locked while the answer was written is held when it arrives', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), []);
    // Locked during the run: the answer arrives with the lock in place.
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2.5' }, dark: {} }],
      studioDefaults(),
      ['--wa-border-radius-scale']
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('1');
    expect(outcome.held).toHaveLength(1);
    expect(conversation.answerStatus('answer-1')).toBe('unchanged');
  });

  it('holds a new shadow component list when the list is locked', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      ['shadowComponents']
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.shadowComponents).toEqual([]);
    expect(outcome.held).toEqual([
      { kind: 'shadowComponents', proposed: ['Card'] },
    ]);
  });

  it('unlock and apply applies the held changes and says what to unlock', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      ['--wa-color-brand', 'shadowComponents']
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const result = conversation.applyHeld('answer-1', outcome.theme);

    expect(result?.unlock).toEqual(['--wa-color-brand', 'shadowComponents']);
    expect(result?.theme.dark['--wa-color-brand']).toBe('#d64228');
    expect(result?.theme.shadowComponents).toEqual(['Card']);
    expect(conversation.heldChanges('answer-1').held).toBe(false);
    // Once only.
    expect(conversation.applyHeld('answer-1', result!.theme)).toBeUndefined();
  });

  it('undo after unlock and apply reverts the held changes too', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#d64228' }, dark: {} }],
      studioDefaults(),
      ['--wa-color-brand']
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const result = conversation.applyHeld('answer-1', outcome.theme);
    expect(conversation.answerStatus('answer-1')).toBe('applied');

    const undone = conversation.undo('answer-1', result!.theme);

    expect(undone?.dark['--wa-color-brand']).toBe('#0071ec');
  });

  it('checks contrast again after unlock and apply', () => {
    const conversation = createThemeAgentConversation();
    const pale = studioDefaults();
    pale.light['--wa-color-text-quiet'] = '#aaaaaa';
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-text-quiet': '#595959' }, dark: {} }],
      pale,
      ['--wa-color-text-quiet']
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const quietFails = () =>
      conversation
        .answerViolations('answer-1')
        .some(
          (v) => v.mode === 'light' && v.foreground === '--wa-color-text-quiet'
        );
    expect(quietFails()).toBe(true);

    conversation.applyHeld('answer-1', outcome.theme);

    expect(quietFails()).toBe(false);
  });

  it('sends the locked values with the snapshot, and only Studio values', () => {
    const conversation = createThemeAgentConversation();
    const snapshot = conversation.messageSent(studioDefaults(), [
      '--wa-color-brand',
      'shadowComponents',
      '--wa-nonexistent',
    ]);
    expect(snapshot.locked).toEqual(['--wa-color-brand', 'shadowComponents']);
  });
});

describe('Theme Agent conversation: what the last answer did', () => {
  const greenBrand = { light: { '--wa-color-brand': '#2f8f4e' }, dark: {} };

  it('says nothing before the first answer', () => {
    const snapshot = createThemeAgentConversation().messageSent(
      studioDefaults(),
      []
    );
    expect(snapshot.previous).toBeUndefined();
  });

  it('tells the agent its last answer was refused, and why', () => {
    const conversation = createThemeAgentConversation();
    conversation.answerReceived(
      'answer-1',
      [{ ...greenBrand, reasons: { '--wa-color-brand': 'Green.' } }],
      studioDefaults(),
      []
    );

    const snapshot = conversation.messageSent(studioDefaults(), []);

    expect(snapshot.previous).toEqual({
      status: 'rejected',
      held: [],
      errors: ['proposal: Unrecognized key: "reasons"'],
    });
    expect(conversation.answerErrors('answer-1')).toEqual([
      'proposal: Unrecognized key: "reasons"',
    ]);
  });

  it('tells the agent which locked values its last answer did not change', () => {
    const conversation = createThemeAgentConversation();
    conversation.answerReceived('answer-1', [greenBrand], studioDefaults(), [
      '--wa-color-brand',
    ]);

    const snapshot = conversation.messageSent(studioDefaults(), [
      '--wa-color-brand',
    ]);

    expect(snapshot.previous).toEqual({
      status: 'unchanged',
      held: ['--wa-color-brand'],
      errors: [],
    });
  });

  it('tells the agent once the user unlocked and applied, or undid the answer', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [greenBrand],
      studioDefaults(),
      ['--wa-color-brand']
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const result = conversation.applyHeld('answer-1', outcome.theme);
    expect(conversation.messageSent(result!.theme, []).previous).toEqual({
      status: 'applied',
      held: [],
      errors: [],
    });

    conversation.undo('answer-1', result!.theme);
    expect(conversation.messageSent(studioDefaults(), []).previous).toEqual({
      status: 'undone',
      held: [],
      errors: [],
    });
  });
});
