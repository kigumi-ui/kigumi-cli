import React from 'react';
import clsx from 'clsx';
import './Markdown.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/markdown/markdown.js'));
}

export const Markdown = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-markdown ref={ref} class={clsx('Markdown', className)} {...props}>
        {children}
      </wa-markdown>
    );
  }
);

Markdown.displayName = 'Markdown';
