import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaIntersectionObserver from '@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js';
import './IntersectionObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js'));
}

/**
 * Observes changes in the intersection of a target element with an ancestor
 *
 * @example
 * ```tsx
 * // Basic usage
 * <IntersectionObserver />
 *
 * // With event handlers
 * <IntersectionObserver
 *   onIntersect={(e) => console.log(e)} />
 *
 * ```
 */
export interface IntersectionObserverProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onIntersect' | 'dir'
> {
  /** Disables the observer */
  disabled?: boolean;

  /** Stops observing after first intersection */
  once?: boolean;

  /** Intersection thresholds */
  threshold?: string;

  /** Root element margin */
  'root-margin'?: string;

  /** CSS class to apply when intersecting */
  'intersect-class'?: string;

  /** Fired when a tracked element begins or ceases intersecting. */
  onIntersect?: (event: CustomEvent) => void;
}

export interface IntersectionObserverRef {
  /** Reference to the underlying HTML element */
  element: WaIntersectionObserver | null;
}

export const IntersectionObserver = forwardRef<
  IntersectionObserverRef,
  IntersectionObserverProps
>(({ children, className, onIntersect, ...props }, ref) => {
  const intersectionobserverRef = useRef<WaIntersectionObserver | null>(null);
  const setIntersectionObserverRef = useCallback(
    (el: WaIntersectionObserver | null) => {
      intersectionobserverRef.current = el;
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return intersectionobserverRef.current;
      },
    }),
    []
  );

  useEffect(() => {
    ensureLoaded();
    const el = intersectionobserverRef.current;
    if (!el) return;

    const handleWaIntersect = (e: Event) => {
      if (onIntersect) onIntersect(e as CustomEvent);
    };

    el.addEventListener('wa-intersect', handleWaIntersect);

    return () => {
      el.removeEventListener('wa-intersect', handleWaIntersect);
    };
  }, [onIntersect]);

  return (
    <wa-intersection-observer
      ref={setIntersectionObserverRef}
      class={clsx('IntersectionObserver', className)}
      {...({ suppressHydrationWarning: true, ...props } as Record<
        string,
        unknown
      >)}
    >
      {children}
    </wa-intersection-observer>
  );
});

IntersectionObserver.displayName = 'IntersectionObserver';
