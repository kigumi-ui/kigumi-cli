import React from 'react';
import clsx from 'clsx';
import './CarouselItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js'));
}

/**
 * Represents an individual slide within a carousel component
 *
 * @example
 * ```jsx
 * <Carousel>
 *   <CarouselItem>
 *     <img src="slide1.jpg" alt="Slide 1" />
 *   </CarouselItem>
 * </Carousel>
 * ```
 */
export const CarouselItem = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-carousel-item
        ref={ref}
        class={clsx('CarouselItem', className)}
        {...props}
      >
        {children}
      </wa-carousel-item>
    );
  }
);

CarouselItem.displayName = 'CarouselItem';
