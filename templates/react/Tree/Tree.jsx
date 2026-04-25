import React, { useRef, useImperativeHandle, useEffect } from 'react';
import clsx from 'clsx';
import './Tree.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tree/tree.js'));
}

export const Tree = React.forwardRef(
  ({ children, className, onSelectionChange, ...props }, ref) => {
    const treeRef = useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return treeRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = treeRef.current;
      if (!el) return;

      const handleSelectionChange = (e) => onSelectionChange?.(e);

      el.addEventListener('wa-selection-change', handleSelectionChange);

      return () => {
        el.removeEventListener('wa-selection-change', handleSelectionChange);
      };
    }, [onSelectionChange]);

    return (
      <wa-tree ref={treeRef} class={clsx('Tree', className)} {...props}>
        {children}
      </wa-tree>
    );
  }
);

Tree.displayName = 'Tree';
