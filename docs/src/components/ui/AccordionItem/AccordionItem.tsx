import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/accordion-item/accordion-item.js';
import './AccordionItem.css';

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
  element: HTMLElement | null;
}

export const AccordionItem = forwardRef<AccordionItemRef, AccordionItemProps>(
  ({ children, className, ...props }, ref) => {
    const accordionitemRef = useRef<
      HTMLElement & {
        expand?: () => void;
        collapse?: () => void;
        toggle?: () => void;
        focus?: (options?: FocusOptions) => void;
      }
    >(null);

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

    return (
      <wa-accordion-item
        ref={accordionitemRef}
        class={clsx('AccordionItem', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-accordion-item>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';
