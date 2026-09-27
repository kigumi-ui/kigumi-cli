/**
 * Angular adapter for the Template function harness (issue #77).
 *
 * A Template is a standalone component, compiled here by Angular's JIT
 * compiler (as `ng test` would) and mounted with `createComponent` under a
 * zoneless application. Probe attributes are bound as `@Input()`s and
 * callbacks as `@Output()`s through `inputBinding` / `outputBinding`, the API
 * a consumer's template compiles to. Public CEM methods are read off the
 * component instance. The shared contract lives in
 * `template-function-harness.ts`.
 *
 * What only Angular adds, checked here:
 *
 * - The Template compiles. A compile error is reported, not thrown, so one
 *   broken Template names itself instead of aborting the loop.
 * - The selector is `k-` plus the CEM tag without `wa-`.
 * - Every CEM attribute is a declared `@Input()` unless the probe pins it as
 *   omitted, and every pinned attribute really is omitted. Angular has no
 *   rest spread, so an attribute that is not an input cannot reach the host
 *   at all.
 * - Every CEM event is a declared `@Output()` named by `toAngularOutputName`.
 * - `style` on the consumer's `k-*` element moves onto the host. The
 *   consumer's `class` stays on the `k-*` element, which Angular renders
 *   with `display: contents`, so the shared class check does not run for
 *   Angular: that seam is unproven until #125 decides it.
 * - A form control implements ControlValueAccessor, proven through a real
 *   `[formControl]` binding.
 */

// First: @angular/forms and @angular/platform-browser load partially compiled
// injectables that need the JIT compiler as soon as they are evaluated.
import '@angular/compiler';
import {
  Component,
  createComponent,
  inputBinding,
  outputBinding,
  provideZonelessChangeDetection,
  reflectComponentType,
  ɵresolveComponentResources as resolveComponentResources,
  type ApplicationRef,
  type Binding,
  type ComponentMirror,
  type Type,
} from '@angular/core';
import {
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { createApplication } from '@angular/platform-browser';
import type { ComponentMetadata } from '../../src/utils/metadata-types.js';
import {
  stripWaPrefix,
  toAngularOutputName,
  toCamelCase,
  toKebabCase,
} from '../../src/utils/naming.js';
import {
  probeAttributes,
  proveTemplate,
  type MountedTemplate,
  type FormValueProperty,
  type ProofCoverage,
  type TemplateAdapter,
} from './template-function-harness.js';

export type { FormValueProperty } from './template-function-harness.js';

export interface AngularTemplateProbe {
  /** The component class the Template exports. */
  Template: Type<unknown>;
  metadata: Pick<
    ComponentMetadata,
    'tagName' | 'attributes' | 'events' | 'methods'
  >;
  /**
   * The kebab-cased CEM attributes this Template has no `@Input()` for,
   * exactly: an unlisted attribute without an input is a violation, and so
   * is a listed one that has an input or is not in the CEM. The registry
   * loop passes the committed `ANGULAR_OMITTED_INPUTS` pin.
   */
  omittedInputs: readonly string[];
  /**
   * Attributes any Template may omit wherever the CEM declares them, such as
   * the ones every Web Awesome element inherits. Not checked for staleness,
   * since the CEM does not declare them on every component.
   */
  inheritedOmissions?: ReadonlySet<string>;
  /**
   * Reads a `styleUrl` the Template names, which Angular resolves before it
   * compiles, as a build does. Only needed for Templates that have one.
   */
  readResource?: (url: string) => Promise<string>;
  /**
   * The host property a form-control Template's ControlValueAccessor maps
   * the form value to. Absent for a Template that is not a form control,
   * which must then not provide NG_VALUE_ACCESSOR either.
   */
  formControl?: FormValueProperty;
}

/**
 * What a ControlValueAccessor must carry across, each observed through a
 * real `[formControl]`. The control starts with a value and disabled, since
 * that is the state an accessor receives before its view exists.
 */
export const FORM_CONTROL_FACETS = [
  'initial value',
  'initial disabled state',
  'value written',
  'value read',
  'touched',
  'enable and disable',
] as const;

export interface AngularProofCoverage extends ProofCoverage {
  /** ControlValueAccessor facets observed; 0 for a Template without one. */
  formControl: number;
}

export interface AngularTemplateProof {
  violations: readonly string[];
  proved: AngularProofCoverage;
  /**
   * CEM attributes skipped because the probe pins them as omitted, inherited
   * ones included. `proved.attributes` covers every other CEM attribute.
   */
  omitted: readonly string[];
}

const PROBE_STYLE = 'outline: 1px solid rgb(1, 2, 3)';

export async function proveAngularTemplate(
  probe: AngularTemplateProbe
): Promise<AngularTemplateProof> {
  const nothing: AngularProofCoverage = {
    attributes: 0,
    events: 0,
    methods: 0,
    formControl: 0,
  };

  let mirror: ComponentMirror<unknown> | null;
  try {
    await resolveComponentResources(probe.readResource ?? unreadable);
    mirror = reflectComponentType(probe.Template);
  } catch (error) {
    return {
      violations: [`template does not compile: ${firstLine(error)}`],
      proved: nothing,
      omitted: [],
    };
  }
  if (!mirror) {
    return {
      violations: ['the Template export is not an Angular component'],
      proved: nothing,
      omitted: [],
    };
  }

  const app = await createApplication({
    providers: [provideZonelessChangeDetection()],
  });
  try {
    return await proveCompiled(probe, mirror, app);
  } finally {
    app.destroy();
  }
}

async function proveCompiled(
  probe: AngularTemplateProbe,
  mirror: ComponentMirror<unknown>,
  app: ApplicationRef
): Promise<AngularTemplateProof> {
  const violations: string[] = [];

  const selector = `k-${stripWaPrefix(probe.metadata.tagName)}`;
  if (mirror.selector !== selector) {
    violations.push(`selector is ${mirror.selector}, not ${selector}`);
  }

  const inputs = new Set(mirror.inputs.map((input) => input.templateName));
  const outputs = new Set(mirror.outputs.map((output) => output.templateName));

  const pinned = new Set(probe.omittedInputs);
  const inherited = probe.inheritedOmissions ?? new Set<string>();
  const inputFor = new Map<string, string>();
  const probed: ComponentMetadata['attributes'] = [];
  const omitted: string[] = [];
  const declared = new Set<string>();
  for (const attribute of probe.metadata.attributes) {
    const kebab = toKebabCase(attribute.name);
    const input = toCamelCase(kebab);
    declared.add(kebab);
    if (inputs.has(input)) {
      inputFor.set(attribute.name, input);
      probed.push(attribute);
      if (pinned.has(kebab)) {
        violations.push(
          `attribute ${kebab} is pinned as omitted, but @Input() ${input} is declared`
        );
      }
    } else if (pinned.has(kebab) || inherited.has(kebab)) {
      omitted.push(attribute.name);
    } else {
      violations.push(
        `@Input() ${input} for attribute ${attribute.name} is not declared`
      );
      probed.push(attribute);
    }
  }
  for (const kebab of pinned) {
    if (!declared.has(kebab)) {
      violations.push(
        `attribute ${kebab} is pinned as omitted, but the CEM declares no such attribute`
      );
    }
  }

  // An output shares the class namespace with inputs and public methods.
  const taken = new Set([
    ...inputs,
    ...probe.metadata.methods.map((method) => method.name),
  ]);
  const adapter: TemplateAdapter = {
    callbackName: (eventName) => toAngularOutputName(eventName, taken),
    handleName: 'component instance',
  };
  for (const event of probe.metadata.events) {
    const output = adapter.callbackName(event.name);
    if (!outputs.has(output)) {
      violations.push(`@Output() ${output} for ${event.name} is not declared`);
    }
  }

  const shared = await proveTemplate({
    adapter,
    metadata: probe.metadata,
    attributes: probeAttributes(probed),
    // No class seam to prove yet (#125): a class set on the `k-*` element
    // would stay there, and nothing would read it.
    className: null,
    mount: ({ attributes, handlers }) =>
      mountAngular(app, probe.Template, {
        bindings: [
          ...Object.entries(attributes).flatMap(([name, value]) => {
            const input = inputFor.get(name);
            return input ? [inputBinding(input, () => value)] : [];
          }),
          ...Object.entries(handlers).flatMap(([name, handler]) =>
            outputs.has(name) ? [outputBinding(name, handler)] : []
          ),
        ],
      }),
  });
  violations.push(...shared.violations);
  violations.push(
    ...styleForwarding(app, probe.Template, mirror, probe.metadata.tagName)
  );

  let formControl = 0;
  const provides = providesValueAccessor(app, probe.Template);
  if (probe.formControl && !provides) {
    violations.push('does not provide NG_VALUE_ACCESSOR');
  } else if (!probe.formControl && provides) {
    violations.push(
      'provides NG_VALUE_ACCESSOR but is not pinned as a form control'
    );
  } else if (probe.formControl) {
    const proof = proveFormControl(app, probe, mirror, probe.formControl);
    violations.push(...proof.violations);
    formControl = proof.facets;
  }

  return {
    violations,
    proved: { ...shared.proved, formControl },
    omitted,
  };
}

/**
 * Create a component the way a consumer's template does: Angular renders its
 * element, `element` sets attributes on it before the first change detection
 * (as static markup would), then the bindings apply. A first change detection
 * that throws tears the mount down before rethrowing.
 */
function mountAngular(
  app: ApplicationRef,
  Component: Type<unknown>,
  options: { bindings?: Binding[]; element?: Record<string, string> } = {}
): MountedTemplate {
  const container = document.createElement('div');
  document.body.append(container);
  const ref = createComponent(Component, {
    environmentInjector: app.injector,
    bindings: options.bindings ?? [],
  });
  const element = ref.location.nativeElement as HTMLElement;
  for (const [name, value] of Object.entries(options.element ?? {})) {
    element.setAttribute(name, value);
  }
  container.append(element);
  const unmount = () => {
    ref.destroy();
    container.remove();
  };
  try {
    ref.changeDetectorRef.detectChanges();
  } catch (error) {
    unmount();
    throw error;
  }
  return {
    container,
    unmount,
    refHandle: {
      get current() {
        return ref.instance as Record<string, unknown>;
      },
    },
  };
}

/**
 * The Angular styling seam: `style` on the consumer's `k-*` element moves
 * onto the host, and leaves the `k-*` element, which renders with
 * `display: contents` and so cannot size or space anything itself.
 */
function styleForwarding(
  app: ApplicationRef,
  Template: Type<unknown>,
  mirror: ComponentMirror<unknown>,
  tagName: string
): string[] {
  const { container, unmount } = mountAngular(app, Template, {
    element: { style: PROBE_STYLE },
  });
  try {
    const element = container.firstElementChild;
    const host = container.querySelector(tagName);
    // Reported rather than skipped, so a run that could not look at the
    // style seam never reads as one that proved it.
    if (!element || !host) {
      return [`style forwarding was not checked: no ${tagName} rendered`];
    }

    const violations: string[] = [];
    if (host.getAttribute('style') !== PROBE_STYLE) {
      violations.push(
        `style on ${mirror.selector} was not forwarded to ${tagName}`
      );
    }
    if (element.hasAttribute('style')) {
      violations.push(`style stayed on ${mirror.selector}`);
    }
    return violations;
  } finally {
    unmount();
  }
}

/** Whether the component registers itself as a ControlValueAccessor. */
function providesValueAccessor(
  app: ApplicationRef,
  Template: Type<unknown>
): boolean {
  const ref = createComponent(Template, { environmentInjector: app.injector });
  try {
    const accessors = ref.injector.get(NG_VALUE_ACCESSOR, null, {
      self: true,
    });
    return Array.isArray(accessors) && accessors.includes(ref.instance);
  } finally {
    ref.destroy();
  }
}

/** Probe values per model property: initial, then written, then read. */
const FORM_VALUES: Readonly<
  Record<FormValueProperty, readonly [unknown, unknown, unknown]>
> = {
  value: ['probe-initial', 'probe-written', 'probe-read'],
  checked: [true, false, true],
};

let formHosts = 0;

/**
 * Bind the Template to a FormControl the way a consumer does, then walk the
 * FORM_CONTROL_FACETS. "Value read" dispatches only the `input` / `change`
 * events the CEM declares, since those are the events the component emits
 * when a user edits it. `blur` is dispatched regardless: it is how Angular's
 * own accessors mark a control touched, and it reaches a focusable host
 * natively whether or not the CEM lists it.
 */
function proveFormControl(
  app: ApplicationRef,
  probe: AngularTemplateProbe,
  mirror: ComponentMirror<unknown>,
  property: FormValueProperty
): { violations: string[]; facets: number } {
  const [initial, written, read] = FORM_VALUES[property];
  const control = new FormControl<unknown>({ value: initial, disabled: true });
  const FormHost = Component({
    // Unique per host: Angular warns when two components share an id.
    selector: `kigumi-form-probe-${++formHosts}`,
    imports: [probe.Template, ReactiveFormsModule],
    template: `<${mirror.selector} [formControl]="control"></${mirror.selector}>`,
  })(
    class {
      control = control;
    }
  );

  let mounted: MountedTemplate;
  try {
    mounted = mountAngular(app, FormHost);
  } catch (error) {
    return {
      violations: [`binding [formControl] threw: ${firstLine(error)}`],
      facets: 0,
    };
  }
  const { container, unmount } = mounted;
  try {
    const host = container.querySelector(probe.metadata.tagName) as
      (Element & Record<string, unknown>) | null;
    if (!host) {
      return {
        violations: [
          `the form control was not checked: no ${probe.metadata.tagName} rendered`,
        ],
        facets: 0,
      };
    }

    const violations: string[] = [];
    let facets = 0;
    const facet = (holds: boolean, violation: string) => {
      if (holds) facets += 1;
      else violations.push(violation);
    };

    facet(
      host[property] === initial,
      `the initial form value did not reach the host's ${property}`
    );
    facet(
      host.disabled === true,
      'the initial disabled state did not reach the host'
    );

    control.enable();
    const enabled = host.disabled === false;

    control.setValue(written);
    facet(
      host[property] === written,
      `setting the form value did not reach the host's ${property}`
    );

    host[property] = read;
    const valueEvents = ['input', 'change'].filter((name) =>
      probe.metadata.events.some((event) => event.name === name)
    );
    for (const name of valueEvents) {
      host.dispatchEvent(new Event(name));
      if (control.value === read) break;
    }
    facet(
      control.value === read,
      `no CEM input or change event updated the form value from the host's ${property}`
    );

    host.dispatchEvent(new FocusEvent('blur'));
    facet(control.touched, 'blur did not mark the form control touched');

    control.disable();
    facet(
      enabled && host.disabled === true,
      'enabling and disabling the form control did not reach the host'
    );

    return { violations, facets };
  } finally {
    unmount();
  }
}

async function unreadable(url: string): Promise<string> {
  throw new Error(`no readResource for ${url}`);
}

function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0] ?? message;
}
