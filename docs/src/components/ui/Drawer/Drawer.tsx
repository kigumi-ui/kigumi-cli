import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/drawer/drawer.js';
import './Drawer.css';

export interface DrawerProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onLoad' | 'dir'
> {
  /** Indicates whether or not the drawer is open */
  open?: boolean;
  /** The drawer's label as displayed in the header */
  label?: string;
  /** The direction from which the drawer will open */
  placement?: 'top' | 'end' | 'bottom' | 'start';
  /** When enabled, the drawer will be closed when the user clicks outside of it */
  'light-dismiss'?: boolean;
  /** Disables the header and removes the default close button */
  'without-header'?: boolean;
  /** Event fired when the drawer is shown */
  onShow?: (event: CustomEvent) => void;
  /** Event fired after the drawer is shown */
  onAfterShow?: (event: CustomEvent) => void;
  /** Event fired when the drawer is about to hide */
  onHide?: (event: CustomEvent) => void;
  /** Event fired after the drawer is hidden */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface DrawerRef {
  show: () => void;
  hide: () => void;
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
    const drawerRef = useRef<
      HTMLElement & {
        show?: () => void;
        hide?: () => void;
        open?: boolean;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        show: () => drawerRef.current?.show?.(),
        hide: () => drawerRef.current?.hide?.(),
        get element() {
          return drawerRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = drawerRef.current;
      if (!el || open === undefined) return;

      const isOpen = el.open ?? false;
      if (open && !isOpen) {
        el.show?.();
      } else if (!open && isOpen) {
        el.hide?.();
      }
    }, [open]);

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

    return (
      <wa-drawer
        ref={drawerRef}
        class={clsx('Drawer', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-drawer>
    );
  }
);

Drawer.displayName = 'Drawer';
