import React from 'react';
import clsx from 'clsx';
import './Badge.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/badge/badge.js'));
}

/**
 * Badges are used to draw attention and display statuses or counts
 *
 * @example
 * ```jsx
 * // Basic badge
 * <Badge>New</Badge>
 *
 * // Variants
 * <Badge variant="success">Success</Badge>
 * <Badge variant="warning">Warning</Badge>
 * <Badge variant="danger">Error</Badge>
 *
 * // Pill style with attention
 * <Badge pill attention="pulse">5</Badge>
 *
 * // With start/end slots
 * <Badge variant="success">
 *   <wa-icon slot="start" name="check" />
 *   Approved
 * </Badge>
 *
 * // On buttons
 * <Button>
 *   Notifications
 *   <Badge pill>3</Badge>
 * </Button>
 * ```
 *
 * @typedef {Object} BadgeProps
 * @property {string} [variant] - The badge's theme variant
 * @property {string} [appearance] - The badge's visual appearance
 * @property {boolean} [pill] - Draws a pill-style badge
 * @property {string} [attention] - Adds an animation to draw attention
 */

export const Badge = React.forwardRef(
  ({ children, className, ...props }, ref) => {
    React.useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-badge ref={ref} class={clsx('Badge', className)} {...props}>
        {children}
      </wa-badge>
    );
  }
);

Badge.displayName = 'Badge';
