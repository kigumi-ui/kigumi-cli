/**
 * TypeScript declarations for Web Awesome components
 * This file provides type safety for Web Awesome custom elements in React
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-drawer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          open?: boolean;
          label?: string;
          placement?: 'top' | 'end' | 'bottom' | 'start';
          'light-dismiss'?: boolean;
          'without-header'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export {};
