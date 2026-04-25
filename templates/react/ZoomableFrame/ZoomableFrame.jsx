import React, { useRef, useImperativeHandle, useEffect } from 'react';
import clsx from 'clsx';
import './ZoomableFrame.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/zoomable-frame/zoomable-frame.js'));
}

export const ZoomableFrame = React.forwardRef(
  ({ children, className, onLoad, onError, ...props }, ref) => {
    const frameRef = useRef(null);

    useImperativeHandle(
      ref,
      () => ({
        zoomIn: () => frameRef.current?.zoomIn?.(),
        zoomOut: () => frameRef.current?.zoomOut?.(),
        get contentDocument() {
          return frameRef.current?.contentDocument ?? null;
        },
        get contentWindow() {
          return frameRef.current?.contentWindow ?? null;
        },
        get element() {
          return frameRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = frameRef.current;
      if (!el) return;

      const handleLoad = (e) => onLoad?.(e);
      const handleError = (e) => onError?.(e);

      el.addEventListener('load', handleLoad);
      el.addEventListener('error', handleError);

      return () => {
        el.removeEventListener('load', handleLoad);
        el.removeEventListener('error', handleError);
      };
    }, [onLoad, onError]);

    return (
      <wa-zoomable-frame
        ref={frameRef}
        class={clsx('ZoomableFrame', className)}
        {...props}
      >
        {children}
      </wa-zoomable-frame>
    );
  }
);

ZoomableFrame.displayName = 'ZoomableFrame';
