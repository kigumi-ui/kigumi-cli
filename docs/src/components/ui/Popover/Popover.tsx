import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/popover/popover.js';
import './Popover.css';

export interface PopoverProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** Shows or hides the popover */
  open?: boolean;
  /** The ID of the popover's anchor element */
  for?: string | null;
  /** The preferred placement of the popover */
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  /** The distance in pixels from the target element */
  distance?: number;
  /** The offset distance in pixels along the target edge */
  skidding?: number;
  /** Removes the arrow from the popover */
  'without-arrow'?: boolean;
  /** Event fired when the popover is shown */
  onShow?: (event: CustomEvent) => void;
  /** Event fired after the popover is shown */
  onAfterShow?: (event: CustomEvent) => void;
  /** Event fired when the popover is about to hide */
  onHide?: (event: CustomEvent) => void;
  /** Event fired after the popover is hidden */
  onAfterHide?: (event: CustomEvent) => void;
}

export interface PopoverRef {
  show: () => void;
  hide: () => void;
  element: HTMLElement | null;
}

export const Popover = forwardRef<PopoverRef, PopoverProps>(
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
    const popoverRef = useRef<
      HTMLElement & {
        show?: () => void;
        hide?: () => void;
        open?: boolean;
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        show: () => popoverRef.current?.show?.(),
        hide: () => popoverRef.current?.hide?.(),
        get element() {
          return popoverRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = popoverRef.current;
      if (!el || open === undefined) return;

      const isOpen = el.open ?? false;
      if (open && !isOpen) {
        el.show?.();
      } else if (!open && isOpen) {
        el.hide?.();
      }
    }, [open]);

    useEffect(() => {
      const el = popoverRef.current;
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
      <wa-popover
        ref={popoverRef}
        class={clsx('Popover', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-popover>
    );
  }
);

Popover.displayName = 'Popover';
