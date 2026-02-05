import { forwardRef, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/copy-button/copy-button.js';
import './CopyButton.css';

/**
 * Copies text data to the clipboard when clicked
 *
 * @example
 * ```tsx
 * <CopyButton value="Text to copy" />
 * <CopyButton from=".code-block" copy-label="Copy code" success-label="Copied!" />
 * ```
 */
export interface CopyButtonProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'onCopy' | 'onError' | 'dir'
> {
  /** The text to copy */
  value?: string;
  /** Element selector to copy text from */
  from?: string;
  /** Disables the button */
  disabled?: boolean;
  /** Tooltip label for copy state */
  'copy-label'?: string;
  /** Tooltip label for success state */
  'success-label'?: string;
  /** Tooltip label for error state */
  'error-label'?: string;
  /** Duration of feedback state in milliseconds */
  'feedback-duration'?: number;
  /** Tooltip position */
  'tooltip-placement'?: 'top' | 'right' | 'bottom' | 'left';
  /** Event fired when copy succeeds */
  onCopy?: (event: CustomEvent) => void;
  /** Event fired when copy fails */
  onError?: (event: CustomEvent) => void;
}

export const CopyButton = forwardRef<HTMLElement, CopyButtonProps>(
  ({ children, className, onCopy, onError, ...props }, ref) => {
    const internalRef = ref as React.RefObject<HTMLElement>;

    useEffect(() => {
      const el =
        internalRef && 'current' in internalRef ? internalRef.current : null;
      if (!el) return;

      const handleCopy = (e: Event) => {
        if (onCopy) onCopy(e as CustomEvent);
      };

      const handleError = (e: Event) => {
        if (onError) onError(e as CustomEvent);
      };

      el.addEventListener('wa-copy', handleCopy);
      el.addEventListener('wa-error', handleError);

      return () => {
        el.removeEventListener('wa-copy', handleCopy);
        el.removeEventListener('wa-error', handleError);
      };
    }, [internalRef, onCopy, onError]);

    return (
      <wa-copy-button
        ref={ref}
        class={clsx('CopyButton', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-copy-button>
    );
  }
);

CopyButton.displayName = 'CopyButton';
