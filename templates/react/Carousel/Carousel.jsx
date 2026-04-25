import React from 'react';
import clsx from 'clsx';
import './Carousel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/carousel/carousel.js'));
}

/**
 * Displays an arbitrary number of content slides along a horizontal or vertical axis
 *
 * @example
 * ```jsx
 * <Carousel navigation pagination loop>
 *   <CarouselItem>Slide 1</CarouselItem>
 *   <CarouselItem>Slide 2</CarouselItem>
 *   <CarouselItem>Slide 3</CarouselItem>
 * </Carousel>
 * ```
 *
 * @typedef {Object} CarouselProps
 * @property {boolean} [autoplay] - Automatically scrolls slides
 * @property {number} [autoplay-interval] - Milliseconds between scrolls
 * @property {boolean} [loop] - Allows infinite navigation
 * @property {boolean} [mouse-dragging] - Enables mouse dragging
 * @property {boolean} [navigation] - Shows navigation buttons
 * @property {'horizontal'|'vertical'} [orientation] - Layout direction
 * @property {boolean} [pagination] - Shows pagination dots
 * @property {number} [slides-per-move] - Slides to advance per scroll
 * @property {number} [slides-per-page] - Visible slides count
 * @property {(event: CustomEvent) => void} [onSlideChange] - Slide change handler
 */

export const Carousel = React.forwardRef(
  ({ children, className, onSlideChange, ...props }, ref) => {
    const carouselRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        goToSlide: (index, behavior) => {
          carouselRef.current?.goToSlide?.(index, behavior);
        },
        next: (behavior) => {
          carouselRef.current?.next?.(behavior);
        },
        previous: (behavior) => {
          carouselRef.current?.previous?.(behavior);
        },
        get element() {
          return carouselRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = carouselRef.current;
      if (!el) return;

      const handleSlideChange = (e) => {
        if (onSlideChange) onSlideChange(e);
      };

      el.addEventListener('wa-slide-change', handleSlideChange);

      return () => {
        el.removeEventListener('wa-slide-change', handleSlideChange);
      };
    }, [onSlideChange]);

    return (
      <wa-carousel
        ref={carouselRef}
        class={clsx('Carousel', className)}
        {...props}
      >
        {children}
      </wa-carousel>
    );
  }
);

Carousel.displayName = 'Carousel';
