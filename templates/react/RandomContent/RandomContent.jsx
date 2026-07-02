import React from 'react';
import clsx from 'clsx';
import './RandomContent.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/random-content/random-content.js'));
}

/**
 * Randomly selects and displays one or more of its child elements
 *
 * @example
 * ```jsx
 * // Rotating testimonials
 * <RandomContent autoplay animation="fade">
 *   <blockquote>Quote one</blockquote>
 *   <blockquote>Quote two</blockquote>
 * </RandomContent>
 *
 * // Using ref methods
 * const contentRef = React.useRef(null);
 * <button onClick={() => contentRef.current?.randomize()}>Shuffle</button>
 * <RandomContent ref={contentRef}>
 *   <div>Tip A</div>
 *   <div>Tip B</div>
 * </RandomContent>
 * ```
 *
 * @typedef {Object} RandomContentProps
 * @property {number} [items] - The number of items to display at once
 * @property {string} [mode] - How items are picked: random | unique | sequence
 * @property {boolean} [autoplay] - Automatically randomizes on an interval
 * @property {number} [autoplay-interval] - Milliseconds between randomizations
 * @property {string} [animation] - Animation: none | fade | fade-up | fade-down | fade-left | fade-right
 * @property {function} [onContentChange] - Event fired when displayed content changes
 */

export const RandomContent = React.forwardRef(
  ({ children, className, onContentChange, ...props }, ref) => {
    const randomcontentRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        randomize: () => {
          if (
            randomcontentRef.current &&
            typeof randomcontentRef.current.randomize === 'function'
          ) {
            randomcontentRef.current.randomize();
          }
        },
        get element() {
          return randomcontentRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = randomcontentRef.current;
      if (!el) return;

      const handleContentChange = (e) => {
        if (onContentChange) onContentChange(e);
      };

      el.addEventListener('wa-content-change', handleContentChange);

      return () => {
        el.removeEventListener('wa-content-change', handleContentChange);
      };
    }, [onContentChange]);

    return (
      <wa-random-content
        ref={randomcontentRef}
        class={clsx('RandomContent', className)}
        {...props}
      >
        {children}
      </wa-random-content>
    );
  }
);

RandomContent.displayName = 'RandomContent';
