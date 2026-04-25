import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './AnimatedImage.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/animated-image/animated-image.js'));
}

/**
 * A component for displaying animated GIFs and WEBPs that play and pause on interaction
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AnimatedImage />
 *
 * // With event handlers
 * <AnimatedImage
 *   onLoad={(e) => console.log(e)} />
 *
 * ```
 */
export interface AnimatedImageProps extends Omit<HTMLAttributes<HTMLElement>, 'onLoad' | 'onError' | 'dir'> {

  /** The path to the image to load */
  src: string;

  /** A description of the image used by assistive devices */
  alt: string;

  /** Plays the animation. When this attribute is removed, the animation will pause */
  play?: boolean;

  /** Emitted when the image loads successfully. */
  onLoad?: (event: CustomEvent) => void;

  /** Emitted when the image fails to load. */
  onError?: (event: CustomEvent) => void;
}

export interface AnimatedImageRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const AnimatedImage = forwardRef<AnimatedImageRef, AnimatedImageProps>(
  ({ children, className, onLoad, onError, ...props }, ref) => {
    const animatedimageRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return animatedimageRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = animatedimageRef.current;
      if (!el) return;

      const handleWaLoad = (e: Event) => {
        if (onLoad) onLoad(e as CustomEvent);
      };

      const handleWaError = (e: Event) => {
        if (onError) onError(e as CustomEvent);
      };

      el.addEventListener('wa-load', handleWaLoad);
      el.addEventListener('wa-error', handleWaError);

      return () => {
        el.removeEventListener('wa-load', handleWaLoad);
        el.removeEventListener('wa-error', handleWaError);
      };
    }, [onLoad, onError]);

    return (
      <wa-animated-image
        ref={animatedimageRef}
        class={clsx('AnimatedImage', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-animated-image>
    );
  }
);

AnimatedImage.displayName = 'AnimatedImage';
