# Slider

**Web Awesome**: `wa-slider`  
**Kigumi React**: `<Slider>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-slider` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-slider name="''" value="0">Click me</wa-slider>
```

```tsx
// Kigumi React
import { Slider } from '@/components/ui';

<Slider name="''" value="0">
  Click me
</Slider>;
```

## Props

| Prop           | Type    | Values                         | Default      | Description                                   |
| -------------- | ------- | ------------------------------ | ------------ | --------------------------------------------- |
| `name`         | string  | -                              | `''`         | Form field name                               |
| `value`        | number  | -                              | `0`          | Current value                                 |
| `label`        | string  | -                              | `''`         | Accessible label                              |
| `hint`         | string  | -                              | `''`         | Hint text                                     |
| `min`          | number  | -                              | `0`          | Minimum value                                 |
| `max`          | number  | -                              | `100`        | Maximum value                                 |
| `step`         | number  | -                              | `1`          | Step increment                                |
| `orientation`  | string  | 'horizontal' \| 'vertical'     | `horizontal` | The orientation of the slider                 |
| `disabled`     | boolean | -                              | `false`      | Disables the slider                           |
| `readonly`     | boolean | -                              | `false`      | Makes the slider readonly                     |
| `range`        | boolean | -                              | `false`      | Converts to a range slider with two thumbs    |
| `with-markers` | boolean | -                              | `false`      | Draws markers at each step                    |
| `with-tooltip` | boolean | -                              | `true`       | Draws a tooltip above the thumb               |
| `size`         | string  | 'small' \| 'medium' \| 'large' | `medium`     | Slider size                                   |
| `autofocus`    | boolean | -                              | `false`      | Automatically focuses the slider on page load |

## Slots

| Slot        | Description                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------- |
| `label`     | The slider label. Alternatively, you can use the `label` attribute.                                 |
| `hint`      | Text that describes how to use the input. Alternatively, you can use the `hint` attribute. instead. |
| `reference` | One or more reference labels to show visually below the slider.                                     |

## Events

| Event        | React Handler | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `change`     | `onChange`    | `Event`       | Emitted when an alteration to the control's value is committed by the user.                       |
| `blur`       | `onBlur`      | `FocusEvent`  | Emitted when the control loses focus.                                                             |
| `focus`      | `onFocus`     | `FocusEvent`  | Emitted when the control gains focus.                                                             |
| `input`      | `onInput`     | `InputEvent`  | Emitted when the control receives input.                                                          |
| `wa-invalid` | `onWaInvalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part               | Description                                                                         |
| ------------------ | ----------------------------------------------------------------------------------- |
| `label`            | The element that contains the sliders's label.                                      |
| `hint`             | The element that contains the slider's description.                                 |
| `slider`           | The focusable element with `role="slider"`. Contains the track and reference slot.  |
| `track`            | The slider's track.                                                                 |
| `indicator`        | The colored indicator that shows from the start of the slider to the current value. |
| `markers`          | The container that holds all the markers when `with-markers` is used.               |
| `marker`           | The individual markers that are shown when `with-markers` is used.                  |
| `references`       | The container that holds references that get slotted in.                            |
| `thumb`            | The slider's thumb.                                                                 |
| `thumb-min`        | The min value thumb in a range slider.                                              |
| `thumb-max`        | The max value thumb in a range slider.                                              |
| `tooltip`          | The tooltip, a `<wa-tooltip>` element.                                              |
| `tooltip__tooltip` | The tooltip's `tooltip` part.                                                       |
| `tooltip__content` | The tooltip's `content` part.                                                       |
| `tooltip__arrow`   | The tooltip's `arrow` part.                                                         |

## CSS Custom Properties

| Property          | Default    | Description                                |
| ----------------- | ---------- | ------------------------------------------ |
| `--track-size`    | `0.75em`   | The height or width of the slider's track. |
| `--marker-width`  | `0.1875em` | The width of each individual marker.       |
| `--marker-height` | `0.1875em` | The height of each individual marker.      |
| `--thumb-width`   | `1.25em`   | The width of the thumb.                    |
| `--thumb-height`  | `1.25em`   | The height of the thumb.                   |

## Methods

| Method       | Parameters | Description                                                                                                                                    |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus()`    | -          | Sets focus to the slider.                                                                                                                      |
| `blur()`     | -          | Removes focus from the slider.                                                                                                                 |
| `stepDown()` | -          | Decreases the slider's value by `step`. This is a programmatic change, so `input` and `change` events will not be emitted when this is called. |
| `stepUp()`   | -          | Increases the slider's value by `step`. This is a programmatic change, so `input` and `change` events will not be emitted when this is called. |

## Installation

```bash
npx kigumi add slider
```

---

**Documentation**: [webawesome.com/docs/components/slider](https://webawesome.com/docs/components/slider)
