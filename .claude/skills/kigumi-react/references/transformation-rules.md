# Transformation Rules

Complete mapping of Web Awesome components to Kigumi React components.

## Component Mapping

| Web Awesome                | Kigumi React             | Category      | Tier | Description                                                                                             |
| -------------------------- | ------------------------ | ------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| `wa-button`                | `<Button>`               | Actions       | free | Buttons represent actions that are available to the user                                                |
| `wa-button-group`          | `<ButtonGroup>`          | Actions       | free | Groups related buttons into organized sections, supporting both horizontal and vertical layouts         |
| `wa-input`                 | `<Input>`                | Form Controls | free | Inputs collect data from the user                                                                       |
| `wa-card`                  | `<Card>`                 | Organization  | free | Cards can be used to group related subjects in a container                                              |
| `wa-dialog`                | `<Dialog>`               | Overlays      | free | Dialogs display important prompts and information                                                       |
| `wa-animated-image`        | `<AnimatedImage>`        | Display       | free | A component for displaying animated GIFs and WEBPs that play and pause on interaction                   |
| `wa-animation`             | `<Animation>`            | Display       | free | Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes |
| `wa-avatar`                | `<Avatar>`               | Display       | free | Avatars are used to represent a person or object                                                        |
| `wa-badge`                 | `<Badge>`                | Display       | free | Badges are used to draw attention and display statuses or counts                                        |
| `wa-breadcrumb`            | `<Breadcrumb>`           | Navigation    | free | Breadcrumbs provide a group of links so users can easily navigate a website hierarchy                   |
| `wa-breadcrumb-item`       | `<BreadcrumbItem>`       | Navigation    | free | Breadcrumb Items are used inside breadcrumbs to represent different links                               |
| `wa-icon`                  | `<Icon>`                 | Display       | free | Icons are symbols that can be used to represent various options within an application                   |
| `wa-carousel`              | `<Carousel>`             | Display       | free | Displays an arbitrary number of content slides along a horizontal or vertical axis                      |
| `wa-carousel-item`         | `<CarouselItem>`         | Display       | free | Represents an individual slide within a carousel component                                              |
| `wa-checkbox`              | `<Checkbox>`             | Form Controls | free | Checkboxes allow the user to toggle an option on or off                                                 |
| `wa-color-picker`          | `<ColorPicker>`          | Form Controls | free | Color pickers allow the user to select a color                                                          |
| `wa-combobox`              | `<Combobox>`             | Form Controls | pro  | Combines a text input with a listbox for filtering and selecting options                                |
| `wa-comparison`            | `<Comparison>`           | Display       | free | Compare visual differences between similar content with a sliding panel                                 |
| `wa-page`                  | `<Page>`                 | Layout        | pro  | Pages offer an easy way to scaffold entire page layouts using minimal markup                            |
| `wa-copy-button`           | `<CopyButton>`           | Actions       | free | Copies text data to the clipboard when clicked                                                          |
| `wa-details`               | `<Details>`              | Organization  | free | Shows a brief summary and expands to show additional content                                            |
| `wa-divider`               | `<Divider>`              | Layout        | free | Dividers are used to visually separate content                                                          |
| `wa-drawer`                | `<Drawer>`               | Overlays      | free | Drawers slide in from a container edge to expose additional options                                     |
| `wa-dropdown`              | `<Dropdown>`             | Overlays      | free | Dropdowns expose additional content that pops up when the user interacts with a trigger                 |
| `wa-dropdown-item`         | `<DropdownItem>`         | Overlays      | free | Dropdown items are used inside dropdowns to represent individual menu items                             |
| `wa-format-bytes`          | `<FormatBytes>`          | Formatting    | free | Formats a number as a human-readable byte value                                                         |
| `wa-format-date`           | `<FormatDate>`           | Formatting    | free | Formats a date/time using the Intl.DateTimeFormat API                                                   |
| `wa-format-number`         | `<FormatNumber>`         | Formatting    | free | Formats a number using the Intl.NumberFormat API                                                        |
| `wa-include`               | `<Include>`              | Utilities     | free | Includes give you the power to embed external HTML files into the page                                  |
| `wa-intersection-observer` | `<IntersectionObserver>` | Utilities     | free | Observes changes in the intersection of a target element with an ancestor                               |
| `wa-mutation-observer`     | `<MutationObserver>`     | Utilities     | free | Observes changes to a target element and emits events when they occur                                   |
| `wa-resize-observer`       | `<ResizeObserver>`       | Utilities     | free | Reports changes to the dimensions of an element                                                         |
| `wa-popover`               | `<Popover>`              | Overlays      | free | Popovers display additional content when users interact with a trigger element                          |
| `wa-popup`                 | `<Popup>`                | Overlays      | free | Popup is a utility component for positioning elements relative to an anchor                             |
| `wa-progress-bar`          | `<ProgressBar>`          | Progress      | free | Progress bars are used to show the completion of a task or operation                                    |
| `wa-progress-ring`         | `<ProgressRing>`         | Progress      | free | Progress rings are used to show the completion of a task in a circular format                           |
| `wa-qr-code`               | `<QrCode>`               | Display       | free | Generates QR codes for encoding text, URLs, or data                                                     |
| `wa-radio-group`           | `<RadioGroup>`           | Form Controls | free | Radio groups are used to group multiple radios so only one can be selected                              |
| `wa-radio`                 | `<Radio>`                | Form Controls | free | Radios allow the user to select a single option from a group                                            |
| `wa-rating`                | `<Rating>`               | Form Controls | free | Ratings give users a way to quickly view and provide feedback                                           |
| `wa-relative-time`         | `<RelativeTime>`         | Formatting    | free | Outputs a localized time phrase relative to the current date and time                                   |
| `wa-scroller`              | `<Scroller>`             | Layout        | free | Adds a scrollable container with optional shadow indicators                                             |
| `wa-select`                | `<Select>`               | Form Controls | free | Selects allow you to choose items from a menu of predefined options                                     |
| `wa-option`                | `<Option>`               | Form Controls | free | Options define the selectable items within various form controls                                        |
| `wa-skeleton`              | `<Skeleton>`             | Display       | free | Skeletons are used to provide a visual representation of where content will eventually load             |
| `wa-slider`                | `<Slider>`               | Form Controls | free | Sliders allow the user to select a value within a range                                                 |
| `wa-spinner`               | `<Spinner>`              | Progress      | free | Spinners are used to show the progress of an indeterminate operation                                    |
| `wa-split-panel`           | `<SplitPanel>`           | Layout        | free | Split panels display two adjacent panels with a divider for resizing                                    |
| `wa-switch`                | `<Switch>`               | Form Controls | free | Switches allow the user to toggle an option on or off                                                   |
| `wa-tab-group`             | `<TabGroup>`             | Navigation    | free | Tab groups organize content into a container that shows one section at a time                           |
| `wa-tab`                   | `<Tab>`                  | Navigation    | free | Tabs are used inside tab groups to represent selectable tabs                                            |
| `wa-tab-panel`             | `<TabPanel>`             | Navigation    | free | Tab panels are used inside tab groups to display content for each tab                                   |
| `wa-tag`                   | `<Tag>`                  | Display       | free | Tags are used as labels to organize things or indicate selections                                       |
| `wa-textarea`              | `<Textarea>`             | Form Controls | free | Textareas collect multi-line text data from the user                                                    |
| `wa-tooltip`               | `<Tooltip>`              | Overlays      | free | Tooltips display additional information based on a specific action                                      |
| `wa-tree`                  | `<Tree>`                 | Navigation    | free | Trees allow you to display a hierarchical list of selectable tree items                                 |
| `wa-tree-item`             | `<TreeItem>`             | Navigation    | free | Tree items are used inside trees to represent hierarchical items                                        |
| `wa-zoomable-frame`        | `<ZoomableFrame>`        | Display       | free | Zoomable frames display iframe content with zoom controls                                               |
| `wa-callout`               | `<Callout>`              | Display       | free | Callouts are used to display important messages inline                                                  |
| `wa-file-input`            | `<FileInput>`            | Form Controls | pro  | File inputs allow users to select and upload files from their device                                    |
| `wa-number-input`          | `<NumberInput>`          | Form Controls | pro  | Number inputs allow users to enter numeric values with optional step controls                           |
| `wa-sparkline`             | `<Sparkline>`            | Display       | pro  | Sparklines are small inline data visualizations for showing trends                                      |
| `wa-chart`                 | `<Chart>`                | Data Display  | pro  | Renders interactive data visualisations including bars, lines, pies, and more via Chart.js              |
| `wa-bar-chart`             | `<BarChart>`             | Data Display  | pro  | Displays categorical data as horizontal or vertical rectangular bars scaled to their values             |
| `wa-line-chart`            | `<LineChart>`            | Data Display  | pro  | Connects sequential data points to reveal trends and patterns over a continuous axis                    |
| `wa-bubble-chart`          | `<BubbleChart>`          | Data Display  | pro  | Plots three-dimensional data using position and circle size to encode a third variable                  |
| `wa-doughnut-chart`        | `<DoughnutChart>`        | Data Display  | pro  | Shows proportional segments in a ring shape with an open center for summary content                     |
| `wa-pie-chart`             | `<PieChart>`             | Data Display  | pro  | Divides a circle into wedges that represent each category's share of the whole                          |
| `wa-polar-area-chart`      | `<PolarAreaChart>`       | Data Display  | pro  | Arranges segments of equal angle but varying radius around a central point                              |
| `wa-radar-chart`           | `<RadarChart>`           | Data Display  | pro  | Maps multiple variables onto radial axes to compare profiles at a glance                                |
| `wa-scatter-chart`         | `<ScatterChart>`         | Data Display  | pro  | Positions individual data points by two numeric axes to expose correlations                             |
| `wa-toast`                 | `<Toast>`                | Feedback      | pro  | Container that manages and stacks lightweight notification banners at a chosen screen edge              |
| `wa-toast-item`            | `<ToastItem>`            | Feedback      | pro  | A single notification banner that can be stacked inside a Toast container                               |

## Core Transformation Patterns

### Attributes

| Web Awesome      | React                    |
| ---------------- | ------------------------ |
| `class="..."`    | `className="..."`        |
| `style="..."`    | `style={{ ... }}`        |
| Kebab-case props | Keep as-is               |
| `slot="..."`     | `slot="..."` (preserved) |
| `aria-*`         | `aria-*` (preserved)     |
| `data-*`         | `data-*` (preserved)     |

### Self-Closing Tags

```html
<!-- Web Awesome -->
<wa-icon name="star"></wa-icon>

<!-- React -->
<Icon name="star" />
```

### Inline Styles

```html
<!-- Web Awesome -->
<wa-button style="max-width: 200px; margin: auto">Button</wa-button>

<!-- React -->
<Button style={{ maxWidth: '200px', margin: 'auto' }}>Button</Button>
```

### Slots

Slots are preserved with the `slot` attribute:

```tsx
<Card>
  <div slot="header">Header Content</div>
  Main content
  <div slot="footer">Footer Content</div>
</Card>
```
