#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Angular Template Generator
 *
 * Generates Angular standalone component templates for all components in the registry.
 * TypeScript only (Angular is always TypeScript). Creates .component.ts, .component.css,
 * and .component.spec.ts Handlebars template files.
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
import { CSS_METADATA } from '../src/utils/css-metadata.js';
import { toKebabCase } from '../src/utils/naming.js';

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

interface EventInfo {
  name: string;
  outputName: string;
  type: string;
}

interface MethodInfo {
  name: string;
  signature: string;
}

/**
 * Convert wa-event-name to Angular @Output() camelCase name
 * wa-show -> show, wa-after-hide -> afterHide, blur -> blur
 */
function toOutputName(eventName: string): string {
  const stripped = eventName.startsWith('wa-') ? eventName.slice(3) : eventName;

  // 'input' conflicts with @Input() decorator
  if (stripped === 'input') return 'inputEvent';

  return stripped.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Map event type to TypeScript type
 */
function mapEventType(eventType: string): string {
  if (eventType === 'FocusEvent') return 'FocusEvent';
  if (eventType === 'Event') return 'Event';
  if (eventType === 'MouseEvent') return 'MouseEvent';
  if (eventType === 'KeyboardEvent') return 'KeyboardEvent';
  return 'CustomEvent';
}

/**
 * Get events for a component from metadata
 */
function getEvents(componentKey: string): EventInfo[] {
  const metadata = COMPONENT_METADATA[componentKey];
  if (!metadata?.events) return [];

  return metadata.events.map((e) => ({
    name: e.name,
    outputName: toOutputName(e.name),
    type: mapEventType(e.type?.text || 'CustomEvent'),
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
    signature: m.parameters
      ? m.parameters
          .map((p) => `${p.name}?: ${p.type?.text || 'unknown'}`)
          .join(', ')
      : '',
  }));
}

/**
 * Generate the Angular component TypeScript template
 */
function generateComponentTS(
  component: ComponentDefinition,
  componentKey: string
): string {
  const kebabName = toKebabCase(component.name);
  const events = getEvents(componentKey);
  const methods = getMethods(componentKey);
  const needsCVA =
    CVA_VALUE_COMPONENTS.has(componentKey) ||
    CVA_CHECKED_COMPONENTS.has(componentKey);
  const _isOverlay = OVERLAY_COMPONENTS.has(componentKey);

  // Build imports
  const coreImports = [
    'Component',
    'CUSTOM_ELEMENTS_SCHEMA',
    'ElementRef',
    'ViewChild',
  ];
  if (component.props.length > 0 || needsCVA) coreImports.push('Input');
  if (events.length > 0) coreImports.push('Output', 'EventEmitter');
  if (events.length > 0 || needsCVA) {
    coreImports.push('AfterViewInit', 'OnDestroy');
  }
  if (needsCVA) coreImports.push('forwardRef');

  const lines: string[] = [];

  lines.push(`import { ${coreImports.join(', ')} } from '@angular/core';`);

  if (needsCVA) {
    lines.push(
      `import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';`
    );
  }

  lines.push(`import '{{{importPath}}}';`);
  lines.push(`import type WaElement from '{{{importPath}}}';`);
  lines.push('');

  // Build template string
  const templateAttrs: string[] = ['#element'];

  // Pass props as attributes
  for (const prop of component.props) {
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
  lines.push(' */');
  lines.push('@Component({');
  lines.push(`  selector: 'k-${kebabName}',`);
  lines.push('  standalone: true,');
  lines.push('  schemas: [CUSTOM_ELEMENTS_SCHEMA],');
  lines.push(`  template: \``);
  lines.push(`    <{{tagName}}${templateAttrStr}>`);
  lines.push('      <ng-content />');
  lines.push('    </{{tagName}}>');
  lines.push('  `,');
  lines.push(`  styleUrl: './${kebabName}.component.css',`);

  if (needsCVA) {
    lines.push('  providers: [');
    lines.push('    {');
    lines.push('      provide: NG_VALUE_ACCESSOR,');
    lines.push(`      useExisting: forwardRef(() => {{name}}Component),`);
    lines.push('      multi: true,');
    lines.push('    },');
    lines.push('  ],');
  }

  lines.push('})');

  // Build class
  const interfaces: string[] = [];
  if (events.length > 0 || needsCVA) {
    interfaces.push('AfterViewInit', 'OnDestroy');
  }
  if (needsCVA) interfaces.push('ControlValueAccessor');

  const implementsStr =
    interfaces.length > 0 ? ` implements ${interfaces.join(', ')}` : '';

  lines.push(`export class {{name}}Component${implementsStr} {`);
  lines.push("  @ViewChild('element') elementRef!: ElementRef<WaElement>;");
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

  // ngAfterViewInit
  if (events.length > 0 || needsCVA) {
    lines.push('');
    lines.push('  ngAfterViewInit(): void {');
    lines.push('    const el = this.elementRef.nativeElement;');

    for (const event of events) {
      const handlerName = `handle${event.outputName.charAt(0).toUpperCase()}${event.outputName.slice(1)}`;
      lines.push(
        `    const ${handlerName} = (e: Event) => this.${event.outputName}.emit(e as ${event.type});`
      );
      lines.push(`    el.addEventListener('${event.name}', ${handlerName});`);
      lines.push(
        `    this.cleanups.push(() => el.removeEventListener('${event.name}', ${handlerName}));`
      );
    }

    // CVA: listen for value changes
    if (CVA_VALUE_COMPONENTS.has(componentKey)) {
      lines.push('');
      lines.push(
        '    const handleValueChange = () => this.onChangeCallback((el as unknown as { value: unknown }).value);'
      );
      lines.push("    el.addEventListener('input', handleValueChange);");
      lines.push(
        "    this.cleanups.push(() => el.removeEventListener('input', handleValueChange));"
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

    lines.push('  }');
  }

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

  // Public methods (for overlay components and others)
  if (methods.length > 0) {
    lines.push('');
    for (const method of methods) {
      const argNames = method.signature
        ? method.signature
            .split(',')
            .map((p) => p.split(':')[0].replace('?', '').trim())
            .join(', ')
        : '';
      const argTypes = method.signature
        ? method.signature
            .split(',')
            .map((p) => {
              const parts = p.trim().split(':');
              const paramName = parts[0].replace('?', '').trim();
              return `${paramName}: ${parts[1]?.trim() || 'unknown'}`;
            })
            .join(', ')
        : '';
      lines.push(`  ${method.name}(${method.signature}): void {`);
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
function generateCSS(
  component: ComponentDefinition,
  _componentKey: string
): string {
  const cssInfo = CSS_METADATA[component.name];
  const lines: string[] = [];

  lines.push('/**');
  lines.push(` * ${component.name} Component Styles`);
  lines.push(
    ` * Documentation: https://webawesome.com/docs/components/${toKebabCase(component.name)}`
  );

  if (cssInfo?.parts && cssInfo.parts.length > 0) {
    lines.push(' *');
    lines.push(' * CSS Parts:');
    for (const part of cssInfo.parts) {
      lines.push(` * ${part.name} - ${part.description}`);
    }
  }

  lines.push(' */');
  lines.push(':host {');
  lines.push('  display: contents;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate the Angular component spec template
 */
function generateSpec(component: ComponentDefinition): string {
  const kebabName = toKebabCase(component.name);
  return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { {{name}}Component } from './${kebabName}.component';

describe('{{name}}Component', () => {
  let component: {{name}}Component;
  let fixture: ComponentFixture<{{name}}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [{{name}}Component],
    }).compileComponents();

    fixture = TestBed.createComponent({{name}}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the web component', () => {
    const el = fixture.nativeElement.querySelector('{{tagName}}');
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
    await fs.writeFile(
      path.join(componentDir, `${kebabName}.component.ts.hbs`),
      tsContent
    );

    // Component CSS
    const cssContent = generateCSS(component, key);
    await fs.writeFile(
      path.join(componentDir, `${kebabName}.component.css.hbs`),
      cssContent
    );

    // Component spec
    const specContent = generateSpec(component);
    await fs.writeFile(
      path.join(componentDir, `${kebabName}.component.spec.ts.hbs`),
      specContent
    );

    count++;
    console.log(`  ${component.name} -> templates/angular/${component.name}/`);
  }

  console.log(`\nGenerated ${count} Angular component templates.`);
}

main().catch(console.error);
