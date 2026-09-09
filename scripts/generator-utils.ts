/**
 * Shared helpers for template generators.
 *
 * Both generate-react-templates.ts and generate-vue-templates.ts call into
 * extractCustomTypeImports to decide which non-primitive parameter types
 * need a `import type { ... }` line in the emitted template. Keeping this
 * single-source means a new Pro DOM-like type used as a parameter is
 * picked up by both generators consistently.
 */

export const DOM_GLOBALS = new Set([
  // Element / event types
  'HTMLElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'InputEvent',
  'PointerEvent',
  'TouchEvent',
  'WheelEvent',
  'AddEventListenerOptions',
  'EventListenerOptions',
  // DOM observers / scrolling
  'ResizeObserverEntry',
  'IntersectionObserverEntry',
  'MutationRecord',
  'FocusOptions',
  'ScrollBehavior',
  'ScrollIntoViewOptions',
  // Web APIs
  'File',
  'FileList',
  'FormData',
  'Blob',
  'URL',
  'URLSearchParams',
  'Headers',
  'Request',
  'Response',
  'ReadableStream',
  'WritableStream',
  'AbortController',
  'AbortSignal',
  // JS built-ins
  'Array',
  'Object',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Date',
  'Promise',
  'Error',
  'RegExp',
  'Symbol',
  'Number',
  'String',
  'Boolean',
]);

export function extractCustomTypeImports(
  methods: { parameters?: Array<{ name: string; type: string }> }[]
): string[] {
  const found = new Set<string>();
  for (const m of methods) {
    for (const p of m.parameters ?? []) {
      const matches = p.type.match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [];
      for (const id of matches) {
        if (!DOM_GLOBALS.has(id)) found.add(id);
      }
    }
  }
  return [...found].sort();
}

import fs from 'fs-extra';
import prettier from 'prettier';

/**
 * Format generator output with prettier before writing.
 *
 * The template generators emit raw concatenated strings. The lint-staged
 * pre-commit hook reformats `.ts` / `.tsx` / `.vue` / `.css` files via
 * `prettier --write`, but only on staged files at commit time. Formatting
 * inside the generator keeps `pnpm generate:*` output identical to what
 * lint-staged would produce, so generators can be re-run without showing
 * whitespace-only diffs and downstream snapshot fixtures stay stable.
 *
 * Resolves prettier config via `prettier.resolveConfig(filePath)` so a
 * future `.prettierrc.json` is honored without changes here. Defaults
 * to no config (prettier defaults) when none is found, matching the
 * current repo state.
 */
export async function formatWithPrettier(
  filePath: string,
  content: string
): Promise<string> {
  const config = (await prettier.resolveConfig(filePath)) ?? {};
  return prettier.format(content, { ...config, filepath: filePath });
}

/**
 * Convenience wrapper combining `formatWithPrettier` with `fs.writeFile`.
 * Use everywhere a generator currently calls `fs.writeFile(path, content)`.
 */
export async function writeFormatted(
  filePath: string,
  content: string
): Promise<void> {
  const formatted = await formatWithPrettier(filePath, content);
  await fs.writeFile(filePath, formatted);
}

/**
 * Native DOM events that Web Awesome components fire, mapped to the interface
 * the DOM actually defines for them.
 *
 * Keyed on the event's real `name` (`blur`), never on Web Awesome's
 * `eventName` (`BlurEvent`). The latter is a pascal-cased naming convention
 * from the manifest, and for native events it names no real type: there is no
 * `BlurEvent` interface, blur events are `FocusEvent`. Deriving a type by
 * pattern-matching that string is what let the three generators drift apart.
 *
 * See docs/adr/0001-event-types-are-never-inferred-from-names.md.
 */
const NATIVE_EVENT_TYPES: Record<string, string> = {
  blur: 'FocusEvent',
  focus: 'FocusEvent',
  change: 'Event',
  input: 'InputEvent',
  beforeinput: 'InputEvent',
  load: 'Event',
  error: 'Event',
};

/**
 * The TypeScript type a handler receives for a given event.
 *
 * Two rules, and every event falls under exactly one:
 *   - A native DOM event takes its own DOM interface.
 *   - A Web Awesome custom event (always `wa-`-prefixed) is a `CustomEvent`.
 *
 * The result depends only on the event, never on the framework, so all three
 * generators call this. Framework-specific naming (`onBlur`, `blurEvent`) is a
 * separate concern and stays in each generator.
 *
 * @param eventName The event's DOM name, e.g. `blur` or `wa-show`.
 */
export function mapEventType(eventName: string): string {
  if (eventName.startsWith('wa-')) return 'CustomEvent';
  return NATIVE_EVENT_TYPES[eventName] ?? 'CustomEvent';
}
