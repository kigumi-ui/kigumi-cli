# Kigumi

A CLI that generates React, Vue and Angular Templates around Web Awesome web
components. It copies source code into the user's project rather than shipping
a runtime library, so the generated files are the product.

## Language

### Generation pipeline

**Custom Elements Manifest (CEM)**:
Web Awesome's machine-readable description of its components, their props and
their events. Kigumi's only upstream source of truth about component shape.
_Avoid_: manifest, custom-elements.json (when referring to the concept)

**Component metadata**:
Kigumi's own derived description of a component, parsed from the CEM and
committed to the repo. What the generators actually read.
_Avoid_: registry data (that is a separate thing)

**Registry**:
The catalogue of which components exist, their tier, and which files each one
ships. Distinct from component metadata: the registry says _what exists_,
metadata says _what shape it has_.

**Generator**:
A script that turns component metadata into template files for one framework.
There is one per framework, because output shape genuinely differs.

**Template**:
A generated, committed file that the CLI later copies into a user's project.
Templates are generated output, never hand-edited.
_Avoid_: wrapper, component (ambiguous with Web Awesome's own components)

**Adapter**:
The per-framework part of a shared process. Three adapters is the correct shape
where framework output genuinely differs; three copies of the same logic is not.

### Starters

**Starter**:
A real consumer application repository used as install smoke. Its component set
is a fixed integration contract, not a catalogue of Templates.
_Avoid_: test app

**Starter fixture**:
Committed `kigumi add` output against that fixed set. Adding a Template does
not add a fixture.
_Avoid_: snapshot (that is `.kigumi/snapshots/` for three-way merge)

### Events

**Native event**:
An event a Web Awesome component fires that the DOM already defines, such as
`blur`, `change` or `input`. Its handler type is a real DOM interface and is
never Kigumi's to invent.

**Custom event**:
An event Web Awesome defines itself, always prefixed `wa-`. Dispatched as a
Web Awesome event class (`WaHideEvent`, extending `Event`, not `CustomEvent`)
that may carry a typed payload in `detail`. Generated Templates type the
handler with that class.

**Event class**:
The class Web Awesome declares for a custom event under its package's
`dist/events/`, registered for one event name in `GlobalEventHandlersEventMap`.
A component that dispatches a second class under a shared name (the accordion's
`WaAccordionExpandEvent` as `wa-expand`) is pinned in `EVENT_CLASS_OVERRIDES`.
_Avoid_: event name (that is the DOM name, `wa-hide`), `eventName` (the
manifest's pascal-cased label, which is not a type)

**Manifest artifact**:
An event the CEM declares that the component never fires. When a component
dispatches `new WaStepChangeEvent(detail)`, the analyzer also records an event
named after the argument (`detail`) typed with the class, but every event class
hard-codes its `wa-` name, so only `wa-step-change` ever arrives. Pinned in
`MANIFEST_EVENT_ARTIFACTS` against the real event it shadows, and dropped by
the parser.
_Avoid_: phantom event, fake event

**Event name transformation**:
Turning an event's DOM name into the identifier a framework uses for its
handler, such as `blur` becoming `onBlur` in React or `blurEvent` in Angular.
Genuinely differs per framework.
_Avoid_: event mapping (ambiguous with the type rule below)

**Event type mapping**:
Deciding which TypeScript type a handler receives for a given event. Depends
only on the event, never on the framework.
_Avoid_: event mapping

### Kigumi Studio

**Built-in theme**:
One of the themes Web Awesome ships, chosen per project. Kigumi selects it but
does not author it.
_Avoid_: base theme, preset

**Custom theme**:
The user's own theme, built in Kigumi Studio: `--wa-*` values for light and
dark mode, the components that get a shadow, and its custom CSS. Overrides the
built-in theme.
_Avoid_: preset (that is only a starting point), Studio theme

**Custom CSS**:
The free-form CSS rules of a custom theme, for what its `--wa-*` values and
shadow components cannot express. One set of rules for both modes; dark-mode
rules are written under `.wa-dark`. Kept apart from the rest of the theme, so
it always takes precedence over it.
_Avoid_: overrides, custom styles

**Preset**:
A finished custom theme that ships with Kigumi Studio as a starting point.
Loading one replaces the custom theme being edited.
_Avoid_: template, theme

**Theme Agent**:
The AI assistant in Kigumi Studio that builds and refines a custom theme from
text instructions, in conversation with the user.
_Avoid_: preset agent, theme generator

**Locked value**:
A value in the custom theme, for one mode, that the user locked with its
"Lock value" switch in the Studio sidebar. A mode-independent value is locked
in both modes, and the list of components that get a shadow is one value too.
The Theme Agent may change every value that is not locked and never changes a
locked one. Locks survive a reload and a reset, and are not part of the
exported theme.
_Avoid_: hand-set value, pinned value, protected value

**Held change**:
What an answer proposed for a locked value, or for a value the user changed
while the answer was being written, held back instead of applied. Under the
latest answer the user can apply each held change, or all of them; applying a
locked value unlocks it ("Unlock and apply"). A value changed since the answer
is not applied. Sending the next message keeps the rest as they are, and
undoing the answer locks again what it unlocked, unless that value changed
since. A held change that would fix a failing contrast pair names that pair.
_Avoid_: change request, suggestion
