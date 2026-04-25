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
