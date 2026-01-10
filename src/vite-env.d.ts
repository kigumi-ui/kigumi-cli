/// <reference types="vite/client" />

import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wa-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        variant?: string;
        appearance?: string;
        size?: string;
        pill?: boolean;
        disabled?: boolean;
        loading?: boolean;
        'with-caret'?: boolean;
        href?: string;
        target?: string;
        download?: string;
        rel?: string;
        'data-dialog'?: string;
      };
      'wa-input': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        type?: string;
        label?: string;
        hint?: string;
        placeholder?: string;
        value?: string;
        appearance?: string;
        size?: string;
        pill?: boolean;
        disabled?: boolean;
        'with-clear'?: boolean;
        'password-toggle'?: boolean;
      };
      'wa-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        appearance?: string;
        orientation?: string;
        'with-header'?: boolean;
        'with-footer'?: boolean;
        'with-media'?: boolean;
      };
      'wa-dialog': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        class?: string;
        open?: boolean;
        label?: string;
        'without-header'?: boolean;
        'light-dismiss'?: boolean;
      };
    }
  }
}
