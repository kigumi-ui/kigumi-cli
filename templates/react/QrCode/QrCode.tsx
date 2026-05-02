import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useEffect,
  type HTMLAttributes,
} from 'react';
import clsx from 'clsx';
import type WaQrCode from '@awesome.me/webawesome/dist/components/qr-code/qr-code.js';
import './QrCode.css';

let loadPromise: Promise<unknown> | null = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/qr-code/qr-code.js'));
}

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

  /** Fill color */
  fill?: string;

  /** Background color */
  background?: string;

  /** Corner radius */
  radius?: number;

  /** Error correction level */
  'error-correction'?: 'L' | 'M' | 'Q' | 'H';
}

export interface QrCodeRef {
  /** Reference to the underlying HTML element */
  element: WaQrCode | null;
}

export const QrCode = forwardRef<QrCodeRef, QrCodeProps>(
  ({ children, className, ...props }, ref) => {
    const qrcodeRef = useRef<WaQrCode | null>(null);
    const setQrCodeRef = useCallback((el: WaQrCode | null) => {
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

    useEffect(() => {
      ensureLoaded();
    }, []);

    return (
      <wa-qr-code
        ref={setQrCodeRef}
        class={clsx('QrCode', className)}
        {...({ suppressHydrationWarning: true, ...props } as Record<
          string,
          unknown
        >)}
      >
        {children}
      </wa-qr-code>
    );
  }
);

QrCode.displayName = 'QrCode';
