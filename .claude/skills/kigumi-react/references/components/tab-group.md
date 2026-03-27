# TabGroup

**Web Awesome**: `wa-tab-group`  
**Kigumi React**: `<TabGroup>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-tab-group` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tab-group placement="top" activation="auto">Click me</wa-tab-group>
```

```tsx
// Kigumi React
import { TabGroup } from '@/components/ui';

<TabGroup placement="top" activation="auto">
  Click me
</TabGroup>;
```

## Props

| Prop                      | Type    | Values                                | Default | Description                |
| ------------------------- | ------- | ------------------------------------- | ------- | -------------------------- |
| `placement`               | string  | 'top' \| 'bottom' \| 'start' \| 'end' | `top`   | Tab position               |
| `activation`              | string  | 'auto' \| 'manual'                    | `auto`  | Panel activation method    |
| `without-scroll-controls` | boolean | -                                     | `false` | Disables scroll buttons    |
| `active`                  | string  | -                                     | `-`     | The name of the active tab |

## Slots

| Slot        | Description                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| _(default)_ | Used for grouping tab panels in the tab group. Must be `<wa-tab-panel>` elements.                                                      |
| `nav`       | Used for grouping tabs in the tab group. Must be `<wa-tab>` elements. Note that `<wa-tab>` will set this slot on itself automatically. |

## Events

| Event         | React Handler | Type          | Description                   |
| ------------- | ------------- | ------------- | ----------------------------- |
| `wa-tab-show` | `onWaTabShow` | `CustomEvent` | Emitted when a tab is shown.  |
| `wa-tab-hide` | `onWaTabHide` | `CustomEvent` | Emitted when a tab is hidden. |

## CSS Parts

| Part                  | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `base`                | The component's base wrapper.                                                         |
| `nav`                 | The tab group's navigation container where tabs are slotted in.                       |
| `tabs`                | The container that wraps the tabs.                                                    |
| `body`                | The tab group's body where tab panels are slotted in.                                 |
| `scroll-button`       | The previous/next scroll buttons that show when tabs are scrollable, a `<wa-button>`. |
| `scroll-button-start` | The starting scroll button.                                                           |
| `scroll-button-end`   | The ending scroll button.                                                             |
| `scroll-button__base` | The scroll button's exported `base` part.                                             |

## CSS Custom Properties

| Property            | Default | Description                                                                    |
| ------------------- | ------- | ------------------------------------------------------------------------------ |
| `--indicator-color` | -       | The color of the active tab indicator.                                         |
| `--track-color`     | -       | The color of the indicator's track (the line that separates tabs from panels). |
| `--track-width`     | -       | The width of the indicator's track (the line that separates tabs from panels). |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add tab-group
```

---

**Documentation**: [webawesome.com/docs/components/tab-group](https://webawesome.com/docs/components/tab-group)
