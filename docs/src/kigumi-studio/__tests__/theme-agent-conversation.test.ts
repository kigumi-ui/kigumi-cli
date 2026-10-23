import { describe, it, expect } from 'vitest';
import { createThemeAgentConversation } from '../theme-agent/conversation';
import type { CustomTheme } from '../theme-agent/custom-theme';

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

    const snapshot = conversation.messageSent(theme);
    theme.dark['--wa-color-surface-default'] = '#303030';

    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#202020');
    expect(snapshot.theme.light['--wa-color-surface-default']).toBe('#ffffff');
  });
});

describe('Theme Agent conversation: apply', () => {
  it('applies a valid proposal on top of the current custom theme', () => {
    const conversation = createThemeAgentConversation();
    conversation.messageSent(studioDefaults());

    const outcome = conversation.answerReceived(
      'answer-1',
      {
        light: {
          '--wa-color-brand': '#0891b2',
          '--wa-color-surface-default': '#f8fafc',
        },
        dark: { '--wa-color-surface-default': '#0f172a' },
        shadowComponents: ['Card', 'Button'],
      },
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
    conversation.messageSent(studioDefaults());

    const outcome = conversation.answerReceived(
      'answer-1',
      { light: { '--wa-color-brand': '#0891b2' }, dark: {} },
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
    conversation.messageSent(studioDefaults());

    const outcome = conversation.answerReceived(
      'answer-1',
      proposal,
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
      {
        light: {
          '--wa-color-brand': '#0891b2',
          '--wa-color-surface-default': 'hsl(0 0% 100%)',
        },
        dark: {},
      },
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
      { light: { '--wa-transition-fast': '100ms' }, dark: {} },
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
      {
        light: { '--wa-color-surface-default': '#f8fafc' },
        dark: { '--wa-color-surface-default': '#0f172a' },
        shadowComponents: ['Card'],
      },
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
      { light: { '--wa-border-radius-scale': '2' }, dark: {} },
      studioDefaults()
    );
    if (!first.applied) throw new Error('first answer was not applied');
    const second = conversation.answerReceived(
      'answer-2',
      { light: { '--wa-color-brand': '#0891b2' }, dark: {} },
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
      proposal,
      studioDefaults()
    );
    if (!first.applied) throw new Error('answer was not applied');
    // Delivered again, after it was applied: the record of "before" must not
    // move to the theme that already contains the answer.
    conversation.answerReceived('answer-1', proposal, first.theme);

    expect(conversation.undo('answer-1')).toEqual(studioDefaults());
  });
});

describe('Theme Agent conversation: refinement', () => {
  it('a second answer starts from the current theme, hand edits included', () => {
    const conversation = createThemeAgentConversation();
    const first = conversation.answerReceived(
      'answer-1',
      { light: { '--wa-color-brand': '#0891b2' }, dark: {} },
      studioDefaults()
    );
    if (!first.applied) throw new Error('first answer was not applied');

    // The user tunes the dark surface by hand, then asks for a warmer brand.
    const edited = structuredClone(first.theme);
    edited.dark['--wa-color-surface-default'] = '#1a1410';
    const snapshot = conversation.messageSent(edited);
    expect(snapshot.theme.dark['--wa-color-surface-default']).toBe('#1a1410');

    const second = conversation.answerReceived(
      'answer-2',
      { light: { '--wa-color-brand': '#d97706' }, dark: {} },
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
