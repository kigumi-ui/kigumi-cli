import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaTreeItem from '@awesome.me/webawesome/dist/components/tree-item/tree-item.js';
import './TreeItem.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/tree-item/tree-item.js'));
}

/**
 * Tree items are used inside trees to represent hierarchical items
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TreeItem />
 *
 * // With event handlers
 * <TreeItem
 *   onExpand={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<TreeItemRef>(null);
 * <button onClick={() => ref.current?.getChildrenItems()}>Call Method</button>
 * <TreeItem ref={ref} />
 * ```
 */
export interface TreeItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  | 'onExpand'
  | 'onAfterExpand'
  | 'onCollapse'
  | 'onAfterCollapse'
  | 'onLazyChange'
  | 'onLazyLoad'
  | 'dir'
> {
  /** Expands the item */
  expanded?: boolean;

  /** Selects the item */
  selected?: boolean;

  /** Disables the item */
  disabled?: boolean;

  /** Enables lazy loading */
  lazy?: boolean;

  /** Emitted when the tree item expands. */
  onExpand?: (event: CustomEvent) => void;

  /** Emitted after the tree item expands and all animations are complete. */
  onAfterExpand?: (event: CustomEvent) => void;

  /** Emitted when the tree item collapses. */
  onCollapse?: (event: CustomEvent) => void;

  /** Emitted after the tree item collapses and all animations are complete. */
  onAfterCollapse?: (event: CustomEvent) => void;

  /** Emitted when the tree item's lazy state changes. */
  onLazyChange?: (event: CustomEvent) => void;

  /** Emitted when a lazy item is selected. Use this event to asynchronously load data and append items to the tree before expanding. After appending new items, remove the `lazy` attribute to remove the loading state and update the tree. */
  onLazyLoad?: (event: CustomEvent) => void;
}

export interface TreeItemRef {
  /** Gets all the nested tree items in this node. */
  getChildrenItems: (options: { includeDisabled?: boolean }) => void;
  /** Reference to the underlying HTML element */
  element: WaTreeItem | null;
}

export const TreeItem = forwardRef<TreeItemRef, TreeItemProps>(
  (
    {
      children,
      className,
      onExpand,
      onAfterExpand,
      onCollapse,
      onAfterCollapse,
      onLazyChange,
      onLazyLoad,
      ...props
    },
    ref
  ) => {
    const treeitemRef = useRef<WaTreeItem | null>(null);
    const setTreeItemRef = useCallback((el: WaTreeItem | null) => {
      treeitemRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getChildrenItems: (options: { includeDisabled?: boolean }) => {
          if (
            treeitemRef.current &&
            typeof treeitemRef.current.getChildrenItems === 'function'
          ) {
            treeitemRef.current.getChildrenItems(options);
          }
        },
        get element() {
          return treeitemRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = treeitemRef.current;
      if (!el) return;

      const handleWaExpand = (e: Event) => {
        if (onExpand) onExpand(e as CustomEvent);
      };

      const handleWaAfterExpand = (e: Event) => {
        if (onAfterExpand) onAfterExpand(e as CustomEvent);
      };

      const handleWaCollapse = (e: Event) => {
        if (onCollapse) onCollapse(e as CustomEvent);
      };

      const handleWaAfterCollapse = (e: Event) => {
        if (onAfterCollapse) onAfterCollapse(e as CustomEvent);
      };

      const handleWaLazyChange = (e: Event) => {
        if (onLazyChange) onLazyChange(e as CustomEvent);
      };

      const handleWaLazyLoad = (e: Event) => {
        if (onLazyLoad) onLazyLoad(e as CustomEvent);
      };

      el.addEventListener('wa-expand', handleWaExpand);
      el.addEventListener('wa-after-expand', handleWaAfterExpand);
      el.addEventListener('wa-collapse', handleWaCollapse);
      el.addEventListener('wa-after-collapse', handleWaAfterCollapse);
      el.addEventListener('wa-lazy-change', handleWaLazyChange);
      el.addEventListener('wa-lazy-load', handleWaLazyLoad);

      return () => {
        el.removeEventListener('wa-expand', handleWaExpand);
        el.removeEventListener('wa-after-expand', handleWaAfterExpand);
        el.removeEventListener('wa-collapse', handleWaCollapse);
        el.removeEventListener('wa-after-collapse', handleWaAfterCollapse);
        el.removeEventListener('wa-lazy-change', handleWaLazyChange);
        el.removeEventListener('wa-lazy-load', handleWaLazyLoad);
      };
    }, [
      onExpand,
      onAfterExpand,
      onCollapse,
      onAfterCollapse,
      onLazyChange,
      onLazyLoad,
    ]);

    return (
      <wa-tree-item
        ref={setTreeItemRef}
        class={clsx('TreeItem', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-tree-item>
    );
  }
);

TreeItem.displayName = 'TreeItem';
