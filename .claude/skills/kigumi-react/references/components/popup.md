# Popup

**Web Awesome**: `wa-popup`  
**Kigumi React**: `<Popup>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-popup` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-popup active anchor="value">Click me</wa-popup>
```

```tsx
// Kigumi React
import { Popup } from '@/components/ui';

<Popup active={true} anchor="value">
  Click me
</Popup>;
```

## Props

| Prop                       | Type    | Values                                                                                                                                                             | Default    | Description                     |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------- |
| `active`                   | boolean | -                                                                                                                                                                  | `false`    | Activates the positioning logic |
| `anchor`                   | string  | -                                                                                                                                                                  | `-`        | Anchor element ID or reference  |
| `placement`                | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `top`      | Preferred placement             |
| `strategy`                 | string  | 'absolute' \| 'fixed'                                                                                                                                              | `absolute` | Positioning strategy            |
| `distance`                 | number  | -                                                                                                                                                                  | `0`        | Distance from anchor            |
| `skidding`                 | number  | -                                                                                                                                                                  | `0`        | Offset along anchor             |
| `arrow`                    | boolean | -                                                                                                                                                                  | `false`    | Shows an arrow                  |
| `arrow-placement`          | string  | 'start' \| 'end' \| 'center' \| 'anchor'                                                                                                                           | `anchor`   | Arrow position                  |
| `arrow-padding`            | number  | -                                                                                                                                                                  | `10`       | Arrow edge padding              |
| `flip`                     | boolean | -                                                                                                                                                                  | `false`    | Flips when constrained          |
| `flip-fallback-placements` | string  | -                                                                                                                                                                  | `-`        | Fallback placements             |
| `flip-fallback-strategy`   | string  | 'best-fit' \| 'initial'                                                                                                                                            | `best-fit` | Fallback strategy               |
| `flip-padding`             | number  | -                                                                                                                                                                  | `0`        | Flip boundary padding           |
| `shift`                    | boolean | -                                                                                                                                                                  | `false`    | Shifts to stay visible          |
| `shift-padding`            | number  | -                                                                                                                                                                  | `0`        | Shift boundary padding          |
| `auto-size`                | string  | 'horizontal' \| 'vertical' \| 'both'                                                                                                                               | `-`        | Auto-resize behavior            |
| `sync`                     | string  | 'width' \| 'height' \| 'both'                                                                                                                                      | `-`        | Syncs dimensions with anchor    |
| `auto-size-padding`        | number  | -                                                                                                                                                                  | `0`        | Auto-size boundary padding      |

## Slots

| Slot        | Description                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| _(default)_ | The popup's content.                                                                                                                         |
| `anchor`    | The element the popup will be anchored to. If the anchor lives outside of the popup, you can use the `anchor` attribute or property instead. |

## Events

| Event           | React Handler    | Type          | Description                                                                                                                                          |
| --------------- | ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wa-reposition` | `onWaReposition` | `CustomEvent` | Emitted when the popup is repositioned. This event can fire a lot, so avoid putting expensive operations in your listener or consider debouncing it. |

## CSS Parts

| Part           | Description                                                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `arrow`        | The arrow's container. Avoid setting `top\|bottom\|left\|right` properties, as these values are assigned dynamically as the popup moves. This is most useful for applying a background color to match the popup, and maybe a border or box shadow. |
| `popup`        | The popup's container. Useful for setting a background color, box shadow, etc.                                                                                                                                                                     |
| `hover-bridge` | The hover bridge element. Only available when the `hover-bridge` option is enabled.                                                                                                                                                                |

## CSS Custom Properties

| Property                       | Default | Description                                                                                                                                                                                                                |
| ------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--arrow-size`                 | `6px`   | The size of the arrow. Note that an arrow won't be shown unless the `arrow` attribute is used.                                                                                                                             |
| `--popup-border-width`         | -       | The width of any custom border applied to the popup. This is used to reposition the arrow to overlap to the inside edge of the popup border.                                                                               |
| `--arrow-color`                | `black` | The color of the arrow.                                                                                                                                                                                                    |
| `--auto-size-available-width`  | -       | A read-only custom property that determines the amount of width the popup can be before overflowing. Useful for positioning child elements that need to overflow. This property is only available when using `auto-size`.  |
| `--auto-size-available-height` | -       | A read-only custom property that determines the amount of height the popup can be before overflowing. Useful for positioning child elements that need to overflow. This property is only available when using `auto-size`. |
| `--show-duration`              | `100ms` | The show duration to use when applying built-in animation classes.                                                                                                                                                         |
| `--hide-duration`              | `100ms` | The hide duration to use when applying built-in animation classes.                                                                                                                                                         |

## Methods

| Method         | Parameters | Description                                            |
| -------------- | ---------- | ------------------------------------------------------ |
| `reposition()` | -          | Forces the popup to recalculate and reposition itself. |

## Installation

```bash
npx kigumi add popup
```

---

**Documentation**: [webawesome.com/docs/components/popup](https://webawesome.com/docs/components/popup)
