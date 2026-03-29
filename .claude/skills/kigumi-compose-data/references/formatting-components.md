# Formatting Components

Quick reference for data formatting with Kigumi.

## FormatNumber

**Install:** `npx kigumi add format-number`

| Format      | Code                                                              | Output    |
| ----------- | ----------------------------------------------------------------- | --------- |
| Currency    | `<FormatNumber value={1234.56} type="currency" currency="USD" />` | $1,234.56 |
| Percent     | `<FormatNumber value={0.85} type="percent" />`                    | 85%       |
| Decimal     | `<FormatNumber value={1234567} />`                                | 1,234,567 |
| No grouping | `<FormatNumber value={1234567} without-grouping />`               | 1234567   |

**Key Props:** `value` (number), `type` (currency|decimal|percent), `currency` (USD|EUR|...), `minimum-fraction-digits`, `maximum-fraction-digits`, `lang` (locale)

## FormatDate

**Install:** `npx kigumi add format-date`

| Format | Code                                                                                                                 | Output                          |
| ------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Short  | `<FormatDate date="2024-03-15" month="short" day="numeric" year="numeric" />`                                        | Mar 15, 2024                    |
| Long   | `<FormatDate date="2024-03-15" weekday="long" month="long" day="numeric" />`                                         | Friday, March 15                |
| Time   | `<FormatDate date="2024-03-15T14:30:00" hour="numeric" minute="numeric" />`                                          | 2:30 PM                         |
| Full   | `<FormatDate date="..." weekday="long" month="long" day="numeric" year="numeric" hour="numeric" minute="numeric" />` | Friday, March 15, 2024, 2:30 PM |

**Key Props:** `date` (ISO string), `weekday` `era` `year` `month` `day` `hour` `minute` `second` (narrow|short|long|numeric|2-digit), `hour-format` (auto|12|24), `time-zone`, `lang`

## FormatBytes

**Install:** `npx kigumi add format-bytes`

| Format  | Code                                             | Output     |
| ------- | ------------------------------------------------ | ---------- |
| Default | `<FormatBytes value={1048576} />`                | 1 MB       |
| Long    | `<FormatBytes value={1048576} display="long" />` | 1 megabyte |
| Bits    | `<FormatBytes value={1048576} unit="bit" />`     | 8.39 Mb    |

**Key Props:** `value` (number in bytes), `unit` (byte|bit), `display` (long|short|narrow), `lang`

## RelativeTime

**Install:** `npx kigumi add relative-time`

| Format  | Code                                          | Output                |
| ------- | --------------------------------------------- | --------------------- |
| Default | `<RelativeTime date="2024-03-10T10:00:00" />` | 5 days ago            |
| Auto    | `<RelativeTime date="..." numeric="auto" />`  | yesterday             |
| Short   | `<RelativeTime date="..." format="short" />`  | 5 days ago            |
| Synced  | `<RelativeTime date="..." sync />`            | Updates automatically |

**Key Props:** `date` (ISO string), `format` (long|short|narrow), `numeric` (always|auto), `sync` (boolean, auto-updates), `lang`

## Import Patterns

```tsx
// React
import {
  FormatNumber,
  FormatDate,
  FormatBytes,
  RelativeTime,
} from '@/components/ui';
```

```vue
<!-- Vue -->
import { FormatNumber, FormatDate, FormatBytes, RelativeTime } from
'@/components/ui';
```
