#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Generate Agent Skill Reference Files
 *
 * Generates compact API surface files for agent skills by combining:
 * - LOCAL_REGISTRY (props, names, descriptions, tier)
 * - custom-elements.json (events, slots, CSS parts, CSS custom properties)
 * - Template verification (event handler names verified against .tsx files)
 *
 * Output:
 * - .claude/skills/shared/react-api-surface.md
 * - .claude/skills/shared/vue-api-surface.md
 * - .claude/skills/shared/angular-api-surface.md
 */

import { mkdir, writeFile, readFile, readdir } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { LOCAL_REGISTRY } from '../src/utils/registry.js';
import { toKebabCase } from '../src/utils/naming.js';

const PROJECT_ROOT = process.cwd();

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
 * Always derives from the raw event name: strip "wa-" prefix, camelCase, prepend "on".
 * Never uses reactName from custom-elements.json (it says "onWaHide" but templates use "onHide").
 */
function deriveReactName(eventName: string): string {
  const stripped = eventName.startsWith('wa-') ? eventName.slice(3) : eventName;
  const camel = stripped
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `on${camel}`;
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
 * Resolve the Web Awesome Pro version pinned in `<root>/docs/package.json`.
 * Returns null when unreadable, in which case the caller falls back to
 * "highest installed version wins". Mirrors find-cem.ts (finding F-152).
 */
function resolvePinnedProVersion(root: string): string | null {
  try {
    const pkg = JSON.parse(
      readFileSync(join(root, 'docs', 'package.json'), 'utf-8')
    );
    const spec: unknown =
      pkg?.dependencies?.['@awesome.me/webawesome-pro'] ??
      pkg?.devDependencies?.['@awesome.me/webawesome-pro'];
    if (typeof spec !== 'string') return null;
    const version = spec.replace(/^[\s^~>=<]+/, '').trim();
    return version || null;
  } catch {
    return null;
  }
}

/**
 * Order pnpm-store dirs to probe for the Pro CEM, preferring the pinned version
 * over a stale higher one left in the store (finding F-152).
 */
function selectProStoreDirs(
  storeDirs: string[],
  pinnedVersion: string | null
): string[] {
  const prefix = '@awesome.me+webawesome-pro@';
  const proDirs = storeDirs.filter((d) => d.startsWith(prefix));

  if (pinnedVersion) {
    const exact = `${prefix}${pinnedVersion}`;
    const pinned = proDirs.filter(
      (d) => d === exact || d.startsWith(`${exact}_`)
    );
    if (pinned.length > 0) return pinned;
  }

  return proDirs.sort().reverse();
}

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
    const pinnedVersion = resolvePinnedProVersion(root);
    const searchPaths = [
      join(root, 'docs', 'node_modules', '.pnpm'),
      join(root, 'node_modules', '.pnpm'),
    ];

    for (const pnpmPath of searchPaths) {
      if (!existsSync(pnpmPath)) continue;
      const dirs = await readdir(pnpmPath);
      const webAwesomeDirs = selectProStoreDirs(dirs, pinnedVersion);

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

/**
 * Format props as a compact inline list: open(bool=false), label(string, required)
 */
function formatCompactProps(
  props: Array<{
    name: string;
    type: string;
    values?: string[];
    default?: string;
    required?: boolean;
  }>
): string {
  if (props.length === 0) return 'none';
  return props
    .map((p) => {
      const type = p.values ? p.values.join('|') : p.type;
      const def = p.default ? `=${p.default}` : '';
      const req = p.required ? ', required' : '';
      return `${p.name}(${type}${def}${req})`;
    })
    .join(', ');
}

/**
 * Generate a compact React API surface for all components.
 */
function generateCompactReactSurface(
  ceMap: Map<string, ComponentCEMetadata>,
  unimplemented: Set<string> = new Set()
): string {
  let md = `# Kigumi React API Surface\n\n`;
  md += `> Auto-generated from registry + custom-elements.json + templates.\n`;
  md += `> Event handler names derived from templates (wa-hide -> onHide, not onWaHide).\n\n`;

  // Transformation quick-ref
  md += `## Transformation Rules\n\n`;
  md += `| HTML | React |\n`;
  md += `|------|-------|\n`;
  md += `| \`class="..."\` | \`className="..."\` |\n`;
  md += `| \`style="max-width: 60ch"\` | \`style={{ maxWidth: '60ch' }}\` |\n`;
  md += `| Kebab-case props (\`with-caret\`) | Keep as-is |\n`;
  md += `| \`slot="header"\` | \`slot="header"\` (preserved) |\n`;
  md += `| Self-closing: \`<wa-icon></wa-icon>\` | \`<Icon />\` |\n`;
  md += `| Native events (change, input) | \`onChange\`, \`onInput\` via \`e.target\` |\n`;
  md += `| Custom events (wa-hide, wa-show) | \`onHide\`, \`onShow\` via CustomEvent |\n\n`;
  md += `---\n\n`;

  // Components
  for (const [, component] of Object.entries(LOCAL_REGISTRY)) {
    const ce = ceMap.get(component.tagName);

    md += `## ${component.name}\n`;
    md += `${component.category} | ${component.tier} | ${component.description}\n`;
    md += `${component.tagName} -> <${component.name}>\n\n`;

    // Props
    md += `**Props:** ${formatCompactProps(component.props)}\n`;

    // Events (React handler names, excluding unimplemented)
    if (ce && ce.events.length > 0) {
      const implementedEvents = ce.events.filter(
        (e) => !unimplemented.has(`${component.tagName}:${e.name}`)
      );
      if (implementedEvents.length > 0) {
        const handlers = implementedEvents
          .map((e) => deriveReactName(e.name))
          .join(', ');
        md += `**Events:** ${handlers}\n`;
      }
    }

    // Slots
    if (ce && ce.slots.length > 0) {
      const slotNames = ce.slots
        .map((s) => (s.name === '' ? 'default' : s.name))
        .join(', ');
      md += `**Slots:** ${slotNames}\n`;
    }

    // Methods
    if (ce && ce.methods.length > 0) {
      const methodNames = ce.methods.map((m) => `${m.name}()`).join(', ');
      md += `**Methods:** ${methodNames}\n`;
    }

    // CSS Parts
    if (ce && ce.cssParts.length > 0) {
      const partNames = ce.cssParts.map((p) => p.name).join(', ');
      md += `**Parts:** ${partNames}\n`;
    }

    // CSS Custom Properties
    if (ce && ce.cssProperties.length > 0) {
      const cssProps = ce.cssProperties
        .map((p) => {
          const def = p.default ? `(${p.default})` : '';
          return `${p.name}${def}`;
        })
        .join(', ');
      md += `**CSS:** ${cssProps}\n`;
    }

    // Dependencies
    if (component.dependencies.length > 0) {
      const deps = component.dependencies
        .map((d) => LOCAL_REGISTRY[d]?.name || toPascalCase(d))
        .join(', ');
      md += `**Requires:** ${deps}\n`;
    }

    md += `\n`;
  }

  return md;
}

/**
 * Generate a compact Vue API surface for all components.
 */
function generateCompactVueSurface(
  ceMap: Map<string, ComponentCEMetadata>,
  unimplemented: Set<string> = new Set()
): string {
  let md = `# Kigumi Vue API Surface\n\n`;
  md += `> Auto-generated from registry + custom-elements.json + templates.\n`;
  md += `> Vue uses @event-name syntax. Custom events keep the wa- prefix.\n\n`;

  // Transformation quick-ref
  md += `## Transformation Rules\n\n`;
  md += `| HTML | Vue |\n`;
  md += `|------|-----|\n`;
  md += `| \`class="..."\` | \`class="..."\` (no change) |\n`;
  md += `| \`style="..."\` | \`style="..."\` or \`:style="{ ... }"\` |\n`;
  md += `| Kebab-case props (\`with-caret\`) | Keep as-is |\n`;
  md += `| \`slot="header"\` | \`slot="header"\` (attribute, NOT \`<template #header>\`) |\n`;
  md += `| Boolean prop (\`open\`) | \`:open="isOpen"\` (dynamic) |\n`;
  md += `| Native events (change, input) | \`@change\`, \`@input\` via \`e.target\` |\n`;
  md += `| Custom events (wa-hide, wa-show) | \`@wa-hide\`, \`@wa-show\` via CustomEvent |\n`;
  md += `| v-model | Supported on form controls (Input, Select, etc.) |\n\n`;
  md += `---\n\n`;

  // Components
  for (const [, component] of Object.entries(LOCAL_REGISTRY)) {
    const ce = ceMap.get(component.tagName);

    md += `## ${component.name}\n`;
    md += `${component.category} | ${component.tier} | ${component.description}\n`;
    md += `${component.tagName} -> <${component.name}>\n\n`;

    // Props
    md += `**Props:** ${formatCompactProps(component.props)}\n`;

    // Events (Vue syntax: @event-name, excluding unimplemented)
    if (ce && ce.events.length > 0) {
      const implementedEvents = ce.events.filter(
        (e) => !unimplemented.has(`${component.tagName}:${e.name}`)
      );
      if (implementedEvents.length > 0) {
        const handlers = implementedEvents.map((e) => `@${e.name}`).join(', ');
        md += `**Events:** ${handlers}\n`;
      }
    }

    // Slots
    if (ce && ce.slots.length > 0) {
      const slotNames = ce.slots
        .map((s) => (s.name === '' ? 'default' : s.name))
        .join(', ');
      md += `**Slots:** ${slotNames}\n`;
    }

    // Methods
    if (ce && ce.methods.length > 0) {
      const methodNames = ce.methods.map((m) => `${m.name}()`).join(', ');
      md += `**Methods:** ${methodNames}\n`;
    }

    // CSS Parts
    if (ce && ce.cssParts.length > 0) {
      const partNames = ce.cssParts.map((p) => p.name).join(', ');
      md += `**Parts:** ${partNames}\n`;
    }

    // CSS Custom Properties
    if (ce && ce.cssProperties.length > 0) {
      const cssProps = ce.cssProperties
        .map((p) => {
          const def = p.default ? `(${p.default})` : '';
          return `${p.name}${def}`;
        })
        .join(', ');
      md += `**CSS:** ${cssProps}\n`;
    }

    // Dependencies
    if (component.dependencies.length > 0) {
      const deps = component.dependencies
        .map((d) => LOCAL_REGISTRY[d]?.name || toPascalCase(d))
        .join(', ');
      md += `**Requires:** ${deps}\n`;
    }

    md += `\n`;
  }

  return md;
}

// ---------------------------------------------------------------------------
// Verification: check generated event names against actual templates
// ---------------------------------------------------------------------------

/**
 * Verify derived event names against actual templates.
 * Returns a set of "tagName:eventName" pairs that are NOT in the template
 * (WA exposes them but the Kigumi wrapper does not implement them).
 */
async function verifyEventNamesAgainstTemplates(
  ceMap: Map<string, ComponentCEMetadata>
): Promise<{
  unimplemented: Set<string>;
  warnings: string[];
  verified: number;
}> {
  const unimplemented = new Set<string>();
  const warnings: string[] = [];
  let verified = 0;
  const templatesDir = join(PROJECT_ROOT, 'templates', 'react');

  for (const [, component] of Object.entries(LOCAL_REGISTRY)) {
    const ce = ceMap.get(component.tagName);
    if (!ce || ce.events.length === 0) continue;

    const templatePath = join(
      templatesDir,
      component.name,
      `${component.name}.tsx`
    );
    if (!existsSync(templatePath)) continue;

    const templateContent = await readFile(templatePath, 'utf-8');

    for (const event of ce.events) {
      const reactName = deriveReactName(event.name);
      if (
        !templateContent.includes(`${reactName}?:`) &&
        !templateContent.includes(`${reactName}:`)
      ) {
        unimplemented.add(`${component.tagName}:${event.name}`);
        warnings.push(
          `${component.name}: '${event.name}' (${reactName}) not exposed by wrapper`
        );
      } else {
        verified++;
      }
    }
  }

  return { unimplemented, warnings, verified };
}

// ---------------------------------------------------------------------------
// Angular: verify @Output() names + detect ControlValueAccessor
// ---------------------------------------------------------------------------

/**
 * Extract Angular @Output() names from templates and map CE events to them.
 * Returns Map<tagName, Map<ceEventName, angularOutputName>>.
 */
async function extractAngularOutputMap(): Promise<
  Map<string, Map<string, string>>
> {
  const result = new Map<string, Map<string, string>>();
  const templatesDir = join(PROJECT_ROOT, 'templates', 'angular');

  for (const [, component] of Object.entries(LOCAL_REGISTRY)) {
    const kebab = toKebabCase(component.name);
    const templatePath = join(
      templatesDir,
      component.name,
      `${kebab}.component.ts`
    );

    if (!existsSync(templatePath)) continue;

    const content = await readFile(templatePath, 'utf-8');

    // Extract all @Output() names
    const outputMatches = [...content.matchAll(/@Output\(\)\s+(\w+)/g)];
    const outputNames = new Set(outputMatches.map((m) => m[1]));

    if (outputNames.size === 0) continue;

    // Map addEventListener calls to @Output names:
    // el.addEventListener('wa-show', ... this.showEvent.emit
    // el.addEventListener('blur', ... this.blurEvent.emit
    const listenerMatches = [
      ...content.matchAll(
        /addEventListener\(\s*'([^']+)'\s*,\s*\(?.*?\)?\s*(?:=>|{)\s*(?:{\s*)?this\.(\w+)\.emit/gs
      ),
    ];

    const eventMap = new Map<string, string>();
    for (const m of listenerMatches) {
      const ceEvent = m[1]; // e.g. 'wa-show', 'blur'
      const outputName = m[2]; // e.g. 'showEvent', 'blurEvent'
      if (outputNames.has(outputName)) {
        eventMap.set(ceEvent, outputName);
      }
    }

    // Also try to match outputs not captured by addEventListener regex
    // by deriving the base name and checking if it or suffixed form exists
    // (handles cases where the regex didn't match due to formatting)
    for (const outputName of outputNames) {
      // Skip if already mapped
      const alreadyMapped = [...eventMap.values()].includes(outputName);
      if (alreadyMapped) continue;

      // Try to find the CE event that maps to this output
      const baseName = outputName.replace(/Event$/, '');
      const possibleCeEvents = [
        baseName,
        `wa-${baseName.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
      ];

      for (const ceEvent of possibleCeEvents) {
        if (!eventMap.has(ceEvent)) {
          eventMap.set(ceEvent, outputName);
          break;
        }
      }
    }

    if (eventMap.size > 0) {
      result.set(component.tagName, eventMap);
    }
  }

  return result;
}

/**
 * Detect which components implement ControlValueAccessor.
 */
async function detectCVAComponents(): Promise<Set<string>> {
  const cvaComponents = new Set<string>();
  const templatesDir = join(PROJECT_ROOT, 'templates', 'angular');

  for (const [, component] of Object.entries(LOCAL_REGISTRY)) {
    const kebab = toKebabCase(component.name);
    const templatePath = join(
      templatesDir,
      component.name,
      `${kebab}.component.ts`
    );

    try {
      const content = await readFile(templatePath, 'utf-8');
      if (content.includes('NG_VALUE_ACCESSOR')) {
        cvaComponents.add(component.tagName);
      }
    } catch {
      continue;
    }
  }

  return cvaComponents;
}

/**
 * Generate a compact Angular API surface for all components.
 */
function generateCompactAngularSurface(
  ceMap: Map<string, ComponentCEMetadata>,
  angularOutputMap: Map<string, Map<string, string>>,
  cvaComponents: Set<string>
): string {
  let md = `# Kigumi Angular API Surface\n\n`;
  md += `> Auto-generated from registry + custom-elements.json + Angular templates.\n`;
  md += `> Angular events use (outputName) syntax. Collision suffixes: blur->blurEvent, focus->focusEvent, show->showEvent, input->inputEvent.\n\n`;

  // Transformation quick-ref
  md += `## Transformation Rules\n\n`;
  md += `| HTML | Angular |\n`;
  md += `|------|--------|\n`;
  md += `| \`<wa-button>\` | \`<k-button>\` |\n`;
  md += `| \`class="..."\` | \`class="..."\` (no change) |\n`;
  md += `| \`variant="primary"\` | \`[variant]="'brand'"\` |\n`;
  md += `| \`disabled\` | \`[disabled]="true"\` |\n`;
  md += `| \`style="--wa-x: y"\` | \`style="--wa-x: y"\` (no change) |\n`;
  md += `| \`slot="header"\` | \`slot="header"\` (preserved) |\n`;
  md += `| Event: \`wa-hide\` | \`(hide)="handler()"\` |\n`;
  md += `| Event: \`blur\` | \`(blurEvent)="handler()"\` (collision suffix) |\n`;
  md += `| Form value | \`[(ngModel)]="value"\` (requires FormsModule) |\n\n`;
  md += `---\n\n`;

  // Components
  for (const [, component] of Object.entries(LOCAL_REGISTRY)) {
    const ce = ceMap.get(component.tagName);
    const selectorKebab = component.tagName.replace('wa-', 'k-');

    md += `## ${component.name}\n`;
    md += `${component.category} | ${component.tier} | ${component.description}\n`;
    md += `${component.tagName} -> <${component.name}> (selector: ${selectorKebab})\n\n`;

    // Props
    md += `**Props:** ${formatCompactProps(component.props)}\n`;

    // Events (Angular output names from template extraction)
    const componentOutputs = angularOutputMap.get(component.tagName);
    if (componentOutputs && componentOutputs.size > 0) {
      const outputs = [...componentOutputs.values()]
        .map((name) => `(${name})`)
        .join(', ');
      md += `**Outputs:** ${outputs}\n`;
    }

    // Slots
    if (ce && ce.slots.length > 0) {
      const slotNames = ce.slots
        .map((s) => (s.name === '' ? 'default' : s.name))
        .join(', ');
      md += `**Slots:** ${slotNames}\n`;
    }

    // Methods
    if (ce && ce.methods.length > 0) {
      const methodNames = ce.methods.map((m) => `${m.name}()`).join(', ');
      md += `**Methods:** ${methodNames}\n`;
    }

    // CSS Parts
    if (ce && ce.cssParts.length > 0) {
      const partNames = ce.cssParts.map((p) => p.name).join(', ');
      md += `**Parts:** ${partNames}\n`;
    }

    // CSS Custom Properties
    if (ce && ce.cssProperties.length > 0) {
      const cssProps = ce.cssProperties
        .map((p) => {
          const def = p.default ? `(${p.default})` : '';
          return `${p.name}${def}`;
        })
        .join(', ');
      md += `**CSS:** ${cssProps}\n`;
    }

    // CVA indicator
    if (cvaComponents.has(component.tagName)) {
      md += `**Form:** ControlValueAccessor -- \`[(ngModel)]="value"\` (FormsModule) or \`[formControl]="ctrl"\` (ReactiveFormsModule)\n`;
    }

    // Dependencies
    if (component.dependencies.length > 0) {
      const deps = component.dependencies
        .map((d) => LOCAL_REGISTRY[d]?.name || toPascalCase(d))
        .join(', ');
      md += `**Requires:** ${deps}\n`;
    }

    md += `\n`;
  }

  return md;
}

// ---------------------------------------------------------------------------
// Formatting and writing utilities
// ---------------------------------------------------------------------------

/**
 * Write file, creating parent directories as needed
 */
async function writeOutput(filePath: string, content: string): Promise<void> {
  await mkdir(join(filePath, '..'), { recursive: true });
  await writeFile(filePath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

const SHARED_DIR = join(PROJECT_ROOT, '.claude', 'skills', 'shared');

async function main() {
  console.log('Generating compact Agent Skill API surface files...\n');

  // Load custom-elements.json metadata
  const ceMap = await loadCustomElementsMetadata();
  console.log(
    `  Loaded metadata for ${ceMap.size} components from custom-elements.json`
  );
  console.log(
    `  Registry has ${Object.keys(LOCAL_REGISTRY).length} components\n`
  );

  // Verify event names against templates (always runs)
  console.log('  Verifying event names against templates...');
  const { unimplemented, warnings, verified } =
    await verifyEventNamesAgainstTemplates(ceMap);
  if (warnings.length > 0) {
    console.log(
      `  ${warnings.length} events not exposed by wrappers (excluded from output):`
    );
    warnings.forEach((w) => console.log(`    - ${w}`));
  }
  console.log(`  ${verified} event handler names verified against templates\n`);

  // Generate compact API surface files
  await mkdir(SHARED_DIR, { recursive: true });

  const reactSurface = generateCompactReactSurface(ceMap, unimplemented);
  const reactPath = join(SHARED_DIR, 'react-api-surface.md');
  await writeOutput(reactPath, reactSurface);
  console.log(
    `  [React] ${reactPath.replace(PROJECT_ROOT + '/', '')} (${reactSurface.split('\n').length} lines)`
  );

  const vueSurface = generateCompactVueSurface(ceMap, unimplemented);
  const vuePath = join(SHARED_DIR, 'vue-api-surface.md');
  await writeOutput(vuePath, vueSurface);
  console.log(
    `  [Vue]   ${vuePath.replace(PROJECT_ROOT + '/', '')} (${vueSurface.split('\n').length} lines)`
  );

  // Angular: extract @Output() names from templates + detect CVA
  console.log('\n  Extracting Angular @Output() names from templates...');
  const angularOutputMap = await extractAngularOutputMap();
  const cvaComponents = await detectCVAComponents();
  console.log(
    `  ${angularOutputMap.size} components with mapped outputs, ${cvaComponents.size} with ControlValueAccessor`
  );

  const angularSurface = generateCompactAngularSurface(
    ceMap,
    angularOutputMap,
    cvaComponents
  );
  const angularPath = join(SHARED_DIR, 'angular-api-surface.md');
  await writeOutput(angularPath, angularSurface);
  console.log(
    `  [Angular] ${angularPath.replace(PROJECT_ROOT + '/', '')} (${angularSurface.split('\n').length} lines)`
  );

  console.log('\nDone.\n');
}

main().catch(console.error);
