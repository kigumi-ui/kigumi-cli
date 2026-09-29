import { describe, expect, it } from 'vitest';
import { generateReactTypescriptTemplate } from '../../../scripts/generate-react-templates.js';
import {
  getComponent,
  type ComponentDefinition,
} from '../../../src/utils/registry.js';
import { lintAsConsumer } from '../_helpers/consumer-lint.js';
import { readPropDeprecations } from '../_helpers/deprecation-readers.js';
import {
  DEPRECATED_PROPS,
  DEPRECATION_MESSAGES,
} from '../_helpers/deprecated-props-fixture.js';

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

const SPINNER_FIXTURE: ComponentDefinition = {
  name: 'Spinner',
  tagName: 'wa-spinner',
  category: 'Feedback',
  description: 'Spinners indicate an indeterminate wait',
  dependencies: [],
  files: {
    react: ['components/Spinner.tsx'],
    angular: ['components/Spinner/spinner.component.ts'],
  },
  props: [],
  importPath: '@awesome.me/webawesome/dist/components/spinner/spinner.js',
  tier: 'free',
};

const COLOR_PICKER = getComponent('color-picker')!;

/** Badge plus the shared deprecated props, beside undeprecated ones. */
const DEPRECATED_PROPS_FIXTURE: ComponentDefinition = {
  ...BADGE_FIXTURE,
  props: [...BADGE_FIXTURE.props, ...DEPRECATED_PROPS],
};

describe('generateReactTypescriptTemplate', () => {
  it('emits the Button wrapper', () => {
    expect(generateReactTypescriptTemplate(BUTTON_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Badge wrapper (no events, no methods branch)', () => {
    expect(generateReactTypescriptTemplate(BADGE_FIXTURE)).toMatchSnapshot();
  });
});

describe('consumer lint baseline (issue #136)', () => {
  it('declares a wrapper with no props and no events as a type alias', () => {
    // An `interface X extends Y {}` is `no-empty-object-type`.
    const source = generateReactTypescriptTemplate(SPINNER_FIXTURE);
    expect(source).toContain(
      "export type SpinnerProps = Omit<HTMLAttributes<HTMLElement>, 'dir'>;"
    );
    expect(source).not.toContain('interface SpinnerProps');
  });

  it('types array and object props with unknown, not any', async () => {
    // No registry prop is an array or object today, so this fixture is the
    // only thing that runs those branches.
    const component: ComponentDefinition = {
      ...BADGE_FIXTURE,
      props: [
        { name: 'items', type: 'array', description: 'Fixture' },
        { name: 'options', type: 'object', description: 'Fixture' },
      ],
    };
    const source = generateReactTypescriptTemplate(component);
    expect(source).toContain('items?: unknown[];');
    expect(source).toContain('options?: Record<string, unknown>;');
    expect(
      await lintAsConsumer(source, 'src/components/ui/Badge/Badge.tsx')
    ).toEqual([]);
  });

  it.each([
    ['Spinner (no props, no events)', SPINNER_FIXTURE],
    ['Badge (props, no events)', BADGE_FIXTURE],
    ['Button (props, events, methods)', BUTTON_FIXTURE],
    ['ColorPicker (a CEM parameter typed from its default)', COLOR_PICKER],
  ])('emits %s that a consumer lints clean', async (_label, component) => {
    const name = component.name;
    expect(
      await lintAsConsumer(
        generateReactTypescriptTemplate(component),
        `src/components/ui/${name}/${name}.tsx`
      )
    ).toEqual([]);
  });
});

describe('deprecated props (issue #129)', () => {
  const source = generateReactTypescriptTemplate(DEPRECATED_PROPS_FIXTURE);
  const tags = readPropDeprecations(source, 'tsx');

  it('attaches a @deprecated tag carrying the registry message', () => {
    expect(tags.get('min')).toBe(DEPRECATION_MESSAGES.min);
    expect(tags.get('index-axis')).toBe(DEPRECATION_MESSAGES['index-axis']);
  });

  it('keeps the prop description beside the tag', () => {
    expect(source).toContain('Floor value for the value axis scale');
  });

  it('leaves every other prop undeprecated', () => {
    expect(tags.get('pill')).toBeNull();
    expect(tags.get('variant')).toBeNull();
  });
});
