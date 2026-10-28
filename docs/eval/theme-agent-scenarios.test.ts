import { describe, it, expect } from 'vitest';
import {
  acceptedProposals,
  SCENARIOS,
  type EvalScenario,
} from './theme-agent-scenarios';
import { THEME_AGENT_PROPOSE_TOOL } from '../src/kigumi-studio/theme-agent/constants';
import type { ThemeProposal } from '../src/kigumi-studio/theme-agent/proposal';
import { DEFAULT_VALUES } from '../src/kigumi-studio/lib/defaults';

// The judges decide the eval against the real model, so each is proven here
// on answers written by hand: one it passes, and every way it must fail.

function scenario(id: string): EvalScenario {
  const found = SCENARIOS.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No scenario ${id}`);
  return found;
}

function both(cssVar: string, value: string): ThemeProposal {
  return { light: { [cssVar]: value }, dark: { [cssVar]: value } };
}

describe('acceptedProposals', () => {
  it('keeps the accepted propose_theme calls, validated, in order', () => {
    const proposals = acceptedProposals([
      {
        toolName: THEME_AGENT_PROPOSE_TOOL,
        input: { light: { '--wa-color-primary': '#ff0000' }, dark: {} },
        output: { accepted: false },
      },
      {
        toolName: THEME_AGENT_PROPOSE_TOOL,
        input: { light: { '--wa-color-brand': '#dc2626' }, dark: {} },
        output: { accepted: true },
      },
      {
        toolName: THEME_AGENT_PROPOSE_TOOL,
        input: { light: {}, dark: { '--wa-color-surface-default': '#1c1410' } },
        output: { accepted: true },
      },
    ]);

    expect(proposals).toEqual([
      // A mode-independent value lands in both modes, as the browser applies it.
      both('--wa-color-brand', '#dc2626'),
      { light: {}, dark: { '--wa-color-surface-default': '#1c1410' } },
    ]);
  });

  it('ignores other tools and outputs it cannot read', () => {
    expect(
      acceptedProposals([
        {
          toolName: 'other_tool',
          input: { light: { '--wa-color-brand': '#dc2626' }, dark: {} },
          output: { accepted: true },
        },
        {
          toolName: THEME_AGENT_PROPOSE_TOOL,
          input: { light: { '--wa-color-brand': '#dc2626' }, dark: {} },
          output: 'accepted',
        },
      ])
    ).toEqual([]);
  });
});

describe('every scenario', () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))(
    '%s fails an answer that proposes nothing',
    (_id, s) => {
      const verdict = s.judge([], s.snapshot);
      expect(verdict.pass).toBe(false);
      expect(verdict.reason).toContain('no accepted proposal');
    }
  );

  it('has a unique id', () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('brand locked, make the brand red', () => {
  const s = scenario('locked-brand-red');

  it('locks the brand in the snapshot', () => {
    expect(s.snapshot.locked.light).toContain('--wa-color-brand');
    expect(s.snapshot.locked.dark).toContain('--wa-color-brand');
  });

  it('passes every red Studio might be offered', () => {
    for (const red of ['#d62839', '#b91c1c', '#ef4444', '#e11d48']) {
      expect(
        s.judge([both('--wa-color-brand', red)], s.snapshot).pass,
        red
      ).toBe(true);
    }
  });

  it('passes when the brand is proposed, so Studio holds it', () => {
    const verdict = s.judge([both('--wa-color-brand', '#dc2626')], s.snapshot);
    expect(verdict).toMatchObject({ pass: true });
    expect(verdict.reason).toContain('#dc2626');
  });

  it('fails when the held brand is not red', () => {
    for (const notRed of ['#0071ec', '#ea580c', '#7f6f6f']) {
      const verdict = s.judge([both('--wa-color-brand', notRed)], s.snapshot);
      expect(verdict.pass, notRed).toBe(false);
      expect(verdict.reason).toContain('not red');
    }
  });

  it('fails when the brand is left out of every proposal', () => {
    const verdict = s.judge(
      [both('--wa-color-text-link', '#b91c1c')],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('--wa-color-brand');
  });
});

describe('brand locked, improve a failing brand fill', () => {
  const s = scenario('locked-brand-improve-fill');

  it('locks the brand and starts from a failing fill the user set', () => {
    expect(s.snapshot.locked.light).toEqual(['--wa-color-brand']);
    expect(s.snapshot.theme.light['--wa-color-brand-fill-loud']).toBe(
      '#22c55e'
    );
    expect(s.messages).toEqual([{ role: 'user', content: 'improve' }]);
  });

  it('passes when a new fill carries white text in both modes', () => {
    const verdict = s.judge(
      [both('--wa-color-brand-fill-loud', '#15803d')],
      s.snapshot
    );
    expect(verdict).toMatchObject({ pass: true });
  });

  it('fails when the locked brand is proposed instead', () => {
    // Studio would hold it, but the fill fixes the pair (ADR 0015).
    const verdict = s.judge([both('--wa-color-brand', '#15803d')], s.snapshot);
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("the brand is the user's");
  });

  it('fails when the fill is not proposed', () => {
    const verdict = s.judge(
      [both('--wa-color-text-normal', '#000000')],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('text on the brand fill');
  });
});

describe('dark surface locked, make it warmer', () => {
  const s = scenario('locked-dark-surface-warmer');

  it('locks the dark surface only', () => {
    expect(s.snapshot.locked.dark).toContain('--wa-color-surface-default');
    expect(s.snapshot.locked.light).not.toContain('--wa-color-surface-default');
  });

  it('passes when the light surface changes and the dark one is held', () => {
    expect(
      s.judge([both('--wa-color-surface-default', '#fff7ed')], s.snapshot)
    ).toMatchObject({ pass: true });
  });

  it('passes when the light surface changes through the neutral colour', () => {
    expect(
      s.judge([both('--wa-color-neutral', '#78716c')], s.snapshot)
    ).toMatchObject({
      pass: true,
    });
  });

  it('fails when the light surface stays as it is', () => {
    const verdict = s.judge(
      [both('--wa-color-text-normal', '#292524')],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('no light surface changes');
  });

  it('fails when the dark surface the preview paints changes', () => {
    // The fixture's dark surface is the user's own value, so a dark neutral
    // colour leaves it alone. A dark surface at its default is derived from
    // the neutral colour, and changing that repaints it, locked or not.
    const atDefault = {
      ...s.snapshot,
      theme: {
        ...s.snapshot.theme,
        dark: {
          ...s.snapshot.theme.dark,
          '--wa-color-surface-default':
            DEFAULT_VALUES['--wa-color-surface-default'].dark,
        },
      },
    };
    const answer: ThemeProposal[] = [
      {
        light: { '--wa-color-surface-default': '#fff7ed' },
        dark: { '--wa-color-neutral': '#a8a29e' },
      },
    ];
    expect(s.judge(answer, s.snapshot)).toMatchObject({ pass: true });
    const verdict = s.judge(answer, atDefault);
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('dark');
  });
});

describe('nothing locked, make it warmer', () => {
  const s = scenario('unlocked-warmer');

  it('locks nothing', () => {
    expect(s.snapshot.locked).toEqual({
      light: [],
      dark: [],
      shadowComponents: false,
      customCSS: false,
    });
  });

  it('passes when the brand is left alone', () => {
    expect(
      s.judge([both('--wa-color-surface-default', '#fff7ed')], s.snapshot)
    ).toMatchObject({ pass: true });
  });

  it('fails when the brand fill is set for a mood', () => {
    // An unset fill follows the brand; set, it stops following it.
    const verdict = s.judge(
      [
        both('--wa-color-surface-default', '#fff7ed'),
        both('--wa-color-brand-fill-loud', '#9a3412'),
      ],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('--wa-color-brand-fill-loud');
  });

  it('fails when the brand is proposed', () => {
    const verdict = s.judge(
      [
        both('--wa-color-surface-default', '#fff7ed'),
        both('--wa-color-brand', '#ea580c'),
      ],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('--wa-color-brand');
  });
});

const HEADER_RULE = [
  '.Card::part(base) { border: none; }',
  '.Card::part(header) { border-bottom: var(--wa-border-width-s) solid var(--wa-color-surface-border); }',
].join('\n');

describe('nothing locked, a change no value can express', () => {
  const s = scenario('card-header-rule');

  it('passes when the header rule lands as custom CSS', () => {
    expect(
      s.judge([{ light: {}, dark: {}, customCSS: HEADER_RULE }], s.snapshot)
    ).toMatchObject({ pass: true });
  });

  it.each([
    ['no custom CSS', { light: { '--wa-border-width-scale': '0' }, dark: {} }],
    [
      'no header part',
      { light: {}, dark: {}, customCSS: '.Card { border: none; }' },
    ],
    [
      'the card border kept',
      {
        light: {},
        dark: {},
        customCSS:
          '.Card::part(header) { border-bottom: 1px solid var(--wa-color-surface-border); }',
      },
    ],
  ])('fails with %s', (_name, proposal) => {
    expect(s.judge([proposal], s.snapshot).pass).toBe(false);
  });

  it('fails when nothing is proposed', () => {
    expect(s.judge([], s.snapshot).pass).toBe(false);
  });
});

describe('custom CSS locked, the same request', () => {
  const s = scenario('locked-custom-css-header-rule');
  const complete = `${s.snapshot.theme.customCSS}\n${HEADER_RULE}`;

  it('locks the custom CSS', () => {
    expect(s.snapshot.locked.customCSS).toBe(true);
  });

  it('passes when the complete custom CSS is proposed, and so held', () => {
    expect(
      s.judge([{ light: {}, dark: {}, customCSS: complete }], s.snapshot)
    ).toMatchObject({ pass: true });
  });

  it('fails when the proposal drops the rule the user wrote', () => {
    const verdict = s.judge(
      [{ light: {}, dark: {}, customCSS: HEADER_RULE }],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('complete custom CSS');
  });

  it('fails when no custom CSS is proposed, so nothing is held', () => {
    const verdict = s.judge(
      [{ light: { '--wa-border-width-scale': '0' }, dark: {} }],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('holds no custom CSS');
  });
});

describe('nothing locked, no card border plus a + pattern', () => {
  const s = scenario('card-border-plus-pattern');

  it('passes when custom CSS removes the card border', () => {
    expect(
      s.judge(
        [
          {
            light: {},
            dark: {},
            customCSS: '.Card::part(base) { border: none; }',
          },
        ],
        s.snapshot
      )
    ).toMatchObject({ pass: true });
  });

  it.each([
    ['nothing proposed', []],
    [
      'no custom CSS',
      [{ light: { '--wa-color-surface-default': '#fafafa' }, dark: {} }],
    ],
    [
      'the card border kept',
      [
        {
          light: {},
          dark: {},
          customCSS:
            '.Card { background-image: radial-gradient(var(--wa-color-surface-border) 1px, transparent 1px); }',
        },
      ],
    ],
  ])('fails with %s', (_name, proposals) => {
    expect(s.judge(proposals, s.snapshot).pass).toBe(false);
  });
});

describe('nothing locked, a dot pattern on the page background', () => {
  const s = scenario('page-dot-pattern');
  const dots =
    'radial-gradient(var(--wa-color-surface-border) 1px, transparent 1px)';

  it.each(['body', 'html', ':root'])(
    'passes with the pattern on %s',
    (page) => {
      expect(
        s.judge(
          [
            {
              light: {},
              dark: {},
              customCSS: `${page} { background-image: ${dots}; background-size: 16px 16px; }`,
            },
          ],
          s.snapshot
        )
      ).toMatchObject({ pass: true });
    }
  );

  it.each([
    ['nothing proposed', []],
    [
      'the pattern on a component',
      [
        {
          light: {},
          dark: {},
          customCSS: `.Card { background-image: ${dots}; }`,
        },
      ],
    ],
    [
      'a plain page colour',
      [
        {
          light: {},
          dark: {},
          customCSS: 'body { background: var(--wa-color-surface-lowered); }',
        },
      ],
    ],
  ])('fails with %s', (_name, proposals) => {
    expect(s.judge(proposals, s.snapshot).pass).toBe(false);
  });
});

describe('nothing locked, a subtle shimmer on skeletons', () => {
  const s = scenario('skeleton-shimmer');
  const keyframes = '@keyframes skeleton-shimmer { 50% { opacity: 0.6; } }';
  const animate =
    '.Skeleton::part(indicator) { animation: skeleton-shimmer 2s ease-in-out infinite; }';
  const motionSafe = `@media (prefers-reduced-motion: no-preference) { ${animate} }`;

  it.each([
    ['the wrapper class', `${keyframes}\n${motionSafe}`],
    [
      'the tag',
      `${keyframes}\n${motionSafe.replace('.Skeleton', 'wa-skeleton')}`,
    ],
  ])('passes with a keyframes animation on %s', (_name, customCSS) => {
    expect(
      s.judge([{ light: {}, dark: {}, customCSS }], s.snapshot)
    ).toMatchObject({ pass: true });
  });

  it.each([
    ['nothing proposed', []],
    [
      'no keyframes',
      [
        {
          light: {},
          dark: {},
          customCSS: '.Skeleton::part(indicator) { opacity: 0.8; }',
        },
      ],
    ],
    [
      'the animation on another component',
      [
        {
          light: {},
          dark: {},
          customCSS: `${keyframes}\n${motionSafe.replace('.Skeleton', '.Card')}`,
        },
      ],
    ],
    [
      'keyframes no rule animates',
      [{ light: {}, dark: {}, customCSS: keyframes }],
    ],
  ])('fails with %s', (_name, proposals) => {
    expect(s.judge(proposals, s.snapshot).pass).toBe(false);
  });

  it('names the missing @keyframes as the reason', () => {
    expect(
      s.judge(
        [
          {
            light: {},
            dark: {},
            customCSS:
              '@media (prefers-reduced-motion: no-preference) { .Skeleton::part(indicator) { animation: pulse 2s; } }',
          },
        ],
        s.snapshot
      )
    ).toEqual({
      pass: false,
      reason: 'the custom CSS defines no @keyframes',
    });
  });
});

describe('a failing brand fill the user set, make the corners rounder', () => {
  const s = scenario('set-fill-corrected');

  it('starts from a brand fill the user set that fails under white text', () => {
    expect(s.snapshot.theme.light['--wa-color-brand-fill-loud']).toBe(
      '#22c55e'
    );
    expect(s.snapshot.theme.dark['--wa-color-brand-fill-loud']).toBe('#22c55e');
  });

  it('passes when a new fill carries white text in both modes', () => {
    const verdict = s.judge(
      [
        both('--wa-border-radius-scale', '2'),
        both('--wa-color-brand-fill-loud', '#15803d'),
      ],
      s.snapshot
    );
    expect(verdict).toMatchObject({ pass: true });
    expect(verdict.reason).toContain('#15803d');
  });

  it('fails when the fill is left failing', () => {
    const verdict = s.judge(
      [both('--wa-border-radius-scale', '2')],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('text on the brand fill');
  });

  it('fails when only one mode is fixed', () => {
    const verdict = s.judge(
      [{ light: { '--wa-color-brand-fill-loud': '#15803d' }, dark: {} }],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain('Dark mode, text on the brand fill');
  });

  it('fails when the brand is changed instead', () => {
    const verdict = s.judge(
      [
        both('--wa-color-brand', '#15803d'),
        both('--wa-color-brand-fill-loud', '#15803d'),
      ],
      s.snapshot
    );
    expect(verdict.pass).toBe(false);
    expect(verdict.reason).toContain("the brand is the user's");
  });
});
