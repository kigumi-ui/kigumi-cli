import React from 'react';
import clsx from 'clsx';
import './SplitPanel.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/split-panel/split-panel.js'));
}

export const SplitPanel = React.forwardRef(
  ({ children, className, onReposition, ...props }, ref) => {
    const panelRef = React.useRef(null);

    React.useEffect(() => {
      ensureLoaded();
      const el = panelRef.current;
      if (!el) return;

      const handleReposition = (e) => onReposition?.(e);
      el.addEventListener('wa-reposition', handleReposition);

      return () => {
        el.removeEventListener('wa-reposition', handleReposition);
      };
    }, [onReposition]);

    return (
      <wa-split-panel
        ref={(node) => {
          panelRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        class={clsx('SplitPanel', className)}
        {...props}
      >
        {children}
      </wa-split-panel>
    );
  }
);

SplitPanel.displayName = 'SplitPanel';
