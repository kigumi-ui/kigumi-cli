import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/accordion/accordion.js';
import './Accordion.css';

/**
 * Accordions group related disclosure panels and control how many can be open at once
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Accordion />
 *
 * // With event handlers
 * <Accordion
 *   onExpand={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<AccordionRef>(null);
 * <button onClick={() => ref.current?.expandAll()}>Call Method</button>
 * <Accordion ref={ref} />
 * ```
 */
export interface AccordionProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onExpand' | 'onAfterExpand' | 'onCollapse' | 'onAfterCollapse' | 'dir'
> {
  /** Controls how many items can be expanded at once. `single` keeps one open, `single-collapsible` allows all to be closed, `multiple` allows any number open. */
  mode?: 'single' | 'single-collapsible' | 'multiple';

  /** Where the expand/collapse icon is placed on each item */
  'icon-placement'?: 'start' | 'end';

  /** The heading level applied to each item header for assistive technology */
  'heading-level'?: string;

  /** The visual style of the accordion */
  appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';

  /** Emitted before an item expands. Cancelable. */
  onExpand?: (event: CustomEvent) => void;

  /** Emitted after an item finishes expanding. */
  onAfterExpand?: (event: CustomEvent) => void;

  /** Emitted before an item collapses. Cancelable. */
  onCollapse?: (event: CustomEvent) => void;

  /** Emitted after an item finishes collapsing. */
  onAfterCollapse?: (event: CustomEvent) => void;
}

export interface AccordionRef {
  /** Expands all accordion items. No-op when `mode` is `single` or `single-collapsible`. */
  expandAll: () => void;

  /** Collapses all accordion items. */
  collapseAll: () => void;
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Accordion = forwardRef<AccordionRef, AccordionProps>(
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
    const accordionRef = useRef<
      HTMLElement & {
        expandAll?: () => void;
        collapseAll?: () => void;
      }
    >(null);

    useImperativeHandle(
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

    useEffect(() => {
      const el = accordionRef.current;
      if (!el) return;

      const handleExpand = (e: Event) => {
        if (onExpand) onExpand(e as CustomEvent);
      };

      const handleAfterExpand = (e: Event) => {
        if (onAfterExpand) onAfterExpand(e as CustomEvent);
      };

      const handleCollapse = (e: Event) => {
        if (onCollapse) onCollapse(e as CustomEvent);
      };

      const handleAfterCollapse = (e: Event) => {
        if (onAfterCollapse) onAfterCollapse(e as CustomEvent);
      };

      el.addEventListener('wa-expand', handleExpand);
      el.addEventListener('wa-after-expand', handleAfterExpand);
      el.addEventListener('wa-collapse', handleCollapse);
      el.addEventListener('wa-after-collapse', handleAfterCollapse);

      return () => {
        el.removeEventListener('wa-expand', handleExpand);
        el.removeEventListener('wa-after-expand', handleAfterExpand);
        el.removeEventListener('wa-collapse', handleCollapse);
        el.removeEventListener('wa-after-collapse', handleAfterCollapse);
      };
    }, [onExpand, onAfterExpand, onCollapse, onAfterCollapse]);

    return (
      <wa-accordion
        ref={accordionRef}
        class={clsx('Accordion', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-accordion>
    );
  }
);

Accordion.displayName = 'Accordion';
