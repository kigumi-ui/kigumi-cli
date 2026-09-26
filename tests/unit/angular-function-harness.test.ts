/**
 * The Angular adapter of the Template function harness (issue #77), driven
 * with small inline components so each failure mode has one cause. The shared
 * contract (attributes, cleanup, methods) is covered through the React adapter
 * in `react-function-harness.test.ts`; this file covers what the Angular
 * adapter adds: JIT compilation, the `k-` selector, declared `@Input()` and
 * `@Output()` names, the `style` seam, and ControlValueAccessor through a
 * real `[formControl]` binding.
 *
 * Inline components are declared with `Component({...})(class ...)` and
 * metadata `inputs` / `outputs` rather than decorator syntax: Vite compiles
 * test files under the root tsconfig, which has no `experimentalDecorators`.
 */
// @vitest-environment jsdom

// First: @angular/forms loads partially compiled injectables that need the
// JIT compiler as soon as they are evaluated.
import '@angular/compiler';
import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  type Type,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  FORM_CONTROL_FACETS,
  proveAngularTemplate,
} from './angular-function-harness.js';
import type { AngularTemplateProbe } from './angular-function-harness.js';

const SHOW = { name: 'wa-after-show', eventType: 'CustomEvent' };

interface InlineOptions {
  selector?: string;
  /** Declared `@Input()`s, each bound onto the host as its kebab attribute. */
  inputs?: readonly string[];
  /** CEM event -> the `@Output()` property that re-emits it. */
  outputs?: Readonly<Record<string, string>>;
  /** Public methods, each delegating to the host method of the same name. */
  methods?: readonly string[];
  /** What happens to the `style` of the `k-*` element; `move` by default. */
  style?: 'move' | 'copy' | 'drop';
  /** Skip removing listeners on destroy. */
  leak?: boolean;
  /** Raw template, replacing the generated `<wa-probe>` markup. */
  template?: string;
  styleUrl?: string;
  /** Make the component a ControlValueAccessor; each flag breaks one part. */
  accessor?: InlineAccessor;
}

interface InlineAccessor {
  /** The host property the form value maps to. */
  property: 'value' | 'checked';
  /** The host event the accessor reads the value on. */
  readOn: string;
  /** Find the host only in ngAfterViewInit, dropping earlier writes. */
  late?: boolean;
  /** Never mark the control touched. */
  untouched?: boolean;
  /** Ignore setDisabledState. */
  ignoreDisabled?: boolean;
  /** Apply setDisabledState(true) but never setDisabledState(false). */
  neverEnable?: boolean;
  /** Ignore writeValue. */
  ignoreWrites?: boolean;
  /** Leave NG_VALUE_ACCESSOR unprovided. */
  unprovided?: boolean;
}

/**
 * A component shaped like a generated Template: it renders `<wa-probe>`,
 * binds its inputs as attributes, re-emits host events through its outputs,
 * removes its listeners on destroy, and moves the `style` of its own element
 * onto the host. Each option breaks one of those.
 */
function inlineTemplate(options: InlineOptions = {}): Type<unknown> {
  const inputs = options.inputs ?? [];
  const outputs = options.outputs ?? {};
  const style = options.style ?? 'move';
  const bindings = inputs
    .map((name) => {
      const attribute = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      return `[attr.${attribute}]="${name} === false ? null : ${name}"`;
    })
    .join(' ');

  const accessor = options.accessor;

  class InlineProbe {
    readonly self = inject(ElementRef) as ElementRef<HTMLElement>;
    readonly cleanups: (() => void)[] = [];
    lateHost: HTMLElement | null = null;
    onChange: (value: unknown) => void = () => {};
    onTouched: () => void = () => {};

    constructor() {
      for (const property of Object.values(outputs)) {
        (this as unknown as Record<string, unknown>)[property] =
          new EventEmitter<Event>();
      }
    }

    get host(): HTMLElement {
      const host = this.self.nativeElement.querySelector('wa-probe');
      if (!host) throw new Error('wa-probe was not rendered');
      return host as HTMLElement;
    }

    ngAfterViewInit(): void {
      const own = this.self.nativeElement.getAttribute('style');
      if (own && style !== 'drop') {
        this.host.setAttribute('style', own);
        if (style === 'move') this.self.nativeElement.removeAttribute('style');
      }
      for (const [event, property] of Object.entries(outputs)) {
        const emitter = (
          this as unknown as Record<string, EventEmitter<Event>>
        )[property];
        const handler = (e: Event) => emitter.emit(e);
        const host = this.host;
        host.addEventListener(event, handler);
        this.cleanups.push(() => host.removeEventListener(event, handler));
      }
      if (accessor) {
        const host = this.host;
        this.lateHost = host;
        const read = () =>
          this.onChange(
            (host as unknown as Record<string, unknown>)[accessor.property]
          );
        host.addEventListener(accessor.readOn, read);
        this.cleanups.push(() =>
          host.removeEventListener(accessor.readOn, read)
        );
        if (!accessor.untouched) {
          const touch = () => this.onTouched();
          host.addEventListener('blur', touch);
          this.cleanups.push(() => host.removeEventListener('blur', touch));
        }
      }
    }

    ngOnDestroy(): void {
      if (!options.leak) this.cleanups.forEach((fn) => fn());
    }

    /** The host as the accessor sees it: absent before the view if `late`. */
    accessorHost(): Record<string, unknown> | null {
      const host = accessor?.late ? this.lateHost : this.host;
      return host as unknown as Record<string, unknown> | null;
    }

    writeValue(value: unknown): void {
      const host = this.accessorHost();
      if (host && accessor && !accessor.ignoreWrites) {
        host[accessor.property] = value;
      }
    }

    registerOnChange(fn: (value: unknown) => void): void {
      this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
      this.onTouched = fn;
    }

    setDisabledState(disabled: boolean): void {
      const host = this.accessorHost();
      if (!host || accessor?.ignoreDisabled) return;
      if (disabled || !accessor?.neverEnable) host.disabled = disabled;
    }
  }

  for (const method of options.methods ?? []) {
    Object.defineProperty(InlineProbe.prototype, method, {
      value(this: InlineProbe) {
        (this.host as unknown as Record<string, () => void>)[method]?.();
      },
    });
  }

  return Component({
    selector: options.selector ?? 'k-probe',
    template:
      options.template ?? `<wa-probe ${bindings}><ng-content /></wa-probe>`,
    ...(options.styleUrl ? { styleUrl: options.styleUrl } : {}),
    inputs: [...inputs],
    outputs: Object.values(outputs),
    providers:
      accessor && !accessor.unprovided
        ? [
            {
              provide: NG_VALUE_ACCESSOR,
              useExisting: forwardRef(() => InlineProbe),
              multi: true,
            },
          ]
        : [],
  })(InlineProbe);
}

async function prove(
  Template: Type<unknown>,
  overrides: Partial<Omit<AngularTemplateProbe, 'Template'>> = {}
): Promise<readonly string[]> {
  const { violations } = await proveAngularTemplate({
    Template,
    metadata: { tagName: 'wa-probe', attributes: [], events: [], methods: [] },
    mayOmitInput: () => false,
    ...overrides,
  });
  return violations;
}

describe('proveAngularTemplate', () => {
  it('accepts a Template that binds, re-emits, cleans up and moves style', async () => {
    const { violations, proved } = await proveAngularTemplate({
      Template: inlineTemplate({
        inputs: ['label'],
        outputs: { [SHOW.name]: 'afterShow' },
      }),
      metadata: {
        tagName: 'wa-probe',
        attributes: [{ name: 'label', type: 'string' }],
        events: [SHOW],
        methods: [],
      },
      mayOmitInput: () => false,
    });

    // The consumer's class stays on <k-probe>: Angular has no host-class seam.
    expect(violations).toEqual([]);
    expect(proved).toEqual({
      attributes: 1,
      events: 1,
      methods: 0,
      formControl: 0,
    });
  });

  it('reports a Template that does not compile instead of throwing', async () => {
    // Angular treats any `on*` binding as an event handler and refuses it.
    const violations = await prove(
      inlineTemplate({
        inputs: ['once'],
        template: '<wa-probe [attr.once]="once"></wa-probe>',
      })
    );

    expect(violations).toEqual([
      expect.stringMatching(
        /^template does not compile: .*Binding to event attribute 'once' is disallowed/
      ),
    ]);
  });

  it('reads a styleUrl through readResource before compiling', async () => {
    const Template = inlineTemplate({ styleUrl: './probe.component.css' });

    const violations = await prove(Template, {
      readResource: async (url) => `/* ${url} */ :host { display: contents; }`,
    });

    expect(violations).toEqual([]);
  });

  it('reports a styleUrl it cannot read as a compile failure', async () => {
    const violations = await prove(
      inlineTemplate({ styleUrl: './missing.component.css' })
    );

    expect(violations).toEqual([
      'template does not compile: no readResource for ./missing.component.css',
    ]);
  });

  it('reports a selector that is not k- plus the tag', async () => {
    const violations = await prove(inlineTemplate({ selector: 'wa-probe-x' }));

    expect(violations).toEqual(['selector is wa-probe-x, not k-probe']);
  });

  it('reports a CEM attribute with no @Input()', async () => {
    const violations = await prove(inlineTemplate(), {
      metadata: {
        tagName: 'wa-probe',
        attributes: [{ name: 'with-caret', type: 'boolean' }],
        events: [],
        methods: [],
      },
    });

    expect(violations).toContain(
      '@Input() withCaret for attribute with-caret is not declared'
    );
  });

  it('skips a CEM attribute without an @Input() when it may be omitted', async () => {
    const { violations, proved, omittedInputs } = await proveAngularTemplate({
      Template: inlineTemplate({ inputs: ['label'] }),
      metadata: {
        tagName: 'wa-probe',
        attributes: [{ name: 'label', type: 'string' }, { name: 'did-ssr' }],
        events: [],
        methods: [],
      },
      mayOmitInput: (attribute) => attribute === 'did-ssr',
    });

    expect(violations).toEqual([]);
    expect(omittedInputs).toEqual(['did-ssr']);
    expect(proved.attributes).toBe(1);
  });

  it('binds the Event-suffixed @Output() when an @Input() has the plain name', async () => {
    const violations = await prove(
      inlineTemplate({
        inputs: ['invalid'],
        outputs: { 'wa-invalid': 'invalidEvent' },
      }),
      {
        metadata: {
          tagName: 'wa-probe',
          attributes: [],
          events: [{ name: 'wa-invalid', eventType: 'CustomEvent' }],
          methods: [],
        },
      }
    );

    expect(violations).toEqual([]);
  });

  it('reports an @Output() that keeps a name a public method has', async () => {
    const violations = await prove(
      inlineTemplate({ outputs: { blur: 'blur' } }),
      {
        metadata: {
          tagName: 'wa-probe',
          attributes: [],
          events: [{ name: 'blur', eventType: 'FocusEvent' }],
          methods: [{ name: 'blur' }],
        },
      }
    );

    expect(violations).toContain(
      '@Output() blurEvent for blur is not declared'
    );
  });

  it('reports a listener left on the host after destroy', async () => {
    const violations = await prove(
      inlineTemplate({ outputs: { [SHOW.name]: 'afterShow' }, leak: true }),
      {
        metadata: {
          tagName: 'wa-probe',
          attributes: [],
          events: [SHOW],
          methods: [],
        },
      }
    );

    expect(violations).toEqual(['listener for wa-after-show was not removed']);
  });

  it('names the component instance when a public method is missing', async () => {
    const violations = await prove(inlineTemplate({ methods: ['hide'] }), {
      metadata: {
        tagName: 'wa-probe',
        attributes: [],
        events: [],
        methods: [{ name: 'show' }, { name: 'hide' }],
      },
    });

    expect(violations).toEqual([
      'component instance does not expose a method named show',
    ]);
  });

  it('reports style that never reaches the host', async () => {
    const violations = await prove(inlineTemplate({ style: 'drop' }));

    expect(violations).toEqual([
      'style on k-probe was not forwarded to wa-probe',
      'style stayed on k-probe',
    ]);
  });

  it('reports style copied to the host but left on the k-* element', async () => {
    const violations = await prove(inlineTemplate({ style: 'copy' }));

    expect(violations).toEqual(['style stayed on k-probe']);
  });
});

/**
 * ControlValueAccessor through a real `[formControl]`: the form value, the
 * disabled state and touched must round-trip between a FormControl and the
 * host, including the state the control starts with.
 */
describe('proveAngularTemplate on a form control', () => {
  const INPUT = { name: 'input', eventType: 'InputEvent' };
  const CHANGE = { name: 'change', eventType: 'Event' };
  const OUTPUT_FOR: Record<string, string> = {
    input: 'inputEvent',
    change: 'change',
  };

  /** A form-control Template whose CEM declares `events`, each an output. */
  async function proveAccessor(
    accessor: InlineAccessor,
    events: { name: string; eventType: string }[] = [INPUT, CHANGE]
  ) {
    const outputs = Object.fromEntries(
      events.map((event) => [event.name, OUTPUT_FOR[event.name] ?? ''])
    );
    return proveAngularTemplate({
      Template: inlineTemplate({ accessor, outputs }),
      metadata: { tagName: 'wa-probe', attributes: [], events, methods: [] },
      mayOmitInput: () => false,
      formControl: accessor.property,
    });
  }

  it('accepts an accessor that syncs value, disabled and touched', async () => {
    const { violations, proved } = await proveAccessor({
      property: 'value',
      readOn: 'input',
    });

    expect(violations).toEqual([]);
    expect(proved.formControl).toBe(FORM_CONTROL_FACETS.length);
  });

  it('accepts a checked accessor that reads on change', async () => {
    const { violations, proved } = await proveAccessor({
      property: 'checked',
      readOn: 'change',
    });

    expect(violations).toEqual([]);
    expect(proved.formControl).toBe(FORM_CONTROL_FACETS.length);
  });

  it('reports an accessor that drops the state written before its view exists', async () => {
    const { violations, proved } = await proveAccessor({
      property: 'value',
      readOn: 'input',
      late: true,
    });

    expect(violations).toEqual([
      "the initial form value did not reach the host's value",
      'the initial disabled state did not reach the host',
    ]);
    expect(proved.formControl).toBe(FORM_CONTROL_FACETS.length - 2);
  });

  it('reports an accessor that reads on an event the CEM does not declare', async () => {
    // wa-rating's shape: the CEM declares change, the accessor reads input.
    const { violations } = await proveAccessor(
      { property: 'value', readOn: 'input' },
      [CHANGE]
    );

    expect(violations).toEqual([
      "no CEM input or change event updated the form value from the host's value",
    ]);
  });

  it('reports an accessor that never marks the control touched', async () => {
    const { violations } = await proveAccessor({
      property: 'value',
      readOn: 'input',
      untouched: true,
    });

    expect(violations).toEqual(['blur did not mark the form control touched']);
  });

  it('reports an accessor that ignores setDisabledState', async () => {
    const { violations } = await proveAccessor({
      property: 'value',
      readOn: 'input',
      ignoreDisabled: true,
    });

    expect(violations).toEqual([
      'the initial disabled state did not reach the host',
      'enabling and disabling the form control did not reach the host',
    ]);
  });

  it('reports an accessor that disables the host but never re-enables it', async () => {
    const { violations } = await proveAccessor({
      property: 'value',
      readOn: 'input',
      neverEnable: true,
    });

    expect(violations).toEqual([
      'enabling and disabling the form control did not reach the host',
    ]);
  });

  it('reports an accessor that never writes the form value', async () => {
    const { violations } = await proveAccessor({
      property: 'value',
      readOn: 'input',
      ignoreWrites: true,
    });

    expect(violations).toEqual([
      "the initial form value did not reach the host's value",
      "setting the form value did not reach the host's value",
    ]);
  });

  it('reports a form control that provides no NG_VALUE_ACCESSOR', async () => {
    const { violations, proved } = await proveAccessor({
      property: 'value',
      readOn: 'input',
      unprovided: true,
    });

    expect(violations).toEqual(['does not provide NG_VALUE_ACCESSOR']);
    expect(proved.formControl).toBe(0);
  });

  it('reports NG_VALUE_ACCESSOR on a Template not pinned as a form control', async () => {
    const violations = await prove(
      inlineTemplate({ accessor: { property: 'value', readOn: 'input' } })
    );

    expect(violations).toEqual([
      'provides NG_VALUE_ACCESSOR but is not pinned as a form control',
    ]);
  });
});
