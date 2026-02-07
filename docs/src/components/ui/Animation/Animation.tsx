import {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/animation/animation.js';
import './Animation.css';

/**
 * Animate elements declaratively with nearly 100 baked-in presets, or roll your own with custom keyframes
 *
 * @example
 * ```tsx
 * // Using built-in animations
 * <Animation name="bounce" duration={2000} play>
 *   <div className="box">Bouncing!</div>
 * </Animation>
 *
 * // Using ref methods
 * const animRef = useRef<AnimationRef>(null);
 * <button onClick={() => animRef.current?.cancel()}>Cancel</button>
 * <Animation ref={animRef} name="pulse" iterations={3}>
 *   <div>Content</div>
 * </Animation>
 * ```
 */
export interface AnimationProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'dir'
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
  /** Event fired when the animation is canceled */
  onCancel?: (event: CustomEvent) => void;
  /** Event fired when the animation finishes */
  onFinish?: (event: CustomEvent) => void;
  /** Event fired when the animation starts or restarts */
  onStart?: (event: CustomEvent) => void;
}

export interface AnimationRef {
  cancel: () => void;
  finish: () => void;
  element: HTMLElement | null;
}

export const Animation = forwardRef<AnimationRef, AnimationProps>(
  ({ children, className, onCancel, onFinish, onStart, ...props }, ref) => {
    const animationRef = useRef<
      HTMLElement & {
        cancel?: () => void;
        finish?: () => void;
      }
    >(null);

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
      const el = animationRef.current;
      if (!el) return;

      const handleCancel = (e: Event) => {
        if (onCancel) onCancel(e as CustomEvent);
      };

      const handleFinish = (e: Event) => {
        if (onFinish) onFinish(e as CustomEvent);
      };

      const handleStart = (e: Event) => {
        if (onStart) onStart(e as CustomEvent);
      };

      el.addEventListener('wa-cancel', handleCancel);
      el.addEventListener('wa-finish', handleFinish);
      el.addEventListener('wa-start', handleStart);

      return () => {
        el.removeEventListener('wa-cancel', handleCancel);
        el.removeEventListener('wa-finish', handleFinish);
        el.removeEventListener('wa-start', handleStart);
      };
    }, [onCancel, onFinish, onStart]);

    return (
      <wa-animation
        ref={animationRef}
        class={clsx('Animation', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-animation>
    );
  }
);

Animation.displayName = 'Animation';
