import {
  forwardRef,
  useRef,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/badge/badge.js';
import './Badge.css';

/**
 * Badges are used to draw attention and display statuses or counts
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge>New</Badge>
 *
 * // With start/end slots
 * <Badge variant="success">
 *   <wa-icon slot="start" name="check" />
 *   Approved
 * </Badge>
 *
 * // Pill style with attention
 * <Badge pill attention="pulse">5</Badge>
 * ```
 */
export interface BadgeProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The badge's theme variant */
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

  /** The badge's visual appearance */
  appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';

  /** Draws a pill-style badge with rounded edges */
  pill?: boolean;

  /** Adds an animation to draw attention to the badge */
  attention?: 'none' | 'pulse' | 'bounce';
}

export interface BadgeRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Badge = forwardRef<BadgeRef, BadgeProps>(
  ({ children, className, ...props }, ref) => {
    const badgeRef = useRef<HTMLElement & {}>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return badgeRef.current;
        },
      }),
      []
    );

    return (
      <wa-badge
        ref={badgeRef}
        class={clsx('Badge', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-badge>
    );
  }
);

Badge.displayName = 'Badge';
