import React from 'react';
import clsx from 'clsx';
import './Accordion.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion/accordion.js'));
}

/**
 * Accordions group related disclosure panels and control how many can be open at once
 *
 * @example
 * ```jsx
 * // Basic usage
 * <Accordion />
 *
 * // With event handlers
 * <Accordion onExpand={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = React.useRef(null);
 * <button onClick={() => ref.current?.expandAll()}>Expand All</button>
 * <Accordion ref={ref} />
 * ```
 *
 * @param {Object} props
 * @param {'single' | 'single-collapsible' | 'multiple'} [props.mode] - Controls how many items can be expanded at once
 * @param {'start' | 'end'} [props['icon-placement']] - Where the expand/collapse icon is placed on each item
 * @param {string} [props['heading-level']] - The heading level applied to each item header for assistive technology
 * @param {'filled' | 'outlined' | 'filled-outlined' | 'plain'} [props.appearance] - The visual style of the accordion
 * @param {function} [props.onExpand] - Emitted before an item expands. Cancelable.
 * @param {function} [props.onAfterExpand] - Emitted after an item finishes expanding.
 * @param {function} [props.onCollapse] - Emitted before an item collapses. Cancelable.
 * @param {function} [props.onAfterCollapse] - Emitted after an item finishes collapsing.
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Accordion content
 * @param {React.Ref} ref - Ref with methods: expandAll(), collapseAll()
 */
export const Accordion = React.forwardRef(
  (
    {
      children,
      className,
      onExpand,
      onAfterExpand,
      onCollapse,
      onAfterCollapse,
      ...props
    },
    ref
  ) => {
    const accordionRef = React.useRef(null);
    const setAccordionRef = React.useCallback((el) => {
      accordionRef.current = el;
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        expandAll: () => {
          if (
            accordionRef.current &&
            typeof accordionRef.current.expandAll === 'function'
          ) {
            accordionRef.current.expandAll();
          }
        },
        collapseAll: () => {
          if (
            accordionRef.current &&
            typeof accordionRef.current.collapseAll === 'function'
          ) {
            accordionRef.current.collapseAll();
          }
        },
        get element() {
          return accordionRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
      const el = accordionRef.current;
      if (!el) return;

      const handleWaExpand = (e) => {
        if (onExpand) onExpand(e);
      };

      const handleWaAfterExpand = (e) => {
        if (onAfterExpand) onAfterExpand(e);
      };

      const handleWaCollapse = (e) => {
        if (onCollapse) onCollapse(e);
      };

      const handleWaAfterCollapse = (e) => {
        if (onAfterCollapse) onAfterCollapse(e);
      };

      el.addEventListener('wa-expand', handleWaExpand);
      el.addEventListener('wa-after-expand', handleWaAfterExpand);
      el.addEventListener('wa-collapse', handleWaCollapse);
      el.addEventListener('wa-after-collapse', handleWaAfterCollapse);

      return () => {
        el.removeEventListener('wa-expand', handleWaExpand);
        el.removeEventListener('wa-after-expand', handleWaAfterExpand);
        el.removeEventListener('wa-collapse', handleWaCollapse);
        el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
      };
    }, [onExpand, onAfterExpand, onCollapse, onAfterCollapse]);

    return (
      <wa-accordion
        ref={setAccordionRef}
        class={clsx('Accordion', className)}
        {...{ suppressHydrationWarning: true, ...props }}
      >
        {children}
      </wa-accordion>
    );
  }
);

Accordion.displayName = 'Accordion';
