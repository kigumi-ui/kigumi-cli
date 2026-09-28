/**
 * Shared helpers for template generators.
 *
 * Both generate-react-templates.ts and generate-vue-templates.ts call into
 * extractCustomTypeImports / formatCustomTypeImports to decide which
 * non-primitive parameter types need an `import type` line. Sibling `Wa*`
 * element types (WaCarouselItem) default-import from their own module;
 * other names named-import from the component's importPath.
 */

import { CSS_METADATA } from './css-metadata.js';
import { toKebabCase } from '../src/utils/naming.js';
import type { ComponentProp } from '../src/utils/registry/types.js';

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

/**
 * `WaCarouselItem` is a default export from `carousel-item.js`, not a named
 * export of `carousel.js`. Types that match `Wa` + a component PascalCase
 * name are imported from that sibling module; everything else stays a named
 * import from the component's own `importPath` (e.g. `ToastCreateOptions`).
 */
export function formatCustomTypeImports(
  methods: { parameters?: Array<{ name: string; type: string }> }[],
  selfImportPath: string
): string {
  const siblingLines: string[] = [];
  const namedFromSelf: string[] = [];

  for (const typeName of extractCustomTypeImports(methods)) {
    const kebab = waElementTypeToKebab(typeName);
    if (kebab) {
      siblingLines.push(
        `import type ${typeName} from '@awesome.me/webawesome/dist/components/${kebab}/${kebab}.js';\n`
      );
    } else {
      namedFromSelf.push(typeName);
    }
  }

  let source = siblingLines.join('');
  if (namedFromSelf.length > 0) {
    source += `import type { ${namedFromSelf.join(', ')} } from '${selfImportPath}';\n`;
  }
  return source;
}

function waElementTypeToKebab(typeName: string): string | null {
  if (!/^Wa[A-Z]/.test(typeName)) return null;
  return toKebabCase(typeName.slice(2));
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
 * The `import type` lines a Template needs for its events' handler types.
 *
 * The type itself is already resolved in the metadata (`eventType`), by
 * `scripts/event-types.ts`, so all three generators read one answer and none
 * of them decides a type. Framework-specific naming (`onBlur`, `blurEvent`)
 * is a separate concern and stays in each generator.
 *
 * Native events carry no `eventTypeModule`: their types (`FocusEvent`,
 * `Event`) are DOM globals. Each Web Awesome class is imported from its own
 * file, because the `dist/events/events.js` barrel omits some of them (the
 * accordion's). Paths name the free package; the CLI swaps them for Pro.
 *
 * See docs/adr/0005-event-types-come-from-web-awesome-event-classes.md.
 */
export function formatEventTypeImports(
  events: ReadonlyArray<{ eventType: string; eventTypeModule?: string }>
): string {
  const byModule = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.eventTypeModule) continue;
    const types = byModule.get(event.eventTypeModule) ?? new Set<string>();
    types.add(event.eventType);
    byModule.set(event.eventTypeModule, types);
  }
  return [...byModule]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([module, types]) =>
        `import type { ${[...types].sort().join(', ')} } from '@awesome.me/webawesome/dist/events/${module}.js';\n`
    )
    .join('');
}

/**
 * The expression a generated listener passes on to the consumer's handler.
 * Every listener receives `e: Event`, so a handler typed `Event` gets `e`
 * as-is and any narrower type gets `e as <Type>`: a cast to `Event` would
 * assert nothing, and the ESLint setup is not type-aware enough to flag it.
 */
export function handlerArgument(eventType: string): string {
  return eventType === 'Event' ? 'e' : `e as ${eventType}`;
}

/**
 * Emit a component's CSS template.
 *
 * The header comment (documentation link, custom properties, CSS parts) is
 * identical across all three frameworks. Only the selector block genuinely
 * differs: Angular scopes styles to the host element and sets
 * `display: contents` so the wrapper does not introduce a box, while React and
 * Vue scope to a class named after the component and leave the body empty.
 *
 * This lived three times over. The Angular copy had drifted: it hardcoded the
 * documentation URL rather than reading `docsUrl` from the metadata, so a
 * component needing a non-standard link was silently given the derived one.
 * See issue #30.
 */
export function generateCssTemplate(
  componentName: string,
  options: { selector: string; body: string }
): string {
  const kebabName = toKebabCase(componentName);
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
      const suffix = prop.default ? ` (default: ${prop.default})` : '';
      content += ` * - ${prop.name}: ${prop.description}${suffix}\n`;
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

  content += ` */\n${options.selector} {\n${options.body}\n}\n`;

  return content;
}

/**
 * The attribute values an enumerated boolean is written as: `spellcheck` is
 * `{ true: 'true', false: 'false' }`, `autocorrect` `{ true: 'on', false: 'off' }`.
 */
export type KeywordPair = NonNullable<ComponentProp['keywords']>;

/** A registry prop Web Awesome reads by keyword, with its pair narrowed. */
export interface EnumeratedProp {
  name: string;
  keywords: KeywordPair;
}

/**
 * The props of a component Web Awesome reads as enumerated attributes rather
 * than by presence (templates/AGENTS.md rule 11), in registry order.
 *
 * All three generators write these, each in its framework's own way (an
 * Angular binding, a Vue `hostAttributes()` branch, a React effect). What they
 * share lives here: which props qualify, and how a pair and the pick between
 * its two keywords are spelled. Every Template spells a pair with the
 * registry's named shape, never as a positional `[on, off]` tuple, so a
 * transposed pair cannot compile into the wrong keyword.
 */
export function enumeratedProps(
  props: readonly ComponentProp[]
): EnumeratedProp[] {
  return props.flatMap(({ name, keywords }) =>
    keywords ? [{ name, keywords }] : []
  );
}

/** A pair as the object literal Templates emit: `{ true: 'on', false: 'off' }`. */
export function keywordPairLiteral(keywords: KeywordPair): string {
  return `{ true: '${keywords.true}', false: '${keywords.false}' }`;
}

/**
 * The expression that picks a pair's keyword for the boolean expression
 * `value`: `autocorrect ? 'on' : 'off'`.
 */
export function keywordExpression(
  value: string,
  keywords: KeywordPair
): string {
  return `${value} ? '${keywords.true}' : '${keywords.false}'`;
}

/**
 * The JSDoc lines a Template writes above one prop declaration, at `indent`
 * (issue #129). Without a deprecation this is the one-line
 * `/** description *\/` the React and Angular generators already wrote,
 * unchanged; a prop whose registry entry is `deprecated` gets a block ending
 * in a `@deprecated <message>` tag, which is what makes a consumer's editor
 * strike the prop through.
 *
 * `describe: false` is for a Template that does not document its props
 * (Vue): the description is left out, so an undeprecated prop gets no
 * comment and a deprecated one a tag-only `/** @deprecated ... *\/` line.
 *
 * Throws on a `*\/` in either text: it would close the comment early and
 * leave the rest of the message as code.
 */
export function propJsdocLines(
  prop: Pick<ComponentProp, 'description' | 'deprecated'>,
  indent: string,
  { describe = true }: { describe?: boolean } = {}
): string[] {
  const description = describe ? prop.description : undefined;
  const { deprecated } = prop;
  for (const text of [description, deprecated]) {
    if (text?.includes('*/')) {
      throw new Error(`Prop JSDoc text cannot contain "*/": ${text}`);
    }
  }
  if (!deprecated) {
    return description ? [`${indent}/** ${description} */`] : [];
  }
  if (!description) return [`${indent}/** @deprecated ${deprecated} */`];
  return [
    `${indent}/**`,
    `${indent} * ${description}`,
    `${indent} *`,
    `${indent} * @deprecated ${deprecated}`,
    `${indent} */`,
  ];
}
