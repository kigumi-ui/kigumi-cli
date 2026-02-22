import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/tree/tree.js';
import './Tree.css';

/**
 * Trees allow you to display a hierarchical list of selectable tree items
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Tree />
 *
 * // With event handlers
 * <Tree
 *   onSelectionChange={(e) => console.log(e)} />
 *
 * ```
 */
export interface TreeProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onSelectionChange' | 'dir'
> {
  /** Selection behavior */
  selection?: 'single' | 'multiple' | 'leaf';

  /** Emitted when a tree item is selected or deselected. */
  onSelectionChange?: (event: CustomEvent) => void;
}

export interface TreeRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Tree = forwardRef<TreeRef, TreeProps>(
  ({ children, className, onSelectionChange, ...props }, ref) => {
    const treeRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return treeRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = treeRef.current;
      if (!el) return;

      const handleSelectionChange = (e: Event) => {
        if (onSelectionChange) onSelectionChange(e as CustomEvent);
      };

      el.addEventListener('wa-selection-change', handleSelectionChange);

      return () => {
        el.removeEventListener('wa-selection-change', handleSelectionChange);
      };
    }, [onSelectionChange]);

    return (
      <wa-tree
        ref={treeRef}
        class={clsx('Tree', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tree>
    );
  }
);

Tree.displayName = 'Tree';
