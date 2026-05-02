'use client';

import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaBadge from '@awesome.me/webawesome/dist/components/badge/badge.js';
import './Badge.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/badge/badge.js'));
}

/**
 * Badges are used to draw attention and display statuses or counts
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Badge />
 *
 * // With event handlers
 * <Badge />
 *
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
  element: WaBadge | null;
}

export const Badge = forwardRef<BadgeRef, BadgeProps>(
  ({ children, className, ...props }, ref) => {
    const badgeRef = useRef<WaBadge | null>(null);
    const setBadgeRef = useCallback((el: WaBadge | null) => {
      badgeRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return badgeRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-badge
        ref={setBadgeRef}
        class={clsx('Badge', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-badge>
    );
  }
);

Badge.displayName = 'Badge';
