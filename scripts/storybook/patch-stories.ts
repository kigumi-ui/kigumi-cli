/**
 * Story Patching Script
 *
 * Reads each existing .stories.tsx file and patches the machine-generated
 * sections (JSDoc + const meta block) while preserving all manual story exports.
 *
 * Usage: npx tsx scripts/storybook/patch-stories.ts [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { buildAllStoryData, type StoryData } from './story-data.js';
import { STORY_OVERRIDES } from './overrides.js';

const STORIES_DIR = path.resolve(import.meta.dirname, '../../docs/src/stories');

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Code Generation ─────────────────────────────────────────────────────────

function generateArgTypesBlock(storyData: StoryData): string {
  const lines: string[] = [];

  // Group argTypes by category
  const props: [string, (typeof storyData.argTypes)[string]][] = [];
  const events: [string, (typeof storyData.argTypes)[string]][] = [];
  const slots: [string, (typeof storyData.argTypes)[string]][] = [];
  const methods: [string, (typeof storyData.argTypes)[string]][] = [];

  for (const [name, argType] of Object.entries(storyData.argTypes)) {
    if (name.startsWith('slot:')) {
      slots.push([name, argType]);
    } else if (name.startsWith('method:')) {
      methods.push([name, argType]);
    } else if (argType.table?.category === 'Events') {
      events.push([name, argType]);
    } else {
      props.push([name, argType]);
    }
  }

  // Props
  for (const [name, argType] of props) {
    lines.push(formatArgType(name, argType));
  }

  // Events
  if (events.length > 0) {
    for (const [name, argType] of events) {
      lines.push(formatArgType(name, argType));
    }
  }

  // Slots (docs-only)
  if (slots.length > 0) {
    for (const [name, argType] of slots) {
      lines.push(formatArgType(name, argType));
    }
  }

  // Methods (docs-only)
  if (methods.length > 0) {
    for (const [name, argType] of methods) {
      lines.push(formatArgType(name, argType));
    }
  }

  return lines.join('\n');
}

function formatArgType(
  name: string,
  argType: typeof StoryData.prototype extends never
    ? never
    : Record<string, unknown>
): string {
  const key = needsQuotes(name) ? `'${name}'` : name;
  const parts: string[] = [];

  const at = argType as Record<string, unknown>;

  if (at.control === false) {
    parts.push('control: false');
  } else if (at.control === 'boolean') {
    parts.push("control: 'boolean'");
  } else if (at.control === 'text') {
    parts.push("control: 'text'");
  } else if (at.control === 'number') {
    parts.push("control: 'number'");
  } else if (at.control === 'select' && at.options) {
    parts.push("control: 'select'");
    const opts = (at.options as string[]).map((o) => `'${o}'`).join(', ');
    parts.push(`options: [${opts}]`);
  }

  if (at.action) {
    parts.push(`action: '${at.action}'`);
  }

  if (at.description) {
    const desc = (at.description as string)
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/'/g, "\\'");
    parts.push(`description: '${desc}'`);
  }

  const table = at.table as Record<string, unknown> | undefined;
  if (table) {
    const tableParts: string[] = [];
    if (table.disable) {
      tableParts.push('disable: true');
    }
    if (table.defaultValue) {
      const dv = table.defaultValue as { summary: string };
      const escaped = dv.summary.replace(/'/g, "\\'");
      tableParts.push(`defaultValue: { summary: '${escaped}' }`);
    }
    if (table.category) {
      tableParts.push(`category: '${table.category}'`);
    }
    if (tableParts.length > 0) {
      parts.push(`table: { ${tableParts.join(', ')} }`);
    }
  }

  return `    ${key}: { ${parts.join(', ')} },`;
}

function needsQuotes(name: string): boolean {
  return name.includes('-') || name.includes(':') || name.includes(' ');
}

function generateArgsBlock(storyData: StoryData): string {
  const lines: string[] = [];

  // Non-event args (children, label, etc.)
  for (const [name, value] of Object.entries(storyData.args)) {
    if (storyData.eventPropNames.includes(name)) continue;
    const key = needsQuotes(name) ? `'${name}'` : name;
    lines.push(`    ${key}: ${value},`);
  }

  // Event args with fn()
  for (const eventName of storyData.eventPropNames) {
    lines.push(`    ${eventName}: fn(),`);
  }

  return lines.join('\n');
}

function generateJsDoc(storyData: StoryData): string {
  const desc = storyData.description;
  // Wrap at ~90 chars per line
  const words = desc.split(' ');
  const docLines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > 88) {
      docLines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) docLines.push(currentLine);

  if (docLines.length === 1) {
    return `/** ${docLines[0]} */`;
  }

  const inner = docLines.map((l) => ` * ${l}`).join('\n');
  return `/**\n${inner}\n */`;
}

function generateMetaBlock(storyData: StoryData): string {
  const jsDoc = generateJsDoc(storyData);
  const argTypes = generateArgTypesBlock(storyData);
  const args = generateArgsBlock(storyData);
  const overrides = STORY_OVERRIDES[storyData.componentKey];

  let parametersLine = '';
  if (overrides?.parameters) {
    const params = Object.entries(overrides.parameters)
      .map(([k, v]) => `${k}: '${v}'`)
      .join(', ');
    parametersLine = `\n  parameters: { ${params} },`;
  }

  const argsSection = args.trim() ? `\n  args: {\n${args}\n  },` : '';

  return `${jsDoc}
const meta = {
  title: '${storyData.title}',
  component: ${storyData.componentName},
  tags: ['autodocs'],${parametersLine}
  argTypes: {
${argTypes}
  },${argsSection}
} satisfies Meta<typeof ${storyData.componentName}>;`;
}

// ─── File Patching ───────────────────────────────────────────────────────────

interface PatchResult {
  file: string;
  changed: boolean;
  error?: string;
}

function patchStoryFile(storyFile: string, storyData: StoryData): PatchResult {
  const result: PatchResult = { file: storyFile, changed: false };

  if (!fs.existsSync(storyFile)) {
    result.error = 'File not found';
    return result;
  }

  const content = fs.readFileSync(storyFile, 'utf-8');

  // Find the meta block boundaries
  // Pattern: optional JSDoc + "const meta = {" ... "} satisfies Meta<typeof X>;"
  const metaBlockRegex =
    /(\/\*\*[\s\S]*?\*\/\s*\n)?const meta = \{[\s\S]*?\} satisfies Meta<typeof \w+>;/;

  const match = content.match(metaBlockRegex);
  if (!match) {
    result.error = 'Could not locate meta block';
    return result;
  }

  const newMetaBlock = generateMetaBlock(storyData);
  const newContent = content.replace(metaBlockRegex, newMetaBlock);

  if (newContent === content) {
    return result; // No changes needed
  }

  result.changed = true;

  if (!DRY_RUN) {
    fs.writeFileSync(storyFile, newContent, 'utf-8');
  }

  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const allStoryData = buildAllStoryData();
  const results: PatchResult[] = [];

  console.log(
    DRY_RUN
      ? '🔍 Dry run — no files will be modified\n'
      : '🔧 Patching story files...\n'
  );

  for (const [_key, storyData] of allStoryData) {
    const storyFile = path.join(
      STORIES_DIR,
      `${storyData.componentName}.stories.tsx`
    );

    if (!fs.existsSync(storyFile)) {
      console.log(`  ⏭  ${storyData.componentName} — no story file`);
      continue;
    }

    const result = patchStoryFile(storyFile, storyData);
    results.push(result);

    if (result.error) {
      console.log(`  ✗  ${storyData.componentName} — ${result.error}`);
    } else if (result.changed) {
      console.log(`  ✓  ${storyData.componentName} — patched`);
    } else {
      console.log(`  ·  ${storyData.componentName} — no changes`);
    }
  }

  const changed = results.filter((r) => r.changed).length;
  const errored = results.filter((r) => r.error).length;
  const unchanged = results.filter((r) => !r.changed && !r.error).length;

  console.log(
    `\nDone: ${changed} patched, ${unchanged} unchanged, ${errored} errors`
  );
}

main();
