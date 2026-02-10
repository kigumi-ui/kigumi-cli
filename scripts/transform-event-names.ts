/**
 * Event Name Transformation Script
 *
 * Transforms event names in React and Vue templates:
 * - React TSX: onWa* -> on* (e.g., onWaShow -> onShow)
 * - React JSX: onWa* -> on* (same pattern)
 * - Vue: wa-* -> simplified (e.g., 'wa-show' -> 'show')
 *
 * DOM event listeners (el.addEventListener('wa-show', ...)) remain unchanged.
 *
 * Usage: npx tsx scripts/transform-event-names.ts
 */

import fs from 'fs-extra';
import path from 'path';

interface TransformResult {
  file: string;
  changed: boolean;
  transformations: string[];
}

/**
 * Recursively find files matching a pattern
 */
async function findFiles(
  dir: string,
  pattern: RegExp,
  ignore?: RegExp
): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findFiles(fullPath, pattern, ignore)));
    } else if (pattern.test(entry.name)) {
      if (!ignore || !ignore.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Transform React TSX/JSX event names from onWa* to on*
 *
 * Transforms:
 * - Interface: onWaShow -> onShow (in prop types)
 * - Props destructuring: onWaShow -> onShow
 * - Handler function names: handleWaShow -> handleShow
 * - useEffect dependencies: onWaShow -> onShow
 * - Omit types: 'onWaShow' -> 'onShow'
 *
 * Does NOT transform:
 * - DOM events: el.addEventListener('wa-show', ...) - unchanged
 */
function transformReactFile(content: string): {
  content: string;
  transformations: string[];
} {
  const transformations: string[] = [];
  let newContent = content;

  // Pattern 1: Interface prop types - onWaShow?: (event: CustomEvent) => void;
  // Also handles: onWaAfterShow, onWaHide, etc.
  const propTypePattern =
    /\bon(Wa)([A-Z][a-zA-Z]*)\??\s*:\s*\(event:\s*CustomEvent\)\s*=>\s*void/g;
  newContent = newContent.replace(propTypePattern, (match, _wa, eventName) => {
    transformations.push(`Prop type: onWa${eventName} -> on${eventName}`);
    return match.replace(`onWa${eventName}`, `on${eventName}`);
  });

  // Pattern 2: Omit types - Omit<..., 'onWaShow' | 'onWaHide' | ...>
  // Match: 'onWaShow' | 'onWaAfterShow' etc.
  const omitPattern = /'on(Wa)([A-Z][a-zA-Z]*)'/g;
  newContent = newContent.replace(omitPattern, (match, _wa, eventName) => {
    // Skip if already transformed (no Wa prefix)
    if (!match.includes('Wa')) return match;
    transformations.push(`Omit type: 'onWa${eventName}' -> 'on${eventName}'`);
    return `'on${eventName}'`;
  });

  // Pattern 3: Props destructuring - { ..., onWaShow, onWaAfterShow, ... }
  // Match: onWaShow (as identifier in destructuring)
  const destructurePattern = /\bon(Wa)([A-Z][a-zA-Z]*)\b(?=\s*[,}]|\s*\.\.\.)/g;
  newContent = newContent.replace(
    destructurePattern,
    (match, _wa, eventName) => {
      transformations.push(`Destructure: onWa${eventName} -> on${eventName}`);
      return `on${eventName}`;
    }
  );

  // Pattern 4: Handler functions - const handleWaShow = (e: Event) => ...
  const handlerPattern = /\bhandle(Wa)([A-Z][a-zA-Z]*)\b/g;
  newContent = newContent.replace(handlerPattern, (match, _wa, eventName) => {
    transformations.push(`Handler: handleWa${eventName} -> handle${eventName}`);
    return `handle${eventName}`;
  });

  // Pattern 5: Callback calls - if (onWaShow) onWaShow(e as CustomEvent);
  const callbackCallPattern =
    /\bif\s*\(\s*on(Wa)([A-Z][a-zA-Z]*)\s*\)\s*on\1\2\b/g;
  newContent = newContent.replace(
    callbackCallPattern,
    (match, _wa, eventName) => {
      transformations.push(`Callback: onWa${eventName} -> on${eventName}`);
      return `if (on${eventName}) on${eventName}`;
    }
  );

  // Pattern 6: useEffect dependencies - [onWaShow, onWaAfterShow, ...]
  // This is handled by patterns 3 and 5 already, but let's ensure it
  // Match remaining onWa* in array contexts
  const depsPattern = /\[([^\]]*?)\bon(Wa)([A-Z][a-zA-Z]*)\b([^\]]*?)\]/g;
  newContent = newContent.replace(
    depsPattern,
    (match, before, _wa, eventName, after) => {
      transformations.push(`Dependency: onWa${eventName} -> on${eventName}`);
      return `[${before}on${eventName}${after}]`;
    }
  );

  // Pattern 7: JSDoc comments - @example with onWaShow
  const jsdocPattern = /on(Wa)([A-Z][a-zA-Z]*)=\{/g;
  newContent = newContent.replace(jsdocPattern, (match, _wa, eventName) => {
    transformations.push(`JSDoc example: onWa${eventName} -> on${eventName}`);
    return `on${eventName}={`;
  });

  // Remove duplicate transformations
  const uniqueTransformations = [...new Set(transformations)];

  return { content: newContent, transformations: uniqueTransformations };
}

/**
 * Transform Vue template event names from wa-* to simplified
 *
 * Transforms:
 * - defineEmits types: 'wa-show' -> 'show'
 * - emit calls: emit('wa-show', ...) -> emit('show', ...)
 * - Handler names: handleWaShow -> handleShow
 *
 * Does NOT transform:
 * - DOM events: el.addEventListener('wa-show', ...) - unchanged
 */
function transformVueFile(content: string): {
  content: string;
  transformations: string[];
} {
  const transformations: string[] = [];
  let newContent = content;

  // Pattern 1: defineEmits type - 'wa-show': [event: CustomEvent];
  const emitTypePattern = /'wa-([a-z-]+)':\s*\[event:\s*CustomEvent\]/g;
  newContent = newContent.replace(emitTypePattern, (match, eventName) => {
    transformations.push(`Emit type: 'wa-${eventName}' -> '${eventName}'`);
    return `'${eventName}': [event: CustomEvent]`;
  });

  // Pattern 2: defineEmits array (JS) - defineEmits(['wa-show', 'wa-hide', ...])
  // Match the entire defineEmits call and transform event names within it
  const emitArrayPattern = /defineEmits\(\[([^\]]+)\]\)/g;
  newContent = newContent.replace(emitArrayPattern, (match, events) => {
    const transformed = events.replace(
      /'wa-([a-z-]+)'/g,
      (_m: string, eventName: string) => {
        transformations.push(`Emit array: 'wa-${eventName}' -> '${eventName}'`);
        return `'${eventName}'`;
      }
    );
    return `defineEmits([${transformed}])`;
  });

  // Pattern 3: emit calls - emit('wa-show', e as CustomEvent)
  const emitCallPattern = /emit\('wa-([a-z-]+)',/g;
  newContent = newContent.replace(emitCallPattern, (match, eventName) => {
    transformations.push(
      `Emit call: emit('wa-${eventName}', ...) -> emit('${eventName}', ...)`
    );
    return `emit('${eventName}',`;
  });

  // Pattern 3: Handler function names - const handleWaShow = ...
  const handlerPattern = /\bhandle(Wa)([A-Z][a-zA-Z]*)\b/g;
  newContent = newContent.replace(handlerPattern, (match, _wa, eventName) => {
    transformations.push(`Handler: handleWa${eventName} -> handle${eventName}`);
    return `handle${eventName}`;
  });

  // Remove duplicate transformations
  const uniqueTransformations = [...new Set(transformations)];

  return { content: newContent, transformations: uniqueTransformations };
}

async function transformFile(
  filePath: string,
  isVue: boolean
): Promise<TransformResult> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { content: newContent, transformations } = isVue
    ? transformVueFile(content)
    : transformReactFile(content);

  const changed = content !== newContent;

  if (changed) {
    await fs.writeFile(filePath, newContent, 'utf-8');
  }

  return {
    file: filePath,
    changed,
    transformations,
  };
}

async function main() {
  console.log('Event Name Transformation Script');
  console.log('=================================\n');

  const results: TransformResult[] = [];

  // Transform React TSX templates
  console.log('Processing React TSX templates...');
  const reactTsxFiles = await findFiles(
    'templates/react',
    /\.tsx\.hbs$/,
    /\.test\.tsx\.hbs$/
  );

  for (const file of reactTsxFiles) {
    const result = await transformFile(file, false);
    results.push(result);
    if (result.changed) {
      console.log(`  ✓ ${file}`);
      for (const t of result.transformations.slice(0, 5)) {
        console.log(`    - ${t}`);
      }
      if (result.transformations.length > 5) {
        console.log(`    ... and ${result.transformations.length - 5} more`);
      }
    }
  }

  // Transform React JSX templates
  console.log('\nProcessing React JSX templates...');
  const reactJsxFiles = await findFiles(
    'templates/react',
    /\.jsx\.hbs$/,
    /\.test\.jsx\.hbs$/
  );

  for (const file of reactJsxFiles) {
    const result = await transformFile(file, false);
    results.push(result);
    if (result.changed) {
      console.log(`  ✓ ${file}`);
      for (const t of result.transformations.slice(0, 5)) {
        console.log(`    - ${t}`);
      }
      if (result.transformations.length > 5) {
        console.log(`    ... and ${result.transformations.length - 5} more`);
      }
    }
  }

  // Transform Vue TypeScript templates
  console.log('\nProcessing Vue TypeScript templates...');
  const vueTsFiles = await findFiles(
    'templates/vue',
    /\.vue\.hbs$/,
    /\.js\.vue\.hbs$/
  );

  for (const file of vueTsFiles) {
    const result = await transformFile(file, true);
    results.push(result);
    if (result.changed) {
      console.log(`  ✓ ${file}`);
      for (const t of result.transformations.slice(0, 5)) {
        console.log(`    - ${t}`);
      }
      if (result.transformations.length > 5) {
        console.log(`    ... and ${result.transformations.length - 5} more`);
      }
    }
  }

  // Transform Vue JavaScript templates
  console.log('\nProcessing Vue JavaScript templates...');
  const vueJsFiles = await findFiles('templates/vue', /\.js\.vue\.hbs$/);

  for (const file of vueJsFiles) {
    const result = await transformFile(file, true);
    results.push(result);
    if (result.changed) {
      console.log(`  ✓ ${file}`);
      for (const t of result.transformations.slice(0, 5)) {
        console.log(`    - ${t}`);
      }
      if (result.transformations.length > 5) {
        console.log(`    ... and ${result.transformations.length - 5} more`);
      }
    }
  }

  // Summary
  console.log('\n=================================');
  console.log('Summary');
  console.log('=================================');
  const changedFiles = results.filter((r) => r.changed);
  console.log(`Total files processed: ${results.length}`);
  console.log(`Files changed: ${changedFiles.length}`);

  if (changedFiles.length > 0) {
    console.log('\nChanged files:');
    for (const r of changedFiles) {
      console.log(
        `  - ${r.file} (${r.transformations.length} transformations)`
      );
    }
  }

  // Output detailed results
  await fs.writeJSON('transform-results.json', results, { spaces: 2 });
  console.log('\nDetailed results written to transform-results.json');
}

main().catch(console.error);
