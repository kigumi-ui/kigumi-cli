import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaCheckboxGroup from '@awesome.me/webawesome/dist/components/checkbox-group/checkbox-group.js';
import './CheckboxGroup.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/checkbox-group/checkbox-group.js'));
}

/**
 * Checkbox groups label and group a set of checkboxes so they share hint text and validation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CheckboxGroup />
 *
 * // With event handlers
 * <CheckboxGroup />
 *
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
  element: WaCheckboxGroup | null;
}

export const CheckboxGroup = forwardRef<CheckboxGroupRef, CheckboxGroupProps>(
  ({ children, className, ...props }, ref) => {
    const checkboxgroupRef = useRef<WaCheckboxGroup | null>(null);
    const setCheckboxGroupRef = useCallback((el: WaCheckboxGroup | null) => {
      checkboxgroupRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return checkboxgroupRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-checkbox-group
        ref={setCheckboxGroupRef}
        class={clsx('CheckboxGroup', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-checkbox-group>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';
