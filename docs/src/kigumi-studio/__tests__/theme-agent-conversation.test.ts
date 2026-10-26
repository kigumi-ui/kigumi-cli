import { describe, it, expect } from 'vitest';
import { createThemeAgentConversation } from '../theme-agent/conversation';
import {
  CUSTOM_CSS_LOCK,
  NO_LOCKS,
  SHADOW_COMPONENTS_LOCK,
  valueLock,
  withLocks,
  type LockedValues,
} from '../lib/locks';
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
    customCSS: '',
  };
}

describe('Theme Agent conversation: snapshot', () => {
  it('sends the custom theme as it is when the message is sent, both modes', () => {
    const conversation = createThemeAgentConversation();
    const theme = studioDefaults();
    theme.dark['--wa-color-surface-default'] = '#202020';

    const snapshot = conversation.messageSent(theme, NO_LOCKS);
    theme.dark['--wa-color-surface-default'] = '#303030';

    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#202020');
    expect(snapshot.theme.light['--wa-color-surface-default']).toBe('#ffffff');
  });
});

describe('Theme Agent conversation: apply', () => {
  it('applies a valid proposal on top of the current custom theme', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);

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
      NO_LOCKS
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
    conversation.messageSent(studioDefaults(), NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      studioDefaults(),
      NO_LOCKS
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
      'custom CSS with a literal colour',
      { light: {}, dark: {}, customCSS: '.Card { color: red }' },
      '.Card color: "red" is a colour literal',
    ],
    [
      'custom CSS that loads a url()',
      {
        light: {},
        dark: {},
        customCSS: '.Card { background: url(https://example.com/x.png) }',
      },
      'customCSS: url() loads a resource and is not allowed',
    ],
    [
      'custom CSS with an @import',
      { light: {}, dark: {}, customCSS: '@import "x.css";' },
      'customCSS: @import is not allowed',
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
    conversation.messageSent(studioDefaults(), NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-1',
      [proposal],
      studioDefaults(),
      NO_LOCKS
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
      NO_LOCKS
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
      NO_LOCKS
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
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    expect(conversation.undo('answer-1', outcome.theme)?.theme).toEqual(
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
      NO_LOCKS
    );
    if (!first.applied) throw new Error('first answer was not applied');
    const second = conversation.answerReceived(
      'answer-2',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      first.theme,
      NO_LOCKS
    );
    if (!second.applied) throw new Error('second answer was not applied');

    const undone = conversation.undo('answer-1', second.theme)?.theme;
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
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    // The user tunes the answer's dark surface and the dark text by hand.
    const tuned = structuredClone(outcome.theme);
    tuned.dark['--wa-color-surface-default'] = '#111827';
    tuned.dark['--wa-color-text-normal'] = '#e5e7eb';

    const undone = conversation.undo('answer-1', tuned)?.theme;

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
      NO_LOCKS
    );
    if (!first.applied) throw new Error('answer was not applied');
    // Delivered again, after it was applied: the record of "before" must not
    // move to the theme that already contains the answer.
    conversation.answerReceived('answer-1', [proposal], first.theme, NO_LOCKS);

    expect(conversation.undo('answer-1', first.theme)?.theme).toEqual(
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
      NO_LOCKS
    );
    if (!first.applied) throw new Error('first answer was not applied');

    // The user tunes the dark surface by hand, then asks for a warmer brand.
    const edited = structuredClone(first.theme);
    edited.dark['--wa-color-surface-default'] = '#1a1410';
    const snapshot = conversation.messageSent(edited, NO_LOCKS);
    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    const second = conversation.answerReceived(
      'answer-2',
      [{ light: { '--wa-color-brand': '#d97706' }, dark: {} }],
      edited,
      NO_LOCKS
    );
    expect(second.applied).toBe(true);
    if (!second.applied) return;
    expect(second.theme.light['--wa-color-brand']).toBe('#d97706');
    expect(second.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    // Undo of the second answer goes back to the hand-edited theme.
    expect(conversation.undo('answer-2', second.theme)?.theme).toEqual(edited);
  });
});

describe('Theme Agent conversation: accessibility', () => {
  it('applies a correction on top of the proposal it corrects', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);

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
      NO_LOCKS
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
    conversation.messageSent(studioDefaults(), NO_LOCKS);

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
      NO_LOCKS
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
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const current = studioDefaults();
    // Edited in the sidebar while the answer was on its way.
    current.dark['--wa-color-surface-raised'] = '#f5f5f5';

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2' }, dark: {} }],
      current,
      NO_LOCKS
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

describe('Theme Agent conversation: ended', () => {
  const warmerBrand = [{ light: { '--wa-color-brand': '#c2410c' }, dark: {} }];

  it('applies nothing from an answer that arrives after the conversation ended', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);

    conversation.end();
    const outcome = conversation.answerReceived(
      'answer-1',
      warmerBrand,
      studioDefaults(),
      NO_LOCKS
    );

    expect(outcome).toEqual({
      applied: false,
      errors: ['conversation: ended before the answer arrived'],
    });
  });

  it('an ended conversation offers no undo and no unlock and apply', () => {
    const conversation = createThemeAgentConversation();
    const brandLocked = valueLock('--wa-color-brand', ['light', 'dark']);
    conversation.messageSent(studioDefaults(), brandLocked);
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-brand': '#c2410c',
            '--wa-color-surface-default': '#fff7ed',
          },
          dark: {},
        },
      ],
      studioDefaults(),
      brandLocked
    );
    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(conversation.heldChanges('answer-1')).toHaveLength(1);

    // A preset replaced the theme the answer was applied to.
    conversation.end();

    expect(conversation.undo('answer-1', outcome.theme)).toBeUndefined();
    expect(conversation.applyHeld('answer-1', outcome.theme)).toBeUndefined();
    expect(conversation.heldChanges('answer-1')).toEqual([]);
  });
});

describe('Theme Agent snapshot schema', () => {
  it('lets a run boot before the first message, which carries no snapshot', () => {
    // trigger.dev parses the run's boot and preload payloads with the same
    // schema; they never carry a message's metadata.
    expect(themeAgentClientDataSchema.safeParse(undefined).success).toBe(true);
  });

  it('reads a snapshot from a page that predates custom CSS as having none', () => {
    const theme: Partial<CustomTheme> = studioDefaults();
    delete theme.customCSS;
    const parsed = themeAgentClientDataSchema.safeParse({
      theme,
      locked: NO_LOCKS,
    });
    expect(parsed.success && parsed.data?.theme.customCSS).toBe('');
  });

  it('accepts a snapshot from a page that predates locks', () => {
    const parsed = themeAgentClientDataSchema.safeParse({
      theme: studioDefaults(),
    });
    expect(parsed.success && parsed.data?.locked).toEqual(NO_LOCKS);
  });

  it('reads a lock list from a page before per-mode locks as no locks', () => {
    // The browser still holds what it locked; only the prompt lists none.
    const parsed = themeAgentClientDataSchema.safeParse({
      theme: studioDefaults(),
      locked: ['--wa-color-brand'],
    });
    expect(parsed.success && parsed.data?.locked).toEqual(NO_LOCKS);
  });

  it('accepts the snapshot a message carries and refuses a malformed one', () => {
    const snapshot = createThemeAgentConversation().messageSent(
      studioDefaults(),
      NO_LOCKS
    );
    expect(themeAgentClientDataSchema.safeParse(snapshot).success).toBe(true);
    expect(
      themeAgentClientDataSchema.safeParse({ theme: { light: {} } }).success
    ).toBe(false);
  });
});

/** Locks as the sidebar's switches set them, one value per call. */
function locks(...changes: LockedValues[]): LockedValues {
  return changes.reduce(
    (locked, change) => withLocks(locked, change, true),
    NO_LOCKS
  );
}

const darkSurface = valueLock('--wa-color-surface-default', ['dark']);
const brand = valueLock('--wa-color-brand', ['light', 'dark']);

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
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#d64228');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(outcome.theme.shadowComponents).toEqual(['Card']);
    expect(outcome.held).toEqual([]);
  });

  it('a dark surface locked by hand stays and is held; the light surface changes', () => {
    const conversation = createThemeAgentConversation();
    const tuned = studioDefaults();
    tuned.dark['--wa-color-surface-default'] = '#1a1a1a';

    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      tuned,
      locks(darkSurface)
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#1a1a1a');
    expect(outcome.theme.light['--wa-color-surface-default']).toBe('#fdf6ec');
    expect(outcome.held).toEqual([
      {
        kind: 'value',
        reason: 'locked',
        cssVar: '--wa-color-surface-default',
        proposed: { dark: '#241a12' },
        was: { dark: '#1a1a1a' },
      },
    ]);
    expect(conversation.heldChanges('answer-1')).toEqual([
      { change: outcome.held[0], state: 'held', resolves: [] },
    ]);
  });

  it('locks a mode-independent value in both modes', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      // The switch was flipped while editing dark mode.
      locks(valueLock('--wa-color-brand', ['dark']))
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.light['--wa-color-brand']).toBe('#0071ec');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#0071ec');
    expect(outcome.held[0]).toMatchObject({
      cssVar: '--wa-color-brand',
      proposed: { light: '#d64228', dark: '#d64228' },
    });
  });

  it('a value locked while the answer was written is held when it arrives', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    // Locked during the run: the answer arrives with the lock in place.
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2.5' }, dark: {} }],
      studioDefaults(),
      locks(valueLock('--wa-border-radius-scale', ['light', 'dark']))
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('1');
    expect(outcome.held).toHaveLength(1);
    expect(conversation.answerStatus('answer-1')).toBe('unchanged');
  });

  it('a radius changed by hand during the run, then locked, is held', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const current = studioDefaults();
    current.light['--wa-border-radius-scale'] = '0.5';
    current.dark['--wa-border-radius-scale'] = '0.5';

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2.5' }, dark: {} }],
      current,
      locks(valueLock('--wa-border-radius-scale', ['light', 'dark']))
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('0.5');
    expect(outcome.held[0]).toMatchObject({
      proposed: { light: '2.5', dark: '2.5' },
      was: { light: '0.5', dark: '0.5' },
    });
  });

  it('holds a new shadow component list when the list is locked', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      SHADOW_COMPONENTS_LOCK
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.shadowComponents).toEqual([]);
    expect(outcome.held).toEqual([
      {
        kind: 'shadowComponents',
        reason: 'locked',
        proposed: ['Card'],
        was: [],
      },
    ]);
  });

  it('unlock and apply one value leaves the others held', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      locks(brand, darkSurface, SHADOW_COMPONENTS_LOCK)
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const result = conversation.applyHeld('answer-1', outcome.theme, 1);

    expect(result?.unlock).toEqual(darkSurface);
    expect(result?.applied).toBe(1);
    expect(result?.theme.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(result?.theme.dark['--wa-color-brand']).toBe('#0071ec');
    expect(
      conversation.heldChanges('answer-1').map((entry) => entry.state)
    ).toEqual(['held', 'applied', 'held']);
    // The outcome keeps only what is still held.
    expect(
      conversation.answerReceived('answer-1', [], outcome.theme, NO_LOCKS)
    ).toMatchObject({
      held: [{ cssVar: '--wa-color-brand' }, { kind: 'shadowComponents' }],
    });
    // Once only.
    expect(
      conversation.applyHeld('answer-1', result!.theme, 1)
    ).toBeUndefined();
  });

  it('unlock and apply all applies every held change and says what to unlock', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      locks(brand, SHADOW_COMPONENTS_LOCK)
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const result = conversation.applyHeld('answer-1', outcome.theme);

    expect(result?.unlock).toEqual(locks(brand, SHADOW_COMPONENTS_LOCK));
    expect(result?.theme.dark['--wa-color-brand']).toBe('#d64228');
    expect(result?.theme.shadowComponents).toEqual(['Card']);
    expect(
      conversation.heldChanges('answer-1').every((e) => e.state === 'applied')
    ).toBe(true);
    expect(conversation.applyHeld('answer-1', result!.theme)).toBeUndefined();
  });

  it('unlock and apply leaves a value the user changed since, and its lock', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      locks(brand, darkSurface)
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    // The user unlocked the dark surface, tuned it and locked it again.
    const tuned = structuredClone(outcome.theme);
    tuned.dark['--wa-color-surface-default'] = '#202020';

    const result = conversation.applyHeld('answer-1', tuned);

    expect(result?.theme.dark['--wa-color-surface-default']).toBe('#202020');
    expect(result?.theme.dark['--wa-color-brand']).toBe('#d64228');
    expect(result?.unlock).toEqual(brand);
    expect(result).toMatchObject({ applied: 1, changed: 1 });
    expect(
      conversation.heldChanges('answer-1').map((entry) => entry.state)
    ).toEqual(['applied', 'changed']);
  });

  it('sending the next message keeps what is still held', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      locks(brand)
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    conversation.messageSent(outcome.theme, locks(brand));

    expect(conversation.heldChanges('answer-1')[0].state).toBe('kept');
    expect(conversation.applyHeld('answer-1', outcome.theme)).toBeUndefined();
  });

  it('undo after unlock and apply reverts the held changes and locks them again', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#d64228' }, dark: {} }],
      studioDefaults(),
      locks(brand)
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const result = conversation.applyHeld('answer-1', outcome.theme);
    expect(conversation.answerStatus('answer-1')).toBe('applied');

    const undone = conversation.undo('answer-1', result!.theme);

    expect(undone?.theme.dark['--wa-color-brand']).toBe('#0071ec');
    expect(undone?.relock).toEqual(brand);
  });

  it('undo after unlock and apply leaves a value changed since, and unlocked', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      locks(brand, darkSurface)
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const result = conversation.applyHeld('answer-1', outcome.theme);
    // Unlocked by "Unlock and apply", the brand is tuned by hand.
    const tuned = structuredClone(result!.theme);
    tuned.light['--wa-color-brand'] = '#7c3aed';
    tuned.dark['--wa-color-brand'] = '#7c3aed';

    const undone = conversation.undo('answer-1', tuned);

    expect(undone?.theme.dark['--wa-color-brand']).toBe('#7c3aed');
    expect(undone?.theme.dark['--wa-color-surface-default']).toBe(
      studioDefaults().dark['--wa-color-surface-default']
    );
    expect(undone?.relock).toEqual(darkSurface);
  });

  it('undo of an answer that unlocked nothing locks nothing', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [warmer],
      studioDefaults(),
      locks(brand)
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(conversation.undo('answer-1', outcome.theme)?.relock).toEqual(
      NO_LOCKS
    );
  });

  it('checks contrast again after unlock and apply', () => {
    const conversation = createThemeAgentConversation();
    const pale = studioDefaults();
    pale.light['--wa-color-text-quiet'] = '#aaaaaa';
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-text-quiet': '#595959' }, dark: {} }],
      pale,
      locks(valueLock('--wa-color-text-quiet', ['light']))
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
    const snapshot = conversation.messageSent(studioDefaults(), {
      light: ['--wa-nonexistent'],
      dark: ['--wa-color-surface-default'],
      shadowComponents: true,
    });
    expect(snapshot.locked).toEqual({
      light: [],
      dark: ['--wa-color-surface-default'],
      shadowComponents: true,
      customCSS: false,
    });
  });
});

describe('Theme Agent conversation: what the last answer did', () => {
  const greenBrand = { light: { '--wa-color-brand': '#2f8f4e' }, dark: {} };

  it('says nothing before the first answer', () => {
    const snapshot = createThemeAgentConversation().messageSent(
      studioDefaults(),
      NO_LOCKS
    );
    expect(snapshot.previous).toBeUndefined();
  });

  it('tells the agent its last answer was refused, and why', () => {
    const conversation = createThemeAgentConversation();
    conversation.answerReceived(
      'answer-1',
      [{ ...greenBrand, reasons: { '--wa-color-brand': 'Green.' } }],
      studioDefaults(),
      NO_LOCKS
    );

    const snapshot = conversation.messageSent(studioDefaults(), NO_LOCKS);

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
    conversation.answerReceived(
      'answer-1',
      [
        {
          light: {},
          dark: {
            '--wa-color-brand': '#2f8f4e',
            '--wa-color-surface-default': '#241a12',
          },
        },
      ],
      studioDefaults(),
      locks(brand, darkSurface)
    );

    const snapshot = conversation.messageSent(studioDefaults(), locks(brand));

    expect(snapshot.previous).toEqual({
      status: 'unchanged',
      held: ['--wa-color-brand', '--wa-color-surface-default (dark mode)'],
      errors: [],
    });
  });

  it('says nothing about an answer that proposed nothing, not an older one', () => {
    const conversation = createThemeAgentConversation();
    conversation.answerFinished('answer-1');
    conversation.answerReceived(
      'answer-1',
      [greenBrand],
      studioDefaults(),
      locks(brand)
    );
    expect(
      conversation.messageSent(studioDefaults(), locks(brand)).previous
    ).toMatchObject({ status: 'unchanged', held: ['--wa-color-brand'] });

    // The next answer only talks: the brand held by answer-1 is not its.
    conversation.answerFinished('answer-2');

    expect(
      conversation.messageSent(studioDefaults(), locks(brand)).previous
    ).toBeUndefined();
  });

  it('tells the agent once the user unlocked and applied, or undid the answer', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [greenBrand],
      studioDefaults(),
      locks(brand)
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const result = conversation.applyHeld('answer-1', outcome.theme);
    expect(conversation.messageSent(result!.theme, NO_LOCKS).previous).toEqual({
      status: 'applied',
      held: [],
      errors: [],
    });

    conversation.undo('answer-1', result!.theme);
    expect(
      conversation.messageSent(studioDefaults(), NO_LOCKS).previous
    ).toEqual({ status: 'undone', held: [], errors: [] });
  });
});

describe('Theme Agent conversation: values changed while the answer ran', () => {
  it('holds a value the user changed during the run instead of overwriting it', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    // Not locked, tuned in the sidebar while the answer was on its way.
    const current = studioDefaults();
    current.dark['--wa-color-surface-default'] = '#202020';

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: { '--wa-color-surface-default': '#fdf6ec' },
          dark: { '--wa-color-surface-default': '#241a12' },
        },
      ],
      current,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#202020');
    // The light surface was not touched during the run: it changes.
    expect(outcome.theme.light['--wa-color-surface-default']).toBe('#fdf6ec');
    expect(outcome.held).toEqual([
      {
        kind: 'value',
        reason: 'edited',
        cssVar: '--wa-color-surface-default',
        proposed: { dark: '#241a12' },
        was: { dark: '#202020' },
      },
    ]);
  });

  it('holds a shadow component list the user changed during the run', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const current = studioDefaults();
    current.shadowComponents = ['Button'];

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: {}, shadowComponents: ['Card'] }],
      current,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.shadowComponents).toEqual(['Button']);
    expect(outcome.held).toEqual([
      {
        kind: 'shadowComponents',
        reason: 'edited',
        proposed: ['Card'],
        was: ['Button'],
      },
    ]);
  });

  it('holds a mode-independent value changed during the run as one change for both modes', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const current = studioDefaults();
    current.light['--wa-color-brand'] = '#7c3aed';
    current.dark['--wa-color-brand'] = '#7c3aed';

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#d64228' }, dark: {} }],
      current,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#7c3aed');
    expect(outcome.held).toEqual([
      expect.objectContaining({
        reason: 'edited',
        cssVar: '--wa-color-brand',
        proposed: { light: '#d64228', dark: '#d64228' },
      }),
    ]);
  });

  it('a value the user changed before sending the message is not held', () => {
    const conversation = createThemeAgentConversation();
    const tuned = studioDefaults();
    tuned.dark['--wa-color-surface-default'] = '#202020';
    conversation.messageSent(tuned, NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: { '--wa-color-surface-default': '#241a12' } }],
      tuned,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(outcome.held).toEqual([]);
  });

  it('a value changed during the run and set back is not held', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    // Tuned and then set back: the answer was written for this value.
    const current = studioDefaults();

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: { '--wa-color-surface-default': '#241a12' } }],
      current,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(outcome.held).toEqual([]);
  });

  it('compares with the latest message, not an earlier one', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    conversation.answerFinished('answer-1');
    // Tuned before the second message, so not during its answer.
    const tuned = studioDefaults();
    tuned.dark['--wa-color-surface-default'] = '#202020';
    conversation.messageSent(tuned, NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-2',
      [{ light: {}, dark: { '--wa-color-surface-default': '#241a12' } }],
      tuned,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(outcome.held).toEqual([]);
  });

  it('apply on a value changed during the run unlocks nothing, and undo locks nothing', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const current = studioDefaults();
    current.light['--wa-border-radius-scale'] = '0.5';
    current.dark['--wa-border-radius-scale'] = '0.5';
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2.5' }, dark: {} }],
      current,
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('0.5');

    const result = conversation.applyHeld('answer-1', outcome.theme);

    expect(result?.theme.dark['--wa-border-radius-scale']).toBe('2.5');
    expect(result?.unlock).toEqual(NO_LOCKS);
    const undone = conversation.undo('answer-1', result!.theme);
    expect(undone?.theme.dark['--wa-border-radius-scale']).toBe('0.5');
    expect(undone?.relock).toEqual(NO_LOCKS);
  });

  it('tells the agent which values it did not change because the user changed them during the run', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const current = studioDefaults();
    current.dark['--wa-color-surface-default'] = '#202020';
    conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: { '--wa-color-surface-default': '#241a12' } }],
      current,
      NO_LOCKS
    );

    const snapshot = conversation.messageSent(current, NO_LOCKS);

    expect(snapshot.previous).toEqual({
      status: 'unchanged',
      held: [],
      edited: ['--wa-color-surface-default (dark mode)'],
      errors: [],
    });
    // The task reads it from the message.
    expect(themeAgentClientDataSchema.parse(snapshot)?.previous).toEqual(
      snapshot.previous
    );
  });
});

describe('Theme Agent conversation: contrast a locked value causes', () => {
  /** Light quiet text the user locked at #aaaaaa, which fails on every surface. */
  function paleQuietText(): CustomTheme {
    const theme = studioDefaults();
    theme.light['--wa-color-text-quiet'] = '#aaaaaa';
    return theme;
  }
  const quietText = valueLock('--wa-color-text-quiet', ['light']);
  const describePair = (v: {
    mode: string;
    foreground: string;
    background: string;
  }) => `${v.mode} ${v.foreground} on ${v.background}`;

  it('a held change names the violations applying it would fix', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-text-quiet': '#595959',
            '--wa-border-radius-scale': '2',
          },
          dark: {},
        },
      ],
      paleQuietText(),
      locks(quietText)
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const [entry] = conversation.heldChanges('answer-1');
    expect(entry.resolves.map(describePair)).toEqual([
      'light --wa-color-text-quiet on --wa-color-surface-raised',
      'light --wa-color-text-quiet on --wa-color-surface-default',
      'light --wa-color-text-quiet on --wa-color-surface-lowered',
    ]);
  });

  it('a held change stops naming a pair another held change has fixed', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-color-text-quiet': '#595959',
            // Dark enough for the pale quiet text on its own.
            '--wa-color-surface-raised': '#1a1a1a',
          },
          dark: {},
        },
      ],
      paleQuietText(),
      locks(quietText, valueLock('--wa-color-surface-raised', ['light']))
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const fixesRaised = () =>
      conversation
        .heldChanges('answer-1')
        .filter((entry) => entry.state === 'held')
        .flatMap((entry) => entry.resolves)
        .some((v) => v.background === '--wa-color-surface-raised');
    expect(fixesRaised()).toBe(true);

    // Unlock and apply the quiet text: every quiet text pair now passes.
    conversation.applyHeld('answer-1', outcome.theme, 0);

    expect(fixesRaised()).toBe(false);
  });

  it('a held change that fixes no failing pair names none', () => {
    const conversation = createThemeAgentConversation();
    conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2' }, dark: {} }],
      studioDefaults(),
      locks(valueLock('--wa-border-radius-scale', ['light', 'dark']))
    );
    expect(conversation.heldChanges('answer-1')[0].resolves).toEqual([]);
  });
});

describe('Theme Agent conversation: custom CSS', () => {
  const headerRule = [
    '.Card::part(base) { border: none; }',
    '.Card::part(header) { border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border); }',
  ].join('\n');
  const cardsOnly = {
    light: { '--wa-border-radius-scale': '0.5' },
    dark: {},
    customCSS: headerRule,
  };
  const handWritten = '.Button { text-transform: uppercase; }';

  /** Studio's defaults with the user's own custom CSS. */
  function withHandWritten(): CustomTheme {
    return { ...studioDefaults(), customCSS: handWritten };
  }

  it('applies custom CSS and values from one answer in one step', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      studioDefaults(),
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.customCSS).toBe(headerRule);
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('0.5');
    expect(outcome.held).toEqual([]);
    expect(conversation.answerStatus('answer-1')).toBe('applied');
  });

  it('replaces the custom CSS whole: a proposal is the complete custom CSS', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(withHandWritten(), NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: {}, customCSS: headerRule }],
      withHandWritten(),
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.customCSS).toBe(headerRule);
  });

  it('keeps the custom CSS when a proposal names none', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      withHandWritten(),
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.customCSS).toBe(handWritten);
  });

  it("keeps the user's own rules the subset would refuse, when the proposal carries them unchanged", () => {
    const own = '@font-face { font-family: Brand; src: url(/brand.woff2); }';
    const conversation = createThemeAgentConversation();
    const sent = { ...studioDefaults(), customCSS: own };
    conversation.messageSent(sent, NO_LOCKS);

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: {}, customCSS: `${own}\n${headerRule}` }],
      sent,
      NO_LOCKS
    );

    if (!outcome.applied) throw new Error(outcome.errors.join('; '));
    expect(outcome.theme.customCSS).toBe(`${own}\n${headerRule}`);
  });

  it('undo restores the custom CSS together with the values', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const reverted = conversation.undo('answer-1', outcome.theme);

    expect(reverted?.theme.customCSS).toBe(handWritten);
    expect(reverted?.theme.light['--wa-border-radius-scale']).toBe('1');
    expect(conversation.answerStatus('answer-1')).toBe('undone');
  });

  it('undo leaves custom CSS the user changed after the answer', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      studioDefaults(),
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const edited = { ...outcome.theme, customCSS: handWritten };

    const reverted = conversation.undo('answer-1', edited);

    expect(reverted?.theme.customCSS).toBe(handWritten);
    expect(reverted?.theme.light['--wa-border-radius-scale']).toBe('1');
  });

  it('locked custom CSS is never changed: its proposal is one held change with both texts', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(withHandWritten(), CUSTOM_CSS_LOCK);

    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      CUSTOM_CSS_LOCK
    );

    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme.customCSS).toBe(handWritten);
    // The values beside it are not locked, and land.
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('0.5');
    expect(outcome.held).toEqual([
      {
        kind: 'customCSS',
        reason: 'locked',
        proposed: headerRule,
        was: handWritten,
      },
    ]);
  });

  it('unlock and apply replaces locked custom CSS whole and unlocks it', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      CUSTOM_CSS_LOCK
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const result = conversation.applyHeld('answer-1', outcome.theme);

    expect(result?.theme.customCSS).toBe(headerRule);
    expect(result?.unlock).toEqual(CUSTOM_CSS_LOCK);
    expect(conversation.heldChanges('answer-1')[0].state).toBe('applied');
  });

  it('the next message keeps locked custom CSS as it is', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      CUSTOM_CSS_LOCK
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const snapshot = conversation.messageSent(outcome.theme, CUSTOM_CSS_LOCK);

    expect(snapshot.theme.customCSS).toBe(handWritten);
    expect(snapshot.previous?.held).toEqual(['customCSS']);
    expect(conversation.heldChanges('answer-1')[0].state).toBe('kept');
    expect(conversation.applyHeld('answer-1', outcome.theme)).toBeUndefined();
  });

  it('unlock and apply leaves custom CSS changed since, and its lock', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      CUSTOM_CSS_LOCK
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const rewritten = { ...outcome.theme, customCSS: '.Badge { gap: 0; }' };

    const result = conversation.applyHeld('answer-1', rewritten);

    expect(result?.theme.customCSS).toBe('.Badge { gap: 0; }');
    expect(result?.unlock).toEqual(NO_LOCKS);
    expect(result).toMatchObject({ applied: 0, changed: 1 });
  });

  it('undo after unlock and apply puts the custom CSS back and locks it again', () => {
    const conversation = createThemeAgentConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      CUSTOM_CSS_LOCK
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    const result = conversation.applyHeld('answer-1', outcome.theme);

    const reverted = conversation.undo('answer-1', result!.theme);

    expect(reverted?.theme.customCSS).toBe(handWritten);
    expect(reverted?.relock).toEqual(CUSTOM_CSS_LOCK);
  });

  it('holds custom CSS the user changed in the editor while the answer was written, locked or not', () => {
    for (const locked of [NO_LOCKS, CUSTOM_CSS_LOCK]) {
      const conversation = createThemeAgentConversation();
      conversation.messageSent(studioDefaults(), NO_LOCKS);

      const outcome = conversation.answerReceived(
        'answer-1',
        [cardsOnly],
        withHandWritten(),
        locked
      );

      if (!outcome.applied) throw new Error('answer was not applied');
      expect(outcome.theme.customCSS).toBe(handWritten);
      expect(outcome.held).toEqual([
        {
          kind: 'customCSS',
          reason: locked.customCSS ? 'locked' : 'edited',
          proposed: headerRule,
          was: handWritten,
        },
      ]);
    }
  });

  it('apply on custom CSS changed during the run unlocks nothing, and undo locks nothing', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    const outcome = conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      NO_LOCKS
    );
    if (!outcome.applied) throw new Error('answer was not applied');

    const result = conversation.applyHeld('answer-1', outcome.theme);
    expect(result?.theme.customCSS).toBe(headerRule);
    expect(result?.unlock).toEqual(NO_LOCKS);

    // Back to the user's edit, as the answer found it.
    const reverted = conversation.undo('answer-1', result!.theme);
    expect(reverted?.theme.customCSS).toBe(handWritten);
    expect(reverted?.relock).toEqual(NO_LOCKS);

    const snapshot = conversation.messageSent(reverted!.theme, NO_LOCKS);
    expect(snapshot.previous?.status).toBe('undone');
  });

  it('tells the agent its custom CSS was not changed because the user edited it during the run', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), NO_LOCKS);
    conversation.answerReceived(
      'answer-1',
      [cardsOnly],
      withHandWritten(),
      NO_LOCKS
    );

    const snapshot = conversation.messageSent(withHandWritten(), NO_LOCKS);

    expect(snapshot.previous).toEqual({
      status: 'applied',
      held: [],
      edited: ['customCSS'],
      errors: [],
    });
  });
});
