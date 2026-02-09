#!/usr/bin/env tsx
/**
 * React Template Auto-Fixer
 *
 * Automatically fixes incomplete React templates by adding missing:
 * - Events to Props interface
 * - Methods to Ref interface
 * - Event listeners in useEffect
 * - Method implementations in useImperativeHandle
 *
 * Uses component-metadata.ts as the source of truth.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { COMPONENT_METADATA } from '../src/utils/component-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const REACT_TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'react');

/**
 * Convert event name to React prop name
 * e.g., 'wa-show' → 'onWaShow', 'blur' → 'onBlur'
 */
function toReactEventName(eventName: string): string {
  const parts = eventName.split('-');
  const camelCase = parts
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join('');
  return 'on' + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Map event type from metadata to TypeScript type
 */
function mapEventType(eventType: string): string {
  if (eventType === 'FocusEvent') return 'FocusEvent';
  if (eventType === 'Event') return 'Event';
  if (eventType === 'MouseEvent') return 'MouseEvent';
  if (eventType === 'KeyboardEvent') return 'KeyboardEvent';
  // All wa-* custom events are CustomEvent
  return 'CustomEvent';
}

/**
 * Fix a single React component template
 */
async function fixReactTemplate(componentName: string): Promise<boolean> {
  const componentKey = componentName
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  const metadata = COMPONENT_METADATA[componentKey];

  if (!metadata) {
    return false; // No metadata, skip
  }

  const templatePath = path.join(
    REACT_TEMPLATES_DIR,
    componentName,
    `${componentName}.tsx.hbs`
  );

  if (!(await fs.pathExists(templatePath))) {
    return false; // Template doesn't exist, skip
  }

  let content = await fs.readFile(templatePath, 'utf-8');
  const originalContent = content;

  // 1. Fix Props interface - add missing event handlers
  const propsInterfaceMatch = content.match(
    /export interface (\w+)Props[^{]*\{([^}]+)\}/s
  );
  if (propsInterfaceMatch && metadata.events.length > 0) {
    const [fullMatch, , propsBody] = propsInterfaceMatch;

    // Build list of event props to add
    const eventPropsToAdd: string[] = [];
    for (const event of metadata.events) {
      const reactEventName = toReactEventName(event.name);
      const eventType = mapEventType(event.eventType);

      // Check if this event is already in the props
      const eventPattern = new RegExp(`${reactEventName}\\s*\\?\\s*:\\s*\\(`);
      if (!eventPattern.test(propsBody)) {
        eventPropsToAdd.push(
          `  /** ${event.description || `Event: ${event.name}`} */\n  ${reactEventName}?: (event: ${eventType}) => void;`
        );
      }
    }

    if (eventPropsToAdd.length > 0) {
      // Find the closing brace of the interface and insert before it
      const closingBraceIndex = content.indexOf(
        '}',
        propsInterfaceMatch.index + fullMatch.length - 1
      );
      if (closingBraceIndex !== -1) {
        content =
          content.slice(0, closingBraceIndex) +
          eventPropsToAdd.join('\n') +
          '\n' +
          content.slice(closingBraceIndex);
      }
    }
  }

  // 2. Fix Ref interface - add missing methods
  const refInterfaceMatch = content.match(
    /export interface (\w+)Ref[^{]*\{([^}]+)\}/s
  );
  if (refInterfaceMatch && metadata.methods.length > 0) {
    const [fullMatch, , refBody] = refInterfaceMatch;

    // Build list of methods to add
    const methodsToAdd: string[] = [];
    for (const method of metadata.methods) {
      const methodName = method.name;

      // Check if this method is already in the ref
      const methodPattern = new RegExp(`\\b${methodName}\\s*[:,(]`);
      if (!methodPattern.test(refBody)) {
        if (method.parameters && method.parameters.length > 0) {
          const params = method.parameters
            .map((p) => `${p.name}: ${p.type}`)
            .join(', ');
          methodsToAdd.push(`  ${methodName}: (${params}) => void;`);
        } else {
          methodsToAdd.push(`  ${methodName}: () => void;`);
        }
      }
    }

    if (methodsToAdd.length > 0) {
      // Find the closing brace of the interface and insert before it
      const closingBraceIndex = content.indexOf(
        '}',
        refInterfaceMatch.index + fullMatch.length - 1
      );
      if (closingBraceIndex !== -1) {
        content =
          content.slice(0, closingBraceIndex) +
          methodsToAdd.join('\n') +
          '\n' +
          content.slice(closingBraceIndex);
      }
    }
  }

  // 3. Fix forwardRef destructuring - add missing event props
  const forwardRefMatch = content.match(
    /forwardRef<[^>]+>\s*\(\s*\(\s*\{([^}]+)\}/s
  );
  if (forwardRefMatch && metadata.events.length > 0) {
    const [, destructuredProps] = forwardRefMatch;

    const propsToAdd: string[] = [];
    for (const event of metadata.events) {
      const reactEventName = toReactEventName(event.name);
      if (!destructuredProps.includes(reactEventName)) {
        propsToAdd.push(reactEventName);
      }
    }

    if (propsToAdd.length > 0) {
      // Add props before ...props
      const propsPattern = /(\{[^}]+)(,\s*\.\.\.props)/s;
      content = content.replace(propsPattern, (match, before, after) => {
        return before + ', ' + propsToAdd.join(', ') + after;
      });
    }
  }

  // 4. Fix useRef type - add missing method types
  const useRefMatch = content.match(
    /const\s+\w+Ref\s*=\s*useRef<HTMLElement\s*&\s*\{([^}]+)\}>/s
  );
  if (useRefMatch && metadata.methods.length > 0) {
    const [, refTypes] = useRefMatch;

    const typesToAdd: string[] = [];
    for (const method of metadata.methods) {
      const methodName = method.name;
      const methodPattern = new RegExp(`\\b${methodName}\\s*\\?\\s*:`);
      if (!methodPattern.test(refTypes)) {
        if (method.parameters && method.parameters.length > 0) {
          const params = method.parameters
            .map((p) => `${p.name}: ${p.type}`)
            .join(', ');
          typesToAdd.push(`      ${methodName}?: (${params}) => void;`);
        } else {
          typesToAdd.push(`      ${methodName}?: () => void;`);
        }
      }
    }

    if (typesToAdd.length > 0) {
      const closingBraceIndex = content.indexOf('}>', useRefMatch.index);
      if (closingBraceIndex !== -1) {
        content =
          content.slice(0, closingBraceIndex) +
          '\n' +
          typesToAdd.join('\n') +
          '\n    ' +
          content.slice(closingBraceIndex);
      }
    }
  }

  // 5. Fix useImperativeHandle - add missing method implementations
  const imperativeHandleMatch = content.match(
    /useImperativeHandle\s*\([^,]+,\s*\(\)\s*=>\s*\(\{([^}]+?get element[^}]+)\}\),/s
  );
  if (imperativeHandleMatch && metadata.methods.length > 0) {
    const [fullMatch, handleBody] = imperativeHandleMatch;

    const methodsToAdd: string[] = [];
    for (const method of metadata.methods) {
      const methodName = method.name;
      const methodPattern = new RegExp(`\\b${methodName}\\s*:`);
      if (!methodPattern.test(handleBody)) {
        if (method.parameters && method.parameters.length > 0) {
          const params = method.parameters.map((p) => p.name).join(', ');
          const paramsDef = method.parameters
            .map((p) => `${p.name}: ${p.type}`)
            .join(', ');
          methodsToAdd.push(`        ${methodName}: (${paramsDef}) => {
          if (${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Ref.current && typeof ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Ref.current.${methodName} === 'function') {
            ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Ref.current.${methodName}(${params});
          }
        },`);
        } else {
          methodsToAdd.push(`        ${methodName}: () => {
          if (${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Ref.current && typeof ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Ref.current.${methodName} === 'function') {
            ${componentName.charAt(0).toLowerCase() + componentName.slice(1)}Ref.current.${methodName}();
          }
        },`);
        }
      }
    }

    if (methodsToAdd.length > 0) {
      // Insert before "get element"
      const getElementIndex = handleBody.indexOf('get element');
      if (getElementIndex !== -1) {
        const insertIndex =
          imperativeHandleMatch.index +
          fullMatch.indexOf(handleBody) +
          getElementIndex;
        content =
          content.slice(0, insertIndex) +
          methodsToAdd.join('\n') +
          '\n' +
          content.slice(insertIndex);
      }
    }
  }

  // 6. Fix useEffect - add missing event listeners
  const useEffectMatch = content.match(
    /useEffect\(\(\)\s*=>\s*\{[^}]*const el = \w+Ref\.current;[^}]*if \(!el\) return;([^}]*?)return \(\) => \{([^}]*?)\};[^}]*\},\s*\[([^\]]+)\]\);/s
  );
  if (useEffectMatch && metadata.events.length > 0) {
    const [fullMatch, listenersBody, , deps] = useEffectMatch;

    const listenersToAdd: string[] = [];
    const cleanupToAdd: string[] = [];
    const depsToAdd: string[] = [];

    for (const event of metadata.events) {
      const reactEventName = toReactEventName(event.name);
      const handlerName = 'handle' + reactEventName.slice(2); // remove 'on' prefix
      const eventType = mapEventType(event.eventType);

      // Check if listener already exists
      if (!listenersBody.includes(`addEventListener('${event.name}'`)) {
        listenersToAdd.push(`
      const ${handlerName} = (e: Event) => {
        if (${reactEventName}) ${reactEventName}(e as ${eventType});
      };
`);
        listenersToAdd.push(
          `      el.addEventListener('${event.name}', ${handlerName});`
        );
        cleanupToAdd.push(
          `        el.removeEventListener('${event.name}', ${handlerName});`
        );

        if (!deps.includes(reactEventName)) {
          depsToAdd.push(reactEventName);
        }
      }
    }

    if (listenersToAdd.length > 0) {
      // Find insertion points
      const returnIndex = fullMatch.indexOf('return () => {');
      const cleanupEndIndex = fullMatch.indexOf('};', returnIndex) + 2;
      const depsStartIndex = fullMatch.indexOf('[', cleanupEndIndex);
      const depsEndIndex = fullMatch.indexOf(']', depsStartIndex);

      // Insert listeners before return
      let newContent = fullMatch.slice(0, returnIndex);
      newContent += listenersToAdd.join('\n') + '\n\n      ';
      newContent += fullMatch.slice(returnIndex, cleanupEndIndex - 2);
      newContent += cleanupToAdd.join('\n') + '\n      ';
      newContent += fullMatch.slice(cleanupEndIndex - 2, depsEndIndex);

      // Add dependencies
      if (depsToAdd.length > 0) {
        newContent += ', ' + depsToAdd.join(', ');
      }

      newContent += fullMatch.slice(depsEndIndex);

      content = content.replace(fullMatch, newContent);
    }
  }

  // Only write if content changed
  if (content !== originalContent) {
    await fs.writeFile(templatePath, content);
    console.log(`  ✓ Fixed ${componentName}`);
    return true;
  }

  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Auto-fixing incomplete React templates...\n');

  // Get all component directories
  const componentDirs = await fs.readdir(REACT_TEMPLATES_DIR);
  let fixedCount = 0;
  let skippedCount = 0;

  for (const dir of componentDirs) {
    const stat = await fs.stat(path.join(REACT_TEMPLATES_DIR, dir));
    if (stat.isDirectory()) {
      const fixed = await fixReactTemplate(dir);
      if (fixed) {
        fixedCount++;
      } else {
        skippedCount++;
      }
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} templates, skipped ${skippedCount}`);
  console.log('\n💡 Run verify-react-templates.ts to check results');
}

main().catch(console.error);
