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

    const snapshot = conversation.messageSent(theme, 'Calm fintech theme');
    theme.dark['--wa-color-surface-default'] = '#303030';

    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#202020');
    expect(snapshot.theme.light['--wa-color-surface-default']).toBe('#ffffff');
  });
});

describe('Theme Agent conversation: apply', () => {
  it('applies a valid proposal on top of the current custom theme', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), 'Calm fintech theme');

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
      studioDefaults()
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
    conversation.messageSent(studioDefaults(), 'Calm fintech theme');

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      studioDefaults()
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
    conversation.messageSent(studioDefaults(), 'Calm fintech theme');

    const outcome = conversation.answerReceived(
      'answer-1',
      [proposal],
      studioDefaults()
    );

    expect(outcome.applied).toBe(false);
    if (outcome.applied) return;
    expect(outcome.errors.some((e) => e.startsWith(error))).toBe(true);
    expect(conversation.answerStatus('answer-1')).toBe('rejected');
    expect(conversation.undo('answer-1')).toBeUndefined();
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
      studioDefaults()
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
      studioDefaults()
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
      before
    );
    expect(outcome.applied).toBe(true);

    expect(conversation.undo('answer-1')).toEqual(studioDefaults());
    expect(conversation.answerStatus('answer-1')).toBe('undone');
    // One step: a second undo has nothing left to restore.
    expect(conversation.undo('answer-1')).toBeUndefined();
  });

  it('undoing an earlier answer restores the theme before it and undoes the later ones', () => {
    const conversation = createThemeAgentConversation();
    const first = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2' }, dark: {} }],
      studioDefaults()
    );
    if (!first.applied) throw new Error('first answer was not applied');
    const second = conversation.answerReceived(
      'answer-2',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      first.theme
    );
    expect(second.applied).toBe(true);

    expect(conversation.undo('answer-1')).toEqual(studioDefaults());
    expect(conversation.answerStatus('answer-2')).toBe('undone');
    expect(conversation.undo('answer-2')).toBeUndefined();
  });

  it('applies the same answer only once', () => {
    const conversation = createThemeAgentConversation();
    const proposal = { light: { '--wa-border-radius-scale': '2' }, dark: {} };
    const first = conversation.answerReceived(
      'answer-1',
      [proposal],
      studioDefaults()
    );
    if (!first.applied) throw new Error('answer was not applied');
    // Delivered again, after it was applied: the record of "before" must not
    // move to the theme that already contains the answer.
    conversation.answerReceived('answer-1', [proposal], first.theme);

    expect(conversation.undo('answer-1')).toEqual(studioDefaults());
  });
});

describe('Theme Agent conversation: refinement', () => {
  it('a second answer starts from the current theme, hand edits included', () => {
    const conversation = createThemeAgentConversation();
    const first = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-color-brand': '#0891b2' }, dark: {} }],
      studioDefaults()
    );
    if (!first.applied) throw new Error('first answer was not applied');

    // The user tunes the dark surface by hand, then asks for a warmer brand.
    const edited = structuredClone(first.theme);
    edited.dark['--wa-color-surface-default'] = '#1a1410';
    const snapshot = conversation.messageSent(edited, 'Make the brand warmer');
    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    const second = conversation.answerReceived(
      'answer-2',
      [{ light: { '--wa-color-brand': '#d97706' }, dark: {} }],
      edited
    );
    expect(second.applied).toBe(true);
    if (!second.applied) return;
    expect(second.theme.light['--wa-color-brand']).toBe('#d97706');
    expect(second.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    // Undo of the second answer goes back to the hand-edited theme.
    expect(conversation.undo('answer-2')).toEqual(edited);
  });
});

describe('Theme Agent conversation: accessibility', () => {
  it('applies a correction on top of the proposal it corrects', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), 'Calm fintech theme');

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
      studioDefaults()
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
    conversation.messageSent(studioDefaults(), 'Calm fintech theme');

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
      studioDefaults()
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
    conversation.undo('answer-1');
    expect(conversation.answerViolations('answer-1')).toEqual([]);
  });

  it('checks the theme as applied, hand edits made during the run included', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults(), 'Calm fintech theme');
    const current = studioDefaults();
    // Edited in the sidebar while the answer was on its way.
    current.dark['--wa-color-surface-raised'] = '#f5f5f5';

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '2' }, dark: {} }],
      current
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

  it('accepts a snapshot from a page that predates hand-set values', () => {
    const parsed = themeAgentClientDataSchema.safeParse({
      theme: studioDefaults(),
    });
    expect(parsed.success && parsed.data?.handSet).toEqual({
      light: [],
      dark: [],
      shadowComponents: false,
    });
  });

  it('accepts the snapshot a message carries and refuses a malformed one', () => {
    const snapshot = createThemeAgentConversation().messageSent(
      studioDefaults(),
      'Calm fintech theme'
    );
    expect(themeAgentClientDataSchema.safeParse(snapshot).success).toBe(true);
    expect(
      themeAgentClientDataSchema.safeParse({ theme: { light: {} } }).success
    ).toBe(false);
  });
});

/** A conversation whose first message has been sent with `theme`. */
function startedConversation(theme: CustomTheme = studioDefaults()) {
  const conversation = createThemeAgentConversation();
  conversation.messageSent(theme, 'Calm fintech theme');
  return conversation;
}

describe('Theme Agent conversation: hand-set values', () => {
  it('turns a proposal for a hand-set value into a change request and applies the rest', () => {
    const conversation = startedConversation();
    // The user tunes the dark surface by hand, then asks for a warmer theme.
    const edited = studioDefaults();
    edited.dark['--wa-color-surface-default'] = '#1a1410';
    conversation.userEdited('--wa-color-surface-default', 'dark');
    conversation.messageSent(edited, 'Make it warmer');

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: { '--wa-color-surface-default': '#fdf8f3' },
          dark: { '--wa-color-surface-default': '#241a12' },
          reasons: {
            '--wa-color-surface-default': 'A warmer surface carries the mood.',
          },
        },
      ],
      edited
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.dark['--wa-color-surface-default']).toBe('#1a1410');
    expect(outcome.theme.light['--wa-color-surface-default']).toBe('#fdf8f3');
    expect(outcome.changeRequests).toEqual([
      expect.objectContaining({
        kind: 'value',
        cssVar: '--wa-color-surface-default',
        modes: ['dark'],
        current: '#1a1410',
        proposed: '#241a12',
        reason: 'A warmer surface carries the mood.',
        status: 'open',
      }),
    ]);
  });
});

describe('Theme Agent conversation: when a value becomes hand-set', () => {
  it('a value changed while a run is in progress becomes a change request when the answer arrives', () => {
    const conversation = startedConversation();
    conversation.messageSent(studioDefaults(), 'Make it playful');
    // The run is in flight; the user changes the radius meanwhile.
    const edited = studioDefaults();
    edited.dark['--wa-border-radius-scale'] = '1.5';
    conversation.userEdited('--wa-border-radius-scale', 'dark');

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {
            '--wa-border-radius-scale': '2.5',
            '--wa-color-brand': '#db2777',
          },
          dark: {},
        },
      ],
      edited
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    // A mode-independent value is one change request for both modes.
    expect(outcome.changeRequests).toEqual([
      expect.objectContaining({
        cssVar: '--wa-border-radius-scale',
        modes: ['light', 'dark'],
        current: '1.5',
        proposed: '2.5',
      }),
    ]);
    expect(outcome.theme.light['--wa-border-radius-scale']).toBe('1');
    expect(outcome.theme.dark['--wa-border-radius-scale']).toBe('1.5');
    expect(outcome.theme.dark['--wa-color-brand']).toBe('#db2777');
  });

  it('values set before the first message are not hand-set', () => {
    const conversation = createThemeAgentConversation();
    const tuned = studioDefaults();
    tuned.dark['--wa-color-surface-default'] = '#1a1410';
    conversation.userEdited('--wa-color-surface-default', 'dark');
    const snapshot = conversation.messageSent(tuned, 'Make it playful');
    expect(snapshot.handSet).toEqual({
      light: [],
      dark: [],
      shadowComponents: false,
    });

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: { '--wa-color-surface-default': '#2a1a3a' } }],
      tuned
    );
    expect(outcome.applied && outcome.changeRequests).toEqual([]);
    expect(
      outcome.applied && outcome.theme.dark['--wa-color-surface-default']
    ).toBe('#2a1a3a');
  });

  it('tuning the dark surface leaves the light surface free', () => {
    const conversation = startedConversation();
    conversation.userEdited('--wa-color-surface-default', 'dark');
    const snapshot = conversation.messageSent(studioDefaults(), 'Warmer');
    expect(snapshot.handSet).toEqual({
      light: [],
      dark: ['--wa-color-surface-default'],
      shadowComponents: false,
    });
  });

  it('the shadow component list is one hand-set unit', () => {
    const conversation = startedConversation();
    const edited = studioDefaults();
    edited.shadowComponents = ['Card'];
    conversation.userEditedShadowComponents();

    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: {},
          dark: {},
          shadowComponents: ['Button'],
          reasons: { shadowComponents: 'Flat cards suit a calm theme.' },
        },
      ],
      edited
    );

    expect(outcome.applied).toBe(true);
    if (!outcome.applied) return;
    expect(outcome.theme.shadowComponents).toEqual(['Card']);
    expect(outcome.changeRequests).toEqual([
      expect.objectContaining({
        kind: 'shadowComponents',
        current: ['Card'],
        proposed: ['Button'],
        reason: 'Flat cards suit a calm theme.',
      }),
    ]);
    expect(conversation.answerStatus('answer-1')).toBe('unchanged');
  });
});

/** Hand-set dark surface and radius, one answer proposing both plus a brand. */
function twoChangeRequests() {
  const conversation = startedConversation();
  const edited = studioDefaults();
  edited.dark['--wa-color-surface-default'] = '#1a1410';
  edited.dark['--wa-border-radius-scale'] = '1.5';
  conversation.userEdited('--wa-color-surface-default', 'dark');
  conversation.userEdited('--wa-border-radius-scale', 'dark');
  conversation.messageSent(edited, 'Make it warmer and rounder');
  const outcome = conversation.answerReceived(
    'answer-1',
    [
      {
        light: {
          '--wa-border-radius-scale': '2.5',
          '--wa-color-brand': '#d97706',
        },
        dark: { '--wa-color-surface-default': '#241a12' },
      },
    ],
    edited
  );
  if (!outcome.applied) throw new Error('answer was not applied');
  const request = (cssVar: string) => {
    const found = outcome.changeRequests.find(
      (r) => r.kind === 'value' && r.cssVar === cssVar
    );
    if (!found) throw new Error(`no change request for ${cssVar}`);
    return found;
  };
  const surface = request('--wa-color-surface-default');
  const radius = request('--wa-border-radius-scale');
  return { conversation, edited, applied: outcome.theme, surface, radius };
}

describe('Theme Agent conversation: keep and overwrite', () => {
  it('overwrite applies the proposed value and it stops being hand-set', () => {
    const { conversation, applied, surface } = twoChangeRequests();

    const next = conversation.overwrite(surface.id, applied);
    expect(next?.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(conversation.openChangeRequests().map((r) => r.id)).not.toContain(
      surface.id
    );

    // No longer hand-set: the next answer changes it directly.
    if (!next) return;
    const snapshot = conversation.messageSent(next, 'A bit darker');
    expect(snapshot.handSet.dark).not.toContain('--wa-color-surface-default');
    const later = conversation.answerReceived(
      'answer-2',
      [{ light: {}, dark: { '--wa-color-surface-default': '#1c140e' } }],
      next
    );
    expect(
      later.applied && later.theme.dark['--wa-color-surface-default']
    ).toBe('#1c140e');
    expect(later.applied && later.changeRequests).toEqual([]);
  });

  it('a kept value stays and is not asked about again', () => {
    const { conversation, applied, surface } = twoChangeRequests();

    conversation.keep(surface.id);
    expect(
      conversation.changeRequests('answer-1').find((r) => r.id === surface.id)
        ?.status
    ).toBe('kept');

    const snapshot = conversation.messageSent(applied, 'More contrast please');
    expect(snapshot.kept.dark).toContain('--wa-color-surface-default');
    const later = conversation.answerReceived(
      'answer-2',
      [{ light: {}, dark: { '--wa-color-surface-default': '#000000' } }],
      applied
    );
    expect(
      later.applied && later.theme.dark['--wa-color-surface-default']
    ).toBe('#1a1410');
    expect(later.applied && later.changeRequests).toEqual([]);
  });

  it('a kept value is asked about again when the message names it', () => {
    const { conversation, applied, surface } = twoChangeRequests();
    conversation.keep(surface.id);

    conversation.messageSent(applied, 'Make the dark surface a bit warmer');
    const later = conversation.answerReceived(
      'answer-2',
      [{ light: {}, dark: { '--wa-color-surface-default': '#2a1c10' } }],
      applied
    );

    expect(
      later.applied && later.theme.dark['--wa-color-surface-default']
    ).toBe('#1a1410');
    expect(later.applied && later.changeRequests).toEqual([
      expect.objectContaining({
        cssVar: '--wa-color-surface-default',
        proposed: '#2a1c10',
      }),
    ]);
  });

  it('naming a hand-set value raises a change request, never a silent change', () => {
    const conversation = startedConversation();
    conversation.userEdited('--wa-border-radius-scale', 'dark');
    const edited = studioDefaults();
    edited.dark['--wa-border-radius-scale'] = '1.5';
    conversation.messageSent(edited, 'Set the radius to 3');

    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: { '--wa-border-radius-scale': '3' }, dark: {} }],
      edited
    );

    expect(
      outcome.applied && outcome.theme.dark['--wa-border-radius-scale']
    ).toBe('1.5');
    expect(outcome.applied && outcome.changeRequests).toHaveLength(1);
  });

  it('keep all and overwrite all resolve every open change request', () => {
    const kept = twoChangeRequests();
    kept.conversation.keepAll();
    expect(kept.conversation.openChangeRequests()).toEqual([]);
    expect(
      kept.conversation.changeRequests('answer-1').map((r) => r.status)
    ).toEqual(['kept', 'kept']);

    const overwritten = twoChangeRequests();
    const next = overwritten.conversation.overwriteAll(overwritten.applied);
    expect(next?.dark['--wa-color-surface-default']).toBe('#241a12');
    expect(next?.light['--wa-border-radius-scale']).toBe('2.5');
    expect(next?.dark['--wa-border-radius-scale']).toBe('2.5');
    expect(overwritten.conversation.openChangeRequests()).toEqual([]);
    const snapshot = overwritten.conversation.messageSent(next!, 'Thanks');
    expect(snapshot.handSet).toEqual({
      light: [],
      dark: [],
      shadowComponents: false,
    });
  });

  it('an answer whose changes are all held changes nothing until one is overwritten', () => {
    const conversation = startedConversation();
    conversation.userEdited('--wa-color-surface-default', 'dark');
    const edited = studioDefaults();
    edited.dark['--wa-color-surface-default'] = '#1a1410';
    const outcome = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: { '--wa-color-surface-default': '#241a12' } }],
      edited
    );
    if (!outcome.applied) throw new Error('answer was not applied');
    expect(outcome.theme).toEqual(edited);
    expect(conversation.answerStatus('answer-1')).toBe('unchanged');

    conversation.overwrite(outcome.changeRequests[0].id, edited);
    expect(conversation.answerStatus('answer-1')).toBe('applied');
  });

  it('sending the next message resolves open change requests as kept', () => {
    const { conversation, applied } = twoChangeRequests();

    const snapshot = conversation.messageSent(applied, 'Now the fonts');

    expect(conversation.openChangeRequests()).toEqual([]);
    expect(
      conversation.changeRequests('answer-1').map((r) => r.status)
    ).toEqual(['kept', 'kept']);
    expect(snapshot.kept.dark).toEqual([
      '--wa-color-surface-default',
      '--wa-border-radius-scale',
    ]);
  });
});

describe('Theme Agent conversation: undo with hand-set values', () => {
  it('undo restores values and hand-set status together', () => {
    const { conversation, edited, applied, surface } = twoChangeRequests();
    const next = conversation.overwrite(surface.id, applied);
    if (!next) throw new Error('nothing to overwrite');

    expect(conversation.undo('answer-1')).toEqual(edited);
    expect(conversation.openChangeRequests()).toEqual([]);

    // The dark surface is hand-set again, as it was before the answer.
    const snapshot = conversation.messageSent(edited, 'Try again');
    expect(snapshot.handSet.dark).toContain('--wa-color-surface-default');
    const retry = conversation.answerReceived(
      'answer-2',
      [{ light: {}, dark: { '--wa-color-surface-default': '#241a12' } }],
      edited
    );
    expect(
      retry.applied && retry.theme.dark['--wa-color-surface-default']
    ).toBe('#1a1410');
  });

  it('undo forgets a keep made on the undone answer', () => {
    const { conversation, edited, surface } = twoChangeRequests();
    conversation.keep(surface.id);
    conversation.undo('answer-1');

    const snapshot = conversation.messageSent(edited, 'Try again');
    expect(snapshot.kept.dark).toEqual([]);
    expect(snapshot.handSet.dark).toContain('--wa-color-surface-default');
  });
});

describe('Theme Agent conversation: reasons', () => {
  it('refuses a reason for a value the proposal does not change', () => {
    const conversation = startedConversation();
    const outcome = conversation.answerReceived(
      'answer-1',
      [
        {
          light: { '--wa-color-brand': '#0891b2' },
          dark: {},
          reasons: { '--wa-border-radius-scale': 'Rounder.' },
        },
      ],
      studioDefaults()
    );
    expect(outcome).toEqual({
      applied: false,
      errors: [
        'reasons --wa-border-radius-scale: not a value this proposal changes',
      ],
    });
  });
});

describe('Theme Agent conversation: naming a kept value', () => {
  /** Keep a hand-set value, then ask about it with `message`. */
  function askAgain(
    cssVar: string,
    mode: 'light' | 'dark',
    handValue: string,
    proposed: string,
    message: string
  ) {
    const conversation = startedConversation();
    const edited = studioDefaults();
    edited[mode][cssVar] = handValue;
    conversation.userEdited(cssVar, mode);
    const first = conversation.answerReceived(
      'answer-1',
      [{ light: {}, dark: { [cssVar]: proposed } }],
      edited
    );
    if (!first.applied) throw new Error('answer was not applied');
    conversation.keepAll();
    conversation.messageSent(edited, message);
    return conversation.answerReceived(
      'answer-2',
      [{ light: {}, dark: { [cssVar]: proposed } }],
      edited
    );
  }

  it.each([
    ['--wa-border-radius-scale', '1.5', '2.5', 'Make the corners more rounded'],
    ['--wa-border-radius-scale', '1.5', '2.5', 'Die Ecken runder, bitte'],
    ['--wa-shadow-opacity', '0.2', '0.1', 'Weniger Schatten'],
    [
      '--wa-font-family-heading',
      'ui-serif, serif',
      'ui-sans-serif, system-ui, sans-serif',
      'Use a sans font for headings',
    ],
    ['--wa-font-size-scale', '1', '1.1', 'The text is too small'],
    [
      '--wa-color-surface-default',
      '#1a1410',
      '#241a12',
      'Change the background',
    ],
  ])(
    '%s (hand-set %s, proposed %s) is asked about again after "%s"',
    (cssVar, hand, proposed, message) => {
      const outcome = askAgain(cssVar, 'dark', hand, proposed, message);
      expect(outcome.applied && outcome.changeRequests).toEqual([
        expect.objectContaining({ proposed }),
      ]);
    }
  );

  it('a message about something else does not ask about a kept value again', () => {
    const outcome = askAgain(
      '--wa-border-radius-scale',
      'dark',
      '1.5',
      '2.5',
      'Make the brand warmer'
    );
    expect(outcome.applied && outcome.changeRequests).toEqual([]);
  });
});
