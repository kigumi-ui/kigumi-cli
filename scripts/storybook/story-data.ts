/**
 * Story Data Pipeline
 *
 * Merges component registry (props) + component metadata (events, slots, methods)
 * into a unified data structure for Storybook story generation and validation.
 *
 * Usage: Import buildAllStoryData() or buildStoryData() in other storybook scripts.
 */

import ts from 'typescript';
import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import type { ComponentProp } from '../../src/utils/registry/types.js';
import type { ComponentMetadata } from '../../src/utils/component-metadata.js';
import { STORY_OVERRIDES } from './overrides.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoryArgType {
  control?: string | { type: string } | false;
  options?: string[];
  description?: string;
  action?: string;
  table?: {
    disable?: boolean;
    defaultValue?: { summary: string };
    category?: string;
  };
}

export interface StoryData {
  /** PascalCase component name, e.g. "Button" */
  componentName: string;
  /** kebab-case registry key, e.g. "button" */
  componentKey: string;
  /** Storybook title, e.g. "Components/Button" */
  title: string;
  /** JSDoc description from registry */
  description: string;
  /** Merged argTypes from registry props + metadata events/slots/methods */
  argTypes: Record<string, StoryArgType>;
  /** Default args (fn() for events, custom overrides for children etc.) */
  args: Record<string, string>;
  /** List of event prop names that need fn() in args */
  eventPropNames: string[];
}

// ─── Event Name Helpers ──────────────────────────────────────────────────────

/**
 * Simplify React event names by stripping the onWa prefix.
 * e.g. onWaShow → onShow, onWaAfterHide → onAfterHide
 * Native events (onBlur, onChange) pass through unchanged.
 */
export function simplifyReactEventName(reactName: string): string {
  if (
    reactName.startsWith('onWa') &&
    reactName.length > 4 &&
    reactName[4] === reactName[4].toUpperCase()
  ) {
    return 'on' + reactName.slice(4);
  }
  return reactName;
}

/**
 * Derive a Storybook action name from a simplified React event name.
 * onShow → 'show', onAfterHide → 'after-hide', onBlur → 'blur'
 */
export function eventNameToAction(simplifiedName: string): string {
  const withoutOn = simplifiedName.replace(/^on/, '');
  return withoutOn
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

// ─── Control Mapping ─────────────────────────────────────────────────────────

function propToArgType(prop: ComponentProp): StoryArgType {
  const argType: StoryArgType = {};

  if (prop.type === 'boolean') {
    argType.control = 'boolean';
  } else if (prop.type === 'number') {
    argType.control = 'number';
  } else if (prop.values && prop.values.length > 0) {
    argType.control = 'select';
    argType.options = [...prop.values];
  } else {
    argType.control = 'text';
  }

  if (prop.description) {
    argType.description = prop.description;
  }

  if (
    prop.default !== undefined &&
    prop.default !== '' &&
    prop.default !== "''"
  ) {
    argType.table = { defaultValue: { summary: prop.default } };
  }

  return argType;
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export function buildStoryData(componentKey: string): StoryData | null {
  const definition = LOCAL_REGISTRY[componentKey];
  if (!definition) return null;

  const metadata: ComponentMetadata | undefined =
    COMPONENT_METADATA[componentKey];
  const overrides = STORY_OVERRIDES[componentKey];

  const argTypes: Record<string, StoryArgType> = {};
  const args: Record<string, string> = {};
  const eventPropNames: string[] = [];

  // 1. Props from registry
  for (const prop of definition.props) {
    argTypes[prop.name] = propToArgType(prop);

    // Required props need default args to satisfy Meta<typeof X>
    if (prop.required) {
      const defaultVal =
        prop.default && prop.default !== "''"
          ? prop.default
          : prop.type === 'boolean'
            ? 'false'
            : '';
      if (defaultVal) {
        args[prop.name] = `'${defaultVal}'`;
      }
    }
  }

  // 2. Events from metadata
  if (metadata?.events) {
    for (const event of metadata.events) {
      const reactName =
        event.reactName ||
        `on${event.name.charAt(0).toUpperCase()}${event.name.slice(1)}`;
      const simplified = simplifyReactEventName(reactName);
      const action = eventNameToAction(simplified);

      argTypes[simplified] = {
        action,
        description: event.description,
        table: { category: 'Events' },
      };

      eventPropNames.push(simplified);
      args[simplified] = 'fn()';
    }
  }

  // Note: Slots and Methods are NOT added as argTypes because Storybook's
  // Meta<typeof X> type only accepts known prop names. Slot/method documentation
  // is handled by Storybook's autodocs via the component's TypeScript types.

  // 5. Apply overrides
  if (overrides) {
    // Excluded props (completely removed — not valid on the React component type)
    if (overrides.excludedProps) {
      for (const prop of overrides.excludedProps) {
        delete argTypes[prop];
        delete args[prop];
      }
    }

    // Hidden props
    if (overrides.hiddenProps) {
      for (const prop of overrides.hiddenProps) {
        if (argTypes[prop]) {
          argTypes[prop].table = { ...argTypes[prop].table, disable: true };
        } else {
          argTypes[prop] = { table: { disable: true } };
        }
      }
    }

    // Children default
    if (overrides.childrenDefault) {
      args['children'] = `'${overrides.childrenDefault}'`;
      argTypes['children'] = { control: 'text' };
    }

    // Extra argTypes
    if (overrides.extraArgTypes) {
      for (const [key, value] of Object.entries(overrides.extraArgTypes)) {
        argTypes[key] = value;
      }
    }

    // Extra args
    if (overrides.extraArgs) {
      for (const [key, value] of Object.entries(overrides.extraArgs)) {
        args[key] = value;
      }
    }
  }

  // Build title: use override or derive from component name
  const title = overrides?.title || `Components/${definition.name}`;

  return {
    componentName: definition.name,
    componentKey,
    title,
    description: definition.description,
    argTypes,
    args,
    eventPropNames,
  };
}

export function buildAllStoryData(): Map<string, StoryData> {
  const result = new Map<string, StoryData>();

  for (const key of Object.keys(LOCAL_REGISTRY)) {
    const data = buildStoryData(key);
    if (data) {
      result.set(key, data);
    }
  }

  return result;
}

// ─── Story default summaries ─────────────────────────────────────────────────

/**
 * What a story file's `meta.argTypes` states about one argType's default.
 * `unreadable` is a state of its own, never folded into `missing` or
 * `no-summary`: an argType whose summary cannot be read statically has not
 * been checked (docs/adr/0003).
 */
export type ArgTypeDefault =
  | { kind: 'summary'; summary: string }
  | { kind: 'no-summary' }
  | { kind: 'missing' }
  | { kind: 'unreadable'; reason: string };

/** Parse a story file once, for any number of `argTypeDefaultSummary` reads. */
export function parseStory(source: string): ts.SourceFile {
  return ts.createSourceFile(
    'story.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
}

/** `x satisfies T`, `x as T` and `(x)`, looked through to `x`. */
function unwrap(node: ts.Expression): ts.Expression {
  let value = node;
  while (
    ts.isSatisfiesExpression(value) ||
    ts.isAsExpression(value) ||
    ts.isParenthesizedExpression(value)
  ) {
    value = value.expression;
  }
  return value;
}

/** `where` extended by `key`, as a reader would write the member access. */
function member(where: string, key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${where}.${key}`
    : `${where}[${JSON.stringify(key)}]`;
}

/** A property's name when it is fixed in the source, else `undefined`. */
function staticName(name: ts.PropertyName): string | undefined {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteralLike(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  if (
    ts.isComputedPropertyName(name) &&
    ts.isStringLiteralLike(name.expression)
  ) {
    return name.expression.text;
  }
  return undefined;
}

/**
 * The value `object` gives `key`, decided like the runtime does, by the last
 * property that can set it: `undefined` when none does, and the reason as a
 * string when a spread, a computed key, a shorthand or an accessor may set
 * it, since its value is then not in the literal.
 */
function propertyValue(
  object: ts.ObjectLiteralExpression,
  key: string,
  where: string
): ts.Expression | string | undefined {
  let value: ts.Expression | string | undefined;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      value = `\`${where}\` spreads another object`;
      continue;
    }
    const name = staticName(property.name);
    if (name === undefined) {
      value = `\`${where}\` has a computed key`;
    } else if (name === key) {
      value = ts.isPropertyAssignment(property)
        ? unwrap(property.initializer)
        : `\`${member(where, key)}\` is a shorthand, method or accessor`;
    }
  }
  return value;
}

/**
 * Follow `path` from `object` through nested object literals to the value at
 * its end: `undefined` when a key on the way is absent, and the reason as a
 * string when the way cannot be followed in the source.
 */
function follow(
  object: ts.ObjectLiteralExpression,
  path: string[],
  where: string
): ts.Expression | string | undefined {
  let current = object;
  let at = where;
  for (const [index, key] of path.entries()) {
    const value = propertyValue(current, key, at);
    at = member(at, key);
    if (value === undefined || typeof value === 'string') return value;
    if (index === path.length - 1) return value;
    if (!ts.isObjectLiteralExpression(value)) {
      return `\`${at}\` is not an object literal`;
    }
    current = value;
  }
  return current;
}

/** The object literal assigned to `const meta`, or why there is none. */
function metaObject(story: ts.SourceFile): ts.ObjectLiteralExpression | string {
  for (const statement of story.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'meta' &&
        declaration.initializer
      ) {
        const value = unwrap(declaration.initializer);
        return ts.isObjectLiteralExpression(value)
          ? value
          : '`meta` is not an object literal';
      }
    }
  }
  return 'the file declares no `const meta`';
}

/**
 * The `table.defaultValue.summary` a story's `meta.argTypes` gives `argName`
 * (issue #152). It reads the parsed file, so a quote or brace in a comment
 * never shifts what is read, and a same-named key in `args` or inside another
 * argType is never taken for it. What it cannot follow in the source, such
 * as a spread, a shared constant or a computed summary, is `unreadable` with
 * the reason, never `missing` or `no-summary`.
 */
export function argTypeDefaultSummary(
  story: ts.SourceFile,
  argName: string
): ArgTypeDefault {
  const unreadable = (reason: string): ArgTypeDefault => ({
    kind: 'unreadable',
    reason,
  });

  const meta = metaObject(story);
  if (typeof meta === 'string') return unreadable(meta);

  const argType = follow(meta, ['argTypes', argName], 'meta');
  if (argType === undefined) return { kind: 'missing' };
  if (typeof argType === 'string') return unreadable(argType);
  const at = member('meta.argTypes', argName);
  if (!ts.isObjectLiteralExpression(argType)) {
    return unreadable(`\`${at}\` is not an object literal`);
  }

  const summary = follow(argType, ['table', 'defaultValue', 'summary'], at);
  if (summary === undefined) return { kind: 'no-summary' };
  if (typeof summary === 'string') return unreadable(summary);
  return ts.isStringLiteralLike(summary)
    ? { kind: 'summary', summary: summary.text }
    : unreadable(
        `\`${at}.table.defaultValue.summary\` is not a string literal`
      );
}

/**
 * Whether a story's default summary and a registry default name the same
 * value: one pair of surrounding quotes goes, and an empty string counts as
 * no default, since `buildStoryData` leaves an empty default out of the table.
 */
export function sameDefault(
  summary: string | null,
  registryDefault: string | undefined
): boolean {
  const value = (text: string | null | undefined): string | null => {
    if (text === null || text === undefined) return null;
    const unquoted = /^(['"`])([\s\S]*)\1$/.exec(text.trim());
    const inner = unquoted ? unquoted[2] : text.trim();
    return inner === '' ? null : inner;
  };
  return value(summary) === value(registryDefault);
}
