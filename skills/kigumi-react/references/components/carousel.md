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
import { Carousel } from "@/components/ui";

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

## Dependencies

This component requires:

- [`CarouselItem`](carousel-item.md)

## Installation

```bash
npx kigumi add carousel
```

---

**Documentation**: [webawesome.com/docs/components/carousel](https://webawesome.com/docs/components/carousel)
