import { describe, expect, it } from 'vitest';
import {
  generateTestJavascriptTemplate,
  generateTestTypescriptTemplate,
  generateVueJavascriptTemplate,
  generateVueTypescriptTemplate,
} from '../../../scripts/generate-vue-templates.js';
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

const SWITCH_FIXTURE: ComponentDefinition = {
  name: 'Switch',
  tagName: 'wa-switch',
  category: 'Form Controls',
  description: 'Switches allow the user to toggle an option on or off',
  dependencies: [],
  files: {
    react: ['components/Switch.tsx', 'types/switch.d.ts'],
    angular: ['components/Switch/switch.component.ts'],
  },
  props: [
    {
      name: 'name',
      type: 'string',
      description: 'Form field name',
    },
    {
      name: 'value',
      type: 'string',
      description: 'Form value when checked',
    },
    {
      name: 'size',
      type: 'string',
      values: ['small', 'medium', 'large'],
      default: 'medium',
      description: 'Switch size',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the switch',
    },
    {
      name: 'checked',
      type: 'boolean',
      default: 'false',
      description: 'Whether the switch is on',
    },
    {
      name: 'required',
      type: 'boolean',
      default: 'false',
      description: 'Makes the switch required',
    },
    {
      name: 'hint',
      type: 'string',
      default: "''",
      description: 'Hint text',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/switch/switch.js',
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

/** Badge plus the shared deprecated props, beside undeprecated ones. */
const DEPRECATED_PROPS_FIXTURE: ComponentDefinition = {
  ...BADGE_FIXTURE,
  props: [...BADGE_FIXTURE.props, ...DEPRECATED_PROPS],
};

// Markdown fixture exercises the REMOVED_IMPERATIVE_METHODS branch in
// buildJsdocBlock — its getMarked()/updateAll() methods are marked
// private in WA 3.5.0+, so the Vue wrapper carries an @remarks JSDoc
// note explaining the replacement pattern.
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

// Input exercises the `value` v-model branch: `defineModel<string>()`, the
// value watcher, `:value="model"` on the template, and a listener entry whose
// handler both syncs the model and re-emits.
const INPUT_FIXTURE: ComponentDefinition = {
  name: 'Input',
  tagName: 'wa-input',
  category: 'Form Controls',
  description: 'Inputs collect data from the user',
  dependencies: [],
  files: {
    react: ['components/Input.tsx', 'types/input.d.ts'],
    vue: ['components/Input.vue'],
    angular: ['components/Input/input.component.ts'],
  },
  props: [
    {
      name: 'label',
      type: 'string',
      description: 'Accessible label for the input',
      required: false,
    },
    {
      name: 'value',
      type: 'string',
      description: 'Input value',
      required: false,
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the input',
    },
    {
      name: 'with-clear',
      type: 'boolean',
      default: 'false',
      description: 'Adds a clear button when input has content',
      required: false,
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/input/input.js',
  tier: 'free',
};

// NumberInput exercises the number-typed value model: `defineModel<number>()`
// rather than `defineModel<string>()`, driven by the `value` prop's type.
const NUMBER_INPUT_FIXTURE: ComponentDefinition = {
  name: 'NumberInput',
  tagName: 'wa-number-input',
  category: 'Form Controls',
  description: 'Number inputs collect numeric data from the user',
  dependencies: [],
  files: {
    react: ['components/NumberInput.tsx', 'types/number-input.d.ts'],
    vue: ['components/NumberInput.vue'],
    angular: ['components/NumberInput/number-input.component.ts'],
  },
  props: [
    {
      name: 'value',
      type: 'number',
      description: 'The current value',
      required: false,
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Disables the number input',
    },
  ],
  importPath:
    '@awesome.me/webawesome/dist/components/number-input/number-input.js',
  tier: 'free',
};

// Dialog exercises the `open` v-model branch: `defineModel<boolean>('open')`,
// the open watcher, `:open="open"` on the template, and the wa-show/wa-hide
// listener entries that both sync `open` and re-emit. It also carries an
// @remarks JSDoc note for its removed imperative methods.
const DIALOG_FIXTURE: ComponentDefinition = {
  name: 'Dialog',
  tagName: 'wa-dialog',
  category: 'Overlays',
  description: 'Dialogs appear above the page and require a response',
  dependencies: [],
  files: {
    react: ['components/Dialog.tsx', 'types/dialog.d.ts'],
    vue: ['components/Dialog.vue'],
    angular: ['components/Dialog/dialog.component.ts'],
  },
  props: [
    {
      name: 'label',
      type: 'string',
      description: 'Accessible label for the dialog',
      required: false,
    },
    {
      name: 'open',
      type: 'boolean',
      default: 'false',
      description: 'Whether the dialog is open',
    },
    {
      name: 'without-header',
      type: 'boolean',
      default: 'false',
      description: 'Hides the dialog header',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/dialog/dialog.js',
  tier: 'free',
};

// Toast exercises two branches no other fixture reaches: the component-specific
// `import type` block (its create() takes a ToastCreateOptions parameter), and
// exposed methods carrying parameters — typed in the TS variant, bare in JS.
const TOAST_FIXTURE: ComponentDefinition = {
  name: 'Toast',
  tagName: 'wa-toast',
  category: 'Feedback',
  description: 'Toasts are used to display brief notifications',
  dependencies: [],
  files: {
    react: ['components/Toast.tsx', 'types/toast.d.ts'],
    vue: ['components/Toast.vue'],
    angular: ['components/Toast/toast.component.ts'],
  },
  props: [
    {
      name: 'variant',
      type: 'string',
      values: ['brand', 'success', 'warning', 'danger'],
      default: 'brand',
      description: "The toast's theme variant",
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/toast/toast.js',
  tier: 'pro',
};

const COLOR_PICKER = getComponent('color-picker')!;

describe('generateVueTypescriptTemplate', () => {
  it('emits the Button wrapper', () => {
    expect(generateVueTypescriptTemplate(BUTTON_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Badge wrapper (no events, no methods branch)', () => {
    expect(generateVueTypescriptTemplate(BADGE_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Switch wrapper (checked v-model branch)', () => {
    expect(generateVueTypescriptTemplate(SWITCH_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Markdown wrapper with the @remarks JSDoc for removed imperative methods', () => {
    expect(generateVueTypescriptTemplate(MARKDOWN_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Input wrapper (value v-model branch)', () => {
    expect(generateVueTypescriptTemplate(INPUT_FIXTURE)).toMatchSnapshot();
  });

  it('emits the NumberInput wrapper (number-typed value model)', () => {
    expect(
      generateVueTypescriptTemplate(NUMBER_INPUT_FIXTURE)
    ).toMatchSnapshot();
  });

  it('emits the Dialog wrapper (open v-model branch)', () => {
    expect(generateVueTypescriptTemplate(DIALOG_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Toast wrapper (custom type import, parameterised method)', () => {
    expect(generateVueTypescriptTemplate(TOAST_FIXTURE)).toMatchSnapshot();
  });
});

describe('consumer lint baseline (issue #136)', () => {
  const branches: Array<[string, ComponentDefinition]> = [
    ['Badge (no events, no methods)', BADGE_FIXTURE],
    ['Button (events, methods)', BUTTON_FIXTURE],
    ['Switch (checked v-model)', SWITCH_FIXTURE],
    ['Input (string value v-model)', INPUT_FIXTURE],
    ['NumberInput (number value v-model)', NUMBER_INPUT_FIXTURE],
    ['Dialog (open v-model)', DIALOG_FIXTURE],
    ['Toast (custom type import, parameterised method)', TOAST_FIXTURE],
    ['ColorPicker (a CEM parameter typed from its default)', COLOR_PICKER],
  ];

  it.each(branches)(
    'emits a %s TS wrapper that a consumer lints clean',
    async (_label, component) => {
      const name = component.name;
      expect(
        await lintAsConsumer(
          generateVueTypescriptTemplate(component),
          `src/components/ui/${name}/${name}.vue`
        )
      ).toEqual([]);
    }
  );

  it.each(branches)(
    'emits a %s JS wrapper that a consumer lints clean',
    async (_label, component) => {
      const name = component.name;
      expect(
        await lintAsConsumer(
          generateVueJavascriptTemplate(component),
          `src/components/ui/${name}/${name}.vue`
        )
      ).toEqual([]);
    }
  );

  it('declares no emits for a component without events', () => {
    // An empty `defineEmits<{}>()` is `no-empty-object-type`, and the
    // `emit` it returns is never called.
    expect(generateVueTypescriptTemplate(BADGE_FIXTURE)).not.toContain(
      'defineEmits'
    );
    expect(generateVueJavascriptTemplate(BADGE_FIXTURE)).not.toContain(
      'defineEmits'
    );
  });

  it('types the element ref as the Web Awesome element', () => {
    const source = generateVueTypescriptTemplate(BUTTON_FIXTURE);
    expect(source).toContain(
      "import type WaButton from '@awesome.me/webawesome/dist/components/button/button.js';"
    );
    expect(source).toContain('const elementRef = ref<WaButton | null>(null);');
  });
});

describe('generateVueJavascriptTemplate', () => {
  it('emits the Button JS wrapper', () => {
    expect(generateVueJavascriptTemplate(BUTTON_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Badge JS wrapper (no events, no methods branch)', () => {
    expect(generateVueJavascriptTemplate(BADGE_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Switch JS wrapper (checked v-model branch)', () => {
    expect(generateVueJavascriptTemplate(SWITCH_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Markdown JS wrapper with the @remarks JSDoc for removed imperative methods', () => {
    expect(generateVueJavascriptTemplate(MARKDOWN_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Input JS wrapper (value v-model branch)', () => {
    expect(generateVueJavascriptTemplate(INPUT_FIXTURE)).toMatchSnapshot();
  });

  it('emits the NumberInput JS wrapper (untyped value model)', () => {
    expect(
      generateVueJavascriptTemplate(NUMBER_INPUT_FIXTURE)
    ).toMatchSnapshot();
  });

  it('emits the Dialog JS wrapper (open v-model branch)', () => {
    expect(generateVueJavascriptTemplate(DIALOG_FIXTURE)).toMatchSnapshot();
  });

  it('emits the Toast JS wrapper (no type import, bare method params)', () => {
    expect(generateVueJavascriptTemplate(TOAST_FIXTURE)).toMatchSnapshot();
  });
});

describe('generateTestTypescriptTemplate', () => {
  it('emits the Button TS test stub', () => {
    expect(
      generateTestTypescriptTemplate('Button', 'wa-button')
    ).toMatchSnapshot();
  });
});

describe('generateTestJavascriptTemplate', () => {
  it('emits the Button JS test stub', () => {
    expect(
      generateTestJavascriptTemplate('Button', 'wa-button')
    ).toMatchSnapshot();
  });
});

describe('deprecated props (issue #129)', () => {
  it.each([
    ['.vue', generateVueTypescriptTemplate],
    ['.js.vue', generateVueJavascriptTemplate],
  ] as const)(
    '%s attaches a @deprecated tag carrying the registry message',
    (_dialect, generate) => {
      const tags = readPropDeprecations(
        generate(DEPRECATED_PROPS_FIXTURE),
        'vue'
      );
      expect(tags.get('min')).toBe(DEPRECATION_MESSAGES.min);
      expect(tags.get('index-axis')).toBe(DEPRECATION_MESSAGES['index-axis']);
      expect(tags.get('pill')).toBeNull();
      expect(tags.get('variant')).toBeNull();
    }
  );
});
