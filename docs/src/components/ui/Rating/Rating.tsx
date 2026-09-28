import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/rating/rating.js';
import './Rating.css';
import type { WaHoverEvent } from '@awesome.me/webawesome-pro/dist/events/hover.js';
import type { WaInvalidEvent } from '@awesome.me/webawesome-pro/dist/events/invalid.js';

/**
 * Ratings give users a way to quickly view and provide feedback
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Rating />
 *
 * // With event handlers
 * <Rating
 *   onChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<RatingRef>(null);
 * <button onClick={() => ref.current?.focus()}>Call Method</button>
 * <Rating ref={ref} />
 * ```
 */
export interface RatingProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'onHover' | 'onInvalid' | 'dir'
> {
  /** Accessible label */
  label?: string;

  /** Form field name */
  name?: string;

  /** Current rating value */
  value?: number;

  /** Value the rating returns to when its form is reset */
  'default-value'?: number;

  /** Maximum rating value */
  max?: number;

  /** Rating precision (e.g., 0.5) */
  precision?: number;

  /** Rating size */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Makes the rating readonly */
  readonly?: boolean;

  /** Makes the rating required for form submission */
  required?: boolean;

  /** Disables the rating */
  disabled?: boolean;

  /** Custom validation message; the control is invalid while it is set */
  'custom-error'?: string;

  /** Emitted when the rating's value changes. */
  onChange?: (event: Event) => void;

  /** Emitted when the user hovers over a value. The `phase` property indicates when hovering starts, moves to a new value, or ends. The `value` property tells what the rating's value would be if the user were to commit to the hovered value. */
  onHover?: (event: WaHoverEvent) => void;

  /** Emitted when the form control has been checked for validity and its constraints aren't satisfied. */
  onInvalid?: (event: WaInvalidEvent) => void;
}

export interface RatingRef {
  /** Sets focus on the rating. */
  focus: (options?: FocusOptions) => void;

  /** Removes focus from the rating. */
  blur: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Rating = forwardRef<RatingRef, RatingProps>(
  ({ children, className, onChange, onHover, onInvalid, ...props }, ref) => {
    const ratingRef = useRef<
      HTMLElement & {
        focus?: (options?: FocusOptions) => void;
        blur?: () => void;
      }
    >(null);

    const setRatingRef = useCallback((el: typeof ratingRef.current) => {
      ratingRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options?: FocusOptions) => {
          if (
            ratingRef.current &&
            typeof ratingRef.current.focus === 'function'
          ) {
            ratingRef.current.focus(options);
          }
        },
        blur: () => {
          if (
            ratingRef.current &&
            typeof ratingRef.current.blur === 'function'
          ) {
            ratingRef.current.blur();
          }
        },
        get element() {
          return ratingRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = ratingRef.current;
      if (!el) return;

      const handleChange = (e: Event) => {
        if (onChange) onChange(e);
      };

      const handleHover = (e: Event) => {
        if (onHover) onHover(e as WaHoverEvent);
      };

      const handleInvalid = (e: Event) => {
        if (onInvalid) onInvalid(e as WaInvalidEvent);
      };

      el.addEventListener('change', handleChange);
      el.addEventListener('wa-hover', handleHover);
      el.addEventListener('wa-invalid', handleInvalid);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-hover', handleHover);
        el.removeEventListener('wa-invalid', handleInvalid);
      };
    }, [onChange, onHover, onInvalid]);

    return (
      <wa-rating
        ref={setRatingRef}
        class={clsx('Rating', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-rating>
    );
  }
);

Rating.displayName = 'Rating';
