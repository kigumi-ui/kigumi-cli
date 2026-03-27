# Dropdown

**Web Awesome**: `wa-dropdown`  
**Kigumi React**: `<Dropdown>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-dropdown` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-dropdown open placement="top">Click me</wa-dropdown>
```

```tsx
// Kigumi React
import { Dropdown } from '@/components/ui';

<Dropdown open={true} placement="top">
  Click me
</Dropdown>;
```

## Props

| Prop                  | Type    | Values                                                                                                                                                             | Default        | Description                                      |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------ |
| `open`                | boolean | -                                                                                                                                                                  | `false`        | Indicates whether the dropdown is open           |
| `placement`           | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `bottom-start` | Preferred placement of the dropdown panel        |
| `disabled`            | boolean | -                                                                                                                                                                  | `false`        | Disables the dropdown                            |
| `stay-open-on-select` | boolean | -                                                                                                                                                                  | `false`        | Keeps the dropdown open when an item is selected |
| `distance`            | number  | -                                                                                                                                                                  | `0`            | Distance from the panel to the trigger           |
| `skidding`            | number  | -                                                                                                                                                                  | `0`            | Offset along the trigger                         |
| `hoist`               | boolean | -                                                                                                                                                                  | `false`        | Hoists the dropdown panel to the body            |
| `size`                | string  | 'small' \| 'medium' \| 'large'                                                                                                                                     | `medium`       | Dropdown size                                    |

## Slots

| Slot        | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| _(default)_ | The dropdown's items, typically `<wa-dropdown-item>` elements.                 |
| `trigger`   | The element that triggers the dropdown, such as a `<wa-button>` or `<button>`. |

## Events

| Event           | React Handler   | Type          | Description                                       |
| --------------- | --------------- | ------------- | ------------------------------------------------- |
| `wa-show`       | `onWaShow`      | `CustomEvent` | Emitted when the dropdown is about to show.       |
| `wa-after-show` | `onWaAfterShow` | `CustomEvent` | Emitted after the dropdown has been shown.        |
| `wa-hide`       | `onWaHide`      | `CustomEvent` | Emitted when the dropdown is about to hide.       |
| `wa-after-hide` | `onWaAfterHide` | `CustomEvent` | Emitted after the dropdown has been hidden.       |
| `wa-select`     | `onWaSelect`    | `CustomEvent` | Emitted when an item in the dropdown is selected. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's host element. |
| `menu` | The dropdown menu container.  |

## CSS Custom Properties

| Property          | Default | Description                         |
| ----------------- | ------- | ----------------------------------- |
| `--show-duration` | -       | The duration of the show animation. |
| `--hide-duration` | -       | The duration of the hide animation. |

## Dependencies

This component requires:

- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add dropdown
```

---

**Documentation**: [webawesome.com/docs/components/dropdown](https://webawesome.com/docs/components/dropdown)
