#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Generate Agent Skill Reference Files
 *
 * This script generates markdown reference files for kigumi-react and kigumi-vue
 * skills by reading component definitions from LOCAL_REGISTRY and enriching them
 * with metadata from Web Awesome's custom-elements.json.
 *
 * Generates:
 * - skills/kigumi-react/references/components/{component}.md (enriched)
 * - skills/kigumi-react/references/transformation-rules.md
 * - skills/kigumi-react/references/event-mapping.md (data-driven)
 * - skills/kigumi-vue/references/components/{component}.md (NEW)
 * - skills/kigumi-vue/references/transformation-rules-vue.md (NEW)
 * - skills/kigumi-vue/references/event-mapping-vue.md (NEW)
 */

import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import prettier from 'prettier';
import { LOCAL_REGISTRY } from '../src/utils/registry.js';

const PROJECT_ROOT = process.cwd();

const REACT_SKILLS_DIR = join(
  PROJECT_ROOT,
  '.claude',
  'skills',
  'kigumi-react',
  'references'
);
const REACT_COMPONENTS_DIR = join(REACT_SKILLS_DIR, 'components');

const VUE_SKILLS_DIR = join(
  PROJECT_ROOT,
  '.claude',
  'skills',
  'kigumi-vue',
  'references'
);
const VUE_COMPONENTS_DIR = join(VUE_SKILLS_DIR, 'components');

// ---------------------------------------------------------------------------
// Types for custom-elements.json
// ---------------------------------------------------------------------------

interface CEEvent {
  name: string;
  description?: string;
  reactName?: string;
  eventName?: string;
  type?: { text?: string };
}

interface CESlot {
  name: string;
  description?: string;
}

interface CECssPart {
  name: string;
  description?: string;
}

interface CECssProperty {
  name: string;
  description?: string;
  default?: string;
}

interface CEMember {
  kind: string;
  name: string;
  description?: string;
  privacy?: string;
  parameters?: Array<{ name: string; type?: { text?: string } }>;
}

interface CEDeclaration {
  kind?: string;
  tagName?: string;
  name?: string;
  events?: CEEvent[];
  slots?: CESlot[];
  cssParts?: CECssPart[];
  cssProperties?: CECssProperty[];
  members?: CEMember[];
}

interface CEModule {
  declarations?: CEDeclaration[];
}

interface CustomElementsJSON {
  modules: CEModule[];
}

/** Enriched metadata extracted from custom-elements.json */
interface ComponentCEMetadata {
  events: CEEvent[];
  slots: CESlot[];
  cssParts: CECssPart[];
  cssProperties: CECssProperty[];
  methods: Array<{
    name: string;
    description: string;
    parameters: string;
  }>;
}

/**
 * Method overrides for components where custom-elements.json marks public
 * methods as private (e.g. Dialog.show, Drawer.show).
 */
const METHOD_OVERRIDES: Record<string, ComponentCEMetadata['methods']> = {
  'wa-dialog': [
    { name: 'show', description: 'Shows the dialog.', parameters: '-' },
    {
      name: 'requestClose',
      description: 'Closes the dialog.',
      parameters: '-',
    },
  ],
  'wa-drawer': [
    { name: 'show', description: 'Shows the drawer.', parameters: '-' },
    {
      name: 'requestClose',
      description: 'Closes the drawer.',
      parameters: '-',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert kebab-case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Derive a React handler name from a WA event name.
 * If reactName is present in CE data, use it.
 * Otherwise: strip "wa-" prefix, camelCase, prepend "on".
 */
function deriveReactName(eventName: string, reactName?: string): string {
  if (reactName) return reactName;
  const stripped = eventName.startsWith('wa-') ? eventName.slice(3) : eventName;
  const camel = stripped
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `on${camel}`;
}

/**
 * Map eventName field to a friendlier type string.
 * Native events: BlurEvent -> FocusEvent, FocusEvent -> FocusEvent, etc.
 * Custom events: use CustomEvent.
 */
function friendlyEventType(event: CEEvent): string {
  const en = event.eventName || '';
  if (en === 'FocusEvent' || en === 'BlurEvent') return 'FocusEvent';
  if (en === 'InputEvent') return 'InputEvent';
  if (en === 'ChangeEvent' || en === 'Event') return 'Event';
  if (en === 'LoadEvent') return 'Event';
  if (en === 'ErrorEvent') return 'Event';
  // Everything starting with wa- is a CustomEvent
  if (event.name.startsWith('wa-')) return 'CustomEvent';
  // Fallback for native events without known eventName
  return 'Event';
}

/**
 * Determine if a member is a public method we should document.
 */
function isPublicMethod(member: CEMember): boolean {
  if (member.kind !== 'method') return false;
  if (member.privacy === 'private') return false;
  if (!member.description) return false;
  if (!member.name) return false;
  // Skip internal/lifecycle methods
  if (member.name.startsWith('_')) return false;
  const internalMethods = new Set([
    'formResetCallback',
    'formDisabledCallback',
    'formStateRestoreCallback',
    'handleDisabledChange',
    'handleOpenChange',
    'setValue',
    'getForm',
    'checkValidity',
    'reportValidity',
    'setValidity',
    'setCustomStates',
    'setCustomValidity',
    'updateValidity',
    'resetValidity',
  ]);
  if (internalMethods.has(member.name)) return false;
  return true;
}

/**
 * Escape pipe characters that would break markdown tables.
 */
function escapeTableCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

/**
 * Collapse multi-line descriptions into a single line for table cells.
 * Takes only the first sentence if the description is very long.
 */
function sanitizeDescription(desc: string): string {
  // Collapse newlines
  let result = desc.replace(/\n/g, ' ').trim();
  // Escape pipes
  result = result.replace(/\|/g, '\\|');
  return result;
}

/**
 * Format method parameters for display.
 */
function formatMethodParams(
  params?: Array<{ name: string; type?: { text?: string } }>
): string {
  if (!params || params.length === 0) return '-';
  return params
    .map((p) => {
      const type = escapeTableCell(p.type?.text || 'unknown');
      return `\`${p.name}: ${type}\``;
    })
    .join(', ');
}

// ---------------------------------------------------------------------------
// Load custom-elements.json
// ---------------------------------------------------------------------------

/**
 * Find custom-elements.json in node_modules (supports pnpm hoisting).
 * Searches: docs/node_modules, root node_modules. When running inside a
 * git worktree, also searches the main worktree's node_modules.
 */
async function findCustomElementsJson(): Promise<string | null> {
  const roots = [PROJECT_ROOT];

  // In a git worktree, the main repo may host node_modules
  try {
    const { execSync } = await import('child_process');
    const gitCommon = execSync('git rev-parse --git-common-dir', {
      encoding: 'utf-8',
    }).trim();
    // gitCommon points to e.g. /repo/.git -- parent is the main worktree
    const mainRoot = join(gitCommon, '..');
    if (mainRoot !== PROJECT_ROOT) {
      roots.push(mainRoot);
    }
  } catch {
    // Not in a git repo or git not available -- ignore
  }

  for (const root of roots) {
    const searchPaths = [
      join(root, 'docs', 'node_modules', '.pnpm'),
      join(root, 'node_modules', '.pnpm'),
    ];

    for (const pnpmPath of searchPaths) {
      if (!existsSync(pnpmPath)) continue;
      const dirs = await readdir(pnpmPath);
      const webAwesomeDirs = dirs
        .filter((d) => d.startsWith('@awesome.me+webawesome-pro@'))
        .sort()
        .reverse();

      for (const dir of webAwesomeDirs) {
        const jsonPath = join(
          pnpmPath,
          dir,
          'node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
        );
        if (existsSync(jsonPath)) return jsonPath;
      }
    }

    // Try direct path (non-pnpm)
    const directPath = join(
      root,
      'node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
    );
    if (existsSync(directPath)) return directPath;
  }

  return null;
}

/**
 * Load custom-elements.json and build a Map<tagName, ComponentCEMetadata>.
 */
async function loadCustomElementsMetadata(): Promise<
  Map<string, ComponentCEMetadata>
> {
  const jsonPath = await findCustomElementsJson();

  if (!jsonPath) {
    console.warn(
      '  WARNING: custom-elements.json not found. Generating without enrichment.\n'
    );
    return new Map();
  }

  console.log(
    `  Reading custom-elements.json from: ${jsonPath.replace(PROJECT_ROOT + '/', '')}\n`
  );

  const raw = await readFile(jsonPath, 'utf-8');
  const data: CustomElementsJSON = JSON.parse(raw);
  const metadata = new Map<string, ComponentCEMetadata>();

  for (const module of data.modules) {
    if (!module.declarations) continue;
    for (const decl of module.declarations) {
      if (decl.kind !== 'class' || !decl.tagName) continue;

      const events = (decl.events || []).filter((e) => e.name);
      const slots = (decl.slots || []).filter(
        (s) => s.description !== undefined
      );
      const cssParts = (decl.cssParts || []).filter((p) => p.name);
      const cssProperties = (decl.cssProperties || []).filter((p) => p.name);

      // Extract public methods
      let methods = (decl.members || []).filter(isPublicMethod).map((m) => ({
        name: m.name,
        description: m.description!,
        parameters: formatMethodParams(m.parameters),
      }));

      // Apply overrides for components with incorrectly-scoped methods
      if (methods.length === 0 && METHOD_OVERRIDES[decl.tagName]) {
        methods = METHOD_OVERRIDES[decl.tagName];
      }

      metadata.set(decl.tagName, {
        events,
        slots,
        cssParts,
        cssProperties,
        methods,
      });
    }
  }

  return metadata;
}

// ---------------------------------------------------------------------------
// React Component Reference Generator
// ---------------------------------------------------------------------------

function generateReactComponentReference(
  key: string,
  ceMap: Map<string, ComponentCEMetadata>
): string {
  const component = LOCAL_REGISTRY[key];
  const webAwesomeTag = component.tagName;
  const kigumiName = component.name;
  const ce = ceMap.get(webAwesomeTag);

  const genericDescription = `React wrapper component for the Web Awesome \`${webAwesomeTag}\` element.`;

  let md = `# ${kigumiName}\n\n`;
  md += `**Web Awesome**: \`${webAwesomeTag}\`  \n`;
  md += `**Kigumi React**: \`<${kigumiName}>\`  \n`;
  md += `**Category**: ${component.category}  \n`;
  md += `**Tier**: ${component.tier}  \n\n`;
  md += `${genericDescription}\n\n`;

  // Transformation example
  md += `## Transformation Example\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<${webAwesomeTag}`;

  const exampleProps = component.props.slice(0, 2);
  if (exampleProps.length > 0) {
    exampleProps.forEach((prop) => {
      const value = prop.values
        ? prop.values[0]
        : prop.type === 'boolean'
          ? ''
          : `"${prop.default || 'value'}"`;
      if (prop.type === 'boolean') {
        md += ` ${prop.name}`;
      } else {
        md += ` ${prop.name}=${value}`;
      }
    });
  }

  md += `>Click me</${webAwesomeTag}>\n`;
  md += `\`\`\`\n\n`;

  md += `\`\`\`tsx\n`;
  md += `// Kigumi React\n`;
  md += `import { ${kigumiName} } from '@/components/ui';\n\n`;
  md += `<${kigumiName}`;

  if (exampleProps.length > 0) {
    exampleProps.forEach((prop) => {
      const value = prop.values
        ? `"${prop.values[0]}"`
        : prop.type === 'boolean'
          ? `{true}`
          : `"${prop.default || 'value'}"`;
      md += `\n  ${prop.name}=${value}`;
    });
  }

  md += `\n>\n  Click me\n</${kigumiName}>\n`;
  md += `\`\`\`\n\n`;

  // Props table
  if (component.props.length > 0) {
    md += `## Props\n\n`;
    md += `| Prop | Type | Values | Default | Description |\n`;
    md += `|------|------|--------|---------|-------------|\n`;

    component.props.forEach((prop) => {
      const type = prop.type;
      const values = prop.values
        ? prop.values.map((v) => `'${v}'`).join(' \\| ')
        : '-';
      const defaultVal = prop.default || '-';
      const desc = prop.description || '';
      md += `| \`${prop.name}\` | ${type} | ${values} | \`${defaultVal}\` | ${desc} |\n`;
    });

    md += `\n`;
  }

  // --- Enriched sections from custom-elements.json ---

  if (ce) {
    // Slots
    if (ce.slots.length > 0) {
      md += `## Slots\n\n`;
      md += `| Slot | Description |\n`;
      md += `|------|-------------|\n`;
      ce.slots.forEach((slot) => {
        const slotName = slot.name === '' ? '*(default)*' : `\`${slot.name}\``;
        md += `| ${slotName} | ${sanitizeDescription(slot.description || '')} |\n`;
      });
      md += `\n`;
    }

    // Events
    if (ce.events.length > 0) {
      md += `## Events\n\n`;
      md += `| Event | React Handler | Type | Description |\n`;
      md += `|-------|---------------|------|-------------|\n`;
      ce.events.forEach((event) => {
        const handler = deriveReactName(event.name, event.reactName);
        const type = friendlyEventType(event);
        const desc = sanitizeDescription(event.description || '');
        md += `| \`${event.name}\` | \`${handler}\` | \`${type}\` | ${desc} |\n`;
      });
      md += `\n`;
    }

    // CSS Parts
    if (ce.cssParts.length > 0) {
      md += `## CSS Parts\n\n`;
      md += `| Part | Description |\n`;
      md += `|------|-------------|\n`;
      ce.cssParts.forEach((part) => {
        md += `| \`${part.name}\` | ${sanitizeDescription(part.description || '')} |\n`;
      });
      md += `\n`;
    }

    // CSS Custom Properties
    if (ce.cssProperties.length > 0) {
      md += `## CSS Custom Properties\n\n`;
      md += `| Property | Default | Description |\n`;
      md += `|----------|---------|-------------|\n`;
      ce.cssProperties.forEach((prop) => {
        const defaultVal = prop.default ? `\`${prop.default}\`` : '-';
        md += `| \`${prop.name}\` | ${defaultVal} | ${sanitizeDescription(prop.description || '')} |\n`;
      });
      md += `\n`;
    }

    // Methods
    if (ce.methods.length > 0) {
      md += `## Methods\n\n`;
      md += `| Method | Parameters | Description |\n`;
      md += `|--------|-----------|-------------|\n`;
      ce.methods.forEach((method) => {
        md += `| \`${method.name}()\` | ${method.parameters} | ${sanitizeDescription(method.description)} |\n`;
      });
      md += `\n`;
    }
  }

  // Dependencies
  if (component.dependencies.length > 0) {
    md += `## Dependencies\n\n`;
    md += `This component requires:\n\n`;
    component.dependencies.forEach((dep) => {
      const depComponent = LOCAL_REGISTRY[dep];
      const depName = depComponent ? depComponent.name : toPascalCase(dep);
      md += `- [\`${depName}\`](${dep}.md)\n`;
    });
    md += `\n`;
  }

  md += `## Installation\n\n`;
  md += `\`\`\`bash\n`;
  md += `npx kigumi add ${key}\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;
  md += `**Documentation**: [webawesome.com/docs/components/${key.replace('_', '-')}](https://webawesome.com/docs/components/${key.replace('_', '-')})\n`;

  return md;
}

// ---------------------------------------------------------------------------
// Vue Component Reference Generator
// ---------------------------------------------------------------------------

function generateVueComponentReference(
  key: string,
  ceMap: Map<string, ComponentCEMetadata>
): string {
  const component = LOCAL_REGISTRY[key];
  const webAwesomeTag = component.tagName;
  const kigumiName = component.name;
  const ce = ceMap.get(webAwesomeTag);

  const genericDescription = `Vue wrapper component for the Web Awesome \`${webAwesomeTag}\` element.`;

  let md = `# ${kigumiName}\n\n`;
  md += `**Web Awesome**: \`${webAwesomeTag}\`  \n`;
  md += `**Kigumi Vue**: \`<${kigumiName}>\`  \n`;
  md += `**Category**: ${component.category}  \n`;
  md += `**Tier**: ${component.tier}  \n\n`;
  md += `${genericDescription}\n\n`;

  // Transformation example (Vue syntax)
  md += `## Transformation Example\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<${webAwesomeTag}`;

  const exampleProps = component.props.slice(0, 2);
  if (exampleProps.length > 0) {
    exampleProps.forEach((prop) => {
      const value = prop.values
        ? prop.values[0]
        : prop.type === 'boolean'
          ? ''
          : `"${prop.default || 'value'}"`;
      if (prop.type === 'boolean') {
        md += ` ${prop.name}`;
      } else {
        md += ` ${prop.name}=${value}`;
      }
    });
  }

  md += `>Click me</${webAwesomeTag}>\n`;
  md += `\`\`\`\n\n`;

  md += `\`\`\`vue\n`;
  md += `<!-- Kigumi Vue -->\n`;
  md += `<script setup lang="ts">\n`;
  md += `import { ${kigumiName} } from '@/components/ui';\n`;
  md += `</script>\n\n`;
  md += `<template>\n`;
  md += `  <${kigumiName}`;

  if (exampleProps.length > 0) {
    exampleProps.forEach((prop) => {
      const value = prop.values
        ? `"${prop.values[0]}"`
        : prop.type === 'boolean'
          ? ''
          : `"${prop.default || 'value'}"`;
      if (prop.type === 'boolean') {
        md += `\n    ${prop.name}`;
      } else {
        md += `\n    ${prop.name}=${value}`;
      }
    });
  }

  md += `\n  >\n    Click me\n  </${kigumiName}>\n`;
  md += `</template>\n`;
  md += `\`\`\`\n\n`;

  // Props table
  if (component.props.length > 0) {
    md += `## Props\n\n`;
    md += `| Prop | Type | Values | Default | Description |\n`;
    md += `|------|------|--------|---------|-------------|\n`;

    component.props.forEach((prop) => {
      const type = prop.type;
      const values = prop.values
        ? prop.values.map((v) => `'${v}'`).join(' \\| ')
        : '-';
      const defaultVal = prop.default || '-';
      const desc = prop.description || '';
      md += `| \`${prop.name}\` | ${type} | ${values} | \`${defaultVal}\` | ${desc} |\n`;
    });

    md += `\n`;
  }

  // --- Enriched sections from custom-elements.json ---

  if (ce) {
    // Slots
    if (ce.slots.length > 0) {
      md += `## Slots\n\n`;
      md += `| Slot | Description |\n`;
      md += `|------|-------------|\n`;
      ce.slots.forEach((slot) => {
        const slotName = slot.name === '' ? '*(default)*' : `\`${slot.name}\``;
        md += `| ${slotName} | ${sanitizeDescription(slot.description || '')} |\n`;
      });
      md += `\n`;
    }

    // Events (Vue syntax: @event-name)
    if (ce.events.length > 0) {
      md += `## Events\n\n`;
      md += `| Event | Vue Handler | Type | Description |\n`;
      md += `|-------|------------|------|-------------|\n`;
      ce.events.forEach((event) => {
        const handler = `@${event.name}`;
        const type = friendlyEventType(event);
        const desc = sanitizeDescription(event.description || '');
        md += `| \`${event.name}\` | \`${handler}\` | \`${type}\` | ${desc} |\n`;
      });
      md += `\n`;
    }

    // CSS Parts
    if (ce.cssParts.length > 0) {
      md += `## CSS Parts\n\n`;
      md += `| Part | Description |\n`;
      md += `|------|-------------|\n`;
      ce.cssParts.forEach((part) => {
        md += `| \`${part.name}\` | ${sanitizeDescription(part.description || '')} |\n`;
      });
      md += `\n`;
    }

    // CSS Custom Properties
    if (ce.cssProperties.length > 0) {
      md += `## CSS Custom Properties\n\n`;
      md += `| Property | Default | Description |\n`;
      md += `|----------|---------|-------------|\n`;
      ce.cssProperties.forEach((prop) => {
        const defaultVal = prop.default ? `\`${prop.default}\`` : '-';
        md += `| \`${prop.name}\` | ${defaultVal} | ${sanitizeDescription(prop.description || '')} |\n`;
      });
      md += `\n`;
    }

    // Methods
    if (ce.methods.length > 0) {
      md += `## Methods\n\n`;
      md += `| Method | Parameters | Description |\n`;
      md += `|--------|-----------|-------------|\n`;
      ce.methods.forEach((method) => {
        md += `| \`${method.name}()\` | ${method.parameters} | ${sanitizeDescription(method.description)} |\n`;
      });
      md += `\n`;
    }
  }

  // Dependencies
  if (component.dependencies.length > 0) {
    md += `## Dependencies\n\n`;
    md += `This component requires:\n\n`;
    component.dependencies.forEach((dep) => {
      const depComponent = LOCAL_REGISTRY[dep];
      const depName = depComponent ? depComponent.name : toPascalCase(dep);
      md += `- [\`${depName}\`](${dep}.md)\n`;
    });
    md += `\n`;
  }

  md += `## Installation\n\n`;
  md += `\`\`\`bash\n`;
  md += `npx kigumi add ${key}\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;
  md += `**Documentation**: [webawesome.com/docs/components/${key.replace('_', '-')}](https://webawesome.com/docs/components/${key.replace('_', '-')})\n`;

  return md;
}

// ---------------------------------------------------------------------------
// React Transformation Rules (unchanged logic)
// ---------------------------------------------------------------------------

function generateTransformationRules(): string {
  let md = `# Transformation Rules\n\n`;
  md += `Complete mapping of Web Awesome components to Kigumi React components.\n\n`;
  md += `## Component Mapping\n\n`;
  md += `| Web Awesome | Kigumi React | Category | Tier | Description |\n`;
  md += `|-------------|--------------|----------|------|-------------|\n`;

  Object.entries(LOCAL_REGISTRY).forEach(([_, component]) => {
    md += `| \`${component.tagName}\` | \`<${component.name}>\` | ${component.category} | ${component.tier} | ${component.description} |\n`;
  });

  md += `\n## Core Transformation Patterns\n\n`;
  md += `### Attributes\n\n`;
  md += `| Web Awesome | React |\n`;
  md += `|-------------|-------|\n`;
  md += `| \`class="..."\` | \`className="..."\` |\n`;
  md += `| \`style="..."\` | \`style={{ ... }}\` |\n`;
  md += `| Kebab-case props | Keep as-is |\n`;
  md += `| \`slot="..."\` | \`slot="..."\` (preserved) |\n`;
  md += `| \`aria-*\` | \`aria-*\` (preserved) |\n`;
  md += `| \`data-*\` | \`data-*\` (preserved) |\n\n`;

  md += `### Self-Closing Tags\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<wa-icon name="star"></wa-icon>\n\n`;
  md += `<!-- React -->\n`;
  md += `<Icon name="star" />\n`;
  md += `\`\`\`\n\n`;

  md += `### Inline Styles\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- Web Awesome -->\n`;
  md += `<wa-button style="max-width: 200px; margin: auto">Button</wa-button>\n\n`;
  md += `<!-- React -->\n`;
  md += `<Button style={{ maxWidth: '200px', margin: 'auto' }}>Button</Button>\n`;
  md += `\`\`\`\n\n`;

  md += `### Slots\n\n`;
  md += `Slots are preserved with the \`slot\` attribute:\n\n`;
  md += `\`\`\`tsx\n`;
  md += `<Card>\n`;
  md += `  <div slot="header">Header Content</div>\n`;
  md += `  Main content\n`;
  md += `  <div slot="footer">Footer Content</div>\n`;
  md += `</Card>\n`;
  md += `\`\`\`\n`;

  return md;
}

// ---------------------------------------------------------------------------
// Vue Transformation Rules
// ---------------------------------------------------------------------------

function generateVueTransformationRules(): string {
  let md = `# Transformation Rules (Vue)\n\n`;
  md += `Complete mapping of Web Awesome components to Kigumi Vue components.\n\n`;
  md += `## Component Mapping\n\n`;
  md += `| Web Awesome | Kigumi Vue | Category | Tier |\n`;
  md += `|-------------|------------|----------|------|\n`;

  Object.entries(LOCAL_REGISTRY).forEach(([_, component]) => {
    md += `| \`${component.tagName}\` | \`<${component.name}>\` | ${component.category} | ${component.tier} |\n`;
  });

  md += `\n## Vue Attribute Transformation\n\n`;
  md += `| WA HTML | Vue Template |\n`;
  md += `|---------|-------------|\n`;
  md += `| \`class="wa-stack"\` | \`class="wa-stack"\` |\n`;
  md += `| \`style="max-width: 60ch"\` | \`style="max-width: 60ch"\` |\n`;
  md += `| \`variant="brand"\` | \`variant="brand"\` (static) or \`:variant="myVar"\` (dynamic) |\n`;
  md += `| \`disabled\` | \`disabled\` or \`:disabled="isDisabled"\` |\n`;
  md += `| \`open\` | \`:open="isOpen"\` (always dynamic for controlled state) |\n`;
  md += `| \`slot="header"\` | \`slot="header"\` or \`<template #header>\` |\n`;
  md += `| \`aria-label="Close"\` | \`aria-label="Close"\` |\n`;
  md += `| \`data-testid="btn"\` | \`data-testid="btn"\` |\n\n`;

  md += `## Self-Closing Tags\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- WA -->\n`;
  md += `<wa-icon name="star"></wa-icon>\n`;
  md += `<!-- Vue -->\n`;
  md += `<Icon name="star" />\n`;
  md += `\`\`\`\n\n`;

  md += `## Inline Styles\n\n`;
  md += `\`\`\`html\n`;
  md += `<!-- WA -->\n`;
  md += `<wa-button style="max-width: 200px">Button</wa-button>\n`;
  md += `<!-- Vue (string) -->\n`;
  md += `<Button style="max-width: 200px">Button</Button>\n`;
  md += `<!-- Vue (object, for dynamic values) -->\n`;
  md += `<Button :style="{ maxWidth: '200px' }">Button</Button>\n`;
  md += `\`\`\`\n`;

  return md;
}

// ---------------------------------------------------------------------------
// React Event Mapping (data-driven from custom-elements.json)
// ---------------------------------------------------------------------------

function generateReactEventMapping(
  ceMap: Map<string, ComponentCEMetadata>
): string {
  // Collect all unique events across all components
  const nativeEvents = new Map<
    string,
    { reactName: string; type: string; components: string[] }
  >();
  const customEvents = new Map<
    string,
    { reactName: string; type: string; components: string[] }
  >();

  for (const [tagName, meta] of ceMap) {
    for (const event of meta.events) {
      const isNative = !event.name.startsWith('wa-');
      const target = isNative ? nativeEvents : customEvents;
      const handler = deriveReactName(event.name, event.reactName);
      const type = friendlyEventType(event);

      if (!target.has(event.name)) {
        target.set(event.name, {
          reactName: handler,
          type,
          components: [],
        });
      }
      target.get(event.name)!.components.push(tagName);
    }
  }

  let md = `# Event Mapping\n\n`;
  md += `Web Awesome components use two different event systems depending on the component type.\n\n`;

  // Native DOM events
  md += `## Form Controls -- Native DOM Events\n\n`;
  md += `Components like \`wa-button\`, \`wa-input\`, \`wa-select\`, \`wa-checkbox\`, \`wa-switch\` emit **native browser events** (no \`wa-\` prefix). Event handlers receive standard \`Event\` / \`FocusEvent\` objects.\n\n`;
  md += `| Native Event | React Handler | Type |\n`;
  md += `|--------------|---------------|------|\n`;

  // Sort native events alphabetically
  const sortedNative = [...nativeEvents.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [name, data] of sortedNative) {
    md += `| \`${name}\` | \`${data.reactName}\` | \`${data.type}\` |\n`;
  }

  md += `\n\`\`\`tsx\n`;
  md += `// Correct: native events\n`;
  md += `<Input\n`;
  md += `  onInput={(e) => console.log((e.target as HTMLInputElement).value)}\n`;
  md += `  onChange={(e) => console.log((e.target as HTMLInputElement).value)}\n`;
  md += `/>\n`;
  md += `\`\`\`\n\n`;

  // Custom WA events
  md += `## Overlay / Complex Components -- Custom \`wa-\` Events\n\n`;
  md += `Components like \`wa-dialog\`, \`wa-drawer\`, \`wa-dropdown\`, \`wa-tooltip\` emit **custom events** prefixed with \`wa-\`. Event handlers receive \`CustomEvent\` objects.\n\n`;
  md += `| Web Awesome Event | React Handler | Type |\n`;
  md += `|-------------------|---------------|------|\n`;

  const sortedCustom = [...customEvents.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [name, data] of sortedCustom) {
    md += `| \`${name}\` | \`${data.reactName}\` | \`${data.type}\` |\n`;
  }

  md += `\n\`\`\`tsx\n`;
  md += `import { useState } from 'react';\n`;
  md += `import { Dialog, Button } from '@/components/ui';\n\n`;
  md += `function Example() {\n`;
  md += `  const [open, setOpen] = useState(false);\n\n`;
  md += `  return (\n`;
  md += `    <>\n`;
  md += `      <Button onClick={() => setOpen(true)}>Open Dialog</Button>\n`;
  md += `      <Dialog\n`;
  md += `        open={open}\n`;
  md += `        onWaHide={() => setOpen(false)}\n`;
  md += `        onWaAfterShow={(e) => console.log('Dialog shown', e)}\n`;
  md += `      >\n`;
  md += `        Dialog content\n`;
  md += `      </Dialog>\n`;
  md += `    </>\n`;
  md += `  );\n`;
  md += `}\n`;
  md += `\`\`\`\n`;

  return md;
}

// ---------------------------------------------------------------------------
// Vue Event Mapping (data-driven from custom-elements.json)
// ---------------------------------------------------------------------------

function generateVueEventMapping(
  ceMap: Map<string, ComponentCEMetadata>
): string {
  // Collect all unique events
  const nativeEvents = new Map<
    string,
    { type: string; components: string[] }
  >();
  const customEvents = new Map<
    string,
    { type: string; components: string[] }
  >();

  for (const [tagName, meta] of ceMap) {
    for (const event of meta.events) {
      const isNative = !event.name.startsWith('wa-');
      const target = isNative ? nativeEvents : customEvents;
      const type = friendlyEventType(event);

      if (!target.has(event.name)) {
        target.set(event.name, { type, components: [] });
      }
      target.get(event.name)!.components.push(tagName);
    }
  }

  let md = `# Event Mapping (Vue)\n\n`;
  md += `Web Awesome components use two different event systems. Vue uses \`@event-name\` syntax for both.\n\n`;

  // Native DOM events
  md += `## Native DOM Events\n\n`;
  md += `Form controls (\`wa-input\`, \`wa-select\`, \`wa-checkbox\`, etc.) emit native browser events.\n\n`;
  md += `| Web Awesome Event | Vue Handler | Type |\n`;
  md += `|-------------------|------------|------|\n`;

  const sortedNative = [...nativeEvents.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [name, data] of sortedNative) {
    md += `| \`${name}\` | \`@${name}\` | \`${data.type}\` |\n`;
  }

  md += `\n\`\`\`vue\n`;
  md += `<script setup lang="ts">\n`;
  md += `import { Input } from '@/components/ui';\n\n`;
  md += `function handleInput(e: Event) {\n`;
  md += `  console.log((e.target as HTMLInputElement).value);\n`;
  md += `}\n`;
  md += `</script>\n\n`;
  md += `<template>\n`;
  md += `  <Input @input="handleInput" @change="handleInput" />\n`;
  md += `</template>\n`;
  md += `\`\`\`\n\n`;

  // Custom WA events
  md += `## Custom \`wa-\` Events\n\n`;
  md += `Overlay and complex components emit custom events prefixed with \`wa-\`.\n\n`;
  md += `| Web Awesome Event | Vue Handler | Type |\n`;
  md += `|-------------------|------------|------|\n`;

  const sortedCustom = [...customEvents.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [name, data] of sortedCustom) {
    md += `| \`${name}\` | \`@${name}\` | \`${data.type}\` |\n`;
  }

  md += `\n\`\`\`vue\n`;
  md += `<script setup lang="ts">\n`;
  md += `import { ref } from 'vue';\n`;
  md += `import { Dialog, Button } from '@/components/ui';\n\n`;
  md += `const isOpen = ref(false);\n`;
  md += `</script>\n\n`;
  md += `<template>\n`;
  md += `  <Button @click="isOpen = true">Open Dialog</Button>\n`;
  md += `  <Dialog\n`;
  md += `    :open="isOpen"\n`;
  md += `    @wa-hide="isOpen = false"\n`;
  md += `    @wa-after-show="console.log('Dialog shown')"\n`;
  md += `  >\n`;
  md += `    Dialog content\n`;
  md += `  </Dialog>\n`;
  md += `</template>\n`;
  md += `\`\`\`\n`;

  return md;
}

// ---------------------------------------------------------------------------
// Formatting and writing utilities
// ---------------------------------------------------------------------------

/**
 * Format markdown content with prettier.
 * Pass filePath so Prettier resolves .prettierrc (singleQuote, etc.).
 */
async function formatMarkdown(
  content: string,
  filePath: string
): Promise<string> {
  return await prettier.format(content, {
    parser: 'markdown',
    filepath: filePath,
  });
}

/**
 * Write file only if content has changed
 */
async function writeIfChanged(
  filePath: string,
  newContent: string
): Promise<boolean> {
  const formattedContent = await formatMarkdown(newContent, filePath);

  if (existsSync(filePath)) {
    const existingContent = await readFile(filePath, 'utf-8');
    if (existingContent === formattedContent) {
      return false; // No change
    }
  }
  await writeFile(filePath, formattedContent, 'utf-8');
  return true; // Written
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

async function main() {
  console.log('Generating Agent Skill reference files...\n');

  // Load custom-elements.json metadata
  const ceMap = await loadCustomElementsMetadata();
  console.log(
    `  Loaded metadata for ${ceMap.size} components from custom-elements.json\n`
  );

  // Create output directories
  await mkdir(REACT_COMPONENTS_DIR, { recursive: true });
  await mkdir(VUE_COMPONENTS_DIR, { recursive: true });

  let totalFiles = 0;
  let changedCount = 0;

  // ---- React component reference files ----
  console.log('  [React] Component references:');
  for (const [key] of Object.entries(LOCAL_REGISTRY)) {
    const content = generateReactComponentReference(key, ceMap);
    const filePath = join(REACT_COMPONENTS_DIR, `${key}.md`);
    const wasWritten = await writeIfChanged(filePath, content);
    if (wasWritten) {
      console.log(`    + components/${key}.md`);
      changedCount++;
    }
    totalFiles++;
  }

  // ---- React transformation rules ----
  const reactTransform = generateTransformationRules();
  const reactTransformPath = join(REACT_SKILLS_DIR, 'transformation-rules.md');
  if (await writeIfChanged(reactTransformPath, reactTransform)) {
    console.log(`    + transformation-rules.md`);
    changedCount++;
  }
  totalFiles++;

  // ---- React event mapping (data-driven) ----
  const reactEvents = generateReactEventMapping(ceMap);
  const reactEventsPath = join(REACT_SKILLS_DIR, 'event-mapping.md');
  if (await writeIfChanged(reactEventsPath, reactEvents)) {
    console.log(`    + event-mapping.md`);
    changedCount++;
  }
  totalFiles++;

  // ---- Vue component reference files ----
  console.log('  [Vue] Component references:');
  for (const [key] of Object.entries(LOCAL_REGISTRY)) {
    const content = generateVueComponentReference(key, ceMap);
    const filePath = join(VUE_COMPONENTS_DIR, `${key}.md`);
    const wasWritten = await writeIfChanged(filePath, content);
    if (wasWritten) {
      console.log(`    + components/${key}.md`);
      changedCount++;
    }
    totalFiles++;
  }

  // ---- Vue transformation rules ----
  const vueTransform = generateVueTransformationRules();
  const vueTransformPath = join(VUE_SKILLS_DIR, 'transformation-rules-vue.md');
  if (await writeIfChanged(vueTransformPath, vueTransform)) {
    console.log(`    + transformation-rules-vue.md`);
    changedCount++;
  }
  totalFiles++;

  // ---- Vue event mapping ----
  const vueEvents = generateVueEventMapping(ceMap);
  const vueEventsPath = join(VUE_SKILLS_DIR, 'event-mapping-vue.md');
  if (await writeIfChanged(vueEventsPath, vueEvents)) {
    console.log(`    + event-mapping-vue.md`);
    changedCount++;
  }
  totalFiles++;

  console.log(
    `\nDone: ${changedCount}/${totalFiles} files updated (${totalFiles - changedCount} unchanged)\n`
  );
}

main().catch(console.error);
