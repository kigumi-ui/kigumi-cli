import React from 'react';
import clsx from 'clsx';
import './MutationObserver.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/mutation-observer/mutation-observer.js'));
}

/**
 * @typedef {Object} MutationObserverProps
 * @property {string} [attr] - Space-separated list of attributes to observe
 * @property {boolean} [attr-old-value] - Records previous attribute values
 * @property {boolean} [char-data] - Observes character data changes
 * @property {boolean} [char-data-old-value] - Records previous character data
 * @property {boolean} [child-list] - Observes child node changes
 * @property {boolean} [disabled] - Disables the observer
 * @property {boolean} [subtree] - Deprecated: The observer always watches the whole subtree, so remove this prop. Removed in the next major.
 */

export const MutationObserver = React.forwardRef(
  ({ children, className, onMutation, ...props }, ref) => {
    const observerRef = React.useRef(null);

    React.useEffect(() => {
      ensureLoaded();
      const el = observerRef.current;
      if (!el) return;

      const handleMutation = (e) => {
        if (e.target !== e.currentTarget) return;
        onMutation?.(e);
      };
      el.addEventListener('wa-mutation', handleMutation);

      return () => {
        el.removeEventListener('wa-mutation', handleMutation);
      };
    }, [onMutation]);

    return (
      <wa-mutation-observer
        ref={(node) => {
          observerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('MutationObserver', className)}
        {...props}
      >
        {children}
      </wa-mutation-observer>
    );
  }
);

MutationObserver.displayName = 'MutationObserver';
