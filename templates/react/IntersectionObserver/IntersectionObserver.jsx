import React from 'react';
import clsx from 'clsx';
import './IntersectionObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/intersection-observer/intersection-observer.js'));
}

export const IntersectionObserver = React.forwardRef(
  ({ children, className, onIntersect, ...props }, ref) => {
    const observerRef = React.useRef(null);

    React.useEffect(() => {
      ensureLoaded();
      const el = observerRef.current;
      if (!el) return;

      const handleIntersect = (e) => onIntersect?.(e);
      el.addEventListener('wa-intersect', handleIntersect);

      return () => {
        el.removeEventListener('wa-intersect', handleIntersect);
      };
    }, [onIntersect]);

    return (
      <wa-intersection-observer
        ref={(node) => {
          observerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('IntersectionObserver', className)}
        {...props}
      >
        {children}
      </wa-intersection-observer>
    );
  }
);

IntersectionObserver.displayName = 'IntersectionObserver';
