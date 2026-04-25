import React from 'react';
import clsx from 'clsx';
import './Include.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/include/include.js'));
}

export const Include = React.forwardRef(
  ({ className, onLoad, onIncludeError, ...props }, ref) => {
    const includeRef = React.useRef(null);

    React.useEffect(() => {
      ensureLoaded();
      const el = includeRef.current;
      if (!el) return;

      const handleLoad = (e) => onLoad?.(e);
      const handleError = (e) => onIncludeError?.(e);

      el.addEventListener('wa-load', handleLoad);
      el.addEventListener('wa-include-error', handleError);

      return () => {
        el.removeEventListener('wa-load', handleLoad);
        el.removeEventListener('wa-include-error', handleError);
      };
    }, [onLoad, onIncludeError]);

    return (
      <wa-include
        ref={(node) => {
          includeRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('Include', className)}
        {...props}
      />
    );
  }
);

Include.displayName = 'Include';
