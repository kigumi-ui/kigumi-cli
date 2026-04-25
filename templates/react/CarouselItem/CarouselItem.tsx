import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaCarouselItem from '@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js';
import './CarouselItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js'));
}

/**
 * Represents an individual slide within a carousel component
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CarouselItem />
 *
 * // With event handlers
 * <CarouselItem />
 *
 * ```
 */
export interface CarouselItemProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

}

export interface CarouselItemRef {
  /** Reference to the underlying HTML element */
  element: WaCarouselItem | null;
}

export const CarouselItem = forwardRef<CarouselItemRef, CarouselItemProps>(
  ({ children, className, ...props }, ref) => {
    const carouselitemRef = useRef<WaCarouselItem | null>(null);
    const setCarouselItemRef = useCallback((el: WaCarouselItem | null) => {
      carouselitemRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return carouselitemRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-carousel-item
        ref={setCarouselItemRef}
        class={clsx('CarouselItem', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-carousel-item>
    );
  }
);

CarouselItem.displayName = 'CarouselItem';
