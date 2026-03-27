# Drawer

**Web Awesome**: `wa-drawer`  
**Kigumi Vue**: `<Drawer>`  
**Category**: Overlays  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-drawer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-drawer open label="''">Click me</wa-drawer>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Drawer } from '@/components/ui';
</script>

<template>
  <Drawer open label="''"> Click me </Drawer>
</template>
```

## Props

| Prop             | Type    | Values                                | Default | Description                                          |
| ---------------- | ------- | ------------------------------------- | ------- | ---------------------------------------------------- |
| `open`           | boolean | -                                     | `false` | Indicates whether the drawer is open                 |
| `label`          | string  | -                                     | `''`    | The drawer's label as displayed in the header        |
| `placement`      | string  | 'top' \| 'end' \| 'bottom' \| 'start' | `end`   | The direction from which the drawer will open        |
| `light-dismiss`  | boolean | -                                     | `false` | Closes the drawer when the user clicks outside of it |
| `without-header` | boolean | -                                     | `false` | Removes the header                                   |

## Slots

| Slot             | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| _(default)_      | The drawer's main content.                                                     |
| `label`          | The drawer's label. Alternatively, you can use the `label` attribute.          |
| `header-actions` | Optional actions to add to the header. Works best with `<wa-button>`.          |
| `footer`         | The drawer's footer, usually one or more buttons representing various options. |

## Events

| Event           | Vue Handler      | Type          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wa-show`       | `@wa-show`       | `CustomEvent` | Emitted when the drawer opens.                                                                                                                                                                                                                                                                                                                                                                                                              |
| `wa-after-show` | `@wa-after-show` | `CustomEvent` | Emitted after the drawer opens and all animations are complete.                                                                                                                                                                                                                                                                                                                                                                             |
| `wa-hide`       | `@wa-hide`       | `CustomEvent` | Emitted when the drawer is requesting to close. Calling `event.preventDefault()` will prevent the drawer from closing. You can inspect `event.detail.source` to see which element caused the drawer to close. If the source is the drawer element itself, the user has pressed [[Escape]] or the drawer has been closed programmatically. Avoid using this unless closing the drawer will result in destructive behavior such as data loss. |
| `wa-after-hide` | `@wa-after-hide` | `CustomEvent` | Emitted after the drawer closes and all animations are complete.                                                                                                                                                                                                                                                                                                                                                                            |

## CSS Parts

| Part                 | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| `dialog`             | The drawer's internal `<dialog>` element.                             |
| `header`             | The drawer's header. This element wraps the title and header actions. |
| `header-actions`     | Optional actions to add to the header. Works best with `<wa-button>`. |
| `title`              | The drawer's title.                                                   |
| `close-button`       | The close button, a `<wa-button>`.                                    |
| `close-button__base` | The close button's exported `base` part.                              |
| `body`               | The drawer's body.                                                    |
| `footer`             | The drawer's footer.                                                  |

## CSS Custom Properties

| Property          | Default | Description                                                                                                                                                                           |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--spacing`       | -       | The amount of space around and between the drawer's content.                                                                                                                          |
| `--size`          | -       | The preferred size of the drawer. This will be applied to the drawer's width or height depending on its `placement`. Note that the drawer will shrink to accommodate smaller screens. |
| `--show-duration` | `200ms` | The animation duration when showing the drawer.                                                                                                                                       |
| `--hide-duration` | `200ms` | The animation duration when hiding the drawer.                                                                                                                                        |

## Methods

| Method           | Parameters | Description        |
| ---------------- | ---------- | ------------------ |
| `show()`         | -          | Shows the drawer.  |
| `requestClose()` | -          | Closes the drawer. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add drawer
```

---

**Documentation**: [webawesome.com/docs/components/drawer](https://webawesome.com/docs/components/drawer)
