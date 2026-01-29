import { forwardRef, useRef, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/mutation-observer/mutation-observer.js';
import './MutationObserver.css';

export interface MutationObserverProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Watches for changes to attributes. Use '*' to watch all */
  attr?: string;
  /** Records attribute's previous value */
  'attr-old-value'?: boolean;
  /** Watches for changes to character data */
  'char-data'?: boolean;
  /** Records previous text value */
  'char-data-old-value'?: boolean;
  /** Watches for addition or removal of child nodes */
  'child-list'?: boolean;
  /** Disables the observer */
  disabled?: boolean;
  /** Event fired when a mutation occurs */
  onMutation?: (event: CustomEvent) => void;
}

export const MutationObserver = forwardRef<HTMLElement, MutationObserverProps>(
  ({ children, className, onMutation, ...props }, ref) => {
    const observerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const el = observerRef.current;
      if (!el) return;

      const handleMutation = (e: Event) => onMutation?.(e as CustomEvent);
      el.addEventListener('wa-mutation', handleMutation);

      return () => {
        el.removeEventListener('wa-mutation', handleMutation);
      };
    }, [onMutation]);

    return (
      <wa-mutation-observer
        ref={(node: HTMLElement | null) => {
          (observerRef as React.MutableRefObject<HTMLElement | null>).current =
            node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('MutationObserver', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-mutation-observer>
    );
  }
);

MutationObserver.displayName = 'MutationObserver';
