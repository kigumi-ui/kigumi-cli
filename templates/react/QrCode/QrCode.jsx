import React from 'react';
import clsx from 'clsx';
import './QrCode.css';

let loadPromise = null;
function ensureLoaded() {
  return (loadPromise ??=
    import('@awesome.me/webawesome/dist/components/qr-code/qr-code.js'));
}

/**
 * Generates QR codes for encoding text, URLs, or data
 *
 * @typedef {Object} QrCodeProps
 * @property {string} [value] - The data to encode
 * @property {string} [label] - Accessible label
 * @property {number} [size] - Size in pixels
 * @property {string} [fill] - Deprecated: Set the CSS color property on the QR code instead.
 * @property {string} [background] - Deprecated: Set the CSS background-color property on the QR code instead.
 * @property {number} [radius] - Corner radius
 * @property {string} [error-correction] - Error correction level: L | M | Q | H
 */

export const QrCode = React.forwardRef(({ className, ...props }, ref) => {
  React.useEffect(() => {
    ensureLoaded();
  }, []);

  return <wa-qr-code ref={ref} class={clsx('QrCode', className)} {...props} />;
});

QrCode.displayName = 'QrCode';
