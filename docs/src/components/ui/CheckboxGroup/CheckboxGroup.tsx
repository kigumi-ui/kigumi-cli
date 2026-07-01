import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/checkbox-group/checkbox-group.js';
import './CheckboxGroup.css';

/**
 * Checkbox groups label and group a set of checkboxes so they share hint text and validation
 *
 * @example
 * ```tsx
 * <CheckboxGroup label="Toppings" hint="Choose as many as you like">
 *   <Checkbox value="cheese">Cheese</Checkbox>
 *   <Checkbox value="mushrooms">Mushrooms</Checkbox>
 * </CheckboxGroup>
 * ```
 */
export interface CheckboxGroupProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Group label */
  label?: string;

  /** Hint text shown below the label */
  hint?: string;

  /** Layout direction of the grouped checkboxes */
  orientation?: 'horizontal' | 'vertical';

  /** Size applied to all checkboxes in the group */
  size?: 'small' | 'medium' | 'large' | 'xs' | 's' | 'm' | 'l' | 'xl';

  /** Requires at least one option to be selected */
  required?: boolean;

  /** Only required for SSR. Renders the label slot on the server */
  'with-label'?: boolean;

  /** Only required for SSR. Renders the hint slot on the server */
  'with-hint'?: boolean;
}

export interface CheckboxGroupRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const CheckboxGroup = forwardRef<CheckboxGroupRef, CheckboxGroupProps>(
  ({ children, className, ...props }, ref) => {
    const checkboxgroupRef = useRef<HTMLElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return checkboxgroupRef.current;
        },
      }),
      []
    );

    return (
      <wa-checkbox-group
        ref={checkboxgroupRef}
        class={clsx('CheckboxGroup', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-checkbox-group>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';
