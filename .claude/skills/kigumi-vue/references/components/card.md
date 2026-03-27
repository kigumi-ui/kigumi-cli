# Card

**Web Awesome**: `wa-card`  
**Kigumi Vue**: `<Card>`  
**Category**: Organization  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-card` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-card appearance="outlined" orientation="vertical">Click me</wa-card>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Card } from '@/components/ui';
</script>

<template>
  <Card appearance="outlined" orientation="vertical"> Click me </Card>
</template>
```

## Props

| Prop          | Type    | Values                                                             | Default    | Description                   |
| ------------- | ------- | ------------------------------------------------------------------ | ---------- | ----------------------------- |
| `appearance`  | string  | 'outlined' \| 'filled-outlined' \| 'plain' \| 'filled' \| 'accent' | `outlined` | Visual appearance style       |
| `orientation` | string  | 'vertical' \| 'horizontal'                                         | `vertical` | Card layout orientation       |
| `with-header` | boolean | -                                                                  | `false`    | Adds header section (for SSR) |
| `with-footer` | boolean | -                                                                  | `false`    | Adds footer section (for SSR) |
| `with-media`  | boolean | -                                                                  | `false`    | Adds media section (for SSR)  |

## Slots

| Slot             | Description                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| _(default)_      | The card's main content.                                                  |
| `header`         | An optional header for the card.                                          |
| `footer`         | An optional footer for the card.                                          |
| `media`          | An optional media section to render at the start of the card.             |
| `actions`        | An optional actions section to render at the end for the horizontal card. |
| `header-actions` | An optional actions section to render in the header of the vertical card. |
| `footer-actions` | An optional actions section to render in the footer of the vertical card. |

## CSS Parts

| Part     | Description                                       |
| -------- | ------------------------------------------------- |
| `media`  | The container that wraps the card's media.        |
| `header` | The container that wraps the card's header.       |
| `body`   | The container that wraps the card's main content. |
| `footer` | The container that wraps the card's footer.       |

## CSS Custom Properties

| Property    | Default             | Description                                                                          |
| ----------- | ------------------- | ------------------------------------------------------------------------------------ |
| `--spacing` | `var(--wa-space-l)` | The amount of space around and between sections of the card. Expects a single value. |

## Installation

```bash
npx kigumi add card
```

---

**Documentation**: [webawesome.com/docs/components/card](https://webawesome.com/docs/components/card)
