# Transformation Rules (Vue)

Complete mapping of Web Awesome components to Kigumi Vue components.

## Component Mapping

| Web Awesome | Kigumi Vue | Category | Tier |
|---|---|---|---|
| `wa-button` | `<Button>` | Actions | free |
| `wa-button-group` | `<ButtonGroup>` | Actions | free |
| `wa-copy-button` | `<CopyButton>` | Actions | free |
| `wa-input` | `<Input>` | Form Controls | free |
| `wa-textarea` | `<Textarea>` | Form Controls | free |
| `wa-select` | `<Select>` | Form Controls | free |
| `wa-option` | `<Option>` | Form Controls | free |
| `wa-checkbox` | `<Checkbox>` | Form Controls | free |
| `wa-switch` | `<Switch>` | Form Controls | free |
| `wa-radio-group` | `<RadioGroup>` | Form Controls | free |
| `wa-radio` | `<Radio>` | Form Controls | free |
| `wa-rating` | `<Rating>` | Form Controls | free |
| `wa-color-picker` | `<ColorPicker>` | Form Controls | free |
| `wa-slider` | `<Slider>` | Form Controls | free |
| `wa-combobox` | `<Combobox>` | Form Controls | pro |
| `wa-number-input` | `<NumberInput>` | Form Controls | pro |
| `wa-file-input` | `<FileInput>` | Form Controls | pro |
| `wa-breadcrumb` | `<Breadcrumb>` | Navigation | free |
| `wa-breadcrumb-item` | `<BreadcrumbItem>` | Navigation | free |
| `wa-tab-group` | `<TabGroup>` | Navigation | free |
| `wa-tab` | `<Tab>` | Navigation | free |
| `wa-tab-panel` | `<TabPanel>` | Navigation | free |
| `wa-tree` | `<Tree>` | Navigation | free |
| `wa-tree-item` | `<TreeItem>` | Navigation | free |
| `wa-dialog` | `<Dialog>` | Overlays | free |
| `wa-drawer` | `<Drawer>` | Overlays | free |
| `wa-dropdown` | `<Dropdown>` | Overlays | free |
| `wa-dropdown-item` | `<DropdownItem>` | Overlays | free |
| `wa-tooltip` | `<Tooltip>` | Overlays | free |
| `wa-popover` | `<Popover>` | Overlays | free |
| `wa-popup` | `<Popup>` | Overlays | free |
| `wa-icon` | `<Icon>` | Display | free |
| `wa-avatar` | `<Avatar>` | Display | free |
| `wa-badge` | `<Badge>` | Display | free |
| `wa-tag` | `<Tag>` | Display | free |
| `wa-callout` | `<Callout>` | Display | free |
| `wa-skeleton` | `<Skeleton>` | Display | free |
| `wa-carousel` | `<Carousel>` | Display | free |
| `wa-carousel-item` | `<CarouselItem>` | Display | free |
| `wa-animated-image` | `<AnimatedImage>` | Display | free |
| `wa-animation` | `<Animation>` | Display | free |
| `wa-comparison` | `<Comparison>` | Display | free |
| `wa-qr-code` | `<QrCode>` | Display | free |
| `wa-zoomable-frame` | `<ZoomableFrame>` | Display | free |
| `wa-sparkline` | `<Sparkline>` | Display | pro |
| `wa-card` | `<Card>` | Organization | free |
| `wa-details` | `<Details>` | Organization | free |
| `wa-divider` | `<Divider>` | Layout | free |
| `wa-split-panel` | `<SplitPanel>` | Layout | free |
| `wa-scroller` | `<Scroller>` | Layout | free |
| `wa-page` | `<Page>` | Layout | pro |
| `wa-progress-bar` | `<ProgressBar>` | Progress | free |
| `wa-progress-ring` | `<ProgressRing>` | Progress | free |
| `wa-spinner` | `<Spinner>` | Progress | free |
| `wa-format-bytes` | `<FormatBytes>` | Formatting | free |
| `wa-format-date` | `<FormatDate>` | Formatting | free |
| `wa-format-number` | `<FormatNumber>` | Formatting | free |
| `wa-relative-time` | `<RelativeTime>` | Formatting | free |
| `wa-include` | `<Include>` | Utilities | free |
| `wa-intersection-observer` | `<IntersectionObserver>` | Utilities | free |
| `wa-mutation-observer` | `<MutationObserver>` | Utilities | free |
| `wa-resize-observer` | `<ResizeObserver>` | Utilities | free |

## Vue Attribute Transformation

| WA HTML | Vue Template |
|---------|-------------|
| `class="wa-stack"` | `class="wa-stack"` |
| `style="max-width: 60ch"` | `style="max-width: 60ch"` |
| `variant="brand"` | `variant="brand"` (static) or `:variant="myVar"` (dynamic) |
| `disabled` | `disabled` or `:disabled="isDisabled"` |
| `open` | `:open="isOpen"` (always dynamic for controlled state) |
| `slot="header"` | `slot="header"` or `<template #header>` |
| `aria-label="Close"` | `aria-label="Close"` |
| `data-testid="btn"` | `data-testid="btn"` |

## Vue Event Transformation

| WA Event | Vue Syntax | Type |
|----------|-----------|------|
| Native: `input` | `@input="handler"` | `Event` |
| Native: `change` | `@change="handler"` | `Event` |
| Native: `blur` | `@blur="handler"` | `FocusEvent` |
| Native: `focus` | `@focus="handler"` | `FocusEvent` |
| Custom: `wa-show` | `@wa-show="handler"` | `CustomEvent` |
| Custom: `wa-hide` | `@wa-hide="handler"` | `CustomEvent` |
| Custom: `wa-after-show` | `@wa-after-show="handler"` | `CustomEvent` |
| Custom: `wa-after-hide` | `@wa-after-hide="handler"` | `CustomEvent` |
| Custom: `wa-select` | `@wa-select="handler"` | `CustomEvent` |
| Custom: `wa-tab-show` | `@wa-tab-show="handler"` | `CustomEvent` |

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
<Button style="max-width: 200px">Button</Button>
<!-- Vue (object, for dynamic values) -->
<Button :style="{ maxWidth: '200px' }">Button</Button>
```
