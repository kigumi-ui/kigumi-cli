import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaAnimation from '@awesome.me/webawesome/dist/components/animation/animation.js';
import './Animation.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/animation/animation.js'));
}

/**
 * Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Animation />
 *
 * // With event handlers
 * <Animation
 *   onCancel={(e) => console.log(e)} />
 *
 * // With ref methods
 * const ref = useRef<AnimationRef>(null);
 * <button onClick={() => ref.current?.cancel()}>Call Method</button>
 * <Animation ref={ref} />
 * ```
 */
export interface AnimationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onCancel' | 'onFinish' | 'onStart' | 'dir'
> {
  /** The name of the built-in animation to use */
  name?: string;

  /** Plays the animation. When omitted, the animation will be paused */
  play?: boolean;

  /** The number of milliseconds to delay the start of the animation */
  delay?: number;

  /** Determines the direction of playback */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

  /** The number of milliseconds each iteration takes to complete */
  duration?: number;

  /** The easing function to use */
  easing?: string;

  /** The number of milliseconds to delay after the active period */
  'end-delay'?: number;

  /** Sets how the animation applies styles before and after execution */
  fill?: 'auto' | 'backwards' | 'both' | 'forwards' | 'none';

  /** The number of iterations to run before completing */
  iterations?: number;

  /** The offset at which to start the animation */
  'iteration-start'?: number;

  /** Sets the animation's playback rate */
  'playback-rate'?: number;

  /** Emitted when the animation is canceled. */
  onCancel?: (event: CustomEvent) => void;

  /** Emitted when the animation finishes. */
  onFinish?: (event: CustomEvent) => void;

  /** Emitted when the animation starts or restarts. */
  onStart?: (event: CustomEvent) => void;
}

export interface AnimationRef {
  /** Clears all keyframe effects caused by this animation and aborts its playback. */
  cancel: () => void;

  /** Sets the playback time to the end of the animation corresponding to the current playback direction. */
  finish: () => void;
  /** Reference to the underlying HTML element */
  element: WaAnimation | null;
}

export const Animation = forwardRef<AnimationRef, AnimationProps>(
  ({ children, className, onCancel, onFinish, onStart, ...props }, ref) => {
    const animationRef = useRef<WaAnimation | null>(null);
    const setAnimationRef = useCallback((el: WaAnimation | null) => {
      animationRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        cancel: () => {
          if (
            animationRef.current &&
            typeof animationRef.current.cancel === 'function'
          ) {
            animationRef.current.cancel();
          }
        },
        finish: () => {
          if (
            animationRef.current &&
            typeof animationRef.current.finish === 'function'
          ) {
            animationRef.current.finish();
          }
        },
        get element() {
          return animationRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
      const el = animationRef.current;
      if (!el) return;

      const handleWaCancel = (e: Event) => {
        if (onCancel) onCancel(e as CustomEvent);
      };

      const handleWaFinish = (e: Event) => {
        if (onFinish) onFinish(e as CustomEvent);
      };

      const handleWaStart = (e: Event) => {
        if (onStart) onStart(e as CustomEvent);
      };

      el.addEventListener('wa-cancel', handleWaCancel);
      el.addEventListener('wa-finish', handleWaFinish);
      el.addEventListener('wa-start', handleWaStart);

      return () => {
        el.removeEventListener('wa-cancel', handleWaCancel);
        el.removeEventListener('wa-finish', handleWaFinish);
        el.removeEventListener('wa-start', handleWaStart);
      };
    }, [onCancel, onFinish, onStart]);

    return (
      <wa-animation
        ref={setAnimationRef}
        class={clsx('Animation', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-animation>
    );
  }
);

Animation.displayName = 'Animation';
