import React from 'react';
import clsx from 'clsx';
import './Popup.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/popup/popup.js'));
}

/**
 * @typedef {Object} PopupProps
 * @property {boolean} [active] - Activates the positioning logic
 * @property {string} [anchor] - Anchor element ID or reference
 * @property {string} [placement] - Preferred placement: top | top-start | top-end | bottom | bottom-start | bottom-end | right | right-start | right-end | left | left-start | left-end
 * @property {string} [strategy] - Deprecated: The popup renders in the top layer and picks its own positioning strategy, so remove this prop. Removed in the next major.
 * @property {number} [distance] - Distance from anchor
 * @property {number} [skidding] - Offset along anchor
 * @property {boolean} [arrow] - Shows an arrow
 * @property {string} [arrow-placement] - Arrow position: start | end | center | anchor
 * @property {number} [arrow-padding] - Arrow edge padding
 * @property {string} [boundary] - Area flip, shift and auto-size keep the popup inside: the viewport, or the anchor's scrolling ancestors: viewport | scroll
 * @property {boolean} [flip] - Flips when constrained
 * @property {string} [flip-fallback-placements] - Fallback placements
 * @property {string} [flip-fallback-strategy] - Fallback strategy: best-fit | initial
 * @property {number} [flip-padding] - Flip boundary padding
 * @property {boolean} [shift] - Shifts to stay visible
 * @property {number} [shift-padding] - Shift boundary padding
 * @property {string} [auto-size] - Auto-resize behavior: horizontal | vertical | both
 * @property {string} [sync] - Syncs dimensions with anchor: width | height | both
 * @property {number} [auto-size-padding] - Auto-size boundary padding
 * @property {boolean} [hover-bridge] - Covers the gap between anchor and popup with an invisible element, so the pointer can cross it without leaving either
 */

export const Popup = React.forwardRef(
  ({ children, className, onReposition, ...props }, ref) => {
    const popupRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        reposition: () => popupRef.current?.reposition?.(),
        get element() {
          return popupRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = popupRef.current;
      if (!el) return;

      const handleReposition = (e) => {
        if (e.target !== e.currentTarget) return;
        onReposition?.(e);
      };
      el.addEventListener('wa-reposition', handleReposition);

      return () => {
        el.removeEventListener('wa-reposition', handleReposition);
      };
    }, [onReposition]);

    return (
      <wa-popup ref={popupRef} class={clsx('Popup', className)} {...props}>
        {children}
      </wa-popup>
    );
  }
);

Popup.displayName = 'Popup';
