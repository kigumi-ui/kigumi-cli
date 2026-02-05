import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/qr-code/qr-code.js';
import './QrCode.css';

export interface QrCodeProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The QR code's value */
  value: string;
  /** The size of the QR code, in pixels */
  size?: number;
  /** The fill color */
  fill?: string;
  /** The background color */
  background?: string;
  /** The edge radius of each module (0-0.5 range) */
  radius?: number;
  /** The level of error correction to use */
  'error-correction'?: 'L' | 'M' | 'Q' | 'H';
  /** The label for assistive devices */
  label?: string;
}

export const QrCode = forwardRef<HTMLElement, QrCodeProps>(
  ({ className, ...props }, ref) => {
    return (
      <wa-qr-code
        ref={ref}
        class={clsx('QrCode', className)}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);

QrCode.displayName = 'QrCode';
