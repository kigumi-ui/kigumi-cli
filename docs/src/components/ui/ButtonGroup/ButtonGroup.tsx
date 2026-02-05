import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/button-group/button-group.js';
import './ButtonGroup.css';

/**
 * Groups related buttons into organized sections, supporting both horizontal and vertical layouts
 *
 * @example
 * ```tsx
 * // Basic horizontal button group
 * <ButtonGroup>
 *   <Button>Left</Button>
 *   <Button>Middle</Button>
 *   <Button>Right</Button>
 * </ButtonGroup>
 *
 * // Vertical orientation
 * <ButtonGroup orientation="vertical">
 *   <Button>Top</Button>
 *   <Button>Middle</Button>
 *   <Button>Bottom</Button>
 * </ButtonGroup>
 *
 * // With accessibility label
 * <ButtonGroup label="Text alignment">
 *   <Button><Icon name="align-left" /></Button>
 *   <Button><Icon name="align-center" /></Button>
 *   <Button><Icon name="align-right" /></Button>
 * </ButtonGroup>
 * ```
 */
export interface ButtonGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** A label to use for the button group. This won't be displayed on the screen, but it will be announced by assistive devices */
  label?: string;
  /** Controls the button group's layout direction */
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup = forwardRef<HTMLElement, ButtonGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-button-group
        ref={ref}
        class={clsx('ButtonGroup', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-button-group>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';
