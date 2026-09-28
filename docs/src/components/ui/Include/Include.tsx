import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/include/include.js';
import './Include.css';
import type { WaIncludeErrorEvent } from '@awesome.me/webawesome-pro/dist/events/include-error.js';
import type { WaLoadEvent } from '@awesome.me/webawesome-pro/dist/events/load.js';

/**
 * Includes give you the power to embed external HTML files into the page
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Include />
 *
 * // With event handlers
 * <Include
 *   onLoad={(e) => console.log(e)} />
 *
 * ```
 */
export interface IncludeProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onLoad' | 'onIncludeError' | 'dir'
> {
  /** The location of the HTML file to include */
  src?: string;

  /** The fetch mode */
  mode?: 'cors' | 'no-cors' | 'same-origin';

  /** Allows included scripts to be executed */
  'allow-scripts'?: boolean;

  /** Emitted when the included file is loaded. */
  onLoad?: (event: WaLoadEvent) => void;

  /** Emitted when the included file fails to load due to an error. */
  onIncludeError?: (event: WaIncludeErrorEvent) => void;
}

export interface IncludeRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Include = forwardRef<IncludeRef, IncludeProps>(
  ({ children, className, onLoad, onIncludeError, ...props }, ref) => {
    const includeRef = useRef<HTMLElement & {}>(null);

    const setIncludeRef = useCallback((el: typeof includeRef.current) => {
      includeRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return includeRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = includeRef.current;
      if (!el) return;

      const handleLoad = (e: Event) => {
        if (onLoad) onLoad(e as WaLoadEvent);
      };

      const handleIncludeError = (e: Event) => {
        if (onIncludeError) onIncludeError(e as WaIncludeErrorEvent);
      };

      el.addEventListener('wa-load', handleLoad);
      el.addEventListener('wa-include-error', handleIncludeError);

      return () => {
        el.removeEventListener('wa-load', handleLoad);
        el.removeEventListener('wa-include-error', handleIncludeError);
      };
    }, [onLoad, onIncludeError]);

    return (
      <wa-include
        ref={setIncludeRef}
        class={clsx('Include', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-include>
    );
  }
);

Include.displayName = 'Include';
