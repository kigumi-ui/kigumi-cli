# ButtonGroup

**Web Awesome**: `wa-button-group`  
**Kigumi React**: `<ButtonGroup>`  
**Category**: Actions  
**Tier**: free

React wrapper component for the Web Awesome `wa-button-group` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-button-group label="''" orientation="horizontal">Click me</wa-button-group>
```

```tsx
// Kigumi React
import { ButtonGroup } from '@/components/ui';

<ButtonGroup label="''" orientation="horizontal">
  Click me
</ButtonGroup>;
```

## Props

| Prop          | Type   | Values                     | Default      | Description                                                                                                               |
| ------------- | ------ | -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `label`       | string | -                          | `''`         | A label to use for the button group. This won't be displayed on the screen, but it will be announced by assistive devices |
| `orientation` | string | 'horizontal' \| 'vertical' | `horizontal` | Controls the button group's layout direction                                                                              |

## Slots

| Slot        | Description                                                        |
| ----------- | ------------------------------------------------------------------ |
| _(default)_ | One or more `<wa-button>` elements to display in the button group. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## Dependencies

This component requires:

- [`Button`](button.md)

## Installation

```bash
npx kigumi add button-group
```

---

**Documentation**: [webawesome.com/docs/components/button-group](https://webawesome.com/docs/components/button-group)
