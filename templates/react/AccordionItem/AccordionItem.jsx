import React from 'react';
import clsx from 'clsx';
import './AccordionItem.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js'));
}

/**
 * Accordion items are the individual disclosure panels placed inside an accordion
 *
 * @example
 * ```jsx
 * // Basic usage
 * <AccordionItem label="Section title">Content</AccordionItem>
 *
 * // With ref methods
 * const ref = React.useRef(null);
 * <button onClick={() => ref.current?.expand()}>Expand</button>
 * <AccordionItem ref={ref} label="Section title">Content</AccordionItem>
 * ```
 *
 * @param {Object} props
 * @param {string} [props.label] - The header text. Use the `label` slot for markup-rich headers.
 * @param {boolean} [props.expanded] - Whether the item is expanded
 * @param {boolean} [props.disabled] - Whether the item is disabled and cannot be toggled
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Item content
 * @param {React.Ref} ref - Ref with methods: expand(), collapse(), toggle(), focus(options)
 */
export const AccordionItem = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    const accordionitemRef = React.useRef(null);
    const setAccordionItemRef = React.useCallback((el) => {
      accordionitemRef.current = el;
    }, []);

    React.useImperativeHandle(
      ref,
      () => ({
        expand: () => {
          if (
            accordionitemRef.current &&
            typeof accordionitemRef.current.expand === 'function'
          ) {
            accordionitemRef.current.expand();
          }
        },
        collapse: () => {
          if (
            accordionitemRef.current &&
            typeof accordionitemRef.current.collapse === 'function'
          ) {
            accordionitemRef.current.collapse();
          }
        },
        toggle: () => {
          if (
            accordionitemRef.current &&
            typeof accordionitemRef.current.toggle === 'function'
          ) {
            accordionitemRef.current.toggle();
          }
        },
        focus: (options) => {
          if (
            accordionitemRef.current &&
            typeof accordionitemRef.current.focus === 'function'
          ) {
            accordionitemRef.current.focus(options);
          }
        },
        get element() {
          return accordionitemRef.current;
        },
      }),
      []
    );

    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-accordion-item
        ref={setAccordionItemRef}
        class={clsx('AccordionItem', className)}
        {...{ suppressHydrationWarning: true, ...props }}
      >
        {children}
      </wa-accordion-item>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';
