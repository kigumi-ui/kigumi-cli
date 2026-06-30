import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaAccordionItem from '@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js';
import './AccordionItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js'));
}

/**
 * Accordion items are the individual disclosure panels placed inside an accordion
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AccordionItem />
 *
 * // With event handlers
 * <AccordionItem />
 *
 * // With ref methods
 * const ref = useRef<AccordionItemRef>(null);
 * <button onClick={() => ref.current?.expand()}>Call Method</button>
 * <AccordionItem ref={ref} />
 * ```
 */
export interface AccordionItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** The header text. Use the `label` slot for markup-rich headers. */
  label?: string;

  /** Whether the item is expanded */
  expanded?: boolean;

  /** Whether the item is disabled and cannot be toggled */
  disabled?: boolean;
}

export interface AccordionItemRef {
  /** Expands the accordion item with animation. */
  expand: () => void;

  /** Collapses the accordion item with animation. */
  collapse: () => void;

  /** Toggles the accordion item's expanded state. */
  toggle: () => void;

  /** Focuses the accordion item's trigger button. */
  focus: (options: FocusOptions) => void;
  /** Reference to the underlying HTML element */
  element: WaAccordionItem | null;
}

export const AccordionItem = forwardRef<AccordionItemRef, AccordionItemProps>(
  ({ children, className, ...props }, ref) => {
    const accordionitemRef = useRef<WaAccordionItem | null>(null);
    const setAccordionItemRef = useCallback((el: WaAccordionItem | null) => {
      accordionitemRef.current = el;
    }, []);

    useImperativeHandle(
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
        focus: (options: FocusOptions) => {
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

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-accordion-item
        ref={setAccordionItemRef}
        class={clsx('AccordionItem', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-accordion-item>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';
