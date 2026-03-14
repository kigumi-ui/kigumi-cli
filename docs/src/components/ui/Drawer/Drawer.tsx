import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/drawer/drawer.js';
import './Drawer.css';

/**
 * Drawers slide in from a container edge to expose additional options
 *
 * @example
 * ```tsx
 * // Using open prop (recommended)
 * import { useState } from 'react';
 *
 * function App() {
 *   const [open, setOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setOpen(true)}>Open Drawer</Button>
 *       <Drawer open={open} label="Drawer Title" onHide={() => setOpen(false)}>
 *         <p>Drawer content</p>
 *       </Drawer>
 *     </>
 *   );
 * }
 *
 * // Using ref methods (alternative)
 * import { useRef } from 'react';
 * const drawerRef = useRef<DrawerRef>(null);
 *
 * <Button onClick={() => drawerRef.current?.show()}>Open Drawer</Button>
 * <Drawer ref={drawerRef} label="Drawer Title">
 *   <p>Drawer content</p>
 * </Drawer>
 * ```
 */
export interface DrawerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onShow' | 'onAfterShow' | 'onHide' | 'onAfterHide' | 'dir'
> {
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
  show: () => void;
  hide: () => void;
  requestClose: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Drawer = forwardRef<DrawerRef, DrawerProps>(
  (
    {
      children,
      className,
      open,
      onShow,
      onAfterShow,
      onHide,
      onAfterHide,
      ...props
    },
    ref
  ) => {
    const drawerRef = useRef<HTMLElement & { open?: boolean }>(null);

    useImperativeHandle(
      ref,
      () => ({
        show: () => {
          if (drawerRef.current) drawerRef.current.open = true;
        },
        hide: () => {
          if (drawerRef.current) drawerRef.current.open = false;
        },
        requestClose: () => {
          if (drawerRef.current) drawerRef.current.open = false;
        },
        get element() {
          return drawerRef.current;
        },
      }),
      []
    );

    // Sync open prop with drawer element
    useEffect(() => {
      const el = drawerRef.current;
      if (!el || open === undefined) return;
      el.open = open;
    }, [open]);

    // Setup event listeners
    useEffect(() => {
      const el = drawerRef.current;
      if (!el) return;

      const handleShow = (e: Event) => onShow?.(e as CustomEvent);
      const handleAfterShow = (e: Event) => onAfterShow?.(e as CustomEvent);
      const handleHide = (e: Event) => onHide?.(e as CustomEvent);
      const handleAfterHide = (e: Event) => onAfterHide?.(e as CustomEvent);

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-after-show', handleAfterShow);
      el.addEventListener('wa-hide', handleHide);
      el.addEventListener('wa-after-hide', handleAfterHide);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-after-show', handleAfterShow);
        el.removeEventListener('wa-hide', handleHide);
        el.removeEventListener('wa-after-hide', handleAfterHide);
      };
    }, [onShow, onAfterShow, onHide, onAfterHide]);

    return createPortal(
      <wa-drawer
        ref={drawerRef}
        class={clsx('Drawer', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-drawer>,
      document.body
    );
  }
);

Drawer.displayName = 'Drawer';
