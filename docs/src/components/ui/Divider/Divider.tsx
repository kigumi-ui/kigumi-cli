import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/divider/divider.js';
import './Divider.css';

/**
 * Dividers are used to visually separate content
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Divider />
 *
 * // With event handlers
 * <Divider />
 *
 * ```
 */
export interface DividerProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** Divider orientation */
  orientation?: 'horizontal' | 'vertical';
}

export interface DividerRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Divider = forwardRef<DividerRef, DividerProps>(
  ({ children, className, ...props }, ref) => {
    const dividerRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return dividerRef.current;
        },
      }),
      []
    );

    return (
      <wa-divider
        ref={dividerRef}
        class={clsx('Divider', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-divider>
    );
  }
);

Divider.displayName = 'Divider';
