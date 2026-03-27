# Carousel

**Web Awesome**: `wa-carousel`  
**Kigumi React**: `<Carousel>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-carousel` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-carousel autoplay autoplay-interval="3000">Click me</wa-carousel>
```

```tsx
// Kigumi React
import { Carousel } from '@/components/ui';

<Carousel autoplay={true} autoplay-interval="3000">
  Click me
</Carousel>;
```

## Props

| Prop                | Type    | Values                     | Default      | Description                                              |
| ------------------- | ------- | -------------------------- | ------------ | -------------------------------------------------------- |
| `autoplay`          | boolean | -                          | `false`      | Automatically scrolls slides when user isn't interacting |
| `autoplay-interval` | number  | -                          | `3000`       | Milliseconds between automatic scrolls                   |
| `loop`              | boolean | -                          | `false`      | Allows infinite navigation in same direction             |
| `mouse-dragging`    | boolean | -                          | `false`      | Enables dragging slides with mouse                       |
| `navigation`        | boolean | -                          | `false`      | Shows previous/next buttons                              |
| `orientation`       | string  | 'horizontal' \| 'vertical' | `horizontal` | Carousel layout direction                                |
| `pagination`        | boolean | -                          | `false`      | Shows slide indicator dots                               |
| `slides-per-move`   | number  | -                          | `1`          | Number of slides to advance per scroll                   |
| `slides-per-page`   | number  | -                          | `1`          | Number of slides visible at once                         |

## Slots

| Slot            | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| _(default)_     | The carousel's main content, one or more `<wa-carousel-item>` elements.            |
| `next-icon`     | Optional next icon to use instead of the default. Works best with `<wa-icon>`.     |
| `previous-icon` | Optional previous icon to use instead of the default. Works best with `<wa-icon>`. |

## Events

| Event             | React Handler     | Type          | Description                            |
| ----------------- | ----------------- | ------------- | -------------------------------------- |
| `wa-slide-change` | `onWaSlideChange` | `CustomEvent` | Emitted when the active slide changes. |

## CSS Parts

| Part                         | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `base`                       | The carousel's internal wrapper.            |
| `scroll-container`           | The scroll container that wraps the slides. |
| `pagination`                 | The pagination indicators wrapper.          |
| `pagination-item`            | The pagination indicator.                   |
| `pagination-item-active`     | Applied when the item is active.            |
| `navigation`                 | The navigation wrapper.                     |
| `navigation-button`          | The navigation button.                      |
| `navigation-button-previous` | Applied to the previous button.             |
| `navigation-button-next`     | Applied to the next button.                 |

## CSS Custom Properties

| Property         | Default             | Description                                                                                                               |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--aspect-ratio` | `16/9`              | The aspect ratio of each slide.                                                                                           |
| `--scroll-hint`  | -                   | The amount of padding to apply to the scroll area, allowing adjacent slides to become partially visible as a scroll hint. |
| `--slide-gap`    | `var(--wa-space-m)` | The space between each slide.                                                                                             |

## Methods

| Method        | Parameters                                  | Description                                             |
| ------------- | ------------------------------------------- | ------------------------------------------------------- |
| `previous()`  | `behavior: ScrollBehavior`                  | Move the carousel backward by `slides-per-move` slides. |
| `next()`      | `behavior: ScrollBehavior`                  | Move the carousel forward by `slides-per-move` slides.  |
| `goToSlide()` | `index: number`, `behavior: ScrollBehavior` | Scrolls the carousel to the slide specified by `index`. |

## Dependencies

This component requires:

- [`CarouselItem`](carousel-item.md)

## Installation

```bash
npx kigumi add carousel
```

---

**Documentation**: [webawesome.com/docs/components/carousel](https://webawesome.com/docs/components/carousel)
