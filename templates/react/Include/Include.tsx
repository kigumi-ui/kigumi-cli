import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaInclude from '@awesome.me/webawesome/dist/components/include/include.js';
import './Include.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/include/include.js'));
}

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
export interface IncludeProps extends Omit<HTMLAttributes<HTMLElement>, 'onLoad' | 'onIncludeError' | 'dir'> {

  /** The location of the HTML file to include */
  src?: string;

  /** The fetch mode */
  mode?: 'cors' | 'no-cors' | 'same-origin';

  /** Allows included scripts to be executed */
  'allow-scripts'?: boolean;

  /** Emitted when the included file is loaded. */
  onLoad?: (event: CustomEvent) => void;

  /** Emitted when the included file fails to load due to an error. */
  onIncludeError?: (event: CustomEvent) => void;
}

export interface IncludeRef {
  /** Reference to the underlying HTML element */
  element: WaInclude | null;
}

export const Include = forwardRef<IncludeRef, IncludeProps>(
  ({ children, className, onLoad, onIncludeError, ...props }, ref) => {
    const includeRef = useRef<WaInclude | null>(null);
    const setIncludeRef = useCallback((el: WaInclude | null) => {
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
      ensureLoaded();
      const el = includeRef.current;
      if (!el) return;

      const handleWaLoad = (e: Event) => {
        if (onLoad) onLoad(e as CustomEvent);
      };

      const handleWaIncludeError = (e: Event) => {
        if (onIncludeError) onIncludeError(e as CustomEvent);
      };

      el.addEventListener('wa-load', handleWaLoad);
      el.addEventListener('wa-include-error', handleWaIncludeError);

      return () => {
        el.removeEventListener('wa-load', handleWaLoad);
        el.removeEventListener('wa-include-error', handleWaIncludeError);
      };
    }, [onLoad, onIncludeError]);

    return (
      <wa-include
        ref={setIncludeRef}
        class={clsx('Include', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-include>
    );
  }
);

Include.displayName = 'Include';
