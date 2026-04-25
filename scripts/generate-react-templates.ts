#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * React Template Generator
 *
 * Generates React component templates using forwardRef pattern for all components in the registry.
 * Creates TypeScript variants with proper type safety, event handling, and ref methods.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';
import { CSS_METADATA } from './css-metadata.js';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';
import { extractCustomTypeImports } from './generator-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'react');

/**
 * Convert event name to React style (e.g., 'wa-show' → 'onShow', 'blur' → 'onBlur')
 * Strips the 'wa-' prefix since Kigumi wrappers expose simplified handler names.
 */
function toReactEventName(eventName: string): string {
  const stripped = eventName.startsWith('wa-') ? eventName.slice(3) : eventName;
  const parts = stripped.split('-');
  const camelCase = parts
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');

  return 'on' + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Map event type from custom-elements.json to React/TypeScript type
 */
function mapEventType(eventType: string): string {
  // Standard DOM events
  if (eventType === 'FocusEvent' || eventType === 'BlurEvent')
    return 'FocusEvent';
  if (eventType === 'MouseEvent') return 'MouseEvent';
  if (eventType === 'KeyboardEvent') return 'KeyboardEvent';
  if (eventType === 'InputEvent') return 'CustomEvent';
  if (eventType === 'ChangeEvent') return 'CustomEvent';
  if (eventType === 'LoadEvent') return 'CustomEvent';
  if (eventType === 'ErrorEvent') return 'CustomEvent';

  // All wa-* custom events are CustomEvent
  if (eventType.startsWith('Wa')) return 'CustomEvent';

  return 'CustomEvent';
}

/**
 * Convert TypeScript type to proper format for props interface
 */
function convertToReactPropType(tsType: string, values?: string[]): string {
  if (values && values.length > 0) {
    return values.map((v) => `'${v}'`).join(' | ');
  }

  switch (tsType.toLowerCase()) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'any[]';
    case 'object':
      return 'Record<string, any>';
    default:
      return 'string';
  }
}

/**
 * Generate React TypeScript component template
 */
function generateReactTypescriptTemplate(
  component: ComponentDefinition
): string {
  const componentKey = component.tagName.replace('wa-', '');
  const metadata = COMPONENT_METADATA[componentKey] || {
    events: [],
    slots: [],
    methods: [],
  };

  // 1. Props Interface
  const propsFromRegistry = component.props
    .map((prop) => {
      const quotedName = prop.name.includes('-') ? `'${prop.name}'` : prop.name;
      const type = convertToReactPropType(prop.type, prop.values);
      const optional = prop.required ? '' : '?';
      const comment = prop.description ? `\n  /** ${prop.description} */` : '';
      return `${comment}\n  ${quotedName}${optional}: ${type};`;
    })
    .join('\n');

  // 2. Event Props from metadata
  const eventProps = metadata.events
    .map((event) => {
      const reactName = toReactEventName(event.name);
      const eventType = mapEventType(event.eventType);
      const comment = event.description
        ? `\n  /** ${event.description} */`
        : '';
      return `${comment}\n  ${reactName}?: (event: ${eventType}) => void;`;
    })
    .join('\n');

  // Combine all props with HTMLAttributes
  const eventsToOmit = metadata.events
    .map((e) => `'${toReactEventName(e.name)}'`)
    .join(' | ');
  const propsInterfaceExtends = eventsToOmit
    ? `Omit<HTMLAttributes<HTMLElement>, ${eventsToOmit} | 'dir'>`
    : `Omit<HTMLAttributes<HTMLElement>, 'dir'>`;

  // 3. Ref Interface
  const refMethods = metadata.methods
    .map((method) => {
      if (method.parameters && method.parameters.length > 0) {
        const params = method.parameters
          .map((p) => `${p.name}: ${p.type}`)
          .join(', ');
        const comment = method.description
          ? `\n  /** ${method.description} */`
          : '';
        return `${comment}\n  ${method.name}: (${params}) => void;`;
      } else {
        const comment = method.description
          ? `\n  /** ${method.description} */`
          : '';
        return `${comment}\n  ${method.name}: () => void;`;
      }
    })
    .join('\n');

  const refInterface =
    metadata.methods.length > 0
      ? `${refMethods}\n  /** Reference to the underlying HTML element */\n  element: HTMLElement | null;`
      : `  /** Reference to the underlying HTML element */\n  element: HTMLElement | null;`;

  // 4. useRef type definition
  const refTypeMethods = metadata.methods
    .map((method) => {
      if (method.parameters && method.parameters.length > 0) {
        const params = method.parameters
          .map((p) => `${p.name}: ${p.type}`)
          .join(', ');
        return `\n      ${method.name}?: (${params}) => void;`;
      } else {
        return `\n      ${method.name}?: () => void;`;
      }
    })
    .join('');

  // 5. useImperativeHandle implementation
  const imperativeHandleMethods = metadata.methods
    .map((method) => {
      const methodName = method.name;
      if (method.parameters && method.parameters.length > 0) {
        const params = method.parameters
          .map((p) => `${p.name}: ${p.type}`)
          .join(', ');
        const args = method.parameters.map((p) => p.name).join(', ');
        return `        ${methodName}: (${params}) => {
          if (${component.name.toLowerCase()}Ref.current && typeof ${component.name.toLowerCase()}Ref.current.${methodName} === 'function') {
            ${component.name.toLowerCase()}Ref.current.${methodName}(${args});
          }
        },`;
      } else {
        return `        ${methodName}: () => {
          if (${component.name.toLowerCase()}Ref.current && typeof ${component.name.toLowerCase()}Ref.current.${methodName} === 'function') {
            ${component.name.toLowerCase()}Ref.current.${methodName}();
          }
        },`;
      }
    })
    .join('\n');

  const imperativeHandleContent =
    metadata.methods.length > 0
      ? `${imperativeHandleMethods}\n        get element() {
          return ${component.name.toLowerCase()}Ref.current;
        },`
      : `        get element() {
          return ${component.name.toLowerCase()}Ref.current;
        },`;

  // 6. Event listeners in useEffect
  const eventHandlers = metadata.events
    .map((event) => {
      const reactName = toReactEventName(event.name);
      const eventType = mapEventType(event.eventType);
      return `      const handle${event.name
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('')} = (e: Event) => {
        if (${reactName}) ${reactName}(e as ${eventType});
      };`;
    })
    .join('\n\n');

  const addEventListeners = metadata.events
    .map((event) => {
      const handlerName = `handle${event.name
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('')}`;
      return `      el.addEventListener('${event.name}', ${handlerName});`;
    })
    .join('\n');

  const removeEventListeners = metadata.events
    .map((event) => {
      const handlerName = `handle${event.name
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('')}`;
      return `        el.removeEventListener('${event.name}', ${handlerName});`;
    })
    .join('\n');

  // 7. Event prop destructuring
  const eventPropNames = metadata.events
    .map((e) => toReactEventName(e.name))
    .join(', ');
  const eventPropsDestructure = eventPropNames ? `, ${eventPropNames}` : '';

  // 8. useEffect dependencies
  const useEffectDeps =
    metadata.events.length > 0
      ? metadata.events.map((e) => toReactEventName(e.name)).join(', ')
      : '';

  // 9. Component-specific type imports for non-primitive parameter types.
  // Walks all method parameter types, extracts PascalCase identifiers,
  // filters out DOM globals, and imports the rest from the component's
  // own module (e.g. ToastCreateOptions from Toast).
  const customTypes = extractCustomTypeImports(metadata.methods);
  const typeImport =
    customTypes.length > 0
      ? `import type { ${customTypes.join(', ')} } from '${component.importPath}';\n`
      : '';

  // Template
  return `import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
${typeImport}import './${component.name}.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('${component.importPath}'));
}

/**
 * ${component.description}
 *
 * @example
 * \`\`\`tsx
 * // Basic usage
 * <${component.name} />
 *
 * // With event handlers
 * <${component.name}${metadata.events.length > 0 ? `\n *   ${toReactEventName(metadata.events[0].name)}={(e) => console.log(e)}` : ''} />
 *${
   metadata.methods.length > 0
     ? `
 * // With ref methods
 * const ref = useRef<${component.name}Ref>(null);
 * <button onClick={() => ref.current?.${metadata.methods[0].name}()}>Call Method</button>
 * <${component.name} ref={ref} />`
     : ''
 }
 * \`\`\`
 */
export interface ${component.name}Props extends ${propsInterfaceExtends} {
${propsFromRegistry}${eventProps ? '\n' + eventProps : ''}
}

export interface ${component.name}Ref {
${refInterface}
}

export const ${component.name} = forwardRef<${component.name}Ref, ${component.name}Props>(
  ({ children, className${eventPropsDestructure}, ...props }, ref) => {
    const ${component.name.toLowerCase()}Ref = useRef<HTMLElement & {${refTypeMethods}
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
${imperativeHandleContent}
      }),
      []
    );
${
  metadata.events.length > 0
    ? `
    useEffect(() => {
      ensureLoaded();
      const el = ${component.name.toLowerCase()}Ref.current;
      if (!el) return;

${eventHandlers}

${addEventListeners}

      return () => {
${removeEventListeners}
      };
    }, [${useEffectDeps}]);
`
    : `
    useEffect(() => {
      ensureLoaded();
    }, []);
`
}
    return (
      <${component.tagName}
        ref={${component.name.toLowerCase()}Ref}
        class={clsx('${component.name}', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </${component.tagName}>
    );
  }
);

${component.name}.displayName = '${component.name}';
`;
}

/**
 * Generate CSS template
 */
function generateCSSTemplate(componentName: string): string {
  const kebabName = componentName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const metadata = CSS_METADATA[kebabName];
  const docsUrl =
    metadata?.docsUrl || `https://webawesome.com/docs/components/${kebabName}`;

  let content = `/**
 * ${componentName} Component Styles
 * Documentation: ${docsUrl}
 *
`;

  if (metadata?.customProperties && metadata.customProperties.length > 0) {
    content += ` * CSS Custom Properties:\n`;
    metadata.customProperties.forEach((prop) => {
      const suffix = prop.default ? ` (default: ${prop.default})` : '';
      content += ` * - ${prop.name}: ${prop.description}${suffix}\n`;
    });
  } else {
    content += ` * CSS Custom Properties:\n * (No custom properties defined for this component)\n`;
  }

  content += ` *\n`;

  if (metadata?.parts && metadata.parts.length > 0) {
    content += ` * CSS Parts:\n`;
    metadata.parts.forEach((part) => {
      content += ` * - ${part.name}: ${part.description}\n`;
    });
  }

  content += ` */\n.${componentName} {\n  /* Add your custom styles here */\n}\n`;

  return content;
}

/**
 * Realistic placeholder values for common required-string-prop names. Used
 * by both the JSX attribute emitter and the prop-reflection assertion so
 * the generated test communicates intent ("Test image", not "alt").
 */
const STRING_PLACEHOLDER_BY_NAME: Record<string, string> = {
  src: 'test.gif',
  alt: 'Test image',
  label: 'Test label',
  image: '/avatar.jpg',
  href: 'https://example.com',
  value: 'test value',
  name: 'test-name',
  placeholder: 'placeholder text',
};

function stringPlaceholderFor(
  prop: ComponentDefinition['props'][number]
): string {
  return STRING_PLACEHOLDER_BY_NAME[prop.name] ?? prop.name;
}

/**
 * Render a JSX attribute literal for a required prop, picking a placeholder
 * value that matches the prop's declared type. Returns an empty string for
 * shapes we don't auto-seed (function/event types).
 */
function renderRequiredPropPlaceholder(
  prop: ComponentDefinition['props'][number]
): string {
  // Boolean: presence-truthy by convention, emit explicit `={true}`.
  if (prop.type === 'boolean') return ` ${prop.name}={true}`;
  // Number: use 0 unless the prop has a non-zero default in the registry.
  if (prop.type === 'number') return ` ${prop.name}={0}`;
  // String: seed a realistic placeholder so the test name communicates intent.
  if (prop.type === 'string')
    return ` ${prop.name}="${stringPlaceholderFor(prop)}"`;
  // Enum (string with `values`): pick the first allowed value.
  if (prop.values && prop.values.length > 0)
    return ` ${prop.name}="${prop.values[0]}"`;
  // Anything else (function/event/object) is not auto-seedable; fall through.
  return '';
}

/**
 * Generate TypeScript test template.
 *
 * Emits up to three `it` blocks matching the hand-maintained `.test.jsx`
 * pattern (renders / className passthrough / required-attribute reflection).
 * The reflection block is only emitted when there is at least one required
 * string-or-enum prop whose value can be asserted via `getAttribute`.
 */
function generateTestTypescriptTemplate(
  componentName: string,
  tagName: string,
  props: ComponentDefinition['props']
): string {
  const requiredProps = props.filter((p) => p.required);
  const jsxAttrs = requiredProps.map(renderRequiredPropPlaceholder).join('');

  // Props we can meaningfully assert via getAttribute — strings + enums only.
  // Boolean and number types reflect to the DOM as serialized strings, but
  // the round-trip is brittle enough that we leave them out of the test.
  const reflectableProps = requiredProps.filter(
    (p) => p.type === 'string' || (p.values && p.values.length > 0)
  );
  const reflectionAssertions = reflectableProps
    .map((p) => {
      const value =
        p.type === 'string'
          ? stringPlaceholderFor(p)
          : (p.values?.[0] ?? p.name);
      return `    expect(element?.getAttribute('${p.name}')).toBe('${value}');`;
    })
    .join('\n');

  const reflectionBlock =
    reflectableProps.length > 0
      ? `

  it('forwards required attributes to the underlying ${tagName}', () => {
    const { container } = render(<${componentName}${jsxAttrs} />);
    const element = container.querySelector('${tagName}');
${reflectionAssertions}
  });`
      : '';

  return `import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    const { container } = render(<${componentName}${jsxAttrs} />);
    expect(container.querySelector('${tagName}')).toBeTruthy();
  });

  it('applies custom className to the underlying ${tagName}', () => {
    const { container } = render(<${componentName}${jsxAttrs} className="custom-class" />);
    const element = container.querySelector('${tagName}');
    expect(element?.getAttribute('class')).toContain('custom-class');
  });${reflectionBlock}
});
`;
}

/**
 * Generate all templates for a component.
 *
 * NOTE: This generator only emits the TypeScript variants
 * (`<Name>.tsx` / `<Name>.css` / `<Name>.test.tsx`). The matching `.jsx` /
 * `.test.jsx` JavaScript variants are **hand-maintained** in
 * `templates/react/<Name>/` — they were never produced by this script (the
 * pre-Handlebars-removal version also only emitted `.tsx.hbs`). If you need
 * to update JS variants, edit the `.jsx` / `.test.jsx` files directly.
 */
async function generateComponentTemplates(
  component: ComponentDefinition
): Promise<void> {
  const componentDir = path.join(TEMPLATES_DIR, component.name);
  await fs.ensureDir(componentDir);

  // TypeScript component
  const reactTs = generateReactTypescriptTemplate(component);
  await fs.writeFile(path.join(componentDir, `${component.name}.tsx`), reactTs);

  const css = generateCSSTemplate(component.name);
  await fs.writeFile(path.join(componentDir, `${component.name}.css`), css);

  // TypeScript test
  const testTs = generateTestTypescriptTemplate(
    component.name,
    component.tagName,
    component.props
  );
  await fs.writeFile(
    path.join(componentDir, `${component.name}.test.tsx`),
    testTs
  );

  console.log(`  ✓ Generated templates for ${component.name}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🔨 Generating React templates for all components...\n');

  const allComponents = getAllComponents();
  const componentList = Object.values(allComponents);

  // Ensure templates/react directory exists
  await fs.ensureDir(TEMPLATES_DIR);

  // Generate templates for all components
  for (const component of componentList) {
    await generateComponentTemplates(component);
  }

  console.log(
    `\n✅ Generated React templates for ${componentList.length} components`
  );
}

main().catch(console.error);
