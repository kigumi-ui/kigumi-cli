import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaFormatNumber from '@awesome.me/webawesome/dist/components/format-number/format-number.js';
import './FormatNumber.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-number/format-number.js'));
}

/**
 * Formats a number using the Intl.NumberFormat API
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FormatNumber />
 *
 * // With event handlers
 * <FormatNumber />
 *
 * ```
 */
export interface FormatNumberProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The number to format */
  value?: number;

  /** The formatting style */
  type?: 'currency' | 'decimal' | 'percent';

  /** The currency to use (ISO 4217) */
  currency?: string;

  /** How to display the currency */
  'currency-display'?: 'symbol' | 'narrowSymbol' | 'code' | 'name';

  /** Minimum integer digits */
  'minimum-integer-digits'?: number;

  /** Minimum fraction digits */
  'minimum-fraction-digits'?: number;

  /** Maximum fraction digits */
  'maximum-fraction-digits'?: number;

  /** Minimum significant digits */
  'minimum-significant-digits'?: number;

  /** Maximum significant digits */
  'maximum-significant-digits'?: number;

  /** Disables grouping separators */
  'without-grouping'?: boolean;

  /** The locale to use when formatting */
  lang?: string;
}

export interface FormatNumberRef {
  /** Reference to the underlying HTML element */
  element: WaFormatNumber | null;
}

export const FormatNumber = forwardRef<FormatNumberRef, FormatNumberProps>(
  ({ children, className, ...props }, ref) => {
    const formatnumberRef = useRef<WaFormatNumber | null>(null);
    const setFormatNumberRef = useCallback((el: WaFormatNumber | null) => {
      formatnumberRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return formatnumberRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-format-number
        ref={setFormatNumberRef}
        class={clsx('FormatNumber', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-format-number>
    );
  }
);

FormatNumber.displayName = 'FormatNumber';
