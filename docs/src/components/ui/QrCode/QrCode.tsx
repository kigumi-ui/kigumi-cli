import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import '@awesome.me/webawesome-pro/dist/components/qr-code/qr-code.js';
import './QrCode.css';

/**
 * Generates QR codes for encoding text, URLs, or data
 *
 * @example
 * ```tsx
 * // Basic usage
 * <QrCode />
 *
 * // With event handlers
 * <QrCode />
 *
 * ```
 */
export interface QrCodeProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  /** The data to encode */
  value?: string;

  /** Accessible label */
  label?: string;

  /** Size in pixels */
  size?: number;

  /**
   * Fill color
   *
   * @deprecated Set the CSS color property on the QR code instead.
   */
  fill?: string;

  /**
   * Background color
   *
   * @deprecated Set the CSS background-color property on the QR code instead.
   */
  background?: string;

  /** Corner radius */
  radius?: number;

  /** Error correction level */
  'error-correction'?: 'L' | 'M' | 'Q' | 'H';

  /** URL or data URI of an image, such as a logo, drawn in the centre of the code */
  image?: string;

  /** Colour filled behind the centre image, so the code does not show through a transparent one */
  'image-background'?: string;

  /** Share of the code's error-correction capacity the centre image may take, from 0 to 1 (0.5 when unset); higher values scan less reliably */
  'image-coverage'?: number;
}

export interface QrCodeRef {
  /** Reference to the underlying HTML element */
  element: HTMLElement | null;
}

export const QrCode = forwardRef<QrCodeRef, QrCodeProps>(
  ({ children, className, ...props }, ref) => {
    const qrcodeRef = useRef<HTMLElement & {}>(null);

    const setQrcodeRef = useCallback((el: typeof qrcodeRef.current) => {
      qrcodeRef.current = el;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        get element() {
          return qrcodeRef.current;
        },
      }),
      []
    );

    return (
      <wa-qr-code
        ref={setQrcodeRef}
        class={clsx('QrCode', className)}
        {...(props as Record<string, unknown>)}
      >
        {children}
      </wa-qr-code>
    );
  }
);

QrCode.displayName = 'QrCode';
