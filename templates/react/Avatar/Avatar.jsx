import React from 'react';
import clsx from 'clsx';
import './Avatar.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/avatar/avatar.js'));
}

/**
 * Avatars are used to represent a person or object
 *
 * @example
 * ```jsx
 * // With image
 * <Avatar image="https://example.com/avatar.jpg" label="User avatar" />
 *
 * // With initials
 * <Avatar initials="JD" label="John Doe" />
 *
 * // With custom icon
 * <Avatar label="Settings">
 *   <wa-icon slot="icon" name="gear" />
 * </Avatar>
 * ```
 *
 * @typedef {Object} AvatarProps
 * @property {string} [image] - The image source to use for the avatar
 * @property {string} label - A label for assistive devices (required)
 * @property {string} [initials] - Initials to use as fallback
 * @property {string} [loading] - How the browser should load the image
 * @property {string} [shape] - The shape of the avatar
 * @property {function} [onError] - Event fired when image fails to load
 */

export const Avatar = React.forwardRef(
  ({ children, className, onError, ...props }, ref) => {
    const elementRef = React.useRef(null);

    React.useImperativeHandle(ref, () => elementRef.current, []);

    React.useEffect(() => {
      ensureLoaded();
      const el = elementRef.current;
      if (!el || !onError) return;

      const handleError = (e) => {
        onError(e);
      };

      el.addEventListener('wa-error', handleError);

      return () => {
        el.removeEventListener('wa-error', handleError);
      };
    }, [onError]);

    return (
      <wa-avatar ref={elementRef} class={clsx('Avatar', className)} {...props}>
        {children}
      </wa-avatar>
    );
  }
);

Avatar.displayName = 'Avatar';
