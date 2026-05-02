import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaFormatBytes from '@awesome.me/webawesome/dist/components/format-bytes/format-bytes.js';
import './FormatBytes.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/format-bytes/format-bytes.js'));
}

/**
 * Formats a number as a human-readable byte value
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FormatBytes />
 *
 * // With event handlers
 * <FormatBytes />
 *
 * ```
 */
export interface FormatBytesProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The number to format in bytes */
  value?: number;

  /** The unit to format the value in */
  unit?: 'byte' | 'bit';

  /** Determines how to display the result */
  display?: 'long' | 'short' | 'narrow';

  /** The locale to use when formatting */
  lang?: string;
}

export interface FormatBytesRef {
  /** Reference to the underlying HTML element */
  element: WaFormatBytes | null;
}

export const FormatBytes = forwardRef<FormatBytesRef, FormatBytesProps>(
  ({ children, className, ...props }, ref) => {
    const formatbytesRef = useRef<WaFormatBytes | null>(null);
    const setFormatBytesRef = useCallback((el: WaFormatBytes | null) => {
      formatbytesRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return formatbytesRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-format-bytes
        ref={setFormatBytesRef}
        class={clsx('FormatBytes', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-format-bytes>
    );
  }
);

FormatBytes.displayName = 'FormatBytes';
