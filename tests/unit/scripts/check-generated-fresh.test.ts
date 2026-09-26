import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOCAL_REGISTRY } from '../../../src/utils/registry.js';
import {
  stripCssComments,
  cssRulesEqual,
  extractReactSurface,
  diffSubset,
  isDocsOnlyCssAllowed,
  splitCssRuleBlocks,
  containsAtRule,
  extractVueSurface,
  compareVueVariants,
  checkVueJsVariantSubset,
  checkReactJsVariantSubset,
} from '../../../scripts/check-generated-fresh.js';

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

describe('stripCssComments', () => {
  it('removes block comments and blank lines, trimming each rule line', () => {
    // Each line is trimmed so indentation differences never count as drift.
    const input = `/* doc comment\n * CSS Parts:\n * base — root\n */\n.Foo {\n  display: none;\n}\n\n`;
    expect(stripCssComments(input)).toBe('.Foo {\ndisplay: none;\n}');
  });

  it('treats two files differing only in comments as equal rules', () => {
    const a = `/* old style\n * base — root\n */\n.Foo::part(base) { color: red; }\n`;
    const b = `/* new style\n * - base: the root\n */\n.Foo::part(base) { color: red; }\n`;
    expect(cssRulesEqual(a, b)).toBe(true);
  });

  it('detects a real rule difference even when comments match', () => {
    const a = `/* same */\n.Foo { color: red; }\n`;
    const b = `/* same */\n.Foo { color: blue; }\n`;
    expect(cssRulesEqual(a, b)).toBe(false);
  });

  it('normalizes trailing/leading whitespace per line', () => {
    const a = `.Foo {  color: red;  }`;
    const b = `.Foo {  color: red;  }\n`;
    expect(cssRulesEqual(a, b)).toBe(true);
  });

  it('strips consecutive block comments on the same line', () => {
    const input = `/* a */.Foo { color: red; }/* b */`;
    expect(stripCssComments(input)).toBe('.Foo { color: red; }');
  });
});

describe('containsAtRule', () => {
  it('detects @media / @keyframes / @supports / @layer', () => {
    expect(
      containsAtRule('@media (max-width: 1px) { .x { color: red; } }')
    ).toBe(true);
    expect(containsAtRule('@layer base { .x {} }')).toBe(true);
  });

  it('returns false for flat rule-only CSS', () => {
    expect(containsAtRule('.Foo { color: red; }')).toBe(false);
  });

  it('ignores @ inside comments only', () => {
    // The @ is inside a stripped comment, so no real at-rule remains.
    expect(containsAtRule('/* see @media docs */ .Foo { color: red; }')).toBe(
      false
    );
  });
});

describe('splitCssRuleBlocks', () => {
  it('splits flat CSS into whole rule blocks on the closing brace', () => {
    const css = `.A { color: red; }\n.B::part(x) { display: none; }`;
    expect(splitCssRuleBlocks(css)).toEqual([
      '.A { color: red;\n}',
      '.B::part(x) { display: none;\n}',
    ]);
  });

  it('keeps multi-line declarations within their block', () => {
    const css = `.A {\n  color: red;\n  display: none;\n}`;
    expect(splitCssRuleBlocks(css)).toEqual([
      '.A {\ncolor: red;\ndisplay: none;\n}',
    ]);
  });
});

describe('isDocsOnlyCssAllowed', () => {
  it('allows the Page navigation-toggle docs-only override (multi-line rule)', () => {
    // The real docs override spans selector line + declaration + closing brace.
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n.Page {\n  color: red;\n}`;
    const template = `.Page {\n  color: red;\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(true);
  });

  it('does not allow an unlisted extra rule for an allowlisted component', () => {
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n.Page::part(footer) {\n  color: red;\n}\n.Page {\n  color: red;\n}`;
    const template = `.Page {\n  color: red;\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(false);
  });

  it('does not allow a missing/changed template rule even with allowlist', () => {
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n.Page {\n  color: blue;\n}`;
    const template = `.Page {\n  color: red;\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(false);
  });

  it('does not allow docs-only rules for a non-allowlisted component', () => {
    const docs = `.Button::part(base) { color: red; }\n.Button { color: red; }`;
    const template = `.Button { color: red; }`;
    expect(isDocsOnlyCssAllowed('Button', docs, template)).toBe(false);
  });

  it('refuses (returns false) when an at-rule is present, even if allowlisted', () => {
    // Nested at-rules cannot be safely rule-block-split, so fail loudly.
    const docs = `.Page::part(navigation-toggle) {\n  display: none;\n}\n@media (max-width: 1px) {\n  .Page { color: red; }\n}`;
    const template = `@media (max-width: 1px) {\n  .Page { color: red; }\n}`;
    expect(isDocsOnlyCssAllowed('Page', docs, template)).toBe(false);
  });
});

describe('extractReactSurface', () => {
  it('extracts addEventListener events (single and double quotes)', () => {
    const src = `
      el.addEventListener('blur', handleBlur);
      el.addEventListener("wa-invalid", handleWaInvalid);
    `;
    expect(extractReactSurface(src).events).toEqual(
      new Set(['blur', 'wa-invalid'])
    );
  });

  it('returns an empty event set when no listeners are wired', () => {
    expect(extractReactSurface('const x = 1;').events).toEqual(new Set());
  });
});

describe('diffSubset', () => {
  it('passes when jsx is a strict subset of tsx', () => {
    const tsx = new Set(['blur', 'focus', 'change']);
    const jsx = new Set(['blur']);
    expect(diffSubset(jsx, tsx)).toEqual([]);
  });

  it('passes when jsx equals tsx', () => {
    const tsx = new Set(['blur', 'focus']);
    const jsx = new Set(['blur', 'focus']);
    expect(diffSubset(jsx, tsx)).toEqual([]);
  });

  it('reports members present in jsx but absent in tsx', () => {
    const tsx = new Set(['blur']);
    const jsx = new Set(['blur', 'ghost-event']);
    expect(diffSubset(jsx, tsx)).toEqual(['ghost-event']);
  });

  it('passes for an empty subset', () => {
    expect(diffSubset(new Set(), new Set(['blur']))).toEqual([]);
  });
});

/** A JavaScript SFC (`.js.vue`) around the given `<script setup>` body. */
function jsSfc(script: string): string {
  return `<script setup>\n${script}\n</script>\n\n<template>\n  <wa-button ref="elementRef"><slot /></wa-button>\n</template>\n`;
}

describe('extractVueSurface (JavaScript dialect)', () => {
  it('reads defineEmits names from the array form', () => {
    const surface = extractVueSurface(
      jsSfc(`const emit = defineEmits(['blur', 'wa-invalid']);`)
    );
    expect(surface.emits).toEqual(new Set(['blur', 'wa-invalid']));
  });

  it('reads host listener names from addEventListener, not from removals', () => {
    const surface = extractVueSurface(
      jsSfc(
        [
          'onMounted(() => {',
          '  const el = elementRef.value;',
          '  if (!el) return;',
          "  el.addEventListener('blur', handleBlur);",
          '  el.addEventListener("wa-invalid", handleWaInvalid);',
          '});',
          'onBeforeUnmount(() => {',
          "  elementRef.value?.removeEventListener('wa-ghost', handleGhost);",
          '});',
        ].join('\n')
      )
    );
    expect(surface.listeners).toEqual(new Set(['blur', 'wa-invalid']));
  });

  it('reads prop names from the options object, not the option keys inside it', () => {
    const surface = extractVueSurface(
      jsSfc(
        [
          'const props = defineProps({',
          "  variant: { type: String, required: false, default: 'neutral' },",
          "  'with-caret': {",
          '    type: Boolean,',
          '    required: false,',
          '    default: false,',
          '  },',
          '});',
        ].join('\n')
      )
    );
    expect(surface.props).toEqual(new Set(['variant', 'with-caret']));
  });

  it('reads defineEmits names from the object form, validators included', () => {
    const surface = extractVueSurface(
      jsSfc(
        [
          'const emit = defineEmits({',
          '  blur: null,',
          "  'wa-show': (event) => event instanceof Event,",
          '  change(value) {',
          '    return value !== undefined;',
          '  },',
          '});',
        ].join('\n')
      )
    );
    expect(surface.emits).toEqual(new Set(['blur', 'wa-show', 'change']));
  });

  it('reads prop names from the array form', () => {
    const surface = extractVueSurface(
      jsSfc(`const props = defineProps(['label', 'with-caret']);`)
    );
    expect(surface.props).toEqual(new Set(['label', 'with-caret']));
  });
});

/** A TypeScript SFC (`.vue`) around the given `<script setup lang="ts">` body. */
function tsSfc(script: string): string {
  return `<script setup lang="ts">\n${script}\n</script>\n\n<template>\n  <wa-button ref="elementRef"><slot /></wa-button>\n</template>\n`;
}

describe('extractVueSurface (TypeScript dialect)', () => {
  it('reads defineEmits names from the type literal, quoted or not', () => {
    const surface = extractVueSurface(
      tsSfc(
        `const emit = defineEmits<{\n  blur: [event: FocusEvent];\n  'wa-invalid': [event: CustomEvent];\n}>();`
      )
    );
    expect(surface.emits).toEqual(new Set(['blur', 'wa-invalid']));
  });

  it('reads defineEmits names from call signatures, unions included', () => {
    const surface = extractVueSurface(
      tsSfc(
        [
          'const emit = defineEmits<{',
          "  (e: 'change', value: string): void;",
          "  (e: 'wa-show' | 'wa-hide'): void;",
          '}>();',
        ].join('\n')
      )
    );
    expect(surface.emits).toEqual(new Set(['change', 'wa-show', 'wa-hide']));
  });

  it('reads prop names from the interface that defineProps names', () => {
    const surface = extractVueSurface(
      tsSfc(
        [
          'export interface ButtonProps {',
          '  variant?: string;',
          "  'with-caret'?: boolean;",
          '  size?:',
          "    | 'small'",
          "    | 'medium';",
          '}',
          '',
          'const props = defineProps<ButtonProps>();',
        ].join('\n')
      )
    );
    expect(surface.props).toEqual(new Set(['variant', 'with-caret', 'size']));
  });

  it('reads prop names from a type alias that defineProps names', () => {
    const surface = extractVueSurface(
      tsSfc(
        [
          'type DialogProps = {',
          '  label: string;',
          "  'light-dismiss'?: boolean;",
          '};',
          'const props = defineProps<DialogProps>();',
        ].join('\n')
      )
    );
    expect(surface.props).toEqual(new Set(['label', 'light-dismiss']));
  });

  it('counts each defineModel as the prop Vue declares for it', () => {
    const surface = extractVueSurface(
      tsSfc(
        [
          'const model = defineModel<boolean>({ default: false });',
          "const open = defineModel<boolean>('open', { default: false });",
        ].join('\n')
      )
    );
    expect(surface.props).toEqual(new Set(['modelValue', 'open']));
    expect(surface.unreadable).toEqual([]);
  });

  it('ignores a member call that only shares a macro name', () => {
    const surface = extractVueSurface(
      tsSfc(
        [
          'helpers.defineProps({ ghost: { type: String } });',
          "helpers.defineEmits(['wa-ghost']);",
        ].join('\n')
      )
    );
    expect(surface.props).toEqual(new Set());
    expect(surface.emits).toEqual(new Set());
  });
});

describe('extractVueSurface (declarations it cannot enumerate)', () => {
  it('reads empty declarations as empty, not as unreadable', () => {
    for (const source of [
      jsSfc('defineProps({});\ndefineEmits([]);'),
      jsSfc('defineProps();\ndefineEmits();'),
      tsSfc(
        'interface EmptyProps {}\ndefineProps<EmptyProps>();\ndefineEmits<{\n  // No events for this component\n}>();'
      ),
    ]) {
      const surface = extractVueSurface(source);
      expect(surface.unreadable).toEqual([]);
      expect(surface.props).toEqual(new Set());
      expect(surface.emits).toEqual(new Set());
    }
  });

  it.each([
    [
      'a runtime declaration held in a variable',
      jsSfc('defineEmits(EMITS);'),
      'defineEmits: EMITS is not an array or object literal',
    ],
    [
      'an array element that is not a string',
      jsSfc("defineEmits(['blur', EVENT]);"),
      'defineEmits: EVENT is not a string literal',
    ],
    [
      'a spread in the options object',
      jsSfc('defineProps({ ...shared, label: String });'),
      'defineProps: ...shared has no literal name',
    ],
    [
      'a computed key in the options object',
      jsSfc('defineProps({ [key]: String });'),
      'defineProps: [key]: String has no literal name',
    ],
    [
      'a props type imported from another module',
      tsSfc(
        "import type { ImportedProps } from './types';\ndefineProps<ImportedProps>();"
      ),
      'defineProps: ImportedProps is not a type literal or a type declared in this <script setup>',
    ],
    [
      'an interface that extends another type',
      tsSfc(
        'interface ButtonProps extends BaseProps {\n  label: string;\n}\ndefineProps<ButtonProps>();'
      ),
      'defineProps: extends BaseProps is not read',
    ],
    [
      'a type alias that is not a type literal',
      tsSfc(
        'type DialogProps = BaseProps & { label: string };\ndefineProps<DialogProps>();'
      ),
      'defineProps: BaseProps & { label: string } is not a type literal',
    ],
    [
      'an index signature among the props',
      tsSfc('defineProps<{ label: string; [key: string]: unknown }>();'),
      'defineProps: [key: string]: unknown has no literal name',
    ],
    [
      'a call signature whose event is not a string literal',
      tsSfc("defineEmits<{ (e: 'change' | Other): void }>();"),
      "defineEmits: (e: 'change' | Other): void has no literal name",
    ],
    [
      'a defineModel name that is not a string',
      jsSfc('defineModel(NAME, { default: false });'),
      'defineModel: NAME is not a string literal',
    ],
    [
      'a listener whose event name is not a string',
      jsSfc('el.addEventListener(eventName, handler);'),
      'addEventListener: eventName is not a string literal',
    ],
    [
      'an SFC without <script setup>',
      '<template>\n  <wa-button><slot /></wa-button>\n</template>\n',
      'no <script setup> block',
    ],
    [
      'a plain <script> block beside <script setup>',
      "<script>\nexport default { emits: ['wa-ghost'] };\n</script>\n" +
        jsSfc("defineEmits(['blur']);"),
      'a plain <script> block, whose options are not read',
    ],
    [
      'a script language that is not JavaScript or TypeScript',
      '<script setup lang="coffee">\ndefineEmits [\'blur\']\n</script>\n',
      '<script setup lang="coffee"> is not JavaScript or TypeScript',
    ],
    [
      'an SFC that does not parse',
      jsSfc("defineEmits(['blur']);").replace('</script>', ''),
      'the SFC does not parse: Element is missing end tag.',
    ],
  ])('records %s instead of reading it as empty', (_label, source, reason) => {
    expect(extractVueSurface(source).unreadable).toEqual([reason]);
  });
});

describe('compareVueVariants', () => {
  const BUTTON_VUE = tsSfc(
    [
      'export interface ButtonProps {',
      '  variant?: string;',
      "  'with-caret'?: boolean;",
      '}',
      'const props = defineProps<ButtonProps>();',
      'const emit = defineEmits<{',
      '  blur: [event: FocusEvent];',
      "  'wa-invalid': [event: CustomEvent];",
      '}>();',
      "el.addEventListener('blur', handleBlur);",
      "el.addEventListener('wa-invalid', handleWaInvalid);",
    ].join('\n')
  );
  const BUTTON_JS_VUE = jsSfc(
    [
      'const props = defineProps({',
      "  variant: { type: String, required: false, default: 'neutral' },",
      "  'with-caret': { type: Boolean, required: false, default: false },",
      '});',
      "const emit = defineEmits(['blur', 'wa-invalid']);",
      "el.addEventListener('blur', handleBlur);",
      "el.addEventListener('wa-invalid', handleWaInvalid);",
    ].join('\n')
  );

  /** Replace `from` in the .js.vue fixture, failing if it is not there. */
  function injectIntoJs(from: string, to: string): string {
    expect(BUTTON_JS_VUE).toContain(from);
    return BUTTON_JS_VUE.replace(from, to);
  }

  it('reports nothing when the .js.vue declares what the .vue declares', () => {
    expect(compareVueVariants('Button', BUTTON_VUE, BUTTON_JS_VUE)).toEqual([]);
  });

  it('reports nothing when the .js.vue declares less than the .vue', () => {
    const lessJs = jsSfc("const emit = defineEmits(['blur']);");
    expect(compareVueVariants('Button', BUTTON_VUE, lessJs)).toEqual([]);
  });

  it('reports an event only the .js.vue emits', () => {
    const js = injectIntoJs("'wa-invalid']", "'wa-invalid', 'wa-ghost']");
    expect(compareVueVariants('Button', BUTTON_VUE, js)).toEqual([
      {
        check: 'C',
        component: 'Button',
        message: '.js.vue emits events absent from .vue: wa-ghost',
      },
    ]);
  });

  it('reports a listener only the .js.vue registers', () => {
    const js = injectIntoJs(
      "el.addEventListener('blur', handleBlur);",
      "el.addEventListener('blur', handleBlur);\nel.addEventListener('wa-ghost', handleGhost);"
    );
    expect(compareVueVariants('Button', BUTTON_VUE, js)).toEqual([
      {
        check: 'C',
        component: 'Button',
        message: '.js.vue listens for events absent from .vue: wa-ghost',
      },
    ]);
  });

  it('reports a prop only the .js.vue declares', () => {
    const js = injectIntoJs(
      "  'with-caret':",
      "  ghost: { type: String, required: false },\n  'with-caret':"
    );
    expect(compareVueVariants('Button', BUTTON_VUE, js)).toEqual([
      {
        check: 'C',
        component: 'Button',
        message: '.js.vue declares props absent from .vue: ghost',
      },
    ]);
  });

  it('reports a variant it cannot read instead of comparing it', () => {
    const js = injectIntoJs(
      "defineEmits(['blur', 'wa-invalid'])",
      'defineEmits(EMITS)'
    );
    expect(compareVueVariants('Button', BUTTON_VUE, js)).toEqual([
      {
        check: 'C',
        component: 'Button',
        message:
          'cannot read .js.vue: defineEmits: EMITS is not an array or object literal',
      },
    ]);
  });

  it('reports an unreadable .vue too, since it is the superset compared against', () => {
    const vue = BUTTON_VUE.replace('<script setup lang="ts">', '<script>');
    expect(vue).not.toBe(BUTTON_VUE);
    expect(compareVueVariants('Button', vue, BUTTON_JS_VUE)).toEqual([
      {
        check: 'C',
        component: 'Button',
        message: 'cannot read .vue: no <script setup> block',
      },
    ]);
  });
});

describe('checkVueJsVariantSubset', () => {
  let templatesDir: string;

  beforeEach(async () => {
    templatesDir = await fs.mkdtemp(path.join(os.tmpdir(), 'check-c-vue-'));
  });

  afterEach(async () => {
    await fs.remove(templatesDir);
  });

  it('compares every directory holding both variants and names the Template', async () => {
    await fs.outputFile(
      path.join(templatesDir, 'Button', 'Button.vue'),
      tsSfc('defineEmits<{ blur: [event: FocusEvent] }>();')
    );
    await fs.outputFile(
      path.join(templatesDir, 'Button', 'Button.js.vue'),
      jsSfc("defineEmits(['blur', 'wa-ghost']);")
    );
    // Missing variants are validate:templates' finding, not this check's.
    await fs.outputFile(
      path.join(templatesDir, 'Badge', 'Badge.vue'),
      tsSfc('defineEmits<{ blur: [event: FocusEvent] }>();')
    );
    await fs.outputFile(path.join(templatesDir, 'tsconfig.json'), '{}');

    expect(await checkVueJsVariantSubset(templatesDir)).toEqual({
      findings: [
        {
          check: 'C',
          component: 'Button',
          message: '.js.vue emits events absent from .vue: wa-ghost',
        },
      ],
      pairs: 1,
    });
  });
});

describe('Check C on the committed Vue Templates', () => {
  it('compares one pair per registry component and finds no drift', async () => {
    const { findings, pairs } = await checkVueJsVariantSubset(
      path.join(REPO_ROOT, 'templates', 'vue')
    );
    expect(findings).toEqual([]);
    // The premise: a walk that compared nothing would also find nothing.
    expect(pairs).toBe(Object.keys(LOCAL_REGISTRY).length);
  });
});

describe('extractVueSurface on the committed Templates, against the Vue compiler', () => {
  interface CompiledSfc {
    props?: Record<string, unknown> | string[];
    emits?: string[];
  }

  /**
   * The props and emits Vue compiled, minus the two names each defineModel
   * adds beyond the model prop itself: `<name>Modifiers` (`modelModifiers`
   * for `modelValue`) and `update:<name>`. The reader counts a model once.
   */
  function compiledSurface(sfc: CompiledSfc): {
    props: Set<string>;
    emits: Set<string>;
  } {
    const declared = Array.isArray(sfc.props)
      ? sfc.props
      : Object.keys(sfc.props ?? {});
    const modifiersOf = (prop: string): string =>
      prop === 'modelValue' ? 'modelModifiers' : `${prop}Modifiers`;
    const models = declared.filter((prop) =>
      declared.includes(modifiersOf(prop))
    );
    const sugar = new Set(
      models.flatMap((model) => [modifiersOf(model), `update:${model}`])
    );
    return {
      props: new Set(declared.filter((prop) => !sugar.has(prop))),
      emits: new Set((sfc.emits ?? []).filter((event) => !sugar.has(event))),
    };
  }

  for (const { name } of Object.values(LOCAL_REGISTRY)) {
    for (const file of [`${name}.vue`, `${name}.js.vue`]) {
      it(`reads ${file} as Vue compiles it`, async () => {
        const modulePath = path.join(REPO_ROOT, 'templates', 'vue', name, file);
        const surface = extractVueSurface(
          await fs.readFile(modulePath, 'utf-8')
        );
        const { default: sfc } = (await import(
          /* @vite-ignore */ modulePath
        )) as { default: CompiledSfc };

        expect(surface.unreadable).toEqual([]);
        expect(surface.props).toEqual(compiledSurface(sfc).props);
        expect(surface.emits).toEqual(compiledSurface(sfc).emits);
      });
    }
  }
});

describe('checkReactJsVariantSubset', () => {
  let templatesDir: string;

  beforeEach(async () => {
    templatesDir = await fs.mkdtemp(path.join(os.tmpdir(), 'check-c-react-'));
  });

  afterEach(async () => {
    await fs.remove(templatesDir);
  });

  it('compares every directory holding both variants and names the Template', async () => {
    await fs.outputFile(
      path.join(templatesDir, 'Button', 'Button.tsx'),
      "el.addEventListener('blur', handleBlur);"
    );
    await fs.outputFile(
      path.join(templatesDir, 'Button', 'Button.jsx'),
      "el.addEventListener('blur', handleBlur);\nel.addEventListener('wa-ghost', handleGhost);"
    );
    // Missing variants are validate:templates' finding, not this check's.
    await fs.outputFile(path.join(templatesDir, 'Badge', 'Badge.tsx'), '');

    expect(await checkReactJsVariantSubset(templatesDir)).toEqual({
      findings: [
        {
          check: 'C',
          component: 'Button',
          message: '.jsx wires events absent from .tsx: wa-ghost',
        },
      ],
      pairs: 1,
    });
  });
});

describe('Check C on the committed React Templates', () => {
  it('compares one pair per registry component and finds no drift', async () => {
    const { findings, pairs } = await checkReactJsVariantSubset(
      path.join(REPO_ROOT, 'templates', 'react')
    );
    expect(findings).toEqual([]);
    // The premise: a walk that compared nothing would also find nothing.
    expect(pairs).toBe(Object.keys(LOCAL_REGISTRY).length);
  });
});
