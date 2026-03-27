# Select

**Web Awesome**: `wa-select`  
**Kigumi React**: `<Select>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-select` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-select name="''" value="value">Click me</wa-select>
```

```tsx
// Kigumi React
import { Select } from '@/components/ui';

<Select name="''" value="value">
  Click me
</Select>;
```

## Props

| Prop                  | Type    | Values                                      | Default    | Description                 |
| --------------------- | ------- | ------------------------------------------- | ---------- | --------------------------- |
| `name`                | string  | -                                           | `''`       | Form field name             |
| `value`               | string  | -                                           | `-`        | Selected value(s)           |
| `appearance`          | string  | 'filled' \| 'outlined' \| 'filled-outlined' | `outlined` | Visual appearance           |
| `size`                | string  | 'small' \| 'medium' \| 'large'              | `medium`   | Select size                 |
| `placeholder`         | string  | -                                           | `''`       | Placeholder text            |
| `multiple`            | boolean | -                                           | `false`    | Allows multiple selections  |
| `max-options-visible` | number  | -                                           | `3`        | Max visible tags (multiple) |
| `disabled`            | boolean | -                                           | `false`    | Disables the select         |
| `with-clear`          | boolean | -                                           | `false`    | Shows clear button          |
| `open`                | boolean | -                                           | `false`    | Whether listbox is open     |
| `hoist`               | boolean | -                                           | `false`    | Hoists to body              |
| `placement`           | string  | 'top' \| 'bottom'                           | `bottom`   | Listbox placement           |
| `pill`                | boolean | -                                           | `false`    | Rounded edges               |
| `label`               | string  | -                                           | `''`       | Label text                  |
| `hint`                | string  | -                                           | `''`       | Hint text                   |
| `required`            | boolean | -                                           | `false`    | Makes selection required    |
| `invalid`             | boolean | -                                           | `false`    | Shows invalid/error state   |
| `help-text`           | string  | -                                           | `''`       | Help text below the control |

## Slots

| Slot          | Description                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| _(default)_   | The listbox options. Must be `<wa-option>` elements. You can use `<wa-divider>` to group items visually. |
| `label`       | The input's label. Alternatively, you can use the `label` attribute.                                     |
| `start`       | An element, such as `<wa-icon>`, placed at the start of the combobox.                                    |
| `end`         | An element, such as `<wa-icon>`, placed at the end of the combobox.                                      |
| `clear-icon`  | An icon to use in lieu of the default clear icon.                                                        |
| `expand-icon` | The icon to show when the control is expanded and collapsed. Rotates on open and close.                  |
| `hint`        | Text that describes how to use the input. Alternatively, you can use the `hint` attribute.               |

## Events

| Event           | React Handler   | Type          | Description                                                                                       |
| --------------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `input`         | `onInput`       | `InputEvent`  | Emitted when the control receives input.                                                          |
| `change`        | `onChange`      | `Event`       | Emitted when the control's value changes.                                                         |
| `focus`         | `onFocus`       | `FocusEvent`  | Emitted when the control gains focus.                                                             |
| `blur`          | `onBlur`        | `FocusEvent`  | Emitted when the control loses focus.                                                             |
| `wa-clear`      | `onWaClear`     | `CustomEvent` | Emitted when the control's value is cleared.                                                      |
| `wa-show`       | `onWaShow`      | `CustomEvent` | Emitted when the select's menu opens.                                                             |
| `wa-after-show` | `onWaAfterShow` | `CustomEvent` | Emitted after the select's menu opens and all animations are complete.                            |
| `wa-hide`       | `onWaHide`      | `CustomEvent` | Emitted when the select's menu closes.                                                            |
| `wa-after-hide` | `onWaAfterHide` | `CustomEvent` | Emitted after the select's menu closes and all animations are complete.                           |
| `wa-invalid`    | `onWaInvalid`   | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                       | Description                                                                   |
| -------------------------- | ----------------------------------------------------------------------------- |
| `form-control`             | The form control that wraps the label, input, and hint.                       |
| `form-control-label`       | The label's wrapper.                                                          |
| `form-control-input`       | The select's wrapper.                                                         |
| `hint`                     | The hint's wrapper.                                                           |
| `combobox`                 | The container the wraps the start, end, value, clear icon, and expand button. |
| `start`                    | The container that wraps the `start` slot.                                    |
| `end`                      | The container that wraps the `end` slot.                                      |
| `display-input`            | The element that displays the selected option's label, an `<input>` element.  |
| `listbox`                  | The listbox container where options are slotted.                              |
| `tags`                     | The container that houses option tags when `multiselect` is used.             |
| `tag`                      | The individual tags that represent each multiselect option.                   |
| `tag__content`             | The tag's content part.                                                       |
| `tag__remove-button`       | The tag's remove button.                                                      |
| `tag__remove-button__base` | The tag's remove button base part.                                            |
| `clear-button`             | The clear button.                                                             |
| `expand-icon`              | The container that wraps the expand icon.                                     |

## CSS Custom Properties

| Property          | Default | Description                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------------ |
| `--show-duration` | `100ms` | The duration of the show animation.                                            |
| `--hide-duration` | `100ms` | The duration of the hide animation.                                            |
| `--tag-max-size`  | `10ch`  | When using `multiple`, the max size of tags before their content is truncated. |

## Methods

| Method    | Parameters              | Description                     |
| --------- | ----------------------- | ------------------------------- |
| `show()`  | -                       | Shows the listbox.              |
| `hide()`  | -                       | Hides the listbox.              |
| `focus()` | `options: FocusOptions` | Sets focus on the control.      |
| `blur()`  | -                       | Removes focus from the control. |

## Dependencies

This component requires:

- [`Icon`](icon.md)
- [`Option`](option.md)
- [`Popup`](popup.md)
- [`Tag`](tag.md)

## Installation

```bash
npx kigumi add select
```

---

**Documentation**: [webawesome.com/docs/components/select](https://webawesome.com/docs/components/select)
