# Transformation Rules (Vue)

Complete mapping of Web Awesome components to Kigumi Vue components.

## Component Mapping

| Web Awesome                | Kigumi Vue               | Category      | Tier |
| -------------------------- | ------------------------ | ------------- | ---- |
| `wa-button`                | `<Button>`               | Actions       | free |
| `wa-button-group`          | `<ButtonGroup>`          | Actions       | free |
| `wa-input`                 | `<Input>`                | Form Controls | free |
| `wa-card`                  | `<Card>`                 | Organization  | free |
| `wa-dialog`                | `<Dialog>`               | Overlays      | free |
| `wa-animated-image`        | `<AnimatedImage>`        | Display       | free |
| `wa-animation`             | `<Animation>`            | Display       | free |
| `wa-avatar`                | `<Avatar>`               | Display       | free |
| `wa-badge`                 | `<Badge>`                | Display       | free |
| `wa-breadcrumb`            | `<Breadcrumb>`           | Navigation    | free |
| `wa-breadcrumb-item`       | `<BreadcrumbItem>`       | Navigation    | free |
| `wa-icon`                  | `<Icon>`                 | Display       | free |
| `wa-carousel`              | `<Carousel>`             | Display       | free |
| `wa-carousel-item`         | `<CarouselItem>`         | Display       | free |
| `wa-checkbox`              | `<Checkbox>`             | Form Controls | free |
| `wa-color-picker`          | `<ColorPicker>`          | Form Controls | free |
| `wa-combobox`              | `<Combobox>`             | Form Controls | pro  |
| `wa-comparison`            | `<Comparison>`           | Display       | free |
| `wa-page`                  | `<Page>`                 | Layout        | pro  |
| `wa-copy-button`           | `<CopyButton>`           | Actions       | free |
| `wa-details`               | `<Details>`              | Organization  | free |
| `wa-divider`               | `<Divider>`              | Layout        | free |
| `wa-drawer`                | `<Drawer>`               | Overlays      | free |
| `wa-dropdown`              | `<Dropdown>`             | Overlays      | free |
| `wa-dropdown-item`         | `<DropdownItem>`         | Overlays      | free |
| `wa-format-bytes`          | `<FormatBytes>`          | Formatting    | free |
| `wa-format-date`           | `<FormatDate>`           | Formatting    | free |
| `wa-format-number`         | `<FormatNumber>`         | Formatting    | free |
| `wa-include`               | `<Include>`              | Utilities     | free |
| `wa-intersection-observer` | `<IntersectionObserver>` | Utilities     | free |
| `wa-mutation-observer`     | `<MutationObserver>`     | Utilities     | free |
| `wa-resize-observer`       | `<ResizeObserver>`       | Utilities     | free |
| `wa-popover`               | `<Popover>`              | Overlays      | free |
| `wa-popup`                 | `<Popup>`                | Overlays      | free |
| `wa-progress-bar`          | `<ProgressBar>`          | Progress      | free |
| `wa-progress-ring`         | `<ProgressRing>`         | Progress      | free |
| `wa-qr-code`               | `<QrCode>`               | Display       | free |
| `wa-radio-group`           | `<RadioGroup>`           | Form Controls | free |
| `wa-radio`                 | `<Radio>`                | Form Controls | free |
| `wa-rating`                | `<Rating>`               | Form Controls | free |
| `wa-relative-time`         | `<RelativeTime>`         | Formatting    | free |
| `wa-scroller`              | `<Scroller>`             | Layout        | free |
| `wa-select`                | `<Select>`               | Form Controls | free |
| `wa-option`                | `<Option>`               | Form Controls | free |
| `wa-skeleton`              | `<Skeleton>`             | Display       | free |
| `wa-slider`                | `<Slider>`               | Form Controls | free |
| `wa-spinner`               | `<Spinner>`              | Progress      | free |
| `wa-split-panel`           | `<SplitPanel>`           | Layout        | free |
| `wa-switch`                | `<Switch>`               | Form Controls | free |
| `wa-tab-group`             | `<TabGroup>`             | Navigation    | free |
| `wa-tab`                   | `<Tab>`                  | Navigation    | free |
| `wa-tab-panel`             | `<TabPanel>`             | Navigation    | free |
| `wa-tag`                   | `<Tag>`                  | Display       | free |
| `wa-textarea`              | `<Textarea>`             | Form Controls | free |
| `wa-tooltip`               | `<Tooltip>`              | Overlays      | free |
| `wa-tree`                  | `<Tree>`                 | Navigation    | free |
| `wa-tree-item`             | `<TreeItem>`             | Navigation    | free |
| `wa-zoomable-frame`        | `<ZoomableFrame>`        | Display       | free |
| `wa-callout`               | `<Callout>`              | Display       | free |
| `wa-file-input`            | `<FileInput>`            | Form Controls | pro  |
| `wa-number-input`          | `<NumberInput>`          | Form Controls | pro  |
| `wa-sparkline`             | `<Sparkline>`            | Display       | pro  |
| `wa-chart`                 | `<Chart>`                | Data Display  | pro  |
| `wa-bar-chart`             | `<BarChart>`             | Data Display  | pro  |
| `wa-line-chart`            | `<LineChart>`            | Data Display  | pro  |
| `wa-bubble-chart`          | `<BubbleChart>`          | Data Display  | pro  |
| `wa-doughnut-chart`        | `<DoughnutChart>`        | Data Display  | pro  |
| `wa-pie-chart`             | `<PieChart>`             | Data Display  | pro  |
| `wa-polar-area-chart`      | `<PolarAreaChart>`       | Data Display  | pro  |
| `wa-radar-chart`           | `<RadarChart>`           | Data Display  | pro  |
| `wa-scatter-chart`         | `<ScatterChart>`         | Data Display  | pro  |
| `wa-toast`                 | `<Toast>`                | Feedback      | pro  |
| `wa-toast-item`            | `<ToastItem>`            | Feedback      | pro  |

## Vue Attribute Transformation

| WA HTML                   | Vue Template                                               |
| ------------------------- | ---------------------------------------------------------- |
| `class="wa-stack"`        | `class="wa-stack"`                                         |
| `style="max-width: 60ch"` | `style="max-width: 60ch"`                                  |
| `variant="brand"`         | `variant="brand"` (static) or `:variant="myVar"` (dynamic) |
| `disabled`                | `disabled` or `:disabled="isDisabled"`                     |
| `open`                    | `:open="isOpen"` (always dynamic for controlled state)     |
| `slot="header"`           | `slot="header"` or `<template #header>`                    |
| `aria-label="Close"`      | `aria-label="Close"`                                       |
| `data-testid="btn"`       | `data-testid="btn"`                                        |

## Self-Closing Tags

```html
<!-- WA -->
<wa-icon name="star"></wa-icon>
<!-- Vue -->
<Icon name="star" />
```

## Inline Styles

```html
<!-- WA -->
<wa-button style="max-width: 200px">Button</wa-button>
<!-- Vue (string) -->
<button style="max-width: 200px">Button</button>
<!-- Vue (object, for dynamic values) -->
<button :style="{ maxWidth: '200px' }">Button</button>
```
