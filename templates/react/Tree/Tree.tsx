import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaTree from '@awesome.me/webawesome/dist/components/tree/tree.js';
import './Tree.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tree/tree.js'));
}

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
export interface TreeProps extends Omit<HTMLAttributes<HTMLElement>, 'onSelectionChange' | 'dir'> {

  /** Selection behavior */
  selection?: 'single' | 'multiple' | 'leaf';

  /** Emitted when a tree item is selected or deselected. */
  onSelectionChange?: (event: CustomEvent) => void;
}

export interface TreeRef {
  /** Reference to the underlying HTML element */
  element: WaTree | null;
}

export const Tree = forwardRef<TreeRef, TreeProps>(
  ({ children, className, onSelectionChange, ...props }, ref) => {
    const treeRef = useRef<WaTree | null>(null);
    const setTreeRef = useCallback((el: WaTree | null) => {
      treeRef.current = el;
    }, []);

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
      ensureLoaded();
      const el = treeRef.current;
      if (!el) return;

      const handleWaSelectionChange = (e: Event) => {
        if (onSelectionChange) onSelectionChange(e as CustomEvent);
      };

      el.addEventListener('wa-selection-change', handleWaSelectionChange);

      return () => {
        el.removeEventListener('wa-selection-change', handleWaSelectionChange);
      };
    }, [onSelectionChange]);

    return (
      <wa-tree
        ref={setTreeRef}
        class={clsx('Tree', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-tree>
    );
  }
);

Tree.displayName = 'Tree';
