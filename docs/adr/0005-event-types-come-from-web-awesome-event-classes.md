# Event types come from Web Awesome's event classes

ADR 0001 fixed native events but typed every custom event `CustomEvent`, which
no Web Awesome event is. Web Awesome dispatches its own classes, one per file
under `dist/events/`: `WaHideEvent extends Event`, with a typed `detail`. A
handler typed `CustomEvent` lost that payload and claimed a base class the
runtime object does not have.

We decided that a handler's type is the class the component dispatches, read
from the package's own `dist/events/*.d.ts`. A custom event resolves through
the event name its class registers in `GlobalEventHandlersEventMap`. A native
event resolves to the scalar type the manifest declares for it, else to its DOM
interface. The parser records the answer in the metadata (`eventType`,
`eventTypeModule`), and the three generators read it; none of them decides a
type. This extends ADR 0001: the type still never comes from a name-shaped
string.

## Considered Options

**The manifest's declared type as `CustomEvent<T>`** (rejected): the issue's
original proposal. The manifest declares a payload for only 15 events and omits
it for 33 whose class carries one (Dropdown `wa-select`, Pagination,
CopyButton, `wa-hide` on ten components). It writes `String` where the class
says `string`, and `CustomEvent<T>` keeps the wrong base class.

**The manifest's `eventName` as the class name** (rejected): it matches a real
class for every custom event, but the accordion dispatches
`WaAccordionExpandEvent` under `wa-expand`, and `eventName` says
`WaExpandEvent`, the payload-free class Details fires. A name that is usually
right is the failure mode ADR 0001 exists to prevent.

## Consequences

A class can claim an event name only once, so a component that dispatches a
second class under a shared name (the accordion) cannot be found by name. It is
pinned in `EVENT_CLASS_OVERRIDES` in `scripts/event-types.ts`. The resolver
keeps that list honest. It refuses an entry naming a class the package does not
ship, or one registered for another event, and reports an entry nothing
consults as stale. It also refuses a manifest payload the resolved class does
not carry, which is how a missing entry surfaces. That check reaches only
events whose manifest entry declares a payload shape, and a class whose
`detail` it cannot read (declared through an imported type) is refused rather
than skipped; none is today. An event neither rule can type stops the parser,
rather than falling back to `CustomEvent`, and a native event declared
`CustomEvent` is refused too.

Refusing is a deliberate build stop: a Web Awesome release that adds a `wa-`
event without registering a class for it fails `generate:metadata` until the
class is pinned. Metadata regeneration only happens on a Web Awesome bump, so
the stop lands in the bump PR, which is where the new event must be looked at
anyway.

The native table (`NATIVE_EVENT_TYPES`) is still needed, and grew: the
manifest declares a type for few native events, so `wa-video`'s media events
(`play`, `pause`, `ended`, `volumechange`, `loadedmetadata`) take the `Event`
the HTML spec fires them as. It is consulted only after the manifest's own
declaration.

Handlers typed `CustomEvent` by a user no longer compile against the new
Templates, because the classes lack `initCustomEvent`. Scalar types moved too,
so the net change for native events is not nil: FileInput's `input` is `Event`
(what the manifest declares) where it was `InputEvent`, which breaks a handler
annotated `InputEvent`, and Video's media events are `Event` where they were
`CustomEvent`. Runtime behaviour is
unchanged, since the objects were always these classes. We ship it as a minor
release and flag it under Changed.
