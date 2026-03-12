# Event Mapping

Web Awesome components use two different event systems depending on the component type.

## Form Controls — Native DOM Events

`wa-button`, `wa-input`, `wa-number-input`, `wa-file-input`, `wa-textarea`, `wa-select`, `wa-checkbox`, `wa-switch` emit **native browser events** (no `wa-` prefix). Event handlers receive standard `Event` / `FocusEvent` objects — use `e.target.value`, `e.target.files`, etc.

| Native Event | React Handler | Type         |
| ------------ | ------------- | ------------ |
| `blur`       | `onBlur`      | `FocusEvent` |
| `focus`      | `onFocus`     | `FocusEvent` |
| `input`      | `onInput`     | `Event`      |
| `change`     | `onChange`    | `Event`      |

```tsx
// Correct: native events
<Input
  onInput={(e) => console.log((e.target as HTMLInputElement).value)}
  onChange={(e) => console.log((e.target as HTMLInputElement).value)}
/>

// Wrong: these events don't fire on form controls
<Input onInput={(e: CustomEvent) => console.log(e.detail.value)} />
```

## Overlay / Complex Components — Custom `wa-` Events

`wa-dialog`, `wa-drawer`, `wa-dropdown`, `wa-popup`, `wa-tooltip`, etc. emit **custom events** prefixed with `wa-`. Event handlers receive `CustomEvent` objects.

| Web Awesome Event | React Handler | Type          |
| ----------------- | ------------- | ------------- |
| `wa-show`         | `onShow`      | `CustomEvent` |
| `wa-hide`         | `onHide`      | `CustomEvent` |
| `wa-after-show`   | `onAfterShow` | `CustomEvent` |
| `wa-after-hide`   | `onAfterHide` | `CustomEvent` |
| `wa-clear`        | `onClear`     | `CustomEvent` |
| `wa-invalid`      | `onInvalid`   | `CustomEvent` |

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
        onHide={() => setOpen(false)}
        onAfterShow={(e) => console.log('Dialog shown', e)}
      >
        Dialog content
      </Dialog>
    </>
  );
}
```
