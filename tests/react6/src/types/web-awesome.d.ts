/**
 * TypeScript declarations for Web Awesome components
 * This file provides type safety for Web Awesome custom elements in React
 */

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
    
    'wa-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
      variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
      appearance?: 'accent' | 'filled-outlined' | 'filled' | 'outlined' | 'plain';
      size?: 'small' | 'medium' | 'large';
      pill?: boolean;
      disabled?: boolean;
      loading?: boolean;
      'with-caret'?: boolean;
      href?: string;
      target?: '_blank' | '_self' | '_parent' | '_top';
      download?: string;
      rel?: string;
      },
      HTMLElement
    >;

    'wa-input': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
      type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url' | 'search';
      label?: string;
      hint?: string;
      placeholder?: string;
      value?: string;
      appearance?: 'filled' | 'filled-outlined' | 'outlined';
      size?: 'small' | 'medium' | 'large';
      pill?: boolean;
      disabled?: boolean;
      'with-clear'?: boolean;
      'password-toggle'?: boolean;
      },
      HTMLElement
    >;

    'wa-card': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
      appearance?: 'outlined' | 'filled-outlined' | 'plain' | 'filled' | 'accent';
      orientation?: 'vertical' | 'horizontal';
      'with-header'?: boolean;
      'with-footer'?: boolean;
      'with-media'?: boolean;
      },
      HTMLElement
    >;

    'wa-dialog': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
      open?: boolean;
      label?: string;
      'without-header'?: boolean;
      'light-dismiss'?: boolean;
      },
      HTMLElement
    >;
}
  }
}
