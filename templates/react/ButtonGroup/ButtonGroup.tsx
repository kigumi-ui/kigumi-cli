import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './ButtonGroup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/button-group/button-group.js'));
}

/**
 * Groups related buttons into organized sections, supporting both horizontal and vertical layouts
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ButtonGroup />
 *
 * // With event handlers
 * <ButtonGroup />
 *
 * ```
 */
export interface ButtonGroupProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** A label to use for the button group. This won't be displayed on the screen, but it will be announced by assistive devices */
  label?: string;

  /** Controls the button group's layout direction */
  orientation?: 'horizontal' | 'vertical';
}

export interface ButtonGroupRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const ButtonGroup = forwardRef<ButtonGroupRef, ButtonGroupProps>(
  ({ children, className, ...props }, ref) => {
    const buttongroupRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return buttongroupRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-button-group
        ref={buttongroupRef}
        class={clsx('ButtonGroup', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-button-group>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
