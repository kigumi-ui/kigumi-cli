import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/tag/tag.js';
import './Tag.css';

export interface TagProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The tag's visual appearance */
  appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
  /** Draws a pill-style tag with rounded edges */
  pill?: boolean;
  /** The tag's size */
  size?: 'small' | 'medium' | 'large';
  /** The tag's theme variant */
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  /** Makes the tag removable and shows a remove button */
  withRemove?: boolean;
  /** Emitted when the remove button is activated */
  onRemove?: (event: CustomEvent) => void;
}

export interface TagRef {
  element: HTMLElement | null;
}

export const Tag = forwardRef<TagRef, TagProps>(
  ({ children, className, onRemove, ...props }, ref) => {
    const tagRef = useRef<HTMLElement>(null);

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
      const el = tagRef.current;
      if (!el) return;

      const handleRemove = (e: Event) => onRemove?.(e as CustomEvent);

      el.addEventListener('wa-remove', handleRemove);

      return () => {
        el.removeEventListener('wa-remove', handleRemove);
      };
    }, [onRemove]);

    return (
      <wa-tag
        ref={tagRef}
        class={clsx('Tag', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-tag>
    );
  }
);

Tag.displayName = 'Tag';
