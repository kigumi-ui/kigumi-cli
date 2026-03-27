# Sparkline

**Web Awesome**: `wa-sparkline`  
**Kigumi Vue**: `<Sparkline>`  
**Category**: Display  
**Tier**: pro

Vue wrapper component for the Web Awesome `wa-sparkline` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-sparkline data="value" label="value">Click me</wa-sparkline>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Sparkline } from '@/components/ui';
</script>

<template>
  <Sparkline data="value" label="value"> Click me </Sparkline>
</template>
```

## Props

| Prop         | Type   | Values                                | Default   | Description                               |
| ------------ | ------ | ------------------------------------- | --------- | ----------------------------------------- |
| `data`       | string | -                                     | `-`       | Space-separated numeric data points       |
| `label`      | string | -                                     | `-`       | An accessible label for assistive devices |
| `appearance` | string | 'gradient' \| 'line' \| 'solid'       | `line`    | Visual style of the sparkline             |
| `trend`      | string | 'positive' \| 'negative' \| 'neutral' | `-`       | Trend direction, used for coloring        |
| `curve`      | string | 'linear' \| 'natural' \| 'step'       | `natural` | Interpolation curve style                 |

## CSS Parts

| Part   | Description                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `base` | The SVG container element.                                                  |
| `line` | The sparkline stroke path.                                                  |
| `fill` | The filled area under the line (visible with gradient or solid appearance). |

## CSS Custom Properties

| Property       | Default | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| `--fill-color` | -       | The fill color for the area under the line. |
| `--line-color` | -       | The color of the sparkline stroke.          |
| `--line-width` | -       | The width of the sparkline stroke.          |

## Installation

```bash
npx kigumi add sparkline
```

---

**Documentation**: [webawesome.com/docs/components/sparkline](https://webawesome.com/docs/components/sparkline)
