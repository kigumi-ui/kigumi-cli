# Chart

**Web Awesome**: `wa-chart`  
**Kigumi Vue**: `<Chart>`  
**Category**: Data Display  
**Tier**: pro

Vue wrapper component for the Web Awesome `wa-chart` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-chart label="value" description="value">Click me</wa-chart>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Chart } from '@/components/ui';
</script>

<template>
  <Chart label="value" description="value"> Click me </Chart>
</template>
```

## Props

| Prop                | Type    | Values                                                                                    | Default | Description                                                    |
| ------------------- | ------- | ----------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------- |
| `label`             | string  | -                                                                                         | `-`     | Accessible name read by screen readers                         |
| `description`       | string  | -                                                                                         | `-`     | Supplementary accessible description for the chart             |
| `type`              | string  | 'bar' \| 'line' \| 'pie' \| 'doughnut' \| 'polarArea' \| 'radar' \| 'scatter' \| 'bubble' | `bar`   | Visualisation style to use for the datasets                    |
| `x-label`           | string  | -                                                                                         | `-`     | Text label shown along the horizontal axis                     |
| `y-label`           | string  | -                                                                                         | `-`     | Text label shown along the vertical axis                       |
| `legend-position`   | string  | 'top' \| 'right' \| 'bottom' \| 'left' \| 'start' \| 'end'                                | `top`   | Where the dataset legend appears around the chart area         |
| `stacked`           | boolean | -                                                                                         | `false` | Layers multiple datasets on a single axis                      |
| `index-axis`        | string  | 'x' \| 'y'                                                                                | `x`     | Primary axis for categories (swap to create horizontal charts) |
| `grid`              | string  | 'x' \| 'y' \| 'both' \| 'none'                                                            | `both`  | Controls which background grid lines are visible               |
| `min`               | number  | -                                                                                         | `-`     | Lower bound for the value axis scale                           |
| `max`               | number  | -                                                                                         | `-`     | Upper bound for the value axis scale                           |
| `without-animation` | boolean | -                                                                                         | `false` | Turns off entrance and update transitions                      |
| `without-legend`    | boolean | -                                                                                         | `false` | Removes the dataset legend from view                           |
| `without-tooltip`   | boolean | -                                                                                         | `false` | Suppresses hover tooltips on data points                       |

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
npx kigumi add chart
```

---

**Documentation**: [webawesome.com/docs/components/chart](https://webawesome.com/docs/components/chart)
