#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Vue Template Generator
 *
 * Generates Vue SFC templates for all components in the registry.
 * Creates TypeScript and JavaScript variants, plus CSS and test files.
 *
 * Key design decisions:
 * - No named slot bridging: users apply slot="name" directly on children (WA-idiomatic)
 * - v-model via defineModel() for form controls (value) and toggleable components (open/checked)
 * - Separate onMounted/onUnmounted hooks (not nested)
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'vue');

// Components that support v-model on `value` (form controls with wa-input or input event)
const VALUE_MODEL_COMPONENTS = new Set([
  'input',
  'textarea',
  'select',
  'combobox',
  'number-input',
  'slider',
  'rating',
  'radio-group',
  'color-picker',
]);

// Components that support v-model on `checked`
const CHECKED_MODEL_COMPONENTS = new Set(['checkbox', 'switch']);

// Components that support v-model:open
const OPEN_MODEL_COMPONENTS = new Set([
  'dialog',
  'drawer',
  'details',
  'dropdown',
  'popover',
  'tooltip',
]);

// The input event name for value model sync (most use 'input', some use 'wa-input')
function getValueInputEvent(componentKey: string): string {
  const metadata = COMPONENT_METADATA[componentKey];
  if (!metadata) return 'input';
  const eventNames = metadata.events.map((e) => e.name);
  // Prefer 'input' (native), fallback to 'wa-input', then 'change'
  if (eventNames.includes('input')) return 'input';
  if (eventNames.includes('wa-input')) return 'wa-input';
  if (eventNames.includes('change')) return 'change';
  return 'input';
}

/**
 * Format a prop default for emission into Vue Options-API JS templates.
 * Registry defaults are stored as JS-source fragments: `'horizontal'` for strings
 * arrives here as `horizontal` (unquoted), `'false'` for booleans arrives as
 * `false`. Only string-typed defaults need re-quoting; already-quoted values
 * like `"''"` are passed through untouched.
 */
function formatVueDefault(tsType: string, rawDefault: string): string {
  if (tsType.toLowerCase() !== 'string') return rawDefault;
  const alreadyQuoted = /^(['"]).*\1$/.test(rawDefault);
  return alreadyQuoted ? rawDefault : `'${rawDefault}'`;
}

/**
 * Convert TypeScript type to Vue prop type
 */
function convertToVuePropType(tsType: string): string {
  switch (tsType.toLowerCase()) {
    case 'string':
      return 'String';
    case 'number':
      return 'Number';
    case 'boolean':
      return 'Boolean';
    case 'array':
      return 'Array';
    case 'object':
      return 'Object';
    default:
      return 'String';
  }
}

/**
 * Map event type from custom-elements.json to Vue/TypeScript type
 */
function mapEventType(eventType: string): string {
  if (eventType === 'FocusEvent') return 'FocusEvent';
  if (eventType === 'Event') return 'Event';
  if (eventType === 'MouseEvent') return 'MouseEvent';
  if (eventType === 'KeyboardEvent') return 'KeyboardEvent';
  if (eventType.startsWith('Wa')) return 'CustomEvent';
  return 'CustomEvent';
}

/**
 * Convert event name to PascalCase handler name
 */
function pascalCase(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Determine the value type for a component's model
 */
function getModelValueType(
  componentKey: string,
  component: ComponentDefinition
): string {
  if (CHECKED_MODEL_COMPONENTS.has(componentKey)) return 'boolean';
  const valueProp = component.props.find((p) => p.name === 'value');
  if (valueProp) {
    if (valueProp.type === 'number') return 'number';
    return 'string';
  }
  return 'string';
}

// =============================================================================
// Shared helpers for building listener registration/cleanup code
// =============================================================================

interface ListenerEntry {
  event: string;
  handlerName: string;
  // TypeScript handler body (with type casts)
  tsBody: string;
  // JavaScript handler body (no types)
  jsBody: string;
}

/**
 * Build the unified list of event listeners for a component.
 * Merges component events (emit) with model sync events, deduplicating
 * events that serve both purposes (e.g. wa-show emits AND syncs open model).
 */
function buildListenerEntries(
  componentKey: string,
  metadata: { events: Array<{ name: string; eventType: string }> },
  hasValueModel: boolean,
  hasCheckedModel: boolean,
  hasOpenModel: boolean
): ListenerEntry[] {
  const entries: ListenerEntry[] = [];
  const usedEvents = new Set<string>();

  // Determine which events are used by models
  const modelEvents = new Set<string>();
  if (hasValueModel) modelEvents.add(getValueInputEvent(componentKey));
  if (hasCheckedModel) modelEvents.add('change');
  if (hasOpenModel) {
    modelEvents.add('wa-show');
    modelEvents.add('wa-hide');
  }

  // Component events from metadata — merge with model sync where needed
  for (const event of metadata.events) {
    const eventType = mapEventType(event.eventType);
    const handlerName = `handle${pascalCase(event.name)}`;
    usedEvents.add(event.name);

    // Check if this event also drives a model sync
    if (hasValueModel && event.name === getValueInputEvent(componentKey)) {
      entries.push({
        event: event.name,
        handlerName,
        tsBody: `(e: Event) => { model.value = (e.target as any).value; emit('${event.name}', e as ${eventType}); }`,
        jsBody: `(e) => { model.value = e.target.value; emit('${event.name}', e); }`,
      });
    } else if (hasCheckedModel && event.name === 'change') {
      entries.push({
        event: event.name,
        handlerName,
        tsBody: `(e: Event) => { model.value = (e.target as any).checked; emit('${event.name}', e as ${eventType}); }`,
        jsBody: `(e) => { model.value = e.target.checked; emit('${event.name}', e); }`,
      });
    } else if (hasOpenModel && event.name === 'wa-show') {
      entries.push({
        event: event.name,
        handlerName,
        tsBody: `(e: Event) => { open.value = true; emit('${event.name}', e as ${eventType}); }`,
        jsBody: `(e) => { open.value = true; emit('${event.name}', e); }`,
      });
    } else if (hasOpenModel && event.name === 'wa-hide') {
      entries.push({
        event: event.name,
        handlerName,
        tsBody: `(e: Event) => { open.value = false; emit('${event.name}', e as ${eventType}); }`,
        jsBody: `(e) => { open.value = false; emit('${event.name}', e); }`,
      });
    } else {
      entries.push({
        event: event.name,
        handlerName,
        tsBody: `(e: Event) => emit('${event.name}', e as ${eventType})`,
        jsBody: `(e) => emit('${event.name}', e)`,
      });
    }
  }

  // Model-only events not already covered by component events
  if (hasValueModel) {
    const inputEvent = getValueInputEvent(componentKey);
    if (!usedEvents.has(inputEvent)) {
      entries.push({
        event: inputEvent,
        handlerName: 'handleModelInput',
        tsBody: `(e: Event) => { model.value = (e.target as any).value; }`,
        jsBody: `(e) => { model.value = e.target.value; }`,
      });
    }
  }
  if (hasCheckedModel && !usedEvents.has('change')) {
    entries.push({
      event: 'change',
      handlerName: 'handleModelChange',
      tsBody: `(e: Event) => { model.value = (e.target as any).checked; }`,
      jsBody: `(e) => { model.value = e.target.checked; }`,
    });
  }
  if (hasOpenModel) {
    if (!usedEvents.has('wa-show')) {
      entries.push({
        event: 'wa-show',
        handlerName: 'handleOpenShow',
        tsBody: `() => { open.value = true; }`,
        jsBody: `() => { open.value = true; }`,
      });
    }
    if (!usedEvents.has('wa-hide')) {
      entries.push({
        event: 'wa-hide',
        handlerName: 'handleOpenHide',
        tsBody: `() => { open.value = false; }`,
        jsBody: `() => { open.value = false; }`,
      });
    }
  }

  return entries;
}

// =============================================================================
// TypeScript Template
// =============================================================================

function generateVueTypescriptTemplate(component: ComponentDefinition): string {
  const componentKey = component.tagName.replace('wa-', '');
  const metadata = COMPONENT_METADATA[componentKey] || {
    events: [],
    slots: [],
    methods: [],
  };

  const hasValueModel = VALUE_MODEL_COMPONENTS.has(componentKey);
  const hasCheckedModel = CHECKED_MODEL_COMPONENTS.has(componentKey);
  const hasOpenModel = OPEN_MODEL_COMPONENTS.has(componentKey);
  const hasAnyModel = hasValueModel || hasCheckedModel || hasOpenModel;

  // Determine which props to exclude from the interface (handled by defineModel)
  const excludedProps = new Set<string>();
  if (hasValueModel) excludedProps.add('value');
  if (hasCheckedModel) excludedProps.add('checked');
  if (hasOpenModel) excludedProps.add('open');

  // 1. Props Interface (from registry, excluding model props)
  const filteredProps = component.props.filter(
    (p) => !excludedProps.has(p.name)
  );
  const propsInterface = filteredProps
    .map((prop) => {
      const quotedName = prop.name.includes('-') ? `'${prop.name}'` : prop.name;
      let type = prop.type;
      if (prop.values && prop.values.length > 0) {
        type = prop.values.map((v) => `'${v}'`).join(' | ');
      }
      const optional = prop.required ? '' : '?';
      return `  ${quotedName}${optional}: ${type};`;
    })
    .join('\n');

  // 2. Emits Interface (from metadata)
  const emitsInterface =
    metadata.events.length > 0
      ? metadata.events
          .map((event) => {
            const eventType = mapEventType(event.eventType);
            return `  '${event.name}': [event: ${eventType}];`;
          })
          .join('\n')
      : '  // No events for this component';

  // 3. Build unified listener entries
  const listeners = buildListenerEntries(
    componentKey,
    metadata,
    hasValueModel,
    hasCheckedModel,
    hasOpenModel
  );

  // 4. Exposed Methods (from metadata)
  const exposedMethods =
    metadata.methods.length > 0
      ? metadata.methods
          .map((method) => {
            if (method.parameters && method.parameters.length > 0) {
              const params = method.parameters
                .map((p) => `${p.name}: ${p.type}`)
                .join(', ');
              const args = method.parameters.map((p) => p.name).join(', ');
              return `  ${method.name}: (${params}) => (elementRef.value as any)?.${method.name}?.(${args})`;
            } else {
              return `  ${method.name}: () => (elementRef.value as any)?.${method.name}?.()`;
            }
          })
          .join(',\n')
      : '';

  const hasMethodsOrElement = metadata.methods.length > 0;
  const exposeContent = hasMethodsOrElement
    ? `${exposedMethods},\n  element: elementRef`
    : '  element: elementRef';

  // Build imports
  const vueImports: string[] = ['ref', 'computed', 'onMounted'];
  if (listeners.length > 0) vueImports.push('onUnmounted');
  if (hasAnyModel) vueImports.push('watch');

  // Build defineModel declarations
  const modelDeclarations: string[] = [];
  if (hasValueModel) {
    const valueType = getModelValueType(componentKey, component);
    modelDeclarations.push(`const model = defineModel<${valueType}>();`);
  }
  if (hasCheckedModel) {
    modelDeclarations.push(
      `const model = defineModel<boolean>({ default: false });`
    );
  }
  if (hasOpenModel) {
    modelDeclarations.push(
      `const open = defineModel<boolean>('open', { default: false });`
    );
  }

  // Build model sync watchers (model → element)
  const modelWatchers: string[] = [];
  if (hasValueModel) {
    modelWatchers.push(`watch(model, (val) => {
  const el = elementRef.value as any;
  if (el && el.value !== val) el.value = val ?? '';
});`);
  }
  if (hasCheckedModel) {
    modelWatchers.push(`watch(model, (val) => {
  const el = elementRef.value as any;
  if (el && el.checked !== val) el.checked = val ?? false;
});`);
  }
  if (hasOpenModel) {
    modelWatchers.push(`watch(open, (newOpen) => {
  const el = elementRef.value as any;
  if (!el) return;
  const isOpen = el.open ?? false;
  if (newOpen && !isOpen) el.show?.();
  else if (!newOpen && isOpen) el.hide?.();
});`);
  }

  // Generate handler declarations + addEventListener calls (only when listeners exist)
  const handlerDeclarations =
    listeners.length > 0
      ? listeners.map((l) => `const ${l.handlerName} = ${l.tsBody};`).join('\n')
      : '';
  const addListenerCalls = listeners
    .map((l) => `  el.addEventListener('${l.event}', ${l.handlerName});`)
    .join('\n');
  const removeListenerCalls = listeners
    .map((l) => `  el.removeEventListener('${l.event}', ${l.handlerName});`)
    .join('\n');

  // Build template attributes
  const templateAttrs: string[] = [
    '    ref="elementRef"',
    '    v-bind="definedProps"',
    '    :class="$attrs.class"',
  ];
  if (hasValueModel) templateAttrs.push('    :value="model"');
  if (hasCheckedModel) templateAttrs.push('    :checked="model"');
  if (hasOpenModel) templateAttrs.push('    :open="open"');

  // Build lifecycle blocks (only when there are listeners)
  const lifecycleBlock =
    listeners.length > 0
      ? `
${handlerDeclarations}

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

${addListenerCalls}
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

${removeListenerCalls}
});
`
      : '';

  const loadBlock = `
onMounted(() => {
  ensureLoaded();
});
`;

  // Assemble the template
  return `<script setup lang="ts">
import { ${vueImports.join(', ')} } from 'vue';
import './${component.name}.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('{{{importPath}}}'));
}

/**
 * ${component.description}
 */
export interface ${component.name}Props {
${propsInterface}
}

const props = defineProps<${component.name}Props>();

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits<{
${emitsInterface}
}>();

${modelDeclarations.length > 0 ? modelDeclarations.join('\n') + '\n\n' : ''}const elementRef = ref<HTMLElement | null>(null);
${modelWatchers.length > 0 ? '\n' + modelWatchers.join('\n\n') + '\n' : ''}${loadBlock}${lifecycleBlock}
defineExpose({
${exposeContent},
});
</script>

<template>
  <${component.tagName}
${templateAttrs.join('\n')}
  >
    <slot />
  </${component.tagName}>
</template>
`;
}

// =============================================================================
// JavaScript Template
// =============================================================================

function generateVueJavascriptTemplate(component: ComponentDefinition): string {
  const componentKey = component.tagName.replace('wa-', '');
  const metadata = COMPONENT_METADATA[componentKey] || {
    events: [],
    slots: [],
    methods: [],
  };

  const hasValueModel = VALUE_MODEL_COMPONENTS.has(componentKey);
  const hasCheckedModel = CHECKED_MODEL_COMPONENTS.has(componentKey);
  const hasOpenModel = OPEN_MODEL_COMPONENTS.has(componentKey);
  const hasAnyModel = hasValueModel || hasCheckedModel || hasOpenModel;

  const excludedProps = new Set<string>();
  if (hasValueModel) excludedProps.add('value');
  if (hasCheckedModel) excludedProps.add('checked');
  if (hasOpenModel) excludedProps.add('open');

  // 1. Props (from registry)
  const filteredProps = component.props.filter(
    (p) => !excludedProps.has(p.name)
  );
  const propsOptions = filteredProps
    .map((prop) => {
      const quotedName = prop.name.includes('-') ? `'${prop.name}'` : prop.name;
      const type = convertToVuePropType(prop.type);
      const required = prop.required ? 'true' : 'false';
      const defaultValue = prop.default
        ? `, default: ${formatVueDefault(prop.type, prop.default)}`
        : '';
      return `    ${quotedName}: { type: ${type}, required: ${required}${defaultValue} }`;
    })
    .join(',\n');

  // 2. Emits (from metadata)
  const emitsList =
    metadata.events.length > 0
      ? `['${metadata.events.map((e) => e.name).join("', '")}']`
      : '[]';

  // 3. Build unified listener entries
  const listeners = buildListenerEntries(
    componentKey,
    metadata,
    hasValueModel,
    hasCheckedModel,
    hasOpenModel
  );

  // 4. Exposed Methods (from metadata)
  const exposedMethods =
    metadata.methods.length > 0
      ? metadata.methods
          .map((method) => {
            if (method.parameters && method.parameters.length > 0) {
              const params = method.parameters.map((p) => p.name).join(', ');
              return `  ${method.name}: (${params}) => elementRef.value?.${method.name}?.(${params})`;
            } else {
              return `  ${method.name}: () => elementRef.value?.${method.name}?.()`;
            }
          })
          .join(',\n')
      : '';

  const hasMethodsOrElement = metadata.methods.length > 0;
  const exposeContent = hasMethodsOrElement
    ? `${exposedMethods},\n  element: elementRef`
    : '  element: elementRef';

  // Build imports
  const vueImports: string[] = ['ref', 'computed', 'onMounted'];
  if (listeners.length > 0) vueImports.push('onUnmounted');
  if (hasAnyModel) vueImports.push('watch');

  // Build defineModel declarations
  const modelDeclarations: string[] = [];
  if (hasValueModel) modelDeclarations.push(`const model = defineModel();`);
  if (hasCheckedModel)
    modelDeclarations.push(`const model = defineModel({ default: false });`);
  if (hasOpenModel)
    modelDeclarations.push(
      `const open = defineModel('open', { default: false });`
    );

  // Build model sync watchers (model → element)
  const modelWatchers: string[] = [];
  if (hasValueModel) {
    modelWatchers.push(`watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.value !== val) el.value = val ?? '';
});`);
  }
  if (hasCheckedModel) {
    modelWatchers.push(`watch(model, (val) => {
  const el = elementRef.value;
  if (el && el.checked !== val) el.checked = val ?? false;
});`);
  }
  if (hasOpenModel) {
    modelWatchers.push(`watch(open, (newOpen) => {
  const el = elementRef.value;
  if (!el) return;
  const isOpen = el.open ?? false;
  if (newOpen && !isOpen) el.show?.();
  else if (!newOpen && isOpen) el.hide?.();
});`);
  }

  // Generate handler declarations + addEventListener/removeEventListener calls (only when listeners exist)
  const handlerDeclarations =
    listeners.length > 0
      ? listeners.map((l) => `const ${l.handlerName} = ${l.jsBody};`).join('\n')
      : '';
  const addListenerCalls = listeners
    .map((l) => `  el.addEventListener('${l.event}', ${l.handlerName});`)
    .join('\n');
  const removeListenerCalls = listeners
    .map((l) => `  el.removeEventListener('${l.event}', ${l.handlerName});`)
    .join('\n');

  // Build template attributes
  const templateAttrs: string[] = [
    '    ref="elementRef"',
    '    v-bind="definedProps"',
    '    :class="$attrs.class"',
  ];
  if (hasValueModel) templateAttrs.push('    :value="model"');
  if (hasCheckedModel) templateAttrs.push('    :checked="model"');
  if (hasOpenModel) templateAttrs.push('    :open="open"');

  // Build lifecycle blocks (only when there are listeners)
  const lifecycleBlock =
    listeners.length > 0
      ? `
${handlerDeclarations}

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

${addListenerCalls}
});

onUnmounted(() => {
  const el = elementRef.value;
  if (!el) return;

${removeListenerCalls}
});
`
      : '';

  const loadBlock = `
onMounted(() => {
  ensureLoaded();
});
`;

  return `<script setup>
import { ${vueImports.join(', ')} } from 'vue';
import './${component.name}.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??= import('{{{importPath}}}'));
}

/**
 * ${component.description}
 */
const props = defineProps({
${propsOptions}
});

// Strip undefined props so Vue doesn't override web component defaults (e.g. wa-icon library)
const definedProps = computed(() => {
  const result = {};
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
});

const emit = defineEmits(${emitsList});

${modelDeclarations.length > 0 ? modelDeclarations.join('\n') + '\n\n' : ''}const elementRef = ref(null);
${modelWatchers.length > 0 ? '\n' + modelWatchers.join('\n\n') + '\n' : ''}${loadBlock}${lifecycleBlock}
defineExpose({
${exposeContent},
});
</script>

<template>
  <${component.tagName}
${templateAttrs.join('\n')}
  >
    <slot />
  </${component.tagName}>
</template>
`;
}

// =============================================================================
// CSS, Test, and File Generation (unchanged logic)
// =============================================================================

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

function generateTestTypescriptTemplate(
  componentName: string,
  tagName: string
): string {
  return `import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ${componentName} from './${componentName}.vue';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    const { container } = mount(${componentName});
    expect(container.querySelector('${tagName}')).toBeTruthy();
  });
});
`;
}

function generateTestJavascriptTemplate(
  componentName: string,
  tagName: string
): string {
  return `import { describe, it, expect } from 'vitest';
import { mount } from '@testing-library/vue';
import ${componentName} from './${componentName}.vue';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    const { container } = mount(${componentName});
    expect(container.querySelector('${tagName}')).toBeTruthy();
  });
});
`;
}

async function generateComponentTemplates(
  component: ComponentDefinition
): Promise<void> {
  const componentDir = path.join(TEMPLATES_DIR, component.name);
  await fs.ensureDir(componentDir);

  const vueTs = generateVueTypescriptTemplate(component);
  await fs.writeFile(
    path.join(componentDir, `${component.name}.vue.hbs`),
    vueTs
  );

  const vueJs = generateVueJavascriptTemplate(component);
  await fs.writeFile(
    path.join(componentDir, `${component.name}.js.vue.hbs`),
    vueJs
  );

  const css = generateCSSTemplate(component.name);
  await fs.writeFile(path.join(componentDir, `${component.name}.css`), css);

  const testTs = generateTestTypescriptTemplate(
    component.name,
    component.tagName
  );
  await fs.writeFile(
    path.join(componentDir, `${component.name}.test.ts.hbs`),
    testTs
  );

  const testJs = generateTestJavascriptTemplate(
    component.name,
    component.tagName
  );
  await fs.writeFile(
    path.join(componentDir, `${component.name}.test.js.hbs`),
    testJs
  );

  console.log(`  ✓ Generated templates for ${component.name}`);
}

async function main() {
  console.log('🔨 Generating Vue templates for all components...\n');

  const allComponents = getAllComponents();
  const componentList = Object.values(allComponents);

  await fs.ensureDir(TEMPLATES_DIR);

  for (const component of componentList) {
    await generateComponentTemplates(component);
  }

  console.log(
    `\n✅ Generated Vue templates for ${componentList.length} components`
  );
}

main().catch(console.error);
