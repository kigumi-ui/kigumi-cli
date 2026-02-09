#!/usr/bin/env tsx
/**
 * Vue Template Generator
 *
 * Generates Vue SFC templates for all components in the registry.
 * Creates TypeScript and JavaScript variants, plus CSS and test files.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllComponents,
  type ComponentDefinition,
} from '../src/utils/registry.js';
import { CSS_METADATA } from '../src/utils/css-metadata.js';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'vue');

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
  // Map Web Awesome event types to standard types
  if (eventType === 'FocusEvent') return 'FocusEvent';
  if (eventType === 'Event') return 'Event';
  if (eventType === 'MouseEvent') return 'MouseEvent';
  if (eventType === 'KeyboardEvent') return 'KeyboardEvent';
  // All wa-* custom events are CustomEvent
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
 * Generate TypeScript Vue SFC template
 */
function generateVueTypescriptTemplate(component: ComponentDefinition): string {
  const componentKey = component.tagName.replace('wa-', '');
  const metadata = COMPONENT_METADATA[componentKey] || {
    events: [],
    slots: [],
    methods: [],
  };

  // 1. Props Interface (from registry)
  const propsInterface = component.props
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

  // 3. Event Listeners (from metadata)
  const eventListeners =
    metadata.events.length > 0
      ? metadata.events
          .map((event) => {
            const handlerName = `handle${pascalCase(event.name)}`;
            const eventType = mapEventType(event.eventType);
            return `  const ${handlerName} = (e: Event) => emit('${event.name}', e as ${eventType});
  el.addEventListener('${event.name}', ${handlerName});`;
          })
          .join('\n')
      : '';

  // 4. Event Cleanup (from metadata)
  const eventCleanup =
    metadata.events.length > 0
      ? metadata.events
          .map((event) => {
            const handlerName = `handle${pascalCase(event.name)}`;
            return `    el.removeEventListener('${event.name}', ${handlerName});`;
          })
          .join('\n')
      : '';

  // 5. Exposed Methods (from metadata)
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

  // 6. Named Slots (from metadata)
  const namedSlots = metadata.slots
    .filter((slot) => slot.name !== '')
    .map((slot) => `    <slot name="${slot.name}" />`)
    .join('\n');

  const namedSlotsSection = namedSlots ? `\n${namedSlots}` : '';

  // Template structure
  return `<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import '{{{importPath}}}';
import './${component.name}.css';

/**
 * ${component.description}
 */
export interface ${component.name}Props {
${propsInterface}
}

const props = defineProps<${component.name}Props>();

const emit = defineEmits<{
${emitsInterface}
}>();

const elementRef = ref<HTMLElement | null>(null);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

${eventListeners}

  onUnmounted(() => {
${eventCleanup}
  });
});

defineExpose({
${exposeContent},
});
</script>

<template>
  <${component.tagName}
    ref="elementRef"
    v-bind="props"
    :class="$attrs.class"
  >
    <slot />${namedSlotsSection}
  </${component.tagName}>
</template>
`;
}

/**
 * Generate JavaScript Vue SFC template
 */
function generateVueJavascriptTemplate(component: ComponentDefinition): string {
  const componentKey = component.tagName.replace('wa-', '');
  const metadata = COMPONENT_METADATA[componentKey] || {
    events: [],
    slots: [],
    methods: [],
  };

  // 1. Props (from registry)
  const propsOptions = component.props
    .map((prop) => {
      const quotedName = prop.name.includes('-') ? `'${prop.name}'` : prop.name;
      const type = convertToVuePropType(prop.type);
      const required = prop.required ? 'true' : 'false';
      const defaultValue = prop.default ? `, default: ${prop.default}` : '';
      return `    ${quotedName}: { type: ${type}, required: ${required}${defaultValue} }`;
    })
    .join(',\n');

  // 2. Emits (from metadata)
  const emitsList =
    metadata.events.length > 0
      ? `['${metadata.events.map((e) => e.name).join("', '")}']`
      : '[]';

  // 3. Event Listeners (from metadata)
  const eventListeners =
    metadata.events.length > 0
      ? metadata.events
          .map((event) => {
            const handlerName = `handle${pascalCase(event.name)}`;
            return `  const ${handlerName} = (e) => emit('${event.name}', e);
  el.addEventListener('${event.name}', ${handlerName});`;
          })
          .join('\n')
      : '';

  // 4. Event Cleanup (from metadata)
  const eventCleanup =
    metadata.events.length > 0
      ? metadata.events
          .map((event) => {
            const handlerName = `handle${pascalCase(event.name)}`;
            return `    el.removeEventListener('${event.name}', ${handlerName});`;
          })
          .join('\n')
      : '';

  // 5. Exposed Methods (from metadata)
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

  // 6. Named Slots (from metadata)
  const namedSlots = metadata.slots
    .filter((slot) => slot.name !== '')
    .map((slot) => `    <slot name="${slot.name}" />`)
    .join('\n');

  const namedSlotsSection = namedSlots ? `\n${namedSlots}` : '';

  return `<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import '{{{importPath}}}';
import './${component.name}.css';

/**
 * ${component.description}
 */
const props = defineProps({
${propsOptions}
});

const emit = defineEmits(${emitsList});

const elementRef = ref(null);

onMounted(() => {
  const el = elementRef.value;
  if (!el) return;

${eventListeners}

  onUnmounted(() => {
${eventCleanup}
  });
});

defineExpose({
${exposeContent},
});
</script>

<template>
  <${component.tagName}
    ref="elementRef"
    v-bind="props"
    :class="$attrs.class"
  >
    <slot />${namedSlotsSection}
  </${component.tagName}>
</template>
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
      content += ` * - ${prop.name}: ${prop.description}\n`;
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
 * Generate TypeScript test template
 */
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

/**
 * Generate JavaScript test template
 */
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

/**
 * Generate all templates for a component
 */
async function generateComponentTemplates(
  component: ComponentDefinition
): Promise<void> {
  const componentDir = path.join(TEMPLATES_DIR, component.name);
  await fs.ensureDir(componentDir);

  // TypeScript SFC
  const vueTs = generateVueTypescriptTemplate(component);
  await fs.writeFile(
    path.join(componentDir, `${component.name}.vue.hbs`),
    vueTs
  );

  // JavaScript SFC
  const vueJs = generateVueJavascriptTemplate(component);
  await fs.writeFile(
    path.join(componentDir, `${component.name}.js.vue.hbs`),
    vueJs
  );

  // CSS
  const css = generateCSSTemplate(component.name);
  await fs.writeFile(path.join(componentDir, `${component.name}.css.hbs`), css);

  // TypeScript test
  const testTs = generateTestTypescriptTemplate(
    component.name,
    component.tagName
  );
  await fs.writeFile(
    path.join(componentDir, `${component.name}.test.ts.hbs`),
    testTs
  );

  // JavaScript test
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

/**
 * Main execution
 */
async function main() {
  console.log('🔨 Generating Vue templates for all components...\n');

  const allComponents = getAllComponents();
  const componentList = Object.values(allComponents);

  // Ensure templates/vue directory exists
  await fs.ensureDir(TEMPLATES_DIR);

  // Generate templates for all components
  for (const component of componentList) {
    await generateComponentTemplates(component);
  }

  console.log(
    `\n✅ Generated Vue templates for ${componentList.length} components`
  );
}

main().catch(console.error);
