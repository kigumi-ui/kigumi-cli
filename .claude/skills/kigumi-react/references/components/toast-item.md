# ToastItem

**Web Awesome**: `wa-toast-item`  
**Kigumi React**: `<ToastItem>`  
**Category**: Feedback  
**Tier**: pro

React wrapper component for the Web Awesome `wa-toast-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-toast-item variant="brand" size="small">Click me</wa-toast-item>
```

```tsx
// Kigumi React
import { ToastItem } from '@/components/ui';

<ToastItem variant="brand" size="small">
  Click me
</ToastItem>;
```

## Props

| Prop       | Type   | Values                                                     | Default   | Description                                                                            |
| ---------- | ------ | ---------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `variant`  | string | 'brand' \| 'success' \| 'warning' \| 'danger' \| 'neutral' | `neutral` | Colour scheme reflecting the notification intent                                       |
| `size`     | string | 'small' \| 'medium' \| 'large'                             | `medium`  | Controls the overall dimensions of the notification                                    |
| `duration` | number | -                                                          | `5000`    | Milliseconds before auto-dismiss. Use 0 to keep the notification visible until closed. |

## Slots

| Slot        | Description                                              |
| ----------- | -------------------------------------------------------- |
| _(default)_ | The toast item's message content.                        |
| `icon`      | An optional icon to show at the start of the toast item. |

## Events

| Event           | React Handler   | Type          | Description                                        |
| --------------- | --------------- | ------------- | -------------------------------------------------- |
| `wa-show`       | `onWaShow`      | `CustomEvent` | Emitted when the toast item begins to show.        |
| `wa-after-show` | `onWaAfterShow` | `CustomEvent` | Emitted after the toast item has finished showing. |
| `wa-hide`       | `onWaHide`      | `CustomEvent` | Emitted when the toast item begins to hide.        |
| `wa-after-hide` | `onWaAfterHide` | `CustomEvent` | Emitted after the toast item has finished hiding.  |

## CSS Parts

| Part                       | Description                                  |
| -------------------------- | -------------------------------------------- |
| `toast-item`               | The toast item's main container.             |
| `accent`                   | The colored accent line on the start side.   |
| `icon`                     | The icon container.                          |
| `content`                  | The message content container.               |
| `close-button`             | The close button element.                    |
| `progress-ring`            | The progress ring component.                 |
| `progress-ring__base`      | The progress ring's exported base part.      |
| `progress-ring__label`     | The progress ring's exported label part.     |
| `progress-ring__track`     | The progress ring's exported track part.     |
| `progress-ring__indicator` | The progress ring's exported indicator part. |
| `close-icon`               | The close icon element.                      |
| `close-icon__svg`          | The close icon's exported svg part.          |

## CSS Custom Properties

| Property          | Default | Description                                             |
| ----------------- | ------- | ------------------------------------------------------- |
| `--accent-width`  | -       | The width of the accent line. Defaults to 4px.          |
| `--show-duration` | -       | The animation duration when showing. Defaults to 200ms. |
| `--hide-duration` | -       | The animation duration when hiding. Defaults to 200ms.  |

## Methods

| Method   | Parameters | Description                                                      |
| -------- | ---------- | ---------------------------------------------------------------- |
| `hide()` | -          | Hides the toast item with animation and removes it from the DOM. |

## Installation

```bash
npx kigumi add toast-item
```

---

**Documentation**: [webawesome.com/docs/components/toast-item](https://webawesome.com/docs/components/toast-item)
