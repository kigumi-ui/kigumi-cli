#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Custom Elements Parser
 *
 * Parses Web Awesome's custom-elements.json and generates component metadata
 * for use in template generators.
 *
 * Output: src/utils/component-metadata.ts
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

interface CustomElementsJSON {
  modules: Array<{
    declarations?: Array<{
      kind?: string;
      name?: string;
      tagName?: string;
      members?: Array<{
        kind?: string;
        name?: string;
        description?: string;
        privacy?: string;
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
    }>;
  }>;
}

type ComponentTier = 'presentational' | 'interactive';

interface ComponentMetadata {
  tagName: string;
  className: string;
  /**
   * Tier determines the React/Vue wrapper shape:
   * - 'presentational' = pure `forwardRef` pass-through, no hooks, no `'use client';`.
   *   Safe to render in React Server Components.
   * - 'interactive' = `useRef` + `useImperativeHandle` + `useEffect` for `wa-*` events,
   *   emits `'use client';` as first line.
   *
   * Derived from CEM: a component with >= 1 event requires useEffect + addEventListener
   * in the wrapper, which forces it client-side. Components without events can
   * pass the ref straight through to the native element and therefore work as RSC.
   */
  tier: ComponentTier;
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

/**
 * Method overrides for components where custom-elements.json marks methods
 * as private or lacks descriptions, causing them to be filtered out.
 */
const METHOD_OVERRIDES: Record<string, ComponentMetadata['methods']> = {
  dialog: [
    { name: 'show', description: 'Shows the dialog.' },
    { name: 'requestClose', description: 'Closes the dialog.' },
  ],
  drawer: [
    { name: 'show', description: 'Shows the drawer.' },
    { name: 'requestClose', description: 'Closes the drawer.' },
  ],
};

/**
 * Find custom-elements.json in node_modules
 */
async function findCustomElementsJson(): Promise<string | null> {
  // Try pnpm path first
  const pnpmPath = path.join(PROJECT_ROOT, 'docs/node_modules/.pnpm');

  if (await fs.pathExists(pnpmPath)) {
    const pnpmDirs = await fs.readdir(pnpmPath);
    const webAwesomeDirs = pnpmDirs
      .filter((dir) => dir.startsWith('@awesome.me+webawesome-pro@'))
      .sort()
      .reverse(); // Sort descending to prefer newest version

    for (const dir of webAwesomeDirs) {
      const jsonPath = path.join(
        pnpmPath,
        dir,
        'node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
      );
      if (await fs.pathExists(jsonPath)) {
        return jsonPath;
      }
    }
  }

  // Try regular node_modules
  const regularPath = path.join(
    PROJECT_ROOT,
    'docs/node_modules/@awesome.me/webawesome-pro/dist/custom-elements.json'
  );

  if (await fs.pathExists(regularPath)) {
    return regularPath;
  }

  return null;
}

/**
 * Parse custom-elements.json and extract component metadata
 */
async function parseCustomElements(): Promise<
  Record<string, ComponentMetadata>
> {
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

      // Extract public methods (filter out private, fields, and non-methods)
      const methods = (declaration.members || [])
        .filter(
          (member) =>
            member.kind === 'method' &&
            member.privacy !== 'private' &&
            member.description &&
            member.name
        )
        .map((method) => {
          const params =
            method.parameters?.map((p) => ({
              name: p.name || '',
              type: p.type?.text || 'any',
            })) || [];

          return {
            name: method.name!,
            description: method.description!,
            parameters: params.length > 0 ? params : undefined,
          };
        });

      // Tier = 'interactive' if the component exposes >= 1 custom event.
      // Rationale: events require useEffect + addEventListener in the wrapper,
      // which forces the wrapper client-side. Components without events can
      // pass the forwarded ref straight to the native element, which is
      // RSC-safe (no hooks, no 'use client').
      // Methods alone are fine for presentational components because
      // `ref.current?.method()` works directly on the native wa-* element.
      const tier: ComponentTier =
        events.length > 0 ? 'interactive' : 'presentational';

      metadata[componentKey] = {
        tagName,
        className,
        tier,
        events,
        slots,
        methods,
      };

      // Apply method overrides for components where custom-elements.json
      // marks methods as private or lacks descriptions (e.g. Dialog, Drawer)
      if (
        METHOD_OVERRIDES[componentKey] &&
        metadata[componentKey].methods.length === 0
      ) {
        metadata[componentKey].methods = METHOD_OVERRIDES[componentKey];
      }
    }
  }

  return metadata;
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

export type ComponentTier = 'presentational' | 'interactive';

export interface ComponentMetadata {
  tagName: string;
  className: string;
  /**
   * Tier determines the React/Vue wrapper shape:
   * - 'presentational' = pure \`forwardRef\` pass-through, no hooks, no \`'use client';\`.
   *   Safe to render in React Server Components.
   * - 'interactive' = \`useRef\` + \`useImperativeHandle\` + \`useEffect\` for \`wa-*\` events,
   *   emits \`'use client';\` as first line.
   *
   * Derived from CEM: a component with >= 1 event requires useEffect + addEventListener
   * in the wrapper, which forces it client-side. Components without events can
   * pass the ref straight through to the native element and therefore work as RSC.
   */
  tier: ComponentTier;
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
 * Main execution
 */
async function main() {
  console.log('🔨 Parsing Web Awesome custom-elements.json...\n');

  // Check if metadata file exists and docs not installed - skip regeneration
  const metadataPath = path.join(
    PROJECT_ROOT,
    'src/utils/component-metadata.ts'
  );
  const docsInstalled = await fs.pathExists(
    path.join(PROJECT_ROOT, 'docs/node_modules')
  );

  if ((await fs.pathExists(metadataPath)) && !docsInstalled) {
    console.log(
      '⏭️  Skipping metadata generation (file exists, docs not installed)'
    );
    console.log(
      '   Run `pnpm install` in docs/ to regenerate from custom-elements.json\n'
    );
    return;
  }

  try {
    const metadata = await parseCustomElements();
    const componentCount = Object.keys(metadata).length;

    console.log(`\n✅ Parsed ${componentCount} components\n`);

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

    // Generate TypeScript file
    const outputPath = path.join(
      PROJECT_ROOT,
      'src',
      'utils',
      'component-metadata.ts'
    );
    const source = generateTypeScriptSource(metadata);

    await fs.writeFile(outputPath, source, 'utf-8');

    console.log(`\n✅ Generated: ${path.relative(PROJECT_ROOT, outputPath)}`);
    console.log(
      `   ${source.split('\n').length} lines, ${(source.length / 1024).toFixed(1)} KB\n`
    );
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
