#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Custom Elements Parser
 *
 * Parses Web Awesome's custom-elements.json and generates component metadata
 * for use in template generators.
 *
 * Outputs:
 * - src/utils/component-metadata.ts — runtime component metadata (events, slots, methods)
 * - scripts/css-metadata.ts — build-time CSS parts / custom-properties data
 */

import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { findCustomElementsJson } from './find-cem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

export interface CustomElementDeclaration {
  kind?: string;
  name?: string;
  tagName?: string;
  members?: Array<{
    kind?: string;
    name?: string;
    description?: string;
    privacy?: string;
    static?: boolean;
    type?: { text?: string };
    parameters?: Array<{ name?: string; type?: { text?: string } }>;
  }>;
  events?: Array<{
    name?: string;
    description?: string;
    reactName?: string;
    eventName?: string;
    type?: { text?: string };
  }>;
  slots?: Array<{
    name?: string;
    description?: string;
  }>;
  cssParts?: Array<{
    name?: string;
    description?: string;
  }>;
  cssProperties?: Array<{
    name?: string;
    description?: string;
    default?: string;
  }>;
}

interface CustomElementsJSON {
  modules: Array<{
    declarations?: Array<CustomElementDeclaration>;
  }>;
}

interface ComponentMetadata {
  tagName: string;
  className: string;
  events: Array<{
    name: string;
    description: string;
    reactName?: string;
    eventType: string;
  }>;
  slots: Array<{
    name: string;
    description: string;
  }>;
  methods: Array<{
    name: string;
    description: string;
    parameters?: Array<{ name: string; type: string }>;
  }>;
}

interface CSSPart {
  name: string;
  description: string;
}

interface CSSCustomProperty {
  name: string;
  description: string;
  default?: string;
}

interface ComponentCSSMetadata {
  parts: CSSPart[];
  customProperties: CSSCustomProperty[];
  docsUrl: string;
}

interface ParsedOutput {
  components: Record<string, ComponentMetadata>;
  cssMetadata: Record<string, ComponentCSSMetadata>;
}

/**
 * CEM occasionally uses a destructuring pattern as the literal parameter
 * `name` (e.g. `{ includeDisabled = true }` for `wa-tree-item.getChildrenItems`
 * in WA 3.5.0+). That string is valid as a function signature but a SyntaxError
 * as a call argument, which our generators emit at index `args = p.name`.
 * Normalize anything that isn't a bare JS identifier to `options` (or
 * `options{i}` for non-leading positions); the `type` field still carries the
 * destructured shape so wrapper signatures stay accurate.
 *
 * Exported for unit testing.
 */
export function sanitizeParamName(rawName: string, index: number): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rawName)) return rawName;
  return index === 0 ? 'options' : `options${index}`;
}

/**
 * Pure extractor: given a CEM class declaration, return its CSS metadata or
 * null when the component has neither parts nor custom properties. Exported
 * for unit testing.
 */
export function extractCssMetadata(
  declaration: CustomElementDeclaration
): ComponentCSSMetadata | null {
  const parts: CSSPart[] = (declaration.cssParts || [])
    .filter((p): p is { name: string; description?: string } => !!p.name)
    .map((p) => ({ name: p.name, description: p.description || '' }));

  const customProperties: CSSCustomProperty[] = (
    declaration.cssProperties || []
  )
    .filter(
      (p): p is { name: string; description?: string; default?: string } =>
        !!p.name
    )
    .map((p) => {
      const entry: CSSCustomProperty = {
        name: p.name,
        description: p.description || '',
      };
      if (p.default !== undefined) entry.default = p.default;
      return entry;
    });

  if (parts.length === 0 && customProperties.length === 0) return null;

  const componentKey = (declaration.tagName || '').replace(/^wa-/, '');
  return {
    parts,
    customProperties,
    docsUrl: `https://webawesome.com/docs/components/${componentKey}`,
  };
}

/**
 * Run prettier against the given files via the local binary, resolving when
 * the process exits cleanly. Throws on non-zero exit or spawn error.
 */
function formatWithPrettier(files: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const relative = files.map((f) => path.relative(PROJECT_ROOT, f));
    const child = spawn('pnpm', ['exec', 'prettier', '--write', ...relative], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`prettier exited with code ${code}`));
    });
  });
}

/**
 * Parse custom-elements.json and extract component metadata
 */
async function parseCustomElements(): Promise<ParsedOutput> {
  const filePath = await findCustomElementsJson();

  if (!filePath) {
    throw new Error(
      'custom-elements.json not found. Make sure @awesome.me/webawesome-pro is installed in docs/node_modules'
    );
  }

  console.log(
    `📖 Reading custom-elements.json from: ${path.relative(PROJECT_ROOT, filePath)}`
  );

  const data = (await fs.readJson(filePath)) as CustomElementsJSON;
  const metadata: Record<string, ComponentMetadata> = {};
  const cssMetadata: Record<string, ComponentCSSMetadata> = {};

  for (const module of data.modules) {
    if (!module.declarations) continue;

    for (const declaration of module.declarations) {
      if (declaration.kind !== 'class') continue;
      if (!declaration.tagName || !declaration.name) continue;

      const tagName = declaration.tagName;
      const className = declaration.name;
      const componentKey = tagName.replace('wa-', '');

      // Extract events
      // Derive reactName from the raw event name (strip wa- prefix, camelCase, prepend on)
      // Never use reactName from custom-elements.json — it says "onWaHide" but templates use "onHide"
      const events = (declaration.events || [])
        .map((event) => {
          const name = event.name || '';
          const stripped = name.startsWith('wa-') ? name.slice(3) : name;
          const camel = stripped
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');
          return {
            name,
            description: event.description || '',
            reactName: `on${camel}`,
            eventType: event.eventName || event.type?.text || 'Event',
          };
        })
        .filter((e) => e.name);

      // Extract slots
      const slots = (declaration.slots || []).map((slot) => ({
        name: slot.name || '',
        description: slot.description || '',
      }));

      // Extract public instance methods. Filters:
      // - kind === 'method' drops fields and non-methods
      // - privacy !== 'private' drops methods WA marks private (e.g.
      //   wa-dialog/wa-drawer show()/requestClose() in WA 3.5.0+)
      // - !member.static drops class-level methods that don't make sense on
      //   an instance wrapper (e.g. wa-markdown getMarked()/updateAll())
      // - description && name guards against malformed CEM entries
      const methods = (declaration.members || [])
        .filter(
          (member) =>
            member.kind === 'method' &&
            member.privacy !== 'private' &&
            !member.static &&
            member.description &&
            member.name
        )
        .map((method) => {
          const params =
            method.parameters?.map((p, i) => ({
              name: sanitizeParamName(p.name || '', i),
              type: p.type?.text || 'any',
            })) || [];

          return {
            name: method.name!,
            description: method.description!,
            parameters: params.length > 0 ? params : undefined,
          };
        });

      metadata[componentKey] = {
        tagName,
        className,
        events,
        slots,
        methods,
      };

      // Extract CSS parts and custom properties. Components where CEM
      // provides neither (utility components like wa-animation) are simply
      // absent from the map; template generators handle the missing case.
      const css = extractCssMetadata(declaration);
      if (css) cssMetadata[componentKey] = css;
    }
  }

  return { components: metadata, cssMetadata };
}

/**
 * Generate TypeScript source file
 */
function generateTypeScriptSource(
  metadata: Record<string, ComponentMetadata>
): string {
  return `// Auto-generated by scripts/parse-custom-elements.ts
// DO NOT EDIT MANUALLY
//
// This file contains metadata extracted from Web Awesome's custom-elements.json
// Run \`pnpm generate:metadata\` to regenerate

export interface ComponentMetadata {
  tagName: string;
  className: string;
  events: Array<{
    name: string;
    description: string;
    reactName?: string;
    eventType: string;
  }>;
  slots: Array<{
    name: string;
    description: string;
  }>;
  methods: Array<{
    name: string;
    description: string;
    parameters?: Array<{ name: string; type: string }>;
  }>;
}

export const COMPONENT_METADATA: Record<string, ComponentMetadata> = ${JSON.stringify(metadata, null, 2)};
`;
}

/**
 * Generate scripts/css-metadata.ts source file.
 *
 * Consumed by scripts/generate-{angular,react,vue}-templates.ts to emit CSS
 * parts / custom-property comment blocks into the generated CSS templates.
 * Keys are the WA tag name stripped of the `wa-` prefix (kebab-case, matching
 * how consumers look it up).
 */
function generateCssMetadataSource(
  cssMetadata: Record<string, ComponentCSSMetadata>
): string {
  const sortedKeys = Object.keys(cssMetadata).sort();
  const sorted: Record<string, ComponentCSSMetadata> = {};
  for (const key of sortedKeys) sorted[key] = cssMetadata[key];

  return `// Auto-generated by scripts/parse-custom-elements.ts
// DO NOT EDIT MANUALLY — run \`pnpm generate:metadata\` to regenerate.
//
// Build-time data consumed by generate-{angular,react,vue}-templates.ts to
// emit CSS parts / custom-property comments into the generated CSS templates.
// Not used at runtime. Data is derived from Web Awesome's custom-elements.json
// (cssParts + cssProperties fields per component declaration).

export interface CSSPart {
  name: string;
  description: string;
}

export interface CSSCustomProperty {
  name: string;
  description: string;
  default?: string;
}

export interface ComponentCSSMetadata {
  parts: CSSPart[];
  customProperties: CSSCustomProperty[];
  docsUrl: string;
}

export const CSS_METADATA: Record<string, ComponentCSSMetadata> = ${JSON.stringify(sorted, null, 2)};
`;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔨 Parsing Web Awesome custom-elements.json...\n');

  const metadataPath = path.join(
    PROJECT_ROOT,
    'src/utils/component-metadata.ts'
  );
  const cssMetadataPath = path.join(PROJECT_ROOT, 'scripts/css-metadata.ts');
  const docsInstalled = await fs.pathExists(
    path.join(PROJECT_ROOT, 'docs/node_modules')
  );

  if (
    (await fs.pathExists(metadataPath)) &&
    (await fs.pathExists(cssMetadataPath)) &&
    !docsInstalled
  ) {
    console.log(
      '⏭️  Skipping metadata generation (files exist, docs not installed)'
    );
    console.log(
      '   Run `pnpm install` in docs/ to regenerate from custom-elements.json\n'
    );
    return;
  }

  try {
    const { components: metadata, cssMetadata } = await parseCustomElements();
    const componentCount = Object.keys(metadata).length;
    const cssCount = Object.keys(cssMetadata).length;

    console.log(`\n✅ Parsed ${componentCount} components`);
    console.log(`   ${cssCount} with CSS parts or custom-properties data\n`);

    // Show sample stats
    const stats = Object.entries(metadata)
      .map(([key, data]) => ({
        name: key,
        events: data.events.length,
        slots: data.slots.length,
        methods: data.methods.length,
      }))
      .sort((a, b) => {
        const totalA = a.events + a.methods + a.slots;
        const totalB = b.events + b.methods + b.slots;
        return totalB - totalA;
      });

    console.log('📊 Top 5 most complex components:');
    stats.slice(0, 5).forEach(({ name, events, slots, methods }) => {
      console.log(
        `   ${name.padEnd(20)} - ${events} events, ${slots} slots, ${methods} methods`
      );
    });

    console.log('\n📊 Simplest components:');
    stats
      .slice(-5)
      .reverse()
      .forEach(({ name, events, slots, methods }) => {
        console.log(
          `   ${name.padEnd(20)} - ${events} events, ${slots} slots, ${methods} methods`
        );
      });

    const metadataSource = generateTypeScriptSource(metadata);
    await fs.writeFile(metadataPath, metadataSource, 'utf-8');
    console.log(`\n✅ Generated: ${path.relative(PROJECT_ROOT, metadataPath)}`);
    console.log(
      `   ${metadataSource.split('\n').length} lines, ${(metadataSource.length / 1024).toFixed(1)} KB`
    );

    const cssMetadataSource = generateCssMetadataSource(cssMetadata);
    await fs.writeFile(cssMetadataPath, cssMetadataSource, 'utf-8');
    console.log(
      `✅ Generated: ${path.relative(PROJECT_ROOT, cssMetadataPath)}`
    );
    console.log(
      `   ${cssMetadataSource.split('\n').length} lines, ${(cssMetadataSource.length / 1024).toFixed(1)} KB`
    );

    // Format both outputs so regeneration stays idempotent with the committed
    // prettier-formatted versions (JSON.stringify emits raw double-quoted JSON).
    await formatWithPrettier([metadataPath, cssMetadataPath]);
    console.log();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
