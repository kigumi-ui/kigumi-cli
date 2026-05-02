import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaZoomableFrame from '@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js';
import './ZoomableFrame.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js'));
}

/**
 * Zoomable frames display iframe content with zoom controls
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ZoomableFrame />
 *
 * // With event handlers
 * <ZoomableFrame
 *   onLoad={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<ZoomableFrameRef>(null);
 * <button onClick={() => ref.current?.zoomIn()}>Call Method</button>
 * <ZoomableFrame ref={ref} />
 * ```
 */
export interface ZoomableFrameProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onLoad' | 'onError' | 'dir'
> {
  /** URL of content to display */
  src?: string;

  /** Inline HTML to render */
  srcdoc?: string;

  /** Current zoom level */
  zoom?: number;

  /** Available zoom levels */
  'zoom-levels'?: string;

  /** Enables fullscreen */
  allowfullscreen?: boolean;

  /** Loading behavior */
  loading?: 'eager' | 'lazy';

  /** Hides zoom controls */
  'without-controls'?: boolean;

  /** Disables interaction */
  'without-interaction'?: boolean;

  /** Security restrictions */
  sandbox?: string;

  /** Referrer policy */
  referrerpolicy?: string;

  /** Emitted when the internal iframe when it finishes loading. */
  onLoad?: (event: CustomEvent) => void;

  /** Emitted from the internal iframe when it fails to load. */
  onError?: (event: CustomEvent) => void;
}

export interface ZoomableFrameRef {
  /** Zooms in to the next available zoom level. */
  zoomIn: () => void;

  /** Zooms out to the previous available zoom level. */
  zoomOut: () => void;
  /** Reference to the underlying HTML element */
  element: WaZoomableFrame | null;
}

export const ZoomableFrame = forwardRef<ZoomableFrameRef, ZoomableFrameProps>(
  ({ children, className, onLoad, onError, ...props }, ref) => {
    const zoomableframeRef = useRef<WaZoomableFrame | null>(null);
    const setZoomableFrameRef = useCallback((el: WaZoomableFrame | null) => {
      zoomableframeRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => {
          if (
            zoomableframeRef.current &&
            typeof zoomableframeRef.current.zoomIn === 'function'
          ) {
            zoomableframeRef.current.zoomIn();
          }
        },
        zoomOut: () => {
          if (
            zoomableframeRef.current &&
            typeof zoomableframeRef.current.zoomOut === 'function'
          ) {
            zoomableframeRef.current.zoomOut();
          }
        },
        get element() {
          return zoomableframeRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = zoomableframeRef.current;
      if (!el) return;

      const handleLoad = (e: Event) => {
        if (onLoad) onLoad(e as CustomEvent);
      };

      const handleError = (e: Event) => {
        if (onError) onError(e as CustomEvent);
      };

      el.addEventListener('load', handleLoad);
      el.addEventListener('error', handleError);

      return () => {
        el.removeEventListener('load', handleLoad);
        el.removeEventListener('error', handleError);
      };
    }, [onLoad, onError]);

    return (
      <wa-zoomable-frame
        ref={setZoomableFrameRef}
        class={clsx('ZoomableFrame', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-zoomable-frame>
    );
  }
);

ZoomableFrame.displayName = 'ZoomableFrame';
