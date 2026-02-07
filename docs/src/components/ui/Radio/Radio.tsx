import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/radio/radio.js';
import './Radio.css';

export interface RadioProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The radio's value */
  value?: string;
  /** The radio's visual presentation style */
  appearance?: 'default' | 'button';
  /** Disables the radio */
  disabled?: boolean;
  /** Adjustable sizing */
  size?: 'small' | 'medium' | 'large';
}

export const Radio = forwardRef<HTMLElement, RadioProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <wa-radio
        ref={ref}
        class={clsx('Radio', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-radio>
    );
  }
);

Radio.displayName = 'Radio';
