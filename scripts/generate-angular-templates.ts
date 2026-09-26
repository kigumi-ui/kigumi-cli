#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Angular Template Generator
 *
 * Generates Angular standalone component templates for all components in the registry.
 * TypeScript only (Angular is always TypeScript). Creates .component.ts, .component.css,
 * and .component.spec.ts files (real framework source files; no templating layer).
 *
 * Key design decisions:
 * - Standalone components (Angular 17+ default, no NgModule)
 * - CUSTOM_ELEMENTS_SCHEMA for <wa-*> tag support
 * - ControlValueAccessor for form controls (ngModel + Reactive Forms)
 * - Event @Output names strip wa- prefix (wa-show -> show, wa-after-hide -> afterHide)
 * - :host { display: contents } makes the wrapper DOM-transparent
 * - Selector prefix: k- (e.g., k-button, k-input)
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';
import {
  toKebabCase,
  toPascalCase,
  toAngularOutputName,
} from '../src/utils/naming.js';
import {
  formatCustomTypeImports,
  generateCssTemplate,
  mapEventType,
  writeFormatted,
} from './generator-utils.js';
import { isEntryPoint } from './is-entry-point.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'angular');

// Form controls that need ControlValueAccessor for [(ngModel)] support
const CVA_VALUE_COMPONENTS = new Set([
  'input',
  'textarea',
  'select',
  'combobox',
  'number-input',
  'otp-input',
  'tag-input',
  'slider',
  'rating',
  'radio-group',
  'color-picker',
  'file-input',
]);

const CVA_CHECKED_COMPONENTS = new Set(['checkbox', 'switch']);

// Components with imperative methods (show/hide/requestClose)
const OVERLAY_COMPONENTS = new Set([
  'dialog',
  'drawer',
  'dropdown',
  'popover',
  'tooltip',
  'toast',
]);

// Components whose previous Angular wrappers exposed imperative methods that
// WA 3.5.0+ has marked `private` in the CEM. The methods are filtered out by
// `parse-custom-elements.ts`, so the wrappers no longer expose them. Callers
// should use the documented attribute-based API instead. The note below is
// emitted into the class JSDoc so users copying the template into their
// project see it without needing to consult templates/AGENTS.md.
const REMOVED_IMPERATIVE_METHODS: Record<string, string> = {
  dialog:
    'Open and close programmatically by toggling the `open` attribute (e.g. `[open]="isOpen"`). The previous `show()` / `requestClose()` methods are marked private in WA 3.5.0+ and are no longer exposed.',
  drawer:
    'Open and close programmatically by toggling the `open` attribute (e.g. `[open]="isOpen"`). The previous `show()` / `requestClose()` methods are marked private in WA 3.5.0+ and are no longer exposed.',
  markdown:
    'Re-render programmatically by updating the projected source content (slotted children). The previous `getMarked()` / `updateAll()` methods are marked private in WA 3.5.0+ and are no longer exposed.',
};

interface EventInfo {
  name: string;
  outputName: string;
  type: string;
}

interface MethodParameter {
  name: string;
  type: string;
}

interface MethodInfo {
  name: string;
  parameters: MethodParameter[];
}

/**
 * Get events for a component from metadata. `taken` holds the class's method
 * and @Input() names, which an @Output() name must not reuse.
 */
function getEvents(
  componentKey: string,
  taken: ReadonlySet<string>
): EventInfo[] {
  const metadata = COMPONENT_METADATA[componentKey];
  if (!metadata?.events) return [];

  return metadata.events.map((e) => ({
    name: e.name,
    outputName: toAngularOutputName(e.name, taken),
    type: mapEventType(e.name),
  }));
}

/**
 * Get methods for a component from metadata
 */
function getMethods(componentKey: string): MethodInfo[] {
  const metadata = COMPONENT_METADATA[componentKey];
  if (!metadata?.methods) return [];

  return metadata.methods.map((m) => ({
    name: m.name,
    parameters: (m.parameters ?? []).map((p) => ({
      name: p.name,
      type: p.type || 'unknown',
    })),
  }));
}

/**
 * Generate the Angular component TypeScript template
 */
export function generateComponentTS(
  component: ComponentDefinition,
  componentKey: string
): string {
  const kebabName = toKebabCase(component.name);
  const methods = getMethods(componentKey);

  // @Output names may not collide with method or @Input names
  const taken = new Set([
    ...methods.map((m) => m.name),
    ...component.props.map((p) =>
      p.name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    ),
  ]);
  const events = getEvents(componentKey, taken);

  const needsCVA =
    CVA_VALUE_COMPONENTS.has(componentKey) ||
    CVA_CHECKED_COMPONENTS.has(componentKey);
  const _isOverlay = OVERLAY_COMPONENTS.has(componentKey);

  // Angular treats any `on*` binding as an event handler and refuses to
  // compile it, `[attr.once]` included, so such attributes are written from
  // the class in ngOnChanges instead of bound in the template (issue #77).
  const classWrittenProps = component.props.filter((p) =>
    p.name.toLowerCase().startsWith('on')
  );
  for (const prop of classWrittenProps) {
    if (prop.type !== 'boolean') {
      throw new Error(
        `${component.name}: prop "${prop.name}" starts with "on" but is not a boolean; only boolean on* attributes are written from the class`
      );
    }
  }

  // Build imports
  const coreImports = [
    'Component',
    'CUSTOM_ELEMENTS_SCHEMA',
    'ElementRef',
    'ViewChild',
    'AfterViewInit',
    'inject',
  ];
  if (component.props.length > 0 || needsCVA) coreImports.push('Input');
  if (events.length > 0) coreImports.push('Output', 'EventEmitter');
  if (events.length > 0 || needsCVA) {
    coreImports.push('OnDestroy');
  }
  if (classWrittenProps.length > 0) coreImports.push('OnChanges');
  if (needsCVA) coreImports.push('forwardRef');

  const lines: string[] = [];

  lines.push(`import { ${coreImports.join(', ')} } from '@angular/core';`);

  if (needsCVA) {
    lines.push(
      `import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';`
    );
  }

  lines.push(`import type WaElement from '${component.importPath}';`);

  const typeImport = formatCustomTypeImports(methods, component.importPath);
  if (typeImport) {
    lines.push(typeImport.trimEnd());
  }
  lines.push('');
  lines.push(`let loadPromise: Promise<unknown> | null = null;`);
  lines.push(`function ensureLoaded() {`);
  lines.push(`  return (loadPromise ??= import('${component.importPath}'));`);
  lines.push(`}`);
  lines.push('');

  // Build template string
  const templateAttrs: string[] = ['#element'];

  // Pass props as attributes
  for (const prop of component.props) {
    if (classWrittenProps.includes(prop)) continue;
    const attrName = prop.name;
    const propName = prop.name.replace(/-([a-z])/g, (_, c: string) =>
      c.toUpperCase()
    );
    if (prop.type === 'boolean') {
      templateAttrs.push(`[attr.${attrName}]="${propName} || null"`);
    } else {
      templateAttrs.push(`[attr.${attrName}]="${propName}"`);
    }
  }

  const templateAttrStr = templateAttrs.map((a) => `\n        ${a}`).join('');

  // Build @Component decorator
  lines.push('/**');
  lines.push(` * ${component.description || component.name}`);
  lines.push(' *');
  lines.push(` * @see https://webawesome.com/docs/components/${kebabName}`);
  const apiNote = REMOVED_IMPERATIVE_METHODS[componentKey];
  if (apiNote) {
    lines.push(' *');
    lines.push(` * @remarks ${apiNote}`);
  }
  lines.push(' */');
  lines.push('@Component({');
  lines.push(`  selector: 'k-${kebabName}',`);
  lines.push('  standalone: true,');
  lines.push('  schemas: [CUSTOM_ELEMENTS_SCHEMA],');
  lines.push(`  template: \``);
  lines.push(`    <${component.tagName}${templateAttrStr}>`);
  lines.push('      <ng-content />');
  lines.push(`    </${component.tagName}>`);
  lines.push('  `,');
  lines.push(`  styleUrl: './${kebabName}.component.css',`);

  if (needsCVA) {
    lines.push('  providers: [');
    lines.push('    {');
    lines.push('      provide: NG_VALUE_ACCESSOR,');
    lines.push(
      `      useExisting: forwardRef(() => ${component.name}Component),`
    );
    lines.push('      multi: true,');
    lines.push('    },');
    lines.push('  ],');
  }

  lines.push('})');

  // Build class
  const interfaces: string[] = ['AfterViewInit'];
  if (events.length > 0 || needsCVA) {
    interfaces.push('OnDestroy');
  }
  if (classWrittenProps.length > 0) interfaces.push('OnChanges');
  if (needsCVA) interfaces.push('ControlValueAccessor');

  const implementsStr = ` implements ${interfaces.join(', ')}`;

  lines.push(`export class ${component.name}Component${implementsStr} {`);
  // `static: true` resolves the host at creation rather than after the first
  // view check. `[formControl]` calls writeValue / setDisabledState before
  // that check, so a non-static query dropped a reactive form's initial value
  // and disabled state (issue #77). `#element` is never conditional.
  lines.push(
    "  @ViewChild('element', { static: true }) elementRef!: ElementRef<WaElement>;"
  );
  lines.push('  private hostRef = inject(ElementRef<HTMLElement>);');
  lines.push('');

  // @Input() for each prop
  for (const prop of component.props) {
    const propName = prop.name.replace(/-([a-z])/g, (_, c: string) =>
      c.toUpperCase()
    );

    if (prop.description) {
      lines.push(`  /** ${prop.description} */`);
    }

    if (prop.values && prop.values.length > 0) {
      const unionType = prop.values.map((v) => `'${v}'`).join(' | ');
      lines.push(`  @Input() ${propName}?: ${unionType};`);
    } else if (prop.type === 'boolean') {
      lines.push(`  @Input() ${propName}?: boolean;`);
    } else if (prop.type === 'number') {
      lines.push(`  @Input() ${propName}?: number;`);
    } else {
      lines.push(`  @Input() ${propName}?: string;`);
    }
  }

  if (component.props.length > 0 && events.length > 0) lines.push('');

  // @Output() for each event
  for (const event of events) {
    lines.push(
      `  @Output() ${event.outputName} = new EventEmitter<${event.type}>();`
    );
  }

  // CVA fields
  if (needsCVA) {
    lines.push('');
    lines.push(
      '  private onChangeCallback: (value: unknown) => void = () => {};'
    );
    lines.push('  private onTouchedCallback: () => void = () => {};');
  }

  // Event cleanup array
  if (events.length > 0 || needsCVA) {
    lines.push('');
    lines.push('  private cleanups: (() => void)[] = [];');
  }

  // ngOnChanges -- writes the on* attributes a template binding cannot. The
  // static #element query has resolved by the first ngOnChanges.
  if (classWrittenProps.length > 0) {
    lines.push('');
    lines.push('  ngOnChanges(): void {');
    lines.push(
      '    // Angular refuses `on*` template bindings as event handlers, so these'
    );
    lines.push('    // attributes are written here instead.');
    lines.push('    const el = this.elementRef.nativeElement;');
    for (const prop of classWrittenProps) {
      const propName = prop.name.replace(/-([a-z])/g, (_, c: string) =>
        c.toUpperCase()
      );
      lines.push(`    el.toggleAttribute('${prop.name}', !!this.${propName});`);
    }
    lines.push('  }');
  }

  // ngAfterViewInit -- always present for host attribute forwarding
  lines.push('');
  lines.push('  ngAfterViewInit(): void {');
  lines.push('    ensureLoaded();');
  lines.push('    const el = this.elementRef.nativeElement;');
  lines.push('');
  lines.push('    // Forward host attributes to inner wa-* element');
  lines.push('    const host = this.hostRef.nativeElement;');
  lines.push("    const hostStyle = host.getAttribute('style');");
  lines.push('    if (hostStyle) {');
  lines.push("      el.setAttribute('style', hostStyle);");
  lines.push("      host.removeAttribute('style');");
  lines.push('    }');
  lines.push(
    '    // When slotted, override display:contents so ::slotted() margins apply'
  );
  lines.push("    if (host.hasAttribute('slot')) {");
  lines.push("      host.style.display = 'inline';");
  lines.push('    }');

  if (events.length > 0 || needsCVA) {
    lines.push('');

    for (const event of events) {
      const handlerName = `handle${toPascalCase(event.outputName)}`;
      lines.push(
        `    const ${handlerName} = (e: Event) => this.${event.outputName}.emit(e as ${event.type});`
      );
      lines.push(`    el.addEventListener('${event.name}', ${handlerName});`);
      lines.push(
        `    this.cleanups.push(() => el.removeEventListener('${event.name}', ${handlerName}));`
      );
    }

    // CVA: listen for value changes on the event the component emits when a
    // user edits it: `input` where the CEM declares one, else `change`.
    // wa-rating only dispatches change, so listening on input never updated
    // the form (issue #77).
    if (CVA_VALUE_COMPONENTS.has(componentKey)) {
      const valueEvent = events.some((e) => e.name === 'input')
        ? 'input'
        : 'change';
      lines.push('');
      lines.push(
        '    const handleValueChange = () => this.onChangeCallback((el as unknown as { value: unknown }).value);'
      );
      lines.push(
        `    el.addEventListener('${valueEvent}', handleValueChange);`
      );
      lines.push(
        `    this.cleanups.push(() => el.removeEventListener('${valueEvent}', handleValueChange));`
      );
      lines.push('    const handleBlurTouch = () => this.onTouchedCallback();');
      lines.push("    el.addEventListener('blur', handleBlurTouch);");
      lines.push(
        "    this.cleanups.push(() => el.removeEventListener('blur', handleBlurTouch));"
      );
    } else if (CVA_CHECKED_COMPONENTS.has(componentKey)) {
      lines.push('');
      lines.push(
        '    const handleCheckedChange = () => this.onChangeCallback((el as unknown as { checked: boolean }).checked);'
      );
      lines.push("    el.addEventListener('change', handleCheckedChange);");
      lines.push(
        "    this.cleanups.push(() => el.removeEventListener('change', handleCheckedChange));"
      );
      lines.push('    const handleBlurTouch = () => this.onTouchedCallback();');
      lines.push("    el.addEventListener('blur', handleBlurTouch);");
      lines.push(
        "    this.cleanups.push(() => el.removeEventListener('blur', handleBlurTouch));"
      );
    }
  }

  lines.push('  }');

  // ngOnDestroy
  if (events.length > 0 || needsCVA) {
    lines.push('');
    lines.push('  ngOnDestroy(): void {');
    lines.push('    this.cleanups.forEach((fn) => fn());');
    lines.push('  }');
  }

  // CVA methods
  if (needsCVA) {
    lines.push('');
    lines.push('  writeValue(value: unknown): void {');
    if (CVA_CHECKED_COMPONENTS.has(componentKey)) {
      lines.push('    if (this.elementRef?.nativeElement) {');
      lines.push(
        '      (this.elementRef.nativeElement as unknown as { checked: boolean }).checked = !!value;'
      );
      lines.push('    }');
    } else {
      lines.push('    if (this.elementRef?.nativeElement) {');
      lines.push(
        "      (this.elementRef.nativeElement as unknown as { value: unknown }).value = value ?? '';"
      );
      lines.push('    }');
    }
    lines.push('  }');
    lines.push('');
    lines.push('  registerOnChange(fn: (value: unknown) => void): void {');
    lines.push('    this.onChangeCallback = fn;');
    lines.push('  }');
    lines.push('');
    lines.push('  registerOnTouched(fn: () => void): void {');
    lines.push('    this.onTouchedCallback = fn;');
    lines.push('  }');
    lines.push('');
    lines.push('  setDisabledState(isDisabled: boolean): void {');
    lines.push('    if (this.elementRef?.nativeElement) {');
    lines.push(
      '      (this.elementRef.nativeElement as unknown as { disabled: boolean }).disabled = isDisabled;'
    );
    lines.push('    }');
    lines.push('  }');
  }

  // Public methods (for overlay components and others).
  //
  // Limitation: the CEM's `parameters` array carries no optionality flag (the
  // raw custom-elements.json has `optional: boolean` per parameter, but
  // scripts/parse-custom-elements.ts does not currently surface it on
  // ComponentMetadata). As a result every emitted parameter — public
  // signature AND cast — is marked optional with `?:`, even when WA's actual
  // API requires the argument (e.g. `Toast.create(message)` where `message`
  // is required). This is a deliberate looseness of the wrapper's type
  // contract relative to the underlying API. To tighten: extend
  // ComponentMetadata.methods[].parameters with `optional: boolean` and
  // gate the `?:` emission on it in both places below.
  if (methods.length > 0) {
    lines.push('');
    for (const method of methods) {
      const signature = method.parameters
        .map((p) => `${p.name}?: ${p.type}`)
        .join(', ');
      const argNames = method.parameters.map((p) => p.name).join(', ');
      const argTypes = method.parameters
        .map((p) => `${p.name}?: ${p.type}`)
        .join(', ');
      lines.push(`  ${method.name}(${signature}): void {`);
      lines.push(
        `    (this.elementRef.nativeElement as unknown as { ${method.name}: (${argTypes}) => void }).${method.name}(${argNames});`
      );
      lines.push('  }');
    }
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate the Angular component CSS template
 */
export function generateCSS(
  component: ComponentDefinition,
  _componentKey: string
): string {
  return generateCssTemplate(component.name, {
    selector: ':host',
    body: '  display: contents;',
  });
}

/**
 * Generate the Angular component spec template
 */
export function generateSpec(component: ComponentDefinition): string {
  const kebabName = toKebabCase(component.name);
  return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${component.name}Component } from './${kebabName}.component';

describe('${component.name}Component', () => {
  let component: ${component.name}Component;
  let fixture: ComponentFixture<${component.name}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${component.name}Component],
    }).compileComponents();

    fixture = TestBed.createComponent(${component.name}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('${component.tagName}');
    expect(el).toBeTruthy();
  });
});
`;
}

/**
 * Main: generate all Angular templates
 */
async function main() {
  console.log('Generating Angular templates...\n');

  const components = getAllComponents();
  let count = 0;

  for (const [key, component] of Object.entries(components)) {
    const kebabName = toKebabCase(component.name);
    const componentDir = path.join(TEMPLATES_DIR, component.name);

    await fs.ensureDir(componentDir);

    // Component TypeScript
    const tsContent = generateComponentTS(component, key);
    await writeFormatted(
      path.join(componentDir, `${kebabName}.component.ts`),
      tsContent
    );

    const cssContent = generateCSS(component, key);
    await writeFormatted(
      path.join(componentDir, `${kebabName}.component.css`),
      cssContent
    );

    // Component spec
    const specContent = generateSpec(component);
    await writeFormatted(
      path.join(componentDir, `${kebabName}.component.spec.ts`),
      specContent
    );

    count++;
    console.log(`  ${component.name} -> templates/angular/${component.name}/`);
  }

  console.log(`\nGenerated ${count} Angular component templates.`);
}

if (isEntryPoint(import.meta.url)) {
  main().catch(console.error);
}
