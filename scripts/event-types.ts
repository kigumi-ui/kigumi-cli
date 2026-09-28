/**
 * Event type resolution: which TypeScript type a handler receives for each
 * event a Web Awesome component fires.
 *
 * Web Awesome dispatches its own event classes (`WaHideEvent extends Event`,
 * with a typed `detail`), declared one per file under `dist/events/`. Those
 * declarations are the source of truth, not the manifest: the manifest's
 * `type` is missing for most events that carry a payload, says `CustomEvent`
 * where the class extends `Event`, and writes `String` where the class says
 * `string`. Its `eventName` is a pascal-cased naming convention and names the
 * wrong class for the accordion, which dispatches `WaAccordionExpandEvent`
 * under the name `wa-expand`.
 *
 * So a custom event resolves through the event name each class registers in
 * `GlobalEventHandlersEventMap`, never through a name-shaped string. A native
 * event resolves to the scalar type the manifest declares, else to its DOM
 * interface. Anything that fits neither rule is refused: the parser stops
 * rather than writing a plausible, wrong type into every generated Template.
 *
 * See docs/adr/0005-event-types-come-from-web-awesome-event-classes.md, which
 * extends docs/adr/0001-event-types-are-never-inferred-from-names.md.
 */

import fs from 'fs-extra';
import path from 'path';
import ts from 'typescript';

/** What a class's `detail` property declares. */
export type EventDetail =
  | { kind: 'none' }
  | { kind: 'keys'; keys: string[] }
  /** Declared through a type this file does not define, e.g. an import. */
  | { kind: 'opaque' };

export interface EventClass {
  name: string;
  /** File basename under `dist/events/`, e.g. `hide` for `hide.js`. */
  module: string;
  detail: EventDetail;
}

export interface EventCatalog {
  classes: Map<string, EventClass>;
  /** Event name -> the class registered for it, e.g. `wa-hide` -> `WaHideEvent`. */
  registered: Map<string, string>;
}

export interface ResolvedEventType {
  type: string;
  /** Present when `type` is a Web Awesome class that must be imported. */
  module?: string;
}

export interface ManifestEvent {
  name: string;
  type?: { text?: string };
}

/** Component tag -> event name -> the class that component dispatches. */
export type EventClassOverrides = Readonly<
  Record<string, Readonly<Record<string, string>>>
>;

/**
 * Components that dispatch a class other than the one registered for the
 * event's name.
 *
 * A class can only claim an event name in `GlobalEventHandlersEventMap` once,
 * so when two classes dispatch the same name, the component-specific one
 * registers nothing and cannot be found by name. The accordion is that case:
 * it dispatches `WaAccordionExpandEvent` (detail `{ item }`) as `wa-expand`,
 * while `wa-expand` is registered to the payload-free `WaExpandEvent` that
 * Details fires.
 *
 * This is committed data rather than something derived, so the list cannot
 * absorb the error it exists to correct. The resolver keeps it honest: an
 * entry naming a class the package does not ship, or a class registered for a
 * different event, is refused, and an entry no manifest event consults is
 * reported as stale. A missing entry is caught where the manifest declares a
 * payload the registered class does not carry. That check reaches only events
 * whose manifest entry declares a payload shape, and it refuses a class whose
 * detail it cannot read rather than skipping it.
 */
export const EVENT_CLASS_OVERRIDES: EventClassOverrides = {
  'wa-accordion': {
    'wa-expand': 'WaAccordionExpandEvent',
    'wa-after-expand': 'WaAccordionAfterExpandEvent',
    'wa-collapse': 'WaAccordionCollapseEvent',
    'wa-after-collapse': 'WaAccordionAfterCollapseEvent',
  },
};

/** A manifest artifact, and the real event it shadows. */
export interface ManifestEventArtifact {
  /** The event the component really fires with the artifact's class. */
  shadows: string;
}

/** Component tag -> manifest event name -> what the artifact shadows. */
export type ManifestEventArtifacts = Readonly<
  Record<string, Readonly<Record<string, ManifestEventArtifact>>>
>;

/**
 * What a manifest describes, so pinned entries can be judged stale.
 *
 * The free manifest lacks the Pro components, so an entry for one of them
 * goes unconsulted there without being wrong. The Pro manifest describes
 * every component, so against it such an entry names a component that is
 * gone, or a typo.
 */
export interface ManifestCoverage {
  /** Tag of every component the manifest declares. */
  tags: ReadonlySet<string>;
  /** True when the manifest describes every Web Awesome component (Pro). */
  complete: boolean;
}

/** Pinned entries no manifest event consulted, per list. */
export interface StaleEntries {
  overrides: string[];
  artifacts: string[];
}

/** A manifest event with the handler type resolved for it. */
export interface ResolvedManifestEvent<E extends ManifestEvent> {
  event: E;
  resolved: ResolvedEventType;
}

/**
 * Manifest events that never fire: analyzer artifacts, each shadowing a real
 * event the same component also declares.
 *
 * Every Web Awesome event class hard-codes its `wa-` name in its constructor
 * (`super('wa-step-change', ...)`), so a class can only ever fire under that
 * name. When a component dispatches `new WaStepChangeEvent(detail)`, the
 * manifest analyzer records a second event named after the argument, here
 * `detail`, typed with the class. A handler for it would never run.
 *
 * Each entry names the real event carrying the same class, and
 * `resolveEvents()` drops the artifact. The resolver keeps the list honest the
 * same way it keeps `EVENT_CLASS_OVERRIDES`: it refuses an entry whose real
 * event fires a different class or that the component does not declare, and
 * `staleEntries()` reports an entry no manifest event consults. An unlisted
 * artifact is refused, so a new one stops `generate:metadata` in the bump PR.
 */
export const MANIFEST_EVENT_ARTIFACTS: ManifestEventArtifacts = {
  'wa-combobox': { request: { shadows: 'wa-options-request' } },
  'wa-data-grid': { request: { shadows: 'wa-data-request' } },
  'wa-stepper': { detail: { shadows: 'wa-step-change' } },
};

/**
 * Native DOM events Web Awesome components fire, mapped to the interface the
 * DOM defines for them. Consulted only when the manifest declares no type for
 * the event, and keyed on the event's DOM `name` (`blur`), never on the
 * manifest's `eventName` (`BlurEvent`), which names no real interface.
 */
export const NATIVE_EVENT_TYPES: Readonly<Record<string, string>> = {
  blur: 'FocusEvent',
  focus: 'FocusEvent',
  change: 'Event',
  input: 'InputEvent',
  beforeinput: 'InputEvent',
  load: 'Event',
  error: 'Event',
  // wa-video's media events. Its manifest declares a type for `timeupdate`
  // only (`Event`); the HTML spec fires all of these on a media element as
  // plain `Event`s ("fire an event named play"), so this is the DOM's
  // interface for them, not one read off the event name.
  play: 'Event',
  pause: 'Event',
  ended: 'Event',
  timeupdate: 'Event',
  volumechange: 'Event',
  loadedmetadata: 'Event',
};

/**
 * DOM event interfaces a manifest may declare for a native event.
 * `CustomEvent` is deliberately absent: no Web Awesome event is one, so a
 * native event declared `CustomEvent` is refused rather than typed with it.
 */
const DOM_EVENT_INTERFACES = new Set([
  'Event',
  'UIEvent',
  'FocusEvent',
  'InputEvent',
  'MouseEvent',
  'KeyboardEvent',
  'PointerEvent',
  'TouchEvent',
  'WheelEvent',
]);

/** Declared scalar types that a custom event's class supersedes. */
const IMPRECISE_CUSTOM_EVENT_TYPES = new Set(['Event', 'CustomEvent']);

function propertyName(name: ts.PropertyName): string | null {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  ) {
    return name.text;
  }
  return null;
}

function memberKeys(members: ts.NodeArray<ts.TypeElement>): string[] {
  return members
    .map((m) => (m.name ? propertyName(m.name) : null))
    .filter((k): k is string => k !== null);
}

/**
 * Read the event classes one `dist/events/*.d.ts` file declares, and the
 * event names it registers them under.
 */
export function parseEventDeclarations(
  module: string,
  source: string
): { classes: EventClass[]; registered: Array<[string, string]> } {
  const file = ts.createSourceFile(
    `${module}.d.ts`,
    source,
    ts.ScriptTarget.Latest,
    true
  );

  // Local type names -> their object keys, for `detail: SomeLocalInterface`.
  const localShapes = new Map<string, string[]>();
  for (const stmt of file.statements) {
    if (ts.isInterfaceDeclaration(stmt)) {
      localShapes.set(stmt.name.text, memberKeys(stmt.members));
    } else if (
      ts.isTypeAliasDeclaration(stmt) &&
      ts.isTypeLiteralNode(stmt.type)
    ) {
      localShapes.set(stmt.name.text, memberKeys(stmt.type.members));
    }
  }

  const detailOf = (type: ts.TypeNode | undefined): EventDetail => {
    if (!type) return { kind: 'opaque' };
    // `WaHideEventDetails | undefined`: the payload is the defined member.
    const defined = ts.isUnionTypeNode(type)
      ? type.types.filter((t) => t.kind !== ts.SyntaxKind.UndefinedKeyword)
      : [type];
    if (defined.length !== 1) return { kind: 'opaque' };
    const [node] = defined;
    if (ts.isTypeLiteralNode(node)) {
      return { kind: 'keys', keys: memberKeys(node.members) };
    }
    if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
      const keys = localShapes.get(node.typeName.text);
      if (keys) return { kind: 'keys', keys };
    }
    return { kind: 'opaque' };
  };

  const classes: EventClass[] = [];
  const registered: Array<[string, string]> = [];

  for (const stmt of file.statements) {
    if (ts.isClassDeclaration(stmt) && stmt.name) {
      const detail = stmt.members.find(
        (m): m is ts.PropertyDeclaration =>
          ts.isPropertyDeclaration(m) &&
          m.name !== undefined &&
          propertyName(m.name) === 'detail'
      );
      classes.push({
        name: stmt.name.text,
        module,
        detail: detail ? detailOf(detail.type) : { kind: 'none' },
      });
    }

    // declare global { interface GlobalEventHandlersEventMap { 'wa-hide': WaHideEvent } }
    if (
      ts.isModuleDeclaration(stmt) &&
      stmt.name.getText(file) === 'global' &&
      stmt.body &&
      ts.isModuleBlock(stmt.body)
    ) {
      for (const inner of stmt.body.statements) {
        if (
          !ts.isInterfaceDeclaration(inner) ||
          inner.name.text !== 'GlobalEventHandlersEventMap'
        ) {
          continue;
        }
        for (const member of inner.members) {
          if (!ts.isPropertySignature(member) || !member.type) continue;
          const eventName = propertyName(member.name);
          if (
            eventName &&
            ts.isTypeReferenceNode(member.type) &&
            ts.isIdentifier(member.type.typeName)
          ) {
            registered.push([eventName, member.type.typeName.text]);
          }
        }
      }
    }
  }

  return { classes, registered };
}

/**
 * Read every event class a Web Awesome package declares under `eventsDir`
 * (its `dist/events/`). The `events.d.ts` barrel only re-exports, and
 * incompletely: it omits the accordion's classes, so each file is read.
 */
export async function readEventCatalog(
  eventsDir: string
): Promise<EventCatalog> {
  const catalog: EventCatalog = { classes: new Map(), registered: new Map() };
  const files = (await fs.readdir(eventsDir))
    .filter((f) => f.endsWith('.d.ts') && f !== 'events.d.ts')
    .sort();

  for (const file of files) {
    const module = file.slice(0, -'.d.ts'.length);
    const source = await fs.readFile(path.join(eventsDir, file), 'utf8');
    const parsed = parseEventDeclarations(module, source);
    for (const cls of parsed.classes) catalog.classes.set(cls.name, cls);
    for (const [eventName, cls] of parsed.registered) {
      catalog.registered.set(eventName, cls);
    }
  }

  if (catalog.classes.size === 0) {
    throw new Error(
      `Found no Web Awesome event classes in ${eventsDir}. Event types cannot ` +
        'be resolved without them.'
    );
  }
  return catalog;
}

/** Keys of a declared object shape such as `{ item: WaAccordionItem }`. */
function declaredShapeKeys(text: string): string[] | null {
  if (!text.trim().startsWith('{')) return null;
  const file = ts.createSourceFile(
    'declared.ts',
    `type T = ${text};`,
    ts.ScriptTarget.Latest
  );
  const alias = file.statements[0];
  if (
    alias &&
    ts.isTypeAliasDeclaration(alias) &&
    ts.isTypeLiteralNode(alias.type)
  ) {
    return memberKeys(alias.type.members);
  }
  return null;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** The resolver `createEventTypeResolver()` returns. */
export type EventTypeResolver = ReturnType<typeof createEventTypeResolver>;

/**
 * Resolve manifest events to handler types against one package's catalog.
 *
 * `resolveEvents()` takes every event one component declares, drops its
 * manifest artifacts and types the rest; `resolve()` types a single event and
 * refuses an artifact like any other non-`wa-` event carrying an event class.
 *
 * Stateful only to track which overrides and artifacts were consulted, so a
 * caller that has resolved every component can ask which entries are stale.
 */
export function createEventTypeResolver(
  catalog: EventCatalog,
  overrides: EventClassOverrides = EVENT_CLASS_OVERRIDES,
  artifacts: ManifestEventArtifacts = MANIFEST_EVENT_ARTIFACTS
): {
  resolve(tagName: string, event: ManifestEvent): ResolvedEventType;
  resolveEvents<E extends ManifestEvent>(
    tagName: string,
    events: readonly E[]
  ): Array<ResolvedManifestEvent<E>>;
  staleEntries(coverage: ManifestCoverage): StaleEntries;
} {
  const used = new Set<string>();

  const classType = (name: string): ResolvedEventType => {
    const cls = catalog.classes.get(name);
    if (!cls) throw new Error(`no class ${name}`);
    return { type: cls.name, module: cls.module };
  };

  const registeredEventOf = (className: string): string | undefined => {
    for (const [eventName, cls] of catalog.registered) {
      if (cls === className) return eventName;
    }
    return undefined;
  };

  function checkDeclared(
    where: string,
    className: string,
    declared: string | undefined
  ): void {
    if (!declared) return;
    const text = declared.trim();
    const cls = catalog.classes.get(className) as EventClass;

    const keys = declaredShapeKeys(text);
    if (keys) {
      // A detail declared through a type this file does not define (an
      // import) cannot be compared, and skipping the comparison would switch
      // the missing-override check off for that class without anyone
      // noticing. No shipped class is opaque today, so this is refused.
      if (cls.detail.kind === 'opaque') {
        throw new Error(
          `${where}: the manifest declares a payload with ${keys.join(', ')}, ` +
            `but ${className}'s detail is declared through a type ` +
            `${cls.module}.d.ts does not define, so the payload cannot be ` +
            'checked. Teach parseEventDeclarations() to read that type.'
        );
      }
      const carried = cls.detail.kind === 'keys' ? cls.detail.keys : [];
      const missing = keys.filter((k) => !carried.includes(k));
      if (missing.length > 0) {
        throw new Error(
          `${where}: the manifest declares a payload with ${missing.join(', ')}, ` +
            `but ${className} carries ${carried.length ? carried.join(', ') : 'no detail'}. ` +
            'The component dispatches a different class; pin it in ' +
            'EVENT_CLASS_OVERRIDES (scripts/event-types.ts).'
        );
      }
      return;
    }

    if (IMPRECISE_CUSTOM_EVENT_TYPES.has(text)) return;
    if (catalog.classes.has(text) && text !== className) {
      throw new Error(
        `${where}: the manifest declares ${text}, but ${className} is the ` +
          'class resolved for it.'
      );
    }
  }

  function resolve(tagName: string, event: ManifestEvent): ResolvedEventType {
    const where = `${tagName} ${event.name}`;
    const declared = event.type?.text?.trim() || undefined;

    const pinned = overrides[tagName]?.[event.name];
    if (pinned) {
      used.add(where);
      if (!catalog.classes.has(pinned)) {
        throw new Error(
          `${where}: EVENT_CLASS_OVERRIDES names ${pinned}, which the ` +
            'package does not declare under dist/events/.'
        );
      }
      const pinnedEvent = registeredEventOf(pinned);
      if (pinnedEvent && pinnedEvent !== event.name) {
        throw new Error(
          `${where}: EVENT_CLASS_OVERRIDES names ${pinned}, which is ` +
            `registered for ${pinnedEvent}, not ${event.name}.`
        );
      }
      checkDeclared(where, pinned, declared);
      return classType(pinned);
    }

    if (event.name.startsWith('wa-')) {
      const registered = catalog.registered.get(event.name);
      if (!registered || !catalog.classes.has(registered)) {
        throw new Error(
          `${where}: no Web Awesome event class registers ${event.name}. ` +
            'Pin the class the component dispatches in EVENT_CLASS_OVERRIDES ' +
            '(scripts/event-types.ts).'
        );
      }
      checkDeclared(where, registered, declared);
      return classType(registered);
    }

    if (declared) {
      if (!IDENTIFIER.test(declared)) {
        throw new Error(
          `${where}: native event declared as ${declared}, which is not a ` +
            'type name.'
        );
      }
      if (catalog.classes.has(declared)) {
        const firesAs = registeredEventOf(declared);
        throw new Error(
          `${where}: declared as ${declared}, a Web Awesome event class. ` +
            `It fires only under the wa- name its constructor hard-codes` +
            `${firesAs ? ` (${firesAs})` : ''}, never as ${event.name}: the ` +
            'manifest named this event after the constructor argument. Add ' +
            'it to MANIFEST_EVENT_ARTIFACTS (scripts/event-types.ts).'
        );
      }
      if (DOM_EVENT_INTERFACES.has(declared)) return { type: declared };
      throw new Error(
        `${where}: declared as ${declared}, which is neither a DOM event ` +
          'interface nor a Web Awesome event class.'
      );
    }

    const native = NATIVE_EVENT_TYPES[event.name];
    if (native) return { type: native };
    throw new Error(
      `${where}: native event with no declared type. Add its DOM interface to ` +
        'NATIVE_EVENT_TYPES (scripts/event-types.ts).'
    );
  }

  /** True for a listed artifact of `tagName`, after checking the entry holds. */
  function isArtifact(
    tagName: string,
    event: ManifestEvent,
    declared: readonly string[]
  ): boolean {
    const entry = artifacts[tagName]?.[event.name];
    if (!entry) return false;
    const where = `${tagName} ${event.name}`;
    used.add(where);

    const declaredType = event.type?.text?.trim();
    const realClass = catalog.registered.get(entry.shadows);
    if (!declaredType || declaredType !== realClass) {
      throw new Error(
        `${where}: MANIFEST_EVENT_ARTIFACTS says it shadows ${entry.shadows}, ` +
          `but the manifest declares ${declaredType ?? 'no type'} for it and ` +
          `${entry.shadows} fires ${realClass ?? 'no registered class'}.`
      );
    }
    if (!declared.includes(entry.shadows)) {
      throw new Error(
        `${where}: MANIFEST_EVENT_ARTIFACTS says it shadows ${entry.shadows}, ` +
          `which ${tagName} does not declare. Dropping it would lose the ` +
          `only record that ${tagName} fires ${realClass}.`
      );
    }
    return true;
  }

  function resolveEvents<E extends ManifestEvent>(
    tagName: string,
    events: readonly E[]
  ): Array<ResolvedManifestEvent<E>> {
    const declared = events.map((event) => event.name);
    return events
      .filter((event) => !isArtifact(tagName, event, declared))
      .map((event) => ({ event, resolved: resolve(tagName, event) }));
  }

  function staleEntries(coverage: ManifestCoverage): StaleEntries {
    const stale = (list: EventClassOverrides | ManifestEventArtifacts) =>
      Object.entries(list)
        .filter(([tag]) => coverage.complete || coverage.tags.has(tag))
        .flatMap(([tag, events]) =>
          Object.keys(events).map((name) => `${tag} ${name}`)
        )
        .filter((key) => !used.has(key))
        .sort();
    return { overrides: stale(overrides), artifacts: stale(artifacts) };
  }

  return { resolve, resolveEvents, staleEntries };
}
