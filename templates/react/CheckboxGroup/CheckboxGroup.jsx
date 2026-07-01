import React from 'react';
import clsx from 'clsx';
import './CheckboxGroup.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/checkbox-group/checkbox-group.js'));
}

/**
 * Checkbox groups label and group a set of checkboxes so they share hint text and validation
 *
 * @example
 * ```jsx
 * <CheckboxGroup label="Toppings" hint="Choose as many as you like">
 *   <Checkbox value="cheese">Cheese</Checkbox>
 *   <Checkbox value="mushrooms">Mushrooms</Checkbox>
 * </CheckboxGroup>
 * ```
 *
 * @typedef {Object} CheckboxGroupProps
 * @property {string} [label] - Group label
 * @property {string} [hint] - Hint text shown below the label
 * @property {'horizontal'|'vertical'} [orientation] - Layout direction of the grouped checkboxes
 * @property {'small'|'medium'|'large'|'xs'|'s'|'m'|'l'|'xl'} [size] - Size applied to all checkboxes in the group
 * @property {boolean} [required] - Requires at least one option to be selected
 * @property {boolean} [with-label] - Only required for SSR. Renders the label slot on the server
 * @property {boolean} [with-hint] - Only required for SSR. Renders the hint slot on the server
 */

export const CheckboxGroup = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const checkboxgroupRef = React.useRef(null);

    React.useImperativeHandle(
      ref,
      () => ({
        get element() {
          return checkboxgroupRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-checkbox-group
        ref={checkboxgroupRef}
        class={clsx('CheckboxGroup', className)}
        {...{ suppressHydrationWarning: true, ...props }}
      >
        {children}
      </wa-checkbox-group>
    );
  }
);

CheckboxGroup.displayName = 'CheckboxGroup';
