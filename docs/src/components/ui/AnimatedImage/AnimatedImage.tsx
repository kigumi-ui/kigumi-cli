import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/animated-image/animated-image.js';
import './AnimatedImage.css';

/**
 * A component for displaying animated GIFs and WEBPs that play and pause on interaction
 *
 * @example
 * ```tsx
 * <AnimatedImage
 *   src="https://example.com/animation.gif"
 *   alt="Animated illustration"
 *   play
 * />
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
  /** Event fired when the image loads successfully */
  onLoad?: (event: CustomEvent) => void;
  /** Event fired when the image fails to load */
  onError?: (event: CustomEvent) => void;
}

export const AnimatedImage = forwardRef<HTMLElement, AnimatedImageProps>(
  ({ className, onLoad, onError, ...props }, ref) => {
    const elementRef = useRef<HTMLElement>(null);

    useImperativeHandle(ref, () => elementRef.current as HTMLElement, []);

    useEffect(() => {
      const el = elementRef.current;
      if (!el) return;

      const handleLoad = (e: Event) => {
        if (onLoad) onLoad(e as CustomEvent);
      };

      const handleError = (e: Event) => {
        if (onError) onError(e as CustomEvent);
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
        ref={elementRef}
        class={clsx('AnimatedImage', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

AnimatedImage.displayName = 'AnimatedImage';
