# FormatDate

**Web Awesome**: `wa-format-date`  
**Kigumi Vue**: `<FormatDate>`  
**Category**: Formatting  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-format-date` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-format-date date="value" weekday="narrow">Click me</wa-format-date>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { FormatDate } from '@/components/ui';
</script>

<template>
  <FormatDate date="value" weekday="narrow"> Click me </FormatDate>
</template>
```

## Props

| Prop             | Type   | Values                                                  | Default | Description                       |
| ---------------- | ------ | ------------------------------------------------------- | ------- | --------------------------------- |
| `date`           | string | -                                                       | `-`     | The date/time to format           |
| `weekday`        | string | 'narrow' \| 'short' \| 'long'                           | `-`     | How to display the weekday        |
| `era`            | string | 'narrow' \| 'short' \| 'long'                           | `-`     | How to display the era            |
| `year`           | string | 'numeric' \| '2-digit'                                  | `-`     | How to display the year           |
| `month`          | string | 'numeric' \| '2-digit' \| 'narrow' \| 'short' \| 'long' | `-`     | How to display the month          |
| `day`            | string | 'numeric' \| '2-digit'                                  | `-`     | How to display the day            |
| `hour`           | string | 'numeric' \| '2-digit'                                  | `-`     | How to display the hour           |
| `minute`         | string | 'numeric' \| '2-digit'                                  | `-`     | How to display the minute         |
| `second`         | string | 'numeric' \| '2-digit'                                  | `-`     | How to display the second         |
| `hour-format`    | string | 'auto' \| '12' \| '24'                                  | `auto`  | 12 or 24 hour format              |
| `time-zone-name` | string | 'short' \| 'long'                                       | `-`     | How to display the time zone      |
| `time-zone`      | string | -                                                       | `-`     | The time zone to use              |
| `lang`           | string | -                                                       | `-`     | The locale to use when formatting |

## Installation

```bash
npx kigumi add format-date
```

---

**Documentation**: [webawesome.com/docs/components/format-date](https://webawesome.com/docs/components/format-date)
