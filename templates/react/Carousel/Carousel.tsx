import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaCarousel from '@awesome.me/webawesome/dist/components/carousel/carousel.js';
import './Carousel.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/carousel/carousel.js'));
}

/**
 * Displays an arbitrary number of content slides along a horizontal or vertical axis
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Carousel />
 *
 * // With event handlers
 * <Carousel
 *   onSlideChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<CarouselRef>(null);
 * <button onClick={() => ref.current?.previous()}>Call Method</button>
 * <Carousel ref={ref} />
 * ```
 */
export interface CarouselProps extends Omit<HTMLAttributes<HTMLElement>, 'onSlideChange' | 'dir'> {

  /** Automatically scrolls slides when user isn't interacting */
  autoplay?: boolean;

  /** Milliseconds between automatic scrolls */
  'autoplay-interval'?: number;

  /** Allows infinite navigation in same direction */
  loop?: boolean;

  /** Enables dragging slides with mouse */
  'mouse-dragging'?: boolean;

  /** Shows previous/next buttons */
  navigation?: boolean;

  /** Carousel layout direction */
  orientation?: 'horizontal' | 'vertical';

  /** Shows slide indicator dots */
  pagination?: boolean;

  /** Number of slides to advance per scroll */
  'slides-per-move'?: number;

  /** Number of slides visible at once */
  'slides-per-page'?: number;

  /** Emitted when the active slide changes. */
  onSlideChange?: (event: CustomEvent) => void;
}

export interface CarouselRef {

  /** Move the carousel backward by `slides-per-move` slides. */
  previous: (behavior: ScrollBehavior) => void;

  /** Move the carousel forward by `slides-per-move` slides. */
  next: (behavior: ScrollBehavior) => void;

  /** Scrolls the carousel to the slide specified by `index`. */
  goToSlide: (index: number, behavior: ScrollBehavior) => void;
  /** Reference to the underlying HTML element */
  element: WaCarousel | null;
}

export const Carousel = forwardRef<CarouselRef, CarouselProps>(
  ({ children, className, onSlideChange, ...props }, ref) => {
    const carouselRef = useRef<WaCarousel | null>(null);
    const setCarouselRef = useCallback((el: WaCarousel | null) => {
      carouselRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        previous: (behavior: ScrollBehavior) => {
          if (carouselRef.current && typeof carouselRef.current.previous === 'function') {
            carouselRef.current.previous(behavior);
          }
        },
        next: (behavior: ScrollBehavior) => {
          if (carouselRef.current && typeof carouselRef.current.next === 'function') {
            carouselRef.current.next(behavior);
          }
        },
        goToSlide: (index: number, behavior: ScrollBehavior) => {
          if (carouselRef.current && typeof carouselRef.current.goToSlide === 'function') {
            carouselRef.current.goToSlide(index, behavior);
          }
        },
        get element() {
          return carouselRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = carouselRef.current;
      if (!el) return;

      const handleWaSlideChange = (e: Event) => {
        if (onSlideChange) onSlideChange(e as CustomEvent);
      };

      el.addEventListener('wa-slide-change', handleWaSlideChange);

      return () => {
        el.removeEventListener('wa-slide-change', handleWaSlideChange);
      };
    }, [onSlideChange]);

    return (
      <wa-carousel
        ref={setCarouselRef}
        class={clsx('Carousel', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-carousel>
    );
  }
);

Carousel.displayName = 'Carousel';
