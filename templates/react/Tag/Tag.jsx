import React, { useRef, useImperativeHandle, useEffect } from 'react';
import clsx from 'clsx';
import './Tag.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tag/tag.js'));
}

export const Tag = React.forwardRef(
  ({ children, className, onRemove, ...props }, ref) => {
    const tagRef = useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return tagRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = tagRef.current;
      if (!el) return;

      const handleRemove = (e) => onRemove?.(e);

      el.addEventListener('wa-remove', handleRemove);

      return () => {
        el.removeEventListener('wa-remove', handleRemove);
      };
    }, [onRemove]);

    return (
      <wa-tag ref={tagRef} class={clsx('Tag', className)} {...props}>
        {children}
      </wa-tag>
    );
  }
);

Tag.displayName = 'Tag';
