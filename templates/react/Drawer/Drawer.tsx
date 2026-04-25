import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Drawer.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/drawer/drawer.js'));
}

/**
 * Drawers slide in from a container edge to expose additional options
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Drawer />
 *
 * // With event handlers
 * <Drawer
 *   onShow={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<DrawerRef>(null);
 * <button onClick={() => ref.current?.show()}>Call Method</button>
 * <Drawer ref={ref} />
 * ```
 */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLElement>, 'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'> {

  /** Indicates whether the drawer is open */
  open?: boolean;

  /** The drawer's label as displayed in the header */
  label?: string;

  /** The direction from which the drawer will open */
  placement?: 'top' | 'end' | 'bottom' | 'start';

  /** Closes the drawer when the user clicks outside of it */
  'light-dismiss'?: boolean;

  /** Removes the header */
  'without-header'?: boolean;

  /** Emitted when the drawer opens. */
  onShow?: (event: CustomEvent) => void;

  /** Emitted after the drawer opens and all animations are complete. */
  onAfterShow?: (event: CustomEvent) => void;

  /** Emitted when the drawer is requesting to close. Calling `event.preventDefault()` will prevent the drawer from closing. You can inspect `event.detail.source` to see which element caused the drawer to close. If the source is the drawer element itself, the user has pressed [[Escape]] or the drawer has been closed programmatically. Avoid using this unless closing the drawer will result in destructive behavior such as data loss. */
  onHide?: (event: CustomEvent) => void;

  /** Emitted after the drawer closes and all animations are complete. */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface DrawerRef {

  /** Shows the drawer. */
  show: () => void;

  /** Closes the drawer. */
  requestClose: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Drawer = forwardRef<DrawerRef, DrawerProps>(
  ({ children, className, onShow, onAfterShow, onHide, onAfterHide, ...props }, ref) => {
    const drawerRef = useRef<HTMLElement & {
      show?: () => void;
      requestClose?: () => void;
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (drawerRef.current && typeof drawerRef.current.show === 'function') {
            drawerRef.current.show();
          }
        },
        requestClose: () => {
          if (drawerRef.current && typeof drawerRef.current.requestClose === 'function') {
            drawerRef.current.requestClose();
          }
        },
        get element() {
          return drawerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = drawerRef.current;
      if (!el) return;

      const handleWaShow = (e: Event) => {
        if (onShow) onShow(e as CustomEvent);
      };

      const handleWaAfterShow = (e: Event) => {
        if (onAfterShow) onAfterShow(e as CustomEvent);
      };

      const handleWaHide = (e: Event) => {
        if (onHide) onHide(e as CustomEvent);
      };

      const handleWaAfterHide = (e: Event) => {
        if (onAfterHide) onAfterHide(e as CustomEvent);
      };

      el.addEventListener('wa-show', handleWaShow);
      el.addEventListener('wa-after-show', handleWaAfterShow);
      el.addEventListener('wa-hide', handleWaHide);
      el.addEventListener('wa-after-hide', handleWaAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleWaShow);
        el.removeEventListener('wa-after-show', handleWaAfterShow);
        el.removeEventListener('wa-hide', handleWaHide);
        el.removeEventListener('wa-after-hide', handleWaAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return (
      <wa-drawer
        ref={drawerRef}
        class={clsx('Drawer', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-drawer>
    );
  }
);

Drawer.displayName = 'Drawer';
