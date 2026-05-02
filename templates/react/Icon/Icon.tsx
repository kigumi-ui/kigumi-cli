import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaIcon from '@awesome.me/webawesome/dist/components/icon/icon.js';
import './Icon.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/icon/icon.js'));
}

/**
 * Icons are symbols that can be used to represent various options within an application
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Icon />
 *
 * // With event handlers
 * <Icon
 *   onLoad={(e) => console.log(e)} />
 *
 * ```
 */
export interface IconProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onLoad' | 'onError' | 'dir'
> {
  /** The name of the icon to draw */
  name?: string;

  /** The name of a registered custom icon library */
  library?: string;

  /** An external URL of an SVG file */
  src?: string;

  /** An alternate description for assistive devices */
  label?: string;

  /** The family of icons (classic, brands, sharp, duotone, sharp-duotone) */
  family?: string;

  /** The icon's variant (thin, light, regular, solid) */
  variant?: string;

  /** Sets the width to match the cropped SVG viewBox */
  'auto-width'?: boolean;

  /** Swaps the opacity of duotone icons */
  'swap-opacity'?: boolean;

  /** Rotate the icon by this many degrees */
  rotate?: number;

  /** Flip the icon horizontally, vertically, or both */
  flip?: 'horizontal' | 'vertical' | 'both';

  /** The name of a built-in animation to apply */
  animation?: string;

  /** Emitted when the icon has loaded. When using `spriteSheet: true` this will not emit. */
  onLoad?: (event: CustomEvent) => void;

  /** Emitted when the icon fails to load due to an error. When using `spriteSheet: true` this will not emit. */
  onError?: (event: CustomEvent) => void;
}

export interface IconRef {
  /** Reference to the underlying HTML element */
  element: WaIcon | null;
}

export const Icon = forwardRef<IconRef, IconProps>(
  ({ children, className, onLoad, onError, ...props }, ref) => {
    const iconRef = useRef<WaIcon | null>(null);
    const setIconRef = useCallback((el: WaIcon | null) => {
      iconRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return iconRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = iconRef.current;
      if (!el) return;

      const handleWaLoad = (e: Event) => {
        if (onLoad) onLoad(e as CustomEvent);
      };

      const handleWaError = (e: Event) => {
        if (onError) onError(e as CustomEvent);
      };

      el.addEventListener('wa-load', handleWaLoad);
      el.addEventListener('wa-error', handleWaError);

      return () => {
        el.removeEventListener('wa-load', handleWaLoad);
        el.removeEventListener('wa-error', handleWaError);
      };
    }, [onLoad, onError]);

    return (
      <wa-icon
        ref={setIconRef}
        class={clsx('Icon', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-icon>
    );
  }
);

Icon.displayName = 'Icon';
