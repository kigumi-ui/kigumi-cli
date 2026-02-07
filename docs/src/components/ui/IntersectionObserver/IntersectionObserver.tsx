import { forwardRef, useRef, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/intersection-observer/intersection-observer.js';
import './IntersectionObserver.css';

export interface IntersectionObserverProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Deactivates the intersection observer functionality */
  disabled?: boolean;
  /** CSS class applied to elements during intersection */
  'intersect-class'?: string;
  /** If enabled, observation ceases after initial intersection */
  once?: boolean;
  /** Element ID to define the viewport boundaries */
  root?: string | null;
  /** Offset space around the root boundary */
  'root-margin'?: string;
  /** Space-separated visibility percentages triggering the observer */
  threshold?: string;
  /** Event fired when a tracked element begins or ceases intersecting */
  onIntersect?: (event: CustomEvent) => void;
}

export const IntersectionObserver = forwardRef<
  HTMLElement,
  IntersectionObserverProps
>(({ children, className, onIntersect, ...props }, ref) => {
  const observerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const handleIntersect = (e: Event) => onIntersect?.(e as CustomEvent);
    el.addEventListener('wa-intersect', handleIntersect);

    return () => {
      el.removeEventListener('wa-intersect', handleIntersect);
    };
  }, [onIntersect]);

  return (
    <wa-intersection-observer
      ref={(node: HTMLElement | null) => {
        (observerRef as React.MutableRefObject<HTMLElement | null>).current =
          node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      class={clsx('IntersectionObserver', className)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </wa-intersection-observer>
  );
});

IntersectionObserver.displayName = 'IntersectionObserver';
