# Event Mapping

Web Awesome components use two different event systems depending on the component type.

## Form Controls -- Native DOM Events

Components like `wa-button`, `wa-input`, `wa-select`, `wa-checkbox`, `wa-switch` emit **native browser events** (no `wa-` prefix). Event handlers receive standard `Event` / `FocusEvent` objects.

| Native Event | React Handler | Type         |
| ------------ | ------------- | ------------ |
| `blur`       | `onBlur`      | `FocusEvent` |
| `change`     | `onChange`    | `Event`      |
| `error`      | `onError`     | `Event`      |
| `focus`      | `onFocus`     | `FocusEvent` |
| `input`      | `onInput`     | `InputEvent` |
| `load`       | `onLoad`      | `Event`      |

```tsx
// Correct: native events
<Input
  onInput={(e) => console.log((e.target as HTMLInputElement).value)}
  onChange={(e) => console.log((e.target as HTMLInputElement).value)}
/>
```

## Overlay / Complex Components -- Custom `wa-` Events

Components like `wa-dialog`, `wa-drawer`, `wa-dropdown`, `wa-tooltip` emit **custom events** prefixed with `wa-`. Event handlers receive `CustomEvent` objects.

| Web Awesome Event     | React Handler         | Type          |
| --------------------- | --------------------- | ------------- |
| `wa-after-collapse`   | `onWaAfterCollapse`   | `CustomEvent` |
| `wa-after-expand`     | `onWaAfterExpand`     | `CustomEvent` |
| `wa-after-hide`       | `onWaAfterHide`       | `CustomEvent` |
| `wa-after-show`       | `onWaAfterShow`       | `CustomEvent` |
| `wa-cancel`           | `onWaCancel`          | `CustomEvent` |
| `wa-clear`            | `onWaClear`           | `CustomEvent` |
| `wa-collapse`         | `onWaCollapse`        | `CustomEvent` |
| `wa-copy`             | `onWaCopy`            | `CustomEvent` |
| `wa-create`           | `onWaCreate`          | `CustomEvent` |
| `wa-error`            | `onWaError`           | `CustomEvent` |
| `wa-expand`           | `onWaExpand`          | `CustomEvent` |
| `wa-finish`           | `onWaFinish`          | `CustomEvent` |
| `wa-hide`             | `onWaHide`            | `CustomEvent` |
| `wa-hover`            | `onWaHover`           | `CustomEvent` |
| `wa-include-error`    | `onWaIncludeError`    | `CustomEvent` |
| `wa-intersect`        | `onWaIntersect`       | `CustomEvent` |
| `wa-invalid`          | `onWaInvalid`         | `CustomEvent` |
| `wa-lazy-change`      | `onWaLazyChange`      | `CustomEvent` |
| `wa-lazy-load`        | `onWaLazyLoad`        | `CustomEvent` |
| `wa-load`             | `onWaLoad`            | `CustomEvent` |
| `wa-mutation`         | `onWaMutation`        | `CustomEvent` |
| `wa-remove`           | `onWaRemove`          | `CustomEvent` |
| `wa-reposition`       | `onWaReposition`      | `CustomEvent` |
| `wa-resize`           | `onWaResize`          | `CustomEvent` |
| `wa-select`           | `onWaSelect`          | `CustomEvent` |
| `wa-selection-change` | `onWaSelectionChange` | `CustomEvent` |
| `wa-show`             | `onWaShow`            | `CustomEvent` |
| `wa-slide-change`     | `onWaSlideChange`     | `CustomEvent` |
| `wa-start`            | `onWaStart`           | `CustomEvent` |
| `wa-tab-hide`         | `onWaTabHide`         | `CustomEvent` |
| `wa-tab-show`         | `onWaTabShow`         | `CustomEvent` |

```tsx
import { useState } from 'react';
import { Dialog, Button } from '@/components/ui';

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog
        open={open}
        onWaHide={() => setOpen(false)}
        onWaAfterShow={(e) => console.log('Dialog shown', e)}
      >
        Dialog content
      </Dialog>
    </>
  );
}
```
