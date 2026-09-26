import { describe, expect, it } from 'vitest';
import {
  generateComponentTS,
  generateSpec,
} from '../../../scripts/generate-angular-templates.js';
import type { ComponentDefinition } from '../../../src/utils/registry.js';

const BUTTON_FIXTURE: ComponentDefinition = {
  name: 'Button',
  tagName: 'wa-button',
  category: 'Actions',
  description: 'Buttons represent actions that are available to the user',
  dependencies: [],
  files: {
    react: ['components/Button.tsx', 'types/button.d.ts'],
    vue: ['components/Button.vue'],
    angular: ['components/Button/button.component.ts'],
  },
  props: [
    {
      name: 'variant',
      type: 'string',
      values: ['neutral', 'brand', 'success', 'warning', 'danger'],
      default: 'neutral',
      description: 'Semantic variant of the button',
    },
    {
      name: 'appearance',
      type: 'string',
      values: ['accent', 'filled-outlined', 'filled', 'outlined', 'plain'],
      default: 'filled',
      description: 'Visual appearance style',
    },
    {
      name: 'size',
      type: 'string',
      values: ['small', 'medium', 'large'],
      default: 'medium',
      description: 'Button size',
    },
    {
      name: 'pill',
      type: 'boolean',
      default: 'false',
      description: 'Gives the button rounded edges',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the button',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Shows a loading indicator',
    },
    {
      name: 'with-caret',
      type: 'boolean',
      default: 'false',
      description: 'Adds a dropdown indicator caret',
      required: false,
    },
    {
      name: 'href',
      type: 'string',
      description: 'Makes the button work like a link',
      required: false,
    },
    {
      name: 'target',
      type: 'string',
      values: ['_blank', '_self', '_parent', '_top'],
      description: 'Link target (when href is set)',
      required: false,
    },
    {
      name: 'download',
      type: 'string',
      description: 'Download filename (when href is set)',
      required: false,
    },
    {
      name: 'rel',
      type: 'string',
      description: 'Link relationship (when href is set)',
      required: false,
    },
    {
      name: 'type',
      type: 'string',
      values: ['button', 'submit', 'reset'],
      default: 'button',
      description: "The button's type for form submission",
    },
    {
      name: 'name',
      type: 'string',
      description: 'The name of the button for form submission',
      required: false,
    },
    {
      name: 'value',
      type: 'string',
      description: 'The value of the button for form submission',
      required: false,
    },
    {
      name: 'formaction',
      type: 'string',
      description: "Override the form's action attribute",
      required: false,
    },
    {
      name: 'formenctype',
      type: 'string',
      description: "Override the form's enctype attribute",
      required: false,
    },
    {
      name: 'formmethod',
      type: 'string',
      description: "Override the form's method attribute",
      required: false,
    },
    {
      name: 'formnovalidate',
      type: 'boolean',
      default: 'false',
      description: 'Bypass form validation when this button submits',
    },
    {
      name: 'formtarget',
      type: 'string',
      description: "Override the form's target attribute",
      required: false,
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/button/button.js',
  tier: 'free',
};

const BADGE_FIXTURE: ComponentDefinition = {
  name: 'Badge',
  tagName: 'wa-badge',
  category: 'Display',
  description:
    'Badges are used to draw attention and display statuses or counts',
  dependencies: [],
  files: {
    react: ['components/Badge.tsx', 'types/badge.d.ts'],
    angular: ['components/Badge/badge.component.ts'],
  },
  props: [
    {
      name: 'variant',
      type: 'string',
      values: ['brand', 'neutral', 'success', 'warning', 'danger'],
      default: 'brand',
      description: "The badge's theme variant",
    },
    {
      name: 'appearance',
      type: 'string',
      values: ['accent', 'filled', 'outlined', 'filled-outlined'],
      default: 'accent',
      description: "The badge's visual appearance",
    },
    {
      name: 'pill',
      type: 'boolean',
      default: 'false',
      description: 'Draws a pill-style badge with rounded edges',
    },
    {
      name: 'attention',
      type: 'string',
      values: ['none', 'pulse', 'bounce'],
      default: 'none',
      description: 'Adds an animation to draw attention to the badge',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/badge/badge.js',
  tier: 'free',
};

// Markdown fixture exercises the REMOVED_IMPERATIVE_METHODS branch in
// generateComponentTS — its getMarked()/updateAll() methods are marked
// private in WA 3.5.0+, so the wrapper carries an @remarks JSDoc note
// explaining the replacement pattern. Keeps the apiNote branch covered
// without pulling Dialog's full event surface into the fixture set.
const MARKDOWN_FIXTURE: ComponentDefinition = {
  name: 'Markdown',
  tagName: 'wa-markdown',
  category: 'Display',
  description: 'Renders markdown content in plain HTML',
  dependencies: [],
  files: {
    react: ['components/Markdown.tsx', 'types/markdown.d.ts'],
    vue: ['components/Markdown.vue'],
    angular: ['components/Markdown/markdown.component.ts'],
  },
  props: [
    {
      name: 'tab-size',
      type: 'number',
      default: '4',
      description: 'Tab stop width for whitespace normalization',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/markdown/markdown.js',
  tier: 'free',
};

// IntersectionObserver's `once` starts with "on", which Angular refuses as a
// template binding (it reads as an event handler), so the generator writes
// it from ngOnChanges instead (issue #77).
const INTERSECTION_OBSERVER_FIXTURE: ComponentDefinition = {
  name: 'IntersectionObserver',
  tagName: 'wa-intersection-observer',
  category: 'Utilities',
  description:
    'Observes changes in the intersection of a target element with an ancestor',
  dependencies: [],
  files: {
    angular: [
      'components/IntersectionObserver/intersection-observer.component.ts',
    ],
  },
  props: [
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the observer',
    },
    {
      name: 'once',
      type: 'boolean',
      default: 'false',
      description: 'Stops observing after first intersection',
    },
  ],
  importPath:
    '@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js',
  tier: 'free',
};

// Rating is a value form control whose CEM declares `change` but no `input`,
// so its ControlValueAccessor must read the value on `change` (issue #77).
const RATING_FIXTURE: ComponentDefinition = {
  name: 'Rating',
  tagName: 'wa-rating',
  category: 'Forms',
  description: 'Ratings give users a way to quickly view and provide feedback',
  dependencies: [],
  files: {
    angular: ['components/Rating/rating.component.ts'],
  },
  props: [
    {
      name: 'value',
      type: 'number',
      default: '0',
      description: 'The current rating',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/rating/rating.js',
  tier: 'free',
};

describe('generateComponentTS', () => {
  it('emits the Button component', () => {
    expect(generateComponentTS(BUTTON_FIXTURE, 'button')).toMatchSnapshot();
  });

  it('emits the Badge component (no events, no methods branch)', () => {
    expect(generateComponentTS(BADGE_FIXTURE, 'badge')).toMatchSnapshot();
  });

  it('emits the Markdown component with the @remarks JSDoc for removed imperative methods', () => {
    expect(generateComponentTS(MARKDOWN_FIXTURE, 'markdown')).toMatchSnapshot();
  });

  it('writes an on* boolean from ngOnChanges instead of binding it', () => {
    expect(
      generateComponentTS(
        INTERSECTION_OBSERVER_FIXTURE,
        'intersection-observer'
      )
    ).toMatchSnapshot();
  });

  it('reads a form value on change where the CEM declares no input', () => {
    expect(generateComponentTS(RATING_FIXTURE, 'rating')).toMatchSnapshot();
  });

  it('refuses an on* prop it cannot write from the class', () => {
    const fixture: ComponentDefinition = {
      ...INTERSECTION_OBSERVER_FIXTURE,
      props: [{ name: 'onset', type: 'string', description: 'Fixture' }],
    };

    expect(() => generateComponentTS(fixture, 'intersection-observer')).toThrow(
      /prop "onset" starts with "on" but is not a boolean/
    );
  });
});

describe('generateSpec', () => {
  it('emits the Button spec stub', () => {
    expect(generateSpec(BUTTON_FIXTURE)).toMatchSnapshot();
  });
});
