import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaComparison from '@awesome.me/webawesome/dist/components/comparison/comparison.js';
import './Comparison.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/comparison/comparison.js'));
}

/**
 * Compare visual differences between similar content with a sliding panel
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Comparison />
 *
 * // With event handlers
 * <Comparison
 *   onChange={(e) => console.log(e)} />
 *
 * ```
 */
export interface ComparisonProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'dir'
> {
  /** Divider location as percentage (0-100) */
  position?: number;

  /** Emitted when the position changes. */
  onChange?: (event: CustomEvent) => void;
}

export interface ComparisonRef {
  /** Reference to the underlying HTML element */
  element: WaComparison | null;
}

export const Comparison = forwardRef<ComparisonRef, ComparisonProps>(
  ({ children, className, onChange, ...props }, ref) => {
    const comparisonRef = useRef<WaComparison | null>(null);
    const setComparisonRef = useCallback((el: WaComparison | null) => {
      comparisonRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return comparisonRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = comparisonRef.current;
      if (!el) return;

      const handleChange = (e: Event) => {
        if (onChange) onChange(e as CustomEvent);
      };

      el.addEventListener('change', handleChange);

      return () => {
        el.removeEventListener('change', handleChange);
      };
    }, [onChange]);

    return (
      <wa-comparison
        ref={setComparisonRef}
        class={clsx('Comparison', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-comparison>
    );
  }
);

Comparison.displayName = 'Comparison';
