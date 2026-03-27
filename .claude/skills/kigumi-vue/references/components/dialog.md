# Dialog

**Web Awesome**: `wa-dialog`  
**Kigumi Vue**: `<Dialog>`  
**Category**: Overlays  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-dialog` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-dialog open label="''">Click me</wa-dialog>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Dialog } from '@/components/ui';
</script>

<template>
  <Dialog open label="''"> Click me </Dialog>
</template>
```

## Props

| Prop             | Type    | Values | Default | Description                                                                |
| ---------------- | ------- | ------ | ------- | -------------------------------------------------------------------------- |
| `open`           | boolean | -      | `false` | Indicates whether or not the dialog is open                                |
| `label`          | string  | -      | `''`    | The dialog's label as displayed in the header                              |
| `without-header` | boolean | -      | `false` | Disables the header and removes the default close button                   |
| `light-dismiss`  | boolean | -      | `false` | When enabled, the dialog will be closed when the user clicks outside of it |

## Slots

| Slot             | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| _(default)_      | The dialog's main content.                                                     |
| `label`          | The dialog's label. Alternatively, you can use the `label` attribute.          |
| `header-actions` | Optional actions to add to the header. Works best with `<wa-button>`.          |
| `footer`         | The dialog's footer, usually one or more buttons representing various options. |

## Events

| Event           | Vue Handler      | Type          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wa-show`       | `@wa-show`       | `CustomEvent` | Emitted when the dialog opens.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `wa-after-show` | `@wa-after-show` | `CustomEvent` | Emitted after the dialog opens and all animations are complete.                                                                                                                                                                                                                                                                                                                                                                            |
| `wa-hide`       | `@wa-hide`       | `CustomEvent` | Emitted when the dialog is requested to close. Calling `event.preventDefault()` will prevent the dialog from closing. You can inspect `event.detail.source` to see which element caused the dialog to close. If the source is the dialog element itself, the user has pressed [[Escape]] or the dialog has been closed programmatically. Avoid using this unless closing the dialog will result in destructive behavior such as data loss. |
| `wa-after-hide` | `@wa-after-hide` | `CustomEvent` | Emitted after the dialog closes and all animations are complete.                                                                                                                                                                                                                                                                                                                                                                           |

## CSS Parts

| Part                 | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `dialog`             | The dialog's internal `<dialog>` element.                             |
| `header`             | The dialog's header. This element wraps the title and header actions. |
| `header-actions`     | Optional actions to add to the header. Works best with `<wa-button>`. |
| `title`              | The dialog's title.                                                   |
| `close-button`       | The close button, a `<wa-button>`.                                    |
| `close-button__base` | The close button's exported `base` part.                              |
| `body`               | The dialog's body.                                                    |
| `footer`             | The dialog's footer.                                                  |

## CSS Custom Properties

| Property          | Default | Description                                                                                         |
| ----------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `--spacing`       | -       | The amount of space around and between the dialog's content.                                        |
| `--width`         | -       | The preferred width of the dialog. Note that the dialog will shrink to accommodate smaller screens. |
| `--show-duration` | `200ms` | The animation duration when showing the dialog.                                                     |
| `--hide-duration` | `200ms` | The animation duration when hiding the dialog.                                                      |

## Methods

| Method           | Parameters | Description        |
| ---------------- | ---------- | ------------------ |
| `show()`         | -          | Shows the dialog.  |
| `requestClose()` | -          | Closes the dialog. |

## Installation

```bash
npx kigumi add dialog
```

---

**Documentation**: [webawesome.com/docs/components/dialog](https://webawesome.com/docs/components/dialog)
