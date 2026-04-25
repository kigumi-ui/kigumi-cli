import React from 'react';
import clsx from 'clsx';
import './ResizeObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/resize-observer/resize-observer.js'));
}

export const ResizeObserver = React.forwardRef(
  ({ children, className, onResize, ...props }, ref) => {
    const observerRef = React.useRef(null);

    React.useEffect(() => {
      ensureLoaded();
      const el = observerRef.current;
      if (!el) return;

      const handleResize = (e) => onResize?.(e);
      el.addEventListener('wa-resize', handleResize);

      return () => {
        el.removeEventListener('wa-resize', handleResize);
      };
    }, [onResize]);

    return (
      <wa-resize-observer
        ref={(node) => {
          observerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('ResizeObserver', className)}
        {...props}
      >
        {children}
      </wa-resize-observer>
    );
  }
);

ResizeObserver.displayName = 'ResizeObserver';
