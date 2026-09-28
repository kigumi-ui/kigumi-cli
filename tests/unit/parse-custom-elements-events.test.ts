/**
 * The parser's event pass over a whole manifest (issue #108).
 *
 * `buildMetadata()` is the parser minus its I/O: it drops the manifest
 * artifacts `MANIFEST_EVENT_ARTIFACTS` lists, types every other event, and
 * refuses pinned entries that went stale. Stale is judged against what the
 * manifest describes: the free manifest lacks the Pro components, so an entry
 * for one of them is not stale there, and refusing it broke `generate:metadata`
 * (and so `pnpm build`'s prebuild) on any clone without Web Awesome Pro.
 */
import { describe, expect, it } from 'vitest';
import {
  buildMetadata,
  type CustomElementsJSON,
} from '../../scripts/parse-custom-elements.js';
import {
  createEventTypeResolver,
  parseEventDeclarations,
  type EventCatalog,
} from '../../scripts/event-types.js';

// Shapes copied from the real Web Awesome 3.14 declarations.
const HIDE_DTS = `export declare class WaHideEvent extends Event {
    constructor();
}
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-hide': WaHideEvent;
    }
}`;

const OPTIONS_REQUEST_DTS = `export declare class WaOptionsRequestEvent extends Event {
    readonly detail: WaOptionsRequestEventDetail;
}
interface WaOptionsRequestEventDetail {
    query: string;
}
declare global {
    interface GlobalEventHandlersEventMap {
        'wa-options-request': WaOptionsRequestEvent;
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
  'options-request': OPTIONS_REQUEST_DTS,
});

const COMBOBOX_ARTIFACT = {
  'wa-combobox': { request: { shadows: 'wa-options-request' } },
};

const DIALOG = {
  kind: 'class',
  name: 'WaDialog',
  tagName: 'wa-dialog',
  events: [{ name: 'wa-hide', description: 'Closes.' }],
};

const COMBOBOX = {
  kind: 'class',
  name: 'WaCombobox',
  tagName: 'wa-combobox',
  events: [
    { name: 'request', type: { text: 'WaOptionsRequestEvent' } },
    { name: 'wa-options-request', description: 'Asks for options.' },
  ],
};

function manifest(
  ...declarations: CustomElementsJSON['modules'][number]['declarations'] &
    object
): CustomElementsJSON {
  return { modules: [{ declarations }] };
}

function resolver() {
  return createEventTypeResolver(CATALOG, {}, COMBOBOX_ARTIFACT);
}

describe('buildMetadata events', () => {
  it('drops a listed artifact and keeps the event it shadows', () => {
    const { components } = buildMetadata(
      manifest(DIALOG, COMBOBOX),
      resolver(),
      { complete: true }
    );
    expect(components.combobox?.events).toEqual([
      {
        name: 'wa-options-request',
        description: 'Asks for options.',
        reactName: 'onOptionsRequest',
        eventType: 'WaOptionsRequestEvent',
        eventTypeModule: 'options-request',
      },
    ]);
  });

  it('parses a partial manifest that lacks a pinned entry’s component', () => {
    // The free manifest has no wa-combobox. Its artifact entry goes
    // unconsulted, and that is not a reason to stop the build.
    const { components } = buildMetadata(manifest(DIALOG), resolver(), {
      complete: false,
    });
    expect(Object.keys(components)).toEqual(['dialog']);
  });

  it('refuses the same entry against a complete manifest', () => {
    // Pro describes every component, so an entry nothing matches there names
    // a component that is gone, or a typo.
    expect(() =>
      buildMetadata(manifest(DIALOG), resolver(), { complete: true })
    ).toThrow(/MANIFEST_EVENT_ARTIFACTS.*wa-combobox request/s);
  });

  it('refuses an entry the manifest’s own component never consulted', () => {
    // wa-combobox is described but no longer declares `request`.
    const withoutArtifact = {
      ...COMBOBOX,
      events: [{ name: 'wa-options-request' }],
    };
    expect(() =>
      buildMetadata(manifest(DIALOG, withoutArtifact), resolver(), {
        complete: false,
      })
    ).toThrow(/MANIFEST_EVENT_ARTIFACTS.*wa-combobox request/s);
  });
});
