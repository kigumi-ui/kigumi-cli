import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import './Card.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??= import('@awesome.me/webawesome/dist/components/card/card.js'));
}

/**
 * Cards can be used to group related subjects in a container
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Card />
 *
 * // With event handlers
 * <Card />
 *
 * ```
 */
export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {

  /** Visual appearance style */
  appearance?: 'outlined' | 'filled-outlined' | 'plain' | 'filled' | 'accent';

  /** Card layout orientation */
  orientation?: 'vertical' | 'horizontal';

  /** Adds header section (for SSR) */
  'with-header'?: boolean;

  /** Adds footer section (for SSR) */
  'with-footer'?: boolean;

  /** Adds media section (for SSR) */
  'with-media'?: boolean;
}

export interface CardRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const Card = forwardRef<CardRef, CardProps>(
  ({ children, className, ...props }, ref) => {
    const cardRef = useRef<HTMLElement & {
    }>(null);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return cardRef.current;
        },
      }),
      []
    );

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-card
        ref={cardRef}
        class={clsx('Card', className)}
        suppressHydrationWarning
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-card>
    );
  }
);

Card.displayName = 'Card';
