# CopyButton

**Web Awesome**: `wa-copy-button`  
**Kigumi React**: `<CopyButton>`  
**Category**: Actions  
**Tier**: free

React wrapper component for the Web Awesome `wa-copy-button` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-copy-button value="''" from="''">Click me</wa-copy-button>
```

```tsx
// Kigumi React
import { CopyButton } from '@/components/ui';

<CopyButton value="''" from="''">
  Click me
</CopyButton>;
```

## Props

| Prop                | Type    | Values                                 | Default | Description                                |
| ------------------- | ------- | -------------------------------------- | ------- | ------------------------------------------ |
| `value`             | string  | -                                      | `''`    | The text to copy                           |
| `from`              | string  | -                                      | `''`    | Element selector to copy text from         |
| `disabled`          | boolean | -                                      | `false` | Disables the button                        |
| `copy-label`        | string  | -                                      | `''`    | Tooltip label for copy state               |
| `success-label`     | string  | -                                      | `''`    | Tooltip label for success state            |
| `error-label`       | string  | -                                      | `''`    | Tooltip label for error state              |
| `feedback-duration` | number  | -                                      | `1000`  | Duration of feedback state in milliseconds |
| `tooltip-placement` | string  | 'top' \| 'right' \| 'bottom' \| 'left' | `top`   | Tooltip position                           |

## Slots

| Slot           | Description                                                               |
| -------------- | ------------------------------------------------------------------------- |
| `copy-icon`    | The icon to show in the default copy state. Works best with `<wa-icon>`.  |
| `success-icon` | The icon to show when the content is copied. Works best with `<wa-icon>`. |
| `error-icon`   | The icon to show when a copy error occurs. Works best with `<wa-icon>`.   |

## Events

| Event      | React Handler | Type          | Description                                |
| ---------- | ------------- | ------------- | ------------------------------------------ |
| `wa-copy`  | `onWaCopy`    | `CustomEvent` | Emitted when the data has been copied.     |
| `wa-error` | `onWaError`   | `CustomEvent` | Emitted when the data could not be copied. |

## CSS Parts

| Part                   | Description                                |
| ---------------------- | ------------------------------------------ |
| `button`               | The internal `<button>` element.           |
| `copy-icon`            | The container that holds the copy icon.    |
| `success-icon`         | The container that holds the success icon. |
| `error-icon`           | The container that holds the error icon.   |
| `tooltip__base`        | The tooltip's exported `base` part.        |
| `tooltip__base__popup` | The tooltip's exported `popup` part.       |
| `tooltip__base__arrow` | The tooltip's exported `arrow` part.       |
| `tooltip__body`        | The tooltip's exported `body` part.        |

## Dependencies

This component requires:

- [`Icon`](icon.md)
- [`Tooltip`](tooltip.md)

## Installation

```bash
npx kigumi add copy-button
```

---

**Documentation**: [webawesome.com/docs/components/copy-button](https://webawesome.com/docs/components/copy-button)
