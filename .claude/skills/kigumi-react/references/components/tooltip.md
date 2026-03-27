# Tooltip

**Web Awesome**: `wa-tooltip`  
**Kigumi React**: `<Tooltip>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-tooltip` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tooltip placement="top" disabled>Click me</wa-tooltip>
```

```tsx
// Kigumi React
import { Tooltip } from '@/components/ui';

<Tooltip placement="top" disabled={true}>
  Click me
</Tooltip>;
```

## Props

| Prop            | Type    | Values                                                                                                                                                             | Default       | Description                                      |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------ |
| `placement`     | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `top`         | Tooltip placement                                |
| `disabled`      | boolean | -                                                                                                                                                                  | `false`       | Disables the tooltip                             |
| `distance`      | number  | -                                                                                                                                                                  | `8`           | Distance from target                             |
| `open`          | boolean | -                                                                                                                                                                  | `false`       | Whether the tooltip is open                      |
| `skidding`      | number  | -                                                                                                                                                                  | `0`           | Offset along target                              |
| `trigger`       | string  | -                                                                                                                                                                  | `hover focus` | Activation events                                |
| `without-arrow` | boolean | -                                                                                                                                                                  | `false`       | Hides the arrow                                  |
| `show-delay`    | number  | -                                                                                                                                                                  | `150`         | Show delay (ms)                                  |
| `hide-delay`    | number  | -                                                                                                                                                                  | `0`           | Hide delay (ms)                                  |
| `for`           | string  | -                                                                                                                                                                  | `-`           | The ID of the element the tooltip is anchored to |

## Slots

| Slot        | Description                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------ |
| _(default)_ | The tooltip's default slot where any content should live. Interactive content should be avoided. |

## Events

| Event           | React Handler   | Type          | Description                                                           |
| --------------- | --------------- | ------------- | --------------------------------------------------------------------- |
| `wa-show`       | `onWaShow`      | `CustomEvent` | Emitted when the tooltip begins to show.                              |
| `wa-after-show` | `onWaAfterShow` | `CustomEvent` | Emitted after the tooltip has shown and all animations are complete.  |
| `wa-hide`       | `onWaHide`      | `CustomEvent` | Emitted when the tooltip begins to hide.                              |
| `wa-after-hide` | `onWaAfterHide` | `CustomEvent` | Emitted after the tooltip has hidden and all animations are complete. |

## CSS Parts

| Part          | Description                                                                          |
| ------------- | ------------------------------------------------------------------------------------ |
| `base`        | The component's base wrapper, an `<wa-popup>` element.                               |
| `base__popup` | The popup's exported `popup` part. Use this to target the tooltip's popup container. |
| `base__arrow` | The popup's exported `arrow` part. Use this to target the tooltip's arrow.           |
| `body`        | The tooltip's body where its content is rendered.                                    |

## CSS Custom Properties

| Property      | Default | Description                                                    |
| ------------- | ------- | -------------------------------------------------------------- |
| `--max-width` | -       | The maximum width of the tooltip before its content will wrap. |

## Methods

| Method   | Parameters | Description        |
| -------- | ---------- | ------------------ |
| `show()` | -          | Shows the tooltip. |
| `hide()` | -          | Hides the tooltip  |

## Dependencies

This component requires:

- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add tooltip
```

---

**Documentation**: [webawesome.com/docs/components/tooltip](https://webawesome.com/docs/components/tooltip)
