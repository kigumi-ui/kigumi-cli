import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/tree-item/tree-item.js';
import './TreeItem.css';

export interface TreeItemProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
> {
  /** Disables the tree item */
  disabled?: boolean;
  /** Expands the tree item */
  expanded?: boolean;
  /** Enables lazy loading behavior */
  lazy?: boolean;
  /** Draws the tree item in a selected state */
  selected?: boolean;
  /** Emitted when the item collapses */
  onCollapse?: (event: CustomEvent) => void;
  /** Emitted after collapse animation completes */
  onAfterCollapse?: (event: CustomEvent) => void;
  /** Emitted when the item expands */
  onExpand?: (event: CustomEvent) => void;
  /** Emitted after expand animation completes */
  onAfterExpand?: (event: CustomEvent) => void;
  /** Emitted when lazy state changes */
  onLazyChange?: (event: CustomEvent) => void;
  /** Emitted when a lazy item is selected for async loading */
  onLazyLoad?: (event: CustomEvent) => void;
}

export interface TreeItemRef {
  getChildrenItems: (options?: { includeDisabled?: boolean }) => HTMLElement[];
  element: HTMLElement | null;
}

export const TreeItem = forwardRef<TreeItemRef, TreeItemProps>(
  (
    {
      children,
      className,
      onCollapse,
      onAfterCollapse,
      onExpand,
      onAfterExpand,
      onLazyChange,
      onLazyLoad,
      ...props
    },
    ref
  ) => {
    const treeItemRef = useRef<
      HTMLElement & {
        getChildrenItems?: (options?: {
          includeDisabled?: boolean;
        }) => HTMLElement[];
      }
    >(null);

    useImperativeHandle(
      ref,
      () => ({
        getChildrenItems: (options) =>
          treeItemRef.current?.getChildrenItems?.(options) ?? [],
        get element() {
          return treeItemRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      const el = treeItemRef.current;
      if (!el) return;

      const handleCollapse = (e: Event) => onCollapse?.(e as CustomEvent);
      const handleAfterCollapse = (e: Event) =>
        onAfterCollapse?.(e as CustomEvent);
      const handleExpand = (e: Event) => onExpand?.(e as CustomEvent);
      const handleAfterExpand = (e: Event) => onAfterExpand?.(e as CustomEvent);
      const handleLazyChange = (e: Event) => onLazyChange?.(e as CustomEvent);
      const handleLazyLoad = (e: Event) => onLazyLoad?.(e as CustomEvent);

      el.addEventListener('wa-collapse', handleCollapse);
      el.addEventListener('wa-after-collapse', handleAfterCollapse);
      el.addEventListener('wa-expand', handleExpand);
      el.addEventListener('wa-after-expand', handleAfterExpand);
      el.addEventListener('wa-lazy-change', handleLazyChange);
      el.addEventListener('wa-lazy-load', handleLazyLoad);

      return () => {
        el.removeEventListener('wa-collapse', handleCollapse);
        el.removeEventListener('wa-after-collapse', handleAfterCollapse);
        el.removeEventListener('wa-expand', handleExpand);
        el.removeEventListener('wa-after-expand', handleAfterExpand);
        el.removeEventListener('wa-lazy-change', handleLazyChange);
        el.removeEventListener('wa-lazy-load', handleLazyLoad);
      };
    }, [
      onCollapse,
      onAfterCollapse,
      onExpand,
      onAfterExpand,
      onLazyChange,
      onLazyLoad,
    ]);

    return (
      <wa-tree-item
        ref={treeItemRef}
        class={clsx('TreeItem', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tree-item>
    );
  }
);

TreeItem.displayName = 'TreeItem';
