# Avatar

**Web Awesome**: `wa-avatar`  
**Kigumi React**: `<Avatar>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-avatar` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-avatar image="''" label="''">Click me</wa-avatar>
```

```tsx
// Kigumi React
import { Avatar } from '@/components/ui';

<Avatar image="''" label="''">
  Click me
</Avatar>;
```

## Props

| Prop       | Type   | Values                            | Default  | Description                                                |
| ---------- | ------ | --------------------------------- | -------- | ---------------------------------------------------------- |
| `image`    | string | -                                 | `''`     | The image source to use for the avatar                     |
| `label`    | string | -                                 | `''`     | A label to use to describe the avatar to assistive devices |
| `initials` | string | -                                 | `''`     | Initials to use as a fallback when no image is available   |
| `loading`  | string | 'eager' \| 'lazy'                 | `eager`  | Indicates how the browser should load the image            |
| `shape`    | string | 'circle' \| 'square' \| 'rounded' | `circle` | The shape of the avatar                                    |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add avatar
```

---

**Documentation**: [webawesome.com/docs/components/avatar](https://webawesome.com/docs/components/avatar)
