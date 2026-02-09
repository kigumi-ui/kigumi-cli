# Event Mapping

Web Awesome components emit custom events prefixed with `wa-`. These are mapped to React event handlers.

## Standard Events

| Web Awesome Event | React Handler         | Type                           |
| ----------------- | --------------------- | ------------------------------ |
| `wa-change`       | `onChange`            | `(event: CustomEvent) => void` |
| `wa-input`        | `onInput`             | `(event: CustomEvent) => void` |
| `wa-show`         | `onShow`              | `(event: CustomEvent) => void` |
| `wa-hide`         | `onHide`              | `(event: CustomEvent) => void` |
| `wa-after-show`   | `onAfterShow`         | `(event: CustomEvent) => void` |
| `wa-after-hide`   | `onAfterHide`         | `(event: CustomEvent) => void` |
| `wa-blur`         | `onBlur`              | `(event: FocusEvent) => void`  |
| `wa-focus`        | `onFocus`             | `(event: FocusEvent) => void`  |
| Standard events   | Standard React events | Native types                   |

## Example Usage

```tsx
import { useState } from "react";
import { Dialog, Button } from "@/components/ui";

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog
        open={open}
        onHide={() => setOpen(false)}
        onAfterShow={(e) => console.log("Dialog shown", e)}
      >
        Dialog content
      </Dialog>
    </>
  );
}
```
