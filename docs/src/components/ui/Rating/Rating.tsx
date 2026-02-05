import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/rating/rating.js';
import './Rating.css';

export interface RatingProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'dir'
> {
  /** The current rating */
  value?: number;
  /** The highest rating to show */
  max?: number;
  /** Allows fractional ratings */
  precision?: number;
  /** Makes the rating readonly */
  readonly?: boolean;
  /** Disables the rating */
  disabled?: boolean;
  /** A label for assistive devices */
  label?: string;
  /** The component's size */
  size?: 'small' | 'medium' | 'large';
  /** Event fired when the rating's value changes */
  onChange?: (event: Event) => void;
  /** Event fired during user interaction */
  onHover?: (event: CustomEvent) => void;
}

export interface RatingRef {
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  element: HTMLElement | null;
}

export const Rating = forwardRef<RatingRef, RatingProps>(
  ({ className, onChange, onHover, ...props }, ref) => {
    const ratingRef = useRef<
      HTMLElement & {
        focus?: (options?: FocusOptions) => void;
        blur?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: (options) => ratingRef.current?.focus?.(options),
        blur: () => ratingRef.current?.blur?.(),
        get element() {
          return ratingRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = ratingRef.current;
      if (!el) return;

      const handleChange = (e: Event) => onChange?.(e);
      const handleHover = (e: Event) => onHover?.(e as CustomEvent);

      el.addEventListener('change', handleChange);
      el.addEventListener('wa-hover', handleHover);

      return () => {
        el.removeEventListener('change', handleChange);
        el.removeEventListener('wa-hover', handleHover);
      };
    }, [onChange, onHover]);

    return (
      <wa-rating
        ref={ratingRef}
        class={clsx('Rating', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

Rating.displayName = 'Rating';
