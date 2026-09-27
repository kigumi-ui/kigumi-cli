import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/animated-image/animated-image.js';
import './AnimatedImage.css';
import type { WaErrorEvent } from '@awesome.me/webawesome-pro/dist/events/error.js';
import type { WaLoadEvent } from '@awesome.me/webawesome-pro/dist/events/load.js';

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
export interface AnimatedImageProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onLoad' | 'onError' | 'dir'
> {
  /** The path to the image to load */
  src: string;

  /** A description of the image used by assistive devices */
  alt: string;

  /** Plays the animation. When this attribute is removed, the animation will pause */
  play?: boolean;

  /** Emitted when the image loads successfully. */
  onLoad?: (event: WaLoadEvent) => void;

  /** Emitted when the image fails to load. */
  onError?: (event: WaErrorEvent) => void;
}

export interface AnimatedImageRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const AnimatedImage = forwardRef<AnimatedImageRef, AnimatedImageProps>(
  ({ children, className, onLoad, onError, ...props }, ref) => {
    const animatedimageRef = useRef<HTMLElement & {}>(null);

    const setAnimatedimageRef = useCallback(
      (el: typeof animatedimageRef.current) => {
        animatedimageRef.current = el;
      },
      []
    );

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
      const el = animatedimageRef.current;
      if (!el) return;

      const handleLoad = (e: Event) => {
        if (onLoad) onLoad(e as WaLoadEvent);
      };

      const handleError = (e: Event) => {
        if (onError) onError(e as WaErrorEvent);
      };

      el.addEventListener('wa-load', handleLoad);
      el.addEventListener('wa-error', handleError);

      return () => {
        el.removeEventListener('wa-load', handleLoad);
        el.removeEventListener('wa-error', handleError);
      };
    }, [onLoad, onError]);

    return (
      <wa-animated-image
        ref={setAnimatedimageRef}
        class={clsx('AnimatedImage', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-animated-image>
    );
  }
);

AnimatedImage.displayName = 'AnimatedImage';
