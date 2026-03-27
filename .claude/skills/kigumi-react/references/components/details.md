# Details

**Web Awesome**: `wa-details`  
**Kigumi React**: `<Details>`  
**Category**: Organization  
**Tier**: free

React wrapper component for the Web Awesome `wa-details` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-details open summary="value">Click me</wa-details>
```

```tsx
// Kigumi React
import { Details } from '@/components/ui';

<Details open={true} summary="value">
  Click me
</Details>;
```

## Props

| Prop             | Type    | Values                                                 | Default    | Description                      |
| ---------------- | ------- | ------------------------------------------------------ | ---------- | -------------------------------- |
| `open`           | boolean | -                                                      | `false`    | Whether the details are expanded |
| `summary`        | string  | -                                                      | `-`        | Summary text shown in header     |
| `disabled`       | boolean | -                                                      | `false`    | Disables the details             |
| `appearance`     | string  | 'filled' \| 'outlined' \| 'filled-outlined' \| 'plain' | `outlined` | Visual appearance style          |
| `icon-placement` | string  | 'start' \| 'end'                                       | `end`      | Position of the expand icon      |
| `name`           | string  | -                                                      | `-`        | Name for accordion grouping      |

## Slots

| Slot            | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| _(default)_     | The details' main content.                                                         |
| `summary`       | The details' summary. Alternatively, you can use the `summary` attribute.          |
| `expand-icon`   | Optional expand icon to use instead of the default. Works best with `<wa-icon>`.   |
| `collapse-icon` | Optional collapse icon to use instead of the default. Works best with `<wa-icon>`. |

## Events

| Event           | React Handler   | Type          | Description                                                       |
| --------------- | --------------- | ------------- | ----------------------------------------------------------------- |
| `wa-show`       | `onWaShow`      | `CustomEvent` | Emitted when the details opens.                                   |
| `wa-after-show` | `onWaAfterShow` | `CustomEvent` | Emitted after the details opens and all animations are complete.  |
| `wa-hide`       | `onWaHide`      | `CustomEvent` | Emitted when the details closes.                                  |
| `wa-after-hide` | `onWaAfterHide` | `CustomEvent` | Emitted after the details closes and all animations are complete. |

## CSS Parts

| Part      | Description                                                                                                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base`    | The inner `<details>` element used to render the component. Styles you apply to the component are automatically applied to this part, so you usually don't need to deal with it unless you need to set the `display` property. |
| `header`  | The header that wraps both the summary and the expand/collapse icon.                                                                                                                                                           |
| `summary` | The container that wraps the summary.                                                                                                                                                                                          |
| `icon`    | The container that wraps the expand/collapse icons.                                                                                                                                                                            |
| `content` | The details content.                                                                                                                                                                                                           |

## CSS Custom Properties

| Property          | Default | Description                                                                          |
| ----------------- | ------- | ------------------------------------------------------------------------------------ |
| `--spacing`       | -       | The amount of space around and between the details' content. Expects a single value. |
| `--show-duration` | `200ms` | The show duration to use when applying built-in animation classes.                   |
| `--hide-duration` | `200ms` | The hide duration to use when applying built-in animation classes.                   |

## Methods

| Method   | Parameters | Description        |
| -------- | ---------- | ------------------ |
| `show()` | -          | Shows the details. |
| `hide()` | -          | Hides the details  |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add details
```

---

**Documentation**: [webawesome.com/docs/components/details](https://webawesome.com/docs/components/details)
