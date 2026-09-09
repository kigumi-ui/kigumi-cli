# Kigumi

A CLI that generates React, Vue and Angular wrapper components around Web
Awesome web components. It copies source code into the user's project rather
than shipping a runtime library, so the generated files are the product.

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
A generated, committed wrapper file that the CLI later copies into a user's
project. Templates are generated output, never hand-edited.
_Avoid_: component (ambiguous with Web Awesome's own components)

**Adapter**:
The per-framework part of a shared process. Three adapters is the correct shape
where framework output genuinely differs; three copies of the same logic is not.

### Events

**Native event**:
An event a Web Awesome component fires that the DOM already defines, such as
`blur`, `change` or `input`. Its handler type is a real DOM interface and is
never Kigumi's to invent.

**Custom event**:
An event Web Awesome defines itself, always prefixed `wa-`. Carries a payload
in `detail` and is typed `CustomEvent` in generated wrappers.

**Event name transformation**:
Turning an event's DOM name into the identifier a framework uses for its
handler, such as `blur` becoming `onBlur` in React or `blurEvent` in Angular.
Genuinely differs per framework.
_Avoid_: event mapping (ambiguous with the type rule below)

**Event type mapping**:
Deciding which TypeScript type a handler receives for a given event. Depends
only on the event, never on the framework.
_Avoid_: event mapping
