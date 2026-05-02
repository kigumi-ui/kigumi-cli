import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaMutationObserver from '@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js';
import './MutationObserver.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js'));
}

/**
 * Observes changes to a target element and emits events when they occur
 *
 * @example
 * ```tsx
 * // Basic usage
 * <MutationObserver />
 *
 * // With event handlers
 * <MutationObserver
 *   onMutation={(e) => console.log(e)} />
 *
 * ```
 */
export interface MutationObserverProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onMutation' | 'dir'
> {
  /** Space-separated list of attributes to observe */
  attr?: string;

  /** Records previous attribute values */
  'attr-old-value'?: boolean;

  /** Observes character data changes */
  'char-data'?: boolean;

  /** Records previous character data */
  'char-data-old-value'?: boolean;

  /** Observes child node changes */
  'child-list'?: boolean;

  /** Disables the observer */
  disabled?: boolean;

  /** Observes changes in subtree */
  subtree?: boolean;

  /** Emitted when a mutation occurs. */
  onMutation?: (event: CustomEvent) => void;
}

export interface MutationObserverRef {
  /** Reference to the underlying HTML element */
  element: WaMutationObserver | null;
}

export const MutationObserver = forwardRef<
  MutationObserverRef,
  MutationObserverProps
>(({ children, className, onMutation, ...props }, ref) => {
  const mutationobserverRef = useRef<WaMutationObserver | null>(null);
  const setMutationObserverRef = useCallback(
    (el: WaMutationObserver | null) => {
      mutationobserverRef.current = el;
    },
    []
  );

  useImperativeHandle(
    ref,
    () => ({
      get element() {
        return mutationobserverRef.current;
      },
    }),
    []
  );

  useEffect(() => {
    ensureLoaded();
    const el = mutationobserverRef.current;
    if (!el) return;

    const handleWaMutation = (e: Event) => {
      if (onMutation) onMutation(e as CustomEvent);
    };

    el.addEventListener('wa-mutation', handleWaMutation);

    return () => {
      el.removeEventListener('wa-mutation', handleWaMutation);
    };
  }, [onMutation]);

  return (
    <wa-mutation-observer
      ref={setMutationObserverRef}
      class={clsx('MutationObserver', className)}
      {...({ suppressHydrationWarning: true, ...props } as Record<
        string,
        unknown
      >)}
    >
      {children}
    </wa-mutation-observer>
  );
});

MutationObserver.displayName = 'MutationObserver';
