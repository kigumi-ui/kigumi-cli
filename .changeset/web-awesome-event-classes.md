---
'kigumi': minor
---

### Changed

- **Event handlers**: `wa-` event handlers are now typed with the Web Awesome class the component dispatches, instead of `CustomEvent`, in React, Vue and Angular. Examples: `onHide?: (event: WaHideEvent) => void`, `'wa-hide': [event: WaHideEvent]` and `EventEmitter<WaHideEvent>`. Payloads are now typed on `event.detail`, including events Web Awesome's manifest leaves untyped. Examples: Dropdown `wa-select` gives `event.detail.item`, Pagination `wa-page-change` gives `event.detail.page`, and Accordion `wa-expand` gives `event.detail.item`. Runtime behaviour is unchanged. Run `kigumi update` to pick this up in installed components.
  - **Migration**: Web Awesome's event classes extend `Event`, not `CustomEvent`, so a handler annotated `(e: CustomEvent) => …` no longer type-checks. Remove the annotation and let the prop type infer it, or import the class from your installed package: `import type { WaHideEvent } from '@awesome.me/webawesome/dist/events/hide.js'` (Pro: `@awesome.me/webawesome-pro/dist/events/hide.js`).
  - **Migration**: FileInput's `onInput` / `@input` / `(inputEvent)` is now typed `Event` (see Fixed), so a handler annotated `(e: InputEvent) => …` no longer type-checks either. Annotate it `Event`, or leave it unannotated.

### Fixed

- **FileInput**: `input` handlers are typed `Event`, not `InputEvent`, which is the type Web Awesome's manifest declares for this event (unlike Combobox, DateInput and NumberInput, whose `input` it declares `InputEvent`). The old type promised `inputType` and `data`, which the declared `Event` does not carry.
- **Video**: `play`, `pause`, `ended`, `timeupdate`, `volumechange` and `loadedmetadata` handlers are typed `Event`, not `CustomEvent`.
