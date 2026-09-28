import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EVENT_CLASS_OVERRIDES,
  MANIFEST_EVENT_ARTIFACTS,
  createEventTypeResolver,
  parseEventDeclarations,
  readEventCatalog,
  type EventCatalog,
} from '../../../scripts/event-types.js';
import { resolveCem } from '../../../scripts/find-cem.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

/**
 * Event handler types come from the classes Web Awesome actually dispatches.
 *
 * These pin the two halves: reading those classes out of the package's
 * `dist/events/*.d.ts`, and resolving each manifest event to one of them (or,
 * for a native event, to its DOM interface). The resolver refuses rather than
 * guesses: every silent fallback here would put a plausible, wrong type into
 * ~60 generated Templates.
 *
 * See docs/adr/0005-event-types-come-from-web-awesome-event-classes.md.
 */

// Shapes copied from the real Web Awesome 3.13 declarations.
const HIDE_DTS = `export declare class WaHideEvent extends Event {
    readonly detail: WaHideEventDetails | undefined;
    constructor(detail?: WaHideEventDetails);
}
interface WaHideEventDetails {
    source: Element;
}
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-hide': WaHideEvent;
    }
}
export {};`;

const EXPAND_DTS = `export declare class WaExpandEvent extends Event {
    constructor();
}
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-expand': WaExpandEvent;
    }
}`;

const ACCORDION_EXPAND_DTS = `import type WaAccordionItem from '../components/accordion-item/accordion-item.js';
export declare class WaAccordionExpandEvent extends Event {
    readonly detail: {
        item: WaAccordionItem;
    };
    constructor(detail: {
        item: WaAccordionItem;
    });
}`;

const INTERSECT_DTS = `export declare class WaIntersectEvent extends Event {
    readonly detail?: WaIntersectEventDetail;
}
type WaIntersectEventDetail = { entry: IntersectionObserverEntry };
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-intersect': WaIntersectEvent;
    }
}`;

const DATA_REQUEST_DTS = `export declare class WaDataRequestEvent extends Event {
    readonly detail: WaDataRequestEventDetail;
}
interface WaDataRequestEventDetail {
    page: number;
}
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-data-request': WaDataRequestEvent;
    }
}`;

// A detail declared through an imported type: nothing in this file says
// which keys it carries.
const IMPORTED_DETAIL_DTS = `import type { WaPayload } from './payload.js';
export declare class WaImportedEvent extends Event {
    readonly detail: WaPayload;
}
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-imported': WaImportedEvent;
    }
}`;

function catalogOf(files: Record<string, string>): EventCatalog {
  const catalog: EventCatalog = { classes: new Map(), registered: new Map() };
  for (const [module, source] of Object.entries(files)) {
    const parsed = parseEventDeclarations(module, source);
    for (const cls of parsed.classes) catalog.classes.set(cls.name, cls);
    for (const [event, cls] of parsed.registered) {
      catalog.registered.set(event, cls);
    }
  }
  return catalog;
}

const CATALOG = catalogOf({
  hide: HIDE_DTS,
  expand: EXPAND_DTS,
  'accordion-expand': ACCORDION_EXPAND_DTS,
  intersect: INTERSECT_DTS,
  'data-request': DATA_REQUEST_DTS,
  imported: IMPORTED_DETAIL_DTS,
});

const ACCORDION_OVERRIDE = {
  'wa-accordion': { 'wa-expand': 'WaAccordionExpandEvent' },
};

describe('parseEventDeclarations', () => {
  it('reads a registered class whose detail is a named interface', () => {
    const parsed = parseEventDeclarations('hide', HIDE_DTS);
    expect(parsed.classes).toEqual([
      {
        name: 'WaHideEvent',
        module: 'hide',
        detail: { kind: 'keys', keys: ['source'] },
      },
    ]);
    expect(parsed.registered).toEqual([['wa-hide', 'WaHideEvent']]);
  });

  it('reads an inline object detail', () => {
    const parsed = parseEventDeclarations(
      'accordion-expand',
      ACCORDION_EXPAND_DTS
    );
    expect(parsed.classes[0].detail).toEqual({ kind: 'keys', keys: ['item'] });
  });

  it('reads a detail declared through a type alias', () => {
    const parsed = parseEventDeclarations('intersect', INTERSECT_DTS);
    expect(parsed.classes[0].detail).toEqual({ kind: 'keys', keys: ['entry'] });
  });

  it('records a class without detail as carrying none', () => {
    const parsed = parseEventDeclarations('expand', EXPAND_DTS);
    expect(parsed.classes[0].detail).toEqual({ kind: 'none' });
  });

  it('records a class that registers no event name as unregistered', () => {
    // The accordion's own classes share event names with the generic ones and
    // cannot claim them in GlobalEventHandlersEventMap. They are exactly the
    // events a name lookup would get wrong.
    const parsed = parseEventDeclarations(
      'accordion-expand',
      ACCORDION_EXPAND_DTS
    );
    expect(parsed.classes.map((c) => c.name)).toEqual([
      'WaAccordionExpandEvent',
    ]);
    expect(parsed.registered).toEqual([]);
  });

  it('treats a detail it cannot see into as opaque, not as empty', () => {
    const parsed = parseEventDeclarations(
      'x',
      `import type { Imported } from './elsewhere.js';
export declare class WaXEvent extends Event {
    readonly detail: Imported;
}`
    );
    expect(parsed.classes[0].detail).toEqual({ kind: 'opaque' });
  });
});

describe('readEventCatalog against the installed Web Awesome package', () => {
  const eventsDir = path.join(
    PROJECT_ROOT,
    'node_modules/@awesome.me/webawesome/dist/events'
  );

  it('maps classes to their module and event names to their class', async () => {
    const catalog = await readEventCatalog(eventsDir);

    expect(catalog.classes.get('WaHideEvent')).toEqual({
      name: 'WaHideEvent',
      module: 'hide',
      detail: { kind: 'keys', keys: ['source'] },
    });
    expect(catalog.registered.get('wa-hide')).toBe('WaHideEvent');
    expect(catalog.classes.get('WaAccordionExpandEvent')?.module).toBe(
      'accordion-expand'
    );
    expect([...catalog.registered.values()]).not.toContain(
      'WaAccordionExpandEvent'
    );
  });

  it('skips the events barrel, which re-exports rather than declares', async () => {
    const catalog = await readEventCatalog(eventsDir);
    const modules = new Set([...catalog.classes.values()].map((c) => c.module));
    expect(modules.has('events')).toBe(false);
  });

  it('refuses a directory with no event declarations', async () => {
    await expect(
      readEventCatalog(path.join(PROJECT_ROOT, 'docs/adr'))
    ).rejects.toThrow(/no Web Awesome event classes/);
  });
});

describe('createEventTypeResolver', () => {
  describe('Web Awesome custom events', () => {
    it('resolve to the class registered for their name', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(resolver.resolve('wa-dialog', { name: 'wa-hide' })).toEqual({
        type: 'WaHideEvent',
        module: 'hide',
      });
    });

    it('take a pinned override ahead of the registered class', () => {
      const resolver = createEventTypeResolver(CATALOG, ACCORDION_OVERRIDE);
      expect(
        resolver.resolve('wa-accordion', {
          name: 'wa-expand',
          type: { text: '{ item: WaAccordionItem }' },
        })
      ).toEqual({ type: 'WaAccordionExpandEvent', module: 'accordion-expand' });
      // The override is per component: Details keeps the generic class.
      expect(resolver.resolve('wa-details', { name: 'wa-expand' })).toEqual({
        type: 'WaExpandEvent',
        module: 'expand',
      });
    });

    it('refuse a declared payload the resolved class does not carry', () => {
      // This is the accordion without its override: the manifest says the
      // event carries `item`, the class registered for `wa-expand` carries
      // nothing, so some other class is being dispatched.
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-accordion', {
          name: 'wa-expand',
          type: { text: '{ item: WaAccordionItem }' },
        })
      ).toThrow(/wa-accordion.*wa-expand.*item.*WaExpandEvent/s);
    });

    it('accept a declared payload whose keys the class carries', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(
        resolver.resolve('wa-dialog', {
          name: 'wa-hide',
          type: { text: '{ source: Element }' },
        }).type
      ).toBe('WaHideEvent');
    });

    it('refuse a declared payload when the class detail cannot be read', () => {
      // Skipping the comparison here would silently switch the missing-
      // override check off for this class.
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-x', {
          name: 'wa-imported',
          type: { text: '{ item: WaItem }' },
        })
      ).toThrow(/wa-imported.*item.*WaImportedEvent.*imported\.d\.ts/s);
      // Without a declared payload there is nothing to compare: it resolves.
      expect(resolver.resolve('wa-x', { name: 'wa-imported' })).toEqual({
        type: 'WaImportedEvent',
        module: 'imported',
      });
    });

    it('ignore a declared scalar CustomEvent, which the class supersedes', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(
        resolver.resolve('wa-color-picker', {
          name: 'wa-hide',
          type: { text: 'CustomEvent' },
        }).type
      ).toBe('WaHideEvent');
    });

    it('refuse a declared class that disagrees with the registered one', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-dialog', {
          name: 'wa-hide',
          type: { text: 'WaDataRequestEvent' },
        })
      ).toThrow(/WaDataRequestEvent.*WaHideEvent/s);
    });

    it('refuse an event no class registers, instead of typing it CustomEvent', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-foo', { name: 'wa-something-new' })
      ).toThrow(/wa-something-new/);
    });
  });

  describe('native events', () => {
    it('take the scalar type the manifest declares', () => {
      // wa-file-input dispatches `new Event('input')`, not an InputEvent.
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(
        resolver.resolve('wa-file-input', {
          name: 'input',
          type: { text: 'Event' },
        })
      ).toEqual({ type: 'Event' });
    });

    it('fall back to the DOM table when the manifest declares nothing', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(resolver.resolve('wa-input', { name: 'blur' })).toEqual({
        type: 'FocusEvent',
      });
      expect(resolver.resolve('wa-input', { name: 'input' })).toEqual({
        type: 'InputEvent',
      });
      expect(resolver.resolve('wa-video', { name: 'play' })).toEqual({
        type: 'Event',
      });
    });

    it('refuse a declared Web Awesome class, which fires only under its own wa- name', () => {
      // Every class hard-codes its event name in its constructor, so
      // WaDataRequestEvent can only ever arrive as wa-data-request. A manifest
      // event called `request` carrying it is named after the constructor
      // argument and never fires; typing it would ship a dead handler.
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-data-grid', {
          name: 'request',
          type: { text: 'WaDataRequestEvent' },
        })
      ).toThrow(
        /wa-data-grid request.*WaDataRequestEvent.*wa-data-request.*MANIFEST_EVENT_ARTIFACTS/s
      );
    });

    it('refuse a native event neither the manifest nor the table types', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() => resolver.resolve('wa-video', { name: 'seeking' })).toThrow(
        /seeking/
      );
    });

    it('refuse a native event declared CustomEvent, the type no Web Awesome event has', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-x', {
          name: 'change',
          type: { text: 'CustomEvent' },
        })
      ).toThrow(/change.*CustomEvent/s);
    });

    it('refuse a declared type that is neither a DOM interface nor a class', () => {
      const resolver = createEventTypeResolver(CATALOG, {});
      expect(() =>
        resolver.resolve('wa-x', { name: 'change', type: { text: 'Mystery' } })
      ).toThrow(/Mystery/);
    });
  });

  describe('overrides are pinned data and must stay true', () => {
    it('reports an override no manifest event consulted', () => {
      const resolver = createEventTypeResolver(CATALOG, ACCORDION_OVERRIDE);
      const coverage = { tags: new Set(['wa-accordion']), complete: false };
      resolver.resolve('wa-dialog', { name: 'wa-hide' });
      expect(resolver.staleEntries(coverage).overrides).toEqual([
        'wa-accordion wa-expand',
      ]);
      resolver.resolve('wa-accordion', { name: 'wa-expand' });
      expect(resolver.staleEntries(coverage).overrides).toEqual([]);
    });

    it('refuses an override naming a class the package does not ship', () => {
      const resolver = createEventTypeResolver(CATALOG, {
        'wa-accordion': { 'wa-expand': 'WaNoSuchEvent' },
      });
      expect(() =>
        resolver.resolve('wa-accordion', { name: 'wa-expand' })
      ).toThrow(/WaNoSuchEvent/);
    });

    it('refuses an override naming a class registered for another event', () => {
      const resolver = createEventTypeResolver(CATALOG, {
        'wa-accordion': { 'wa-expand': 'WaHideEvent' },
      });
      expect(() =>
        resolver.resolve('wa-accordion', { name: 'wa-expand' })
      ).toThrow(/WaHideEvent.*wa-hide/s);
    });
  });

  describe('manifest artifacts are pinned data and must stay true', () => {
    const GRID_ARTIFACT = {
      'wa-data-grid': { request: { shadows: 'wa-data-request' } },
    };
    const REQUEST = {
      name: 'request',
      type: { text: 'WaDataRequestEvent' },
    };
    const DATA_REQUEST = { name: 'wa-data-request' };

    it('drops a listed artifact and types the real event it shadows', () => {
      const resolver = createEventTypeResolver(CATALOG, {}, GRID_ARTIFACT);
      const resolved = resolver.resolveEvents('wa-data-grid', [
        REQUEST,
        DATA_REQUEST,
      ]);
      expect(
        resolved.map(({ event, resolved }) => [event.name, resolved.type])
      ).toEqual([['wa-data-request', 'WaDataRequestEvent']]);
    });

    it('keeps each event object, so callers read its other fields', () => {
      const resolver = createEventTypeResolver(CATALOG, {}, {});
      const hide = { name: 'wa-hide', description: 'Closes.' };
      expect(resolver.resolveEvents('wa-dialog', [hide])[0]?.event).toBe(hide);
    });

    it('drops nothing for a component without an entry', () => {
      // The entry is per component: another element's `request` is not one,
      // and without an entry the refusal in resolve() still applies.
      const resolver = createEventTypeResolver(CATALOG, {}, GRID_ARTIFACT);
      expect(() =>
        resolver.resolveEvents('wa-combobox', [REQUEST, DATA_REQUEST])
      ).toThrow(/wa-combobox request.*MANIFEST_EVENT_ARTIFACTS/s);
    });

    it('refuses an entry whose real event fires a different class', () => {
      const resolver = createEventTypeResolver(
        CATALOG,
        {},
        { 'wa-data-grid': { request: { shadows: 'wa-hide' } } }
      );
      expect(() =>
        resolver.resolveEvents('wa-data-grid', [REQUEST, { name: 'wa-hide' }])
      ).toThrow(
        /wa-data-grid request.*WaDataRequestEvent.*wa-hide.*WaHideEvent/s
      );
    });

    it('refuses to drop an artifact whose real event the component does not declare', () => {
      // Dropping it would then lose the only record that the component fires
      // this class at all.
      const resolver = createEventTypeResolver(CATALOG, {}, GRID_ARTIFACT);
      expect(() => resolver.resolveEvents('wa-data-grid', [REQUEST])).toThrow(
        /wa-data-grid request.*wa-data-request/s
      );
    });

    it('reports an entry no manifest event consulted', () => {
      const resolver = createEventTypeResolver(CATALOG, {}, GRID_ARTIFACT);
      const coverage = { tags: new Set(['wa-data-grid']), complete: false };
      resolver.resolveEvents('wa-dialog', [{ name: 'wa-hide' }]);
      expect(resolver.staleEntries(coverage).artifacts).toEqual([
        'wa-data-grid request',
      ]);
      resolver.resolveEvents('wa-data-grid', [REQUEST, DATA_REQUEST]);
      expect(resolver.staleEntries(coverage).artifacts).toEqual([]);
    });
  });

  describe('stale entries are judged against what the manifest describes', () => {
    const GRID_ARTIFACT = {
      'wa-data-grid': { request: { shadows: 'wa-data-request' } },
    };

    it('cannot judge an entry for a component a partial manifest lacks', () => {
      // The free manifest has no Pro components: their entries go
      // unconsulted there without being wrong.
      const resolver = createEventTypeResolver(
        CATALOG,
        ACCORDION_OVERRIDE,
        GRID_ARTIFACT
      );
      expect(
        resolver.staleEntries({ tags: new Set(['wa-dialog']), complete: false })
      ).toEqual({ overrides: [], artifacts: [] });
    });

    it('reports every unconsulted entry against a complete manifest', () => {
      // The Pro manifest describes every component, so an entry for a tag it
      // lacks names a component that is gone or a typo.
      const resolver = createEventTypeResolver(
        CATALOG,
        ACCORDION_OVERRIDE,
        GRID_ARTIFACT
      );
      expect(
        resolver.staleEntries({ tags: new Set(['wa-dialog']), complete: true })
      ).toEqual({
        overrides: ['wa-accordion wa-expand'],
        artifacts: ['wa-data-grid request'],
      });
    });
  });
});

describe('resolving the real manifest', () => {
  it('types every event of every component without refusing', async () => {
    const cem = await resolveCem(PROJECT_ROOT);
    expect(cem.found, 'a Custom Elements Manifest is installed').toBe(true);
    const cemPath = cem.path as string;
    const catalog = await readEventCatalog(
      path.join(path.dirname(cemPath), 'events')
    );
    const resolver = createEventTypeResolver(
      catalog,
      EVENT_CLASS_OVERRIDES,
      MANIFEST_EVENT_ARTIFACTS
    );

    const manifest = (await fs.readJson(cemPath)) as {
      modules: Array<{
        declarations?: Array<{
          tagName?: string;
          events?: Array<{ name?: string; type?: { text?: string } }>;
        }>;
      }>;
    };

    let declared = 0;
    let resolved = 0;
    const tags = new Set<string>();
    const accordion: Record<string, string> = {};
    for (const mod of manifest.modules) {
      for (const decl of mod.declarations ?? []) {
        if (!decl.tagName) continue;
        tags.add(decl.tagName);
        const events = (decl.events ?? []).flatMap((e) =>
          e.name ? [{ name: e.name, type: e.type }] : []
        );
        declared += events.length;
        for (const { event, resolved: type } of resolver.resolveEvents(
          decl.tagName,
          events
        )) {
          resolved++;
          if (decl.tagName === 'wa-accordion') {
            accordion[event.name] = type.type;
          }
        }
      }
    }

    // Exactly the listed artifacts of the components this manifest
    // describes were dropped; nothing else was.
    const dropped = Object.entries(MANIFEST_EVENT_ARTIFACTS)
      .filter(([tag]) => tags.has(tag))
      .flatMap(([, events]) => Object.keys(events));
    expect(resolved).toBeGreaterThan(100);
    expect(dropped.length).toBeGreaterThan(0);
    expect(declared - resolved).toBe(dropped.length);
    expect(
      resolver.staleEntries({ tags, complete: cem.tier === 'pro' })
    ).toEqual({ overrides: [], artifacts: [] });
    expect(accordion['wa-expand']).toBe('WaAccordionExpandEvent');
  });
});
