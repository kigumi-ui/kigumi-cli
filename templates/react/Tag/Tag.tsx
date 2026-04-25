import { forwardRef, useRef, useCallback, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import type WaTag from '@awesome.me/webawesome/dist/components/tag/tag.js';
import './Tag.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/tag/tag.js'));
}

/**
 * Tags are used as labels to organize things or indicate selections
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Tag />
 *
 * // With event handlers
 * <Tag
 *   onRemove={(e) => console.log(e)} />
 *
 * ```
 */
export interface TagProps extends Omit<HTMLAttributes<HTMLElement>, 'onRemove' | 'dir'> {

  /** Visual appearance */
  appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';

  /** Rounded edges */
  pill?: boolean;

  /** Tag size */
  size?: 'small' | 'medium' | 'large';

  /** Theme variant */
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

  /** Shows remove button */
  'with-remove'?: boolean;

  /** Emitted when the remove button is activated. */
  onRemove?: (event: CustomEvent) => void;
}

export interface TagRef {
  /** Reference to the underlying HTML element */
  element: WaTag | null;
}

export const Tag = forwardRef<TagRef, TagProps>(
  ({ children, className, onRemove, ...props }, ref) => {
    const tagRef = useRef<WaTag | null>(null);
    const setTagRef = useCallback((el: WaTag | null) => {
      tagRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return tagRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = tagRef.current;
      if (!el) return;

      const handleWaRemove = (e: Event) => {
        if (onRemove) onRemove(e as CustomEvent);
      };

      el.addEventListener('wa-remove', handleWaRemove);

      return () => {
        el.removeEventListener('wa-remove', handleWaRemove);
      };
    }, [onRemove]);

    return (
      <wa-tag
        ref={setTagRef}
        class={clsx('Tag', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<string, unknown>)}
      >
        {children}
      </wa-tag>
    );
  }
);

Tag.displayName = 'Tag';
