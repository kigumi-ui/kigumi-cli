import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaRandomContent from '@awesome.me/webawesome/dist/components/random-content/random-content.js';
import './RandomContent.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/random-content/random-content.js'));
}

/**
 * Randomly selects and displays one or more of its child elements
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RandomContent />
 *
 * // With event handlers
 * <RandomContent
 *   onContentChange={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<RandomContentRef>(null);
 * <button onClick={() => ref.current?.randomize()}>Call Method</button>
 * <RandomContent ref={ref} />
 * ```
 */
export interface RandomContentProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onContentChange' | 'dir'
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

  /** Emitted whenever the displayed selection changes, including on first render, on `randomize()`, and on each autoplay tick. */
  onContentChange?: (event: CustomEvent) => void;
}

export interface RandomContentRef {
  /** Selects a new set of children using the current mode. Returns the elements now shown. */
  randomize: () => void;
  /** Reference to the underlying HTML element */
  element: WaRandomContent | null;
}

export const RandomContent = forwardRef<RandomContentRef, RandomContentProps>(
  ({ children, className, onContentChange, ...props }, ref) => {
    const randomcontentRef = useRef<WaRandomContent | null>(null);
    const setRandomContentRef = useCallback((el: WaRandomContent | null) => {
      randomcontentRef.current = el;
    }, []);

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
      ensureLoaded();
      const el = randomcontentRef.current;
      if (!el) return;

      const handleWaContentChange = (e: Event) => {
        if (onContentChange) onContentChange(e as CustomEvent);
      };

      el.addEventListener('wa-content-change', handleWaContentChange);

      return () => {
        el.removeEventListener('wa-content-change', handleWaContentChange);
      };
    }, [onContentChange]);

    return (
      <wa-random-content
        ref={setRandomContentRef}
        class={clsx('RandomContent', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-random-content>
    );
  }
);

RandomContent.displayName = 'RandomContent';
