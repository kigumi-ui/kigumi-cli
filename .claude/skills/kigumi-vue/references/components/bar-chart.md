# BarChart

**Web Awesome**: `wa-bar-chart`  
**Kigumi Vue**: `<BarChart>`  
**Category**: Data Display  
**Tier**: pro

Vue wrapper component for the Web Awesome `wa-bar-chart` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-bar-chart label="value" description="value">Click me</wa-bar-chart>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { BarChart } from '@/components/ui';
</script>

<template>
  <BarChart label="value" description="value"> Click me </BarChart>
</template>
```

## Props

| Prop                | Type    | Values                                                     | Default    | Description                                                    |
| ------------------- | ------- | ---------------------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `label`             | string  | -                                                          | `-`        | Accessible name announced by assistive technology              |
| `description`       | string  | -                                                          | `-`        | Extended accessible description for the chart                  |
| `orientation`       | string  | 'vertical' \| 'horizontal'                                 | `vertical` | Controls whether bars grow upward or sideways                  |
| `x-label`           | string  | -                                                          | `-`        | Caption displayed beneath the horizontal axis                  |
| `y-label`           | string  | -                                                          | `-`        | Caption displayed beside the vertical axis                     |
| `legend-position`   | string  | 'top' \| 'right' \| 'bottom' \| 'left' \| 'start' \| 'end' | `top`      | Placement of the dataset legend relative to the chart          |
| `stacked`           | boolean | -                                                          | `false`    | Layers multiple datasets on a single axis                      |
| `index-axis`        | string  | 'x' \| 'y'                                                 | `x`        | Base axis for category labels (swap to flip chart orientation) |
| `grid`              | string  | 'x' \| 'y' \| 'both' \| 'none'                             | `both`     | Selects which background grid lines are drawn                  |
| `min`               | number  | -                                                          | `-`        | Floor value for the value axis scale                           |
| `max`               | number  | -                                                          | `-`        | Ceiling value for the value axis scale                         |
| `without-animation` | boolean | -                                                          | `false`    | Disables entrance and update motion effects                    |
| `without-legend`    | boolean | -                                                          | `false`    | Hides the dataset legend entirely                              |
| `without-tooltip`   | boolean | -                                                          | `false`    | Prevents hover tooltips from appearing on data points          |

## Slots

| Slot        | Description                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| _(default)_ | An optional `<script type="application/json">` element containing the Chart.js configuration object. |

## CSS Custom Properties

| Property              | Default                                                          | Description                                         |
| --------------------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| `--fill-color-1`      | `color-mix(in srgb, var(--wa-color-blue-60) 40%, transparent)`   | Fill color for the first dataset.                   |
| `--fill-color-2`      | `color-mix(in srgb, var(--wa-color-pink-60) 40%, transparent)`   | Fill color for the second dataset.                  |
| `--fill-color-3`      | `color-mix(in srgb, var(--wa-color-green-60) 40%, transparent)`  | Fill color for the third dataset.                   |
| `--fill-color-4`      | `color-mix(in srgb, var(--wa-color-yellow-60) 40%, transparent)` | Fill color for the fourth dataset.                  |
| `--fill-color-5`      | `color-mix(in srgb, var(--wa-color-purple-60) 40%, transparent)` | Fill color for the fifth dataset.                   |
| `--fill-color-6`      | `color-mix(in srgb, var(--wa-color-orange-60) 40%, transparent)` | Fill color for the sixth dataset.                   |
| `--border-color-1`    | `var(--wa-color-blue-60)`                                        | Border color for the first dataset.                 |
| `--border-color-2`    | `var(--wa-color-pink-60)`                                        | Border color for the second dataset.                |
| `--border-color-3`    | `var(--wa-color-green-60)`                                       | Border color for the third dataset.                 |
| `--border-color-4`    | `var(--wa-color-yellow-60)`                                      | Border color for the fourth dataset.                |
| `--border-color-5`    | `var(--wa-color-purple-60)`                                      | Border color for the fifth dataset.                 |
| `--border-color-6`    | `var(--wa-color-orange-60)`                                      | Border color for the sixth dataset.                 |
| `--grid-color`        | `var(--wa-color-neutral-border-quiet)`                           | Color of the chart grid lines and axis borders.     |
| `--border-width`      | `var(--wa-border-width-s)`                                       | Border width for bars and arcs.                     |
| `--border-radius`     | `var(--wa-border-radius-s)`                                      | Border radius for bar charts.                       |
| `--grid-border-width` | `var(--wa-border-width-s)`                                       | Border width for chart grid lines and axis borders. |
| `--line-border-width` | `var(--wa-border-width-m)`                                       | Border width for line and radar charts.             |
| `--point-radius`      | `var(--wa-border-width-m)`                                       | Radius of data point dots.                          |

## Installation

```bash
npx kigumi add bar-chart
```

---

**Documentation**: [webawesome.com/docs/components/bar-chart](https://webawesome.com/docs/components/bar-chart)
