import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaCarouselItem from '@awesome.me/webawesome-pro/dist/components/carousel-item/carousel-item.js';
import '@awesome.me/webawesome-pro/dist/components/carousel/carousel.js';
import './Carousel.css';

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
export interface CarouselProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onSlideChange' | 'dir'
> {
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

  /** Adds a carousel item as the last real slide. */
  addSlide: (slide: WaCarouselItem) => void;

  /** Removes the real slide at the specified index. */
  removeSlide: (index: number) => void;

  /** Scrolls the carousel to the slide specified by `index`. */
  goToSlide: (index: number, behavior: ScrollBehavior) => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Carousel = forwardRef<CarouselRef, CarouselProps>(
  ({ children, className, onSlideChange, ...props }, ref) => {
    const carouselRef = useRef<
      HTMLElement & {
        previous?: (behavior: ScrollBehavior) => void;
        next?: (behavior: ScrollBehavior) => void;
        addSlide?: (slide: WaCarouselItem) => void;
        removeSlide?: (index: number) => void;
        goToSlide?: (index: number, behavior: ScrollBehavior) => void;
      }
    >(null);

    const setCarouselRef = useCallback((el: typeof carouselRef.current) => {
      carouselRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        previous: (behavior: ScrollBehavior) => {
          if (
            carouselRef.current &&
            typeof carouselRef.current.previous === 'function'
          ) {
            carouselRef.current.previous(behavior);
          }
        },
        next: (behavior: ScrollBehavior) => {
          if (
            carouselRef.current &&
            typeof carouselRef.current.next === 'function'
          ) {
            carouselRef.current.next(behavior);
          }
        },
        addSlide: (slide: WaCarouselItem) => {
          if (
            carouselRef.current &&
            typeof carouselRef.current.addSlide === 'function'
          ) {
            carouselRef.current.addSlide(slide);
          }
        },
        removeSlide: (index: number) => {
          if (
            carouselRef.current &&
            typeof carouselRef.current.removeSlide === 'function'
          ) {
            carouselRef.current.removeSlide(index);
          }
        },
        goToSlide: (index: number, behavior: ScrollBehavior) => {
          if (
            carouselRef.current &&
            typeof carouselRef.current.goToSlide === 'function'
          ) {
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
      const el = carouselRef.current;
      if (!el) return;

      const handleSlideChange = (e: Event) => {
        if (onSlideChange) onSlideChange(e as CustomEvent);
      };

      el.addEventListener('wa-slide-change', handleSlideChange);

      return () => {
        el.removeEventListener('wa-slide-change', handleSlideChange);
      };
    }, [onSlideChange]);

    return (
      <wa-carousel
        ref={setCarouselRef}
        class={clsx('Carousel', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-carousel>
    );
  }
);

Carousel.displayName = 'Carousel';
