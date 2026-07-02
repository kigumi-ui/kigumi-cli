import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/random-content/random-content.js';
import './RandomContent.css';

/**
 * Randomly selects and displays one or more of its child elements
 *
 * @example
 * ```tsx
 * // Rotating testimonials
 * <RandomContent autoplay animation="fade">
 *   <blockquote>Quote one</blockquote>
 *   <blockquote>Quote two</blockquote>
 * </RandomContent>
 *
 * // With ref methods
 * const ref = useRef<RandomContentRef>(null);
 * <button onClick={() => ref.current?.randomize()}>Shuffle</button>
 * <RandomContent ref={ref} />
 * ```
 */
export interface RandomContentProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The number of items to display at once */
  items?: number;

  /** How items are picked on each randomization */
  mode?: 'random' | 'unique' | 'sequence';

  /** Automatically randomizes the displayed items on an interval */
  autoplay?: boolean;

  /** The number of milliseconds between randomizations when autoplay is enabled */
  'autoplay-interval'?: number;

  /** The animation to apply when displayed items change */
  animation?:
    | 'none'
    | 'fade'
    | 'fade-up'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right';

  /** Emitted when the displayed content changes. */
  onContentChange?: (event: CustomEvent) => void;
}

export interface RandomContentRef {
  /** Randomizes the displayed items immediately. */
  randomize: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const RandomContent = forwardRef<RandomContentRef, RandomContentProps>(
  ({ children, className, onContentChange, ...props }, ref) => {
    const randomcontentRef = useRef<
      HTMLElement & {
        randomize?: () => void;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        randomize: () => {
          if (
            randomcontentRef.current &&
            typeof randomcontentRef.current.randomize === 'function'
          ) {
            randomcontentRef.current.randomize();
          }
        },
        get element() {
          return randomcontentRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = randomcontentRef.current;
      if (!el) return;

      const handleContentChange = (e: Event) => {
        if (onContentChange) onContentChange(e as CustomEvent);
      };

      el.addEventListener('wa-content-change', handleContentChange);

      return () => {
        el.removeEventListener('wa-content-change', handleContentChange);
      };
    }, [onContentChange]);

    return (
      <wa-random-content
        ref={randomcontentRef}
        class={clsx('RandomContent', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-random-content>
    );
  }
);

RandomContent.displayName = 'RandomContent';
