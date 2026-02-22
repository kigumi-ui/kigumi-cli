/**
 * TypeScript declarations for Web Awesome components
 * This file provides type safety for Web Awesome custom elements in React
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wa-animated-image': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          play?: boolean;
        },
        HTMLElement
      >;

      'wa-animation': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          play?: boolean;
          delay?: number;
          direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
          duration?: number;
          easing?: string;
          'end-delay'?: number;
          fill?: 'auto' | 'backwards' | 'both' | 'forwards' | 'none';
          iterations?: number;
          'iteration-start'?: number;
          'playback-rate'?: number;
        },
        HTMLElement
      >;

      'wa-avatar': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          image?: string;
          label?: string;
          initials?: string;
          loading?: 'eager' | 'lazy';
          shape?: 'circle' | 'square' | 'rounded';
        },
        HTMLElement
      >;

      'wa-badge': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
          appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
          pill?: boolean;
          attention?: 'none' | 'pulse' | 'bounce';
        },
        HTMLElement
      >;

      'wa-breadcrumb': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          label?: string;
        },
        HTMLElement
      >;

      'wa-breadcrumb-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          href?: string;
          target?: '_blank' | '_parent' | '_self' | '_top';
          rel?: string;
        },
        HTMLElement
      >;

      'wa-button': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
          appearance?:
            | 'accent'
            | 'filled-outlined'
            | 'filled'
            | 'outlined'
            | 'plain';
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

      'wa-button-group': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          orientation?: 'horizontal' | 'vertical';
        },
        HTMLElement
      >;

      'wa-card': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          appearance?:
            | 'outlined'
            | 'filled-outlined'
            | 'plain'
            | 'filled'
            | 'accent';
          orientation?: 'vertical' | 'horizontal';
          'with-header'?: boolean;
          'with-footer'?: boolean;
          'with-media'?: boolean;
        },
        HTMLElement
      >;

      'wa-carousel': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          autoplay?: boolean;
          'autoplay-interval'?: number;
          loop?: boolean;
          'mouse-dragging'?: boolean;
          navigation?: boolean;
          orientation?: 'horizontal' | 'vertical';
          pagination?: boolean;
          'slides-per-move'?: number;
          'slides-per-page'?: number;
        },
        HTMLElement
      >;

      'wa-carousel-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {},
        HTMLElement
      >;

      'wa-checkbox': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          checked?: boolean;
          disabled?: boolean;
          hint?: string;
          indeterminate?: boolean;
          name?: string;
          required?: boolean;
          size?: 'small' | 'medium' | 'large';
          value?: string;
        },
        HTMLElement
      >;

      'wa-color-picker': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          format?: 'hex' | 'rgb' | 'hsl' | 'hsv';
          opacity?: boolean;
          disabled?: boolean;
          required?: boolean;
          size?: 'small' | 'medium' | 'large';
          label?: string;
          hint?: string;
          name?: string;
          open?: boolean;
          swatches?: string;
          uppercase?: boolean;
          'without-format-toggle'?: boolean;
        },
        HTMLElement
      >;

      'wa-combobox': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          'allow-custom-value'?: boolean;
          appearance?: 'filled' | 'outlined' | 'filled-outlined';
          autocomplete?: 'list' | 'none';
          disabled?: boolean;
          hint?: string;
          label?: string;
          'max-options-visible'?: number;
          multiple?: boolean;
          name?: string;
          open?: boolean;
          pill?: boolean;
          placeholder?: string;
          placement?: 'top' | 'bottom';
          required?: boolean;
          size?: 'small' | 'medium' | 'large';
          'with-clear'?: boolean;
        },
        HTMLElement
      >;

      'wa-comparison': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          position?: number;
        },
        HTMLElement
      >;

      'wa-copy-button': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          from?: string;
          disabled?: boolean;
          'copy-label'?: string;
          'success-label'?: string;
          'error-label'?: string;
          'feedback-duration'?: number;
          'tooltip-placement'?: 'top' | 'right' | 'bottom' | 'left';
        },
        HTMLElement
      >;

      'wa-details': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          open?: boolean;
          summary?: string;
          disabled?: boolean;
          appearance?: 'filled' | 'outlined' | 'filled-outlined' | 'plain';
          'icon-placement'?: 'start' | 'end';
          name?: string;
        },
        HTMLElement
      >;

      'wa-dialog': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          open?: boolean;
          label?: string;
          'without-header'?: boolean;
          'light-dismiss'?: boolean;
        },
        HTMLElement
      >;

      'wa-divider': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          orientation?: 'horizontal' | 'vertical';
        },
        HTMLElement
      >;

      'wa-drawer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          open?: boolean;
          label?: string;
          placement?: 'top' | 'end' | 'bottom' | 'start';
          'light-dismiss'?: boolean;
          'without-header'?: boolean;
        },
        HTMLElement
      >;

      'wa-dropdown': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          open?: boolean;
          placement?:
            | 'top'
            | 'top-start'
            | 'top-end'
            | 'bottom'
            | 'bottom-start'
            | 'bottom-end'
            | 'right'
            | 'right-start'
            | 'right-end'
            | 'left'
            | 'left-start'
            | 'left-end';
          disabled?: boolean;
          'stay-open-on-select'?: boolean;
          distance?: number;
          skidding?: number;
          hoist?: boolean;
        },
        HTMLElement
      >;

      'wa-dropdown-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          type?: 'normal' | 'checkbox';
          checked?: boolean;
          value?: string;
          disabled?: boolean;
          loading?: boolean;
        },
        HTMLElement
      >;

      'wa-format-bytes': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: number;
          unit?: 'byte' | 'bit';
          display?: 'long' | 'short' | 'narrow';
          lang?: string;
        },
        HTMLElement
      >;

      'wa-format-date': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          date?: string;
          weekday?: 'narrow' | 'short' | 'long';
          era?: 'narrow' | 'short' | 'long';
          year?: 'numeric' | '2-digit';
          month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long';
          day?: 'numeric' | '2-digit';
          hour?: 'numeric' | '2-digit';
          minute?: 'numeric' | '2-digit';
          second?: 'numeric' | '2-digit';
          'hour-format'?: 'auto' | '12' | '24';
          'time-zone-name'?: 'short' | 'long';
          'time-zone'?: string;
          lang?: string;
        },
        HTMLElement
      >;

      'wa-format-number': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: number;
          type?: 'currency' | 'decimal' | 'percent';
          currency?: string;
          'currency-display'?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
          'minimum-integer-digits'?: number;
          'minimum-fraction-digits'?: number;
          'maximum-fraction-digits'?: number;
          'minimum-significant-digits'?: number;
          'maximum-significant-digits'?: number;
          'without-grouping'?: boolean;
          lang?: string;
        },
        HTMLElement
      >;

      'wa-icon': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          library?: string;
          src?: string;
          label?: string;
          family?: string;
          variant?: string;
          'auto-width'?: boolean;
          'swap-opacity'?: boolean;
        },
        HTMLElement
      >;

      'wa-include': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          mode?: 'cors' | 'no-cors' | 'same-origin';
          'allow-scripts'?: boolean;
        },
        HTMLElement
      >;

      'wa-input': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          type?:
            | 'text'
            | 'email'
            | 'password'
            | 'number'
            | 'date'
            | 'tel'
            | 'url'
            | 'search';
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

      'wa-intersection-observer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          disabled?: boolean;
          once?: boolean;
          threshold?: string;
          'root-margin'?: string;
        },
        HTMLElement
      >;

      'wa-mutation-observer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          attr?: string;
          'attr-old-value'?: boolean;
          'char-data'?: boolean;
          'char-data-old-value'?: boolean;
          'child-list'?: boolean;
          disabled?: boolean;
          subtree?: boolean;
        },
        HTMLElement
      >;

      'wa-option': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-popover': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          open?: boolean;
          disabled?: boolean;
          placement?:
            | 'top'
            | 'top-start'
            | 'top-end'
            | 'bottom'
            | 'bottom-start'
            | 'bottom-end'
            | 'right'
            | 'right-start'
            | 'right-end'
            | 'left'
            | 'left-start'
            | 'left-end';
          trigger?: string;
          distance?: number;
          skidding?: number;
          'with-arrow'?: boolean;
        },
        HTMLElement
      >;

      'wa-popup': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          active?: boolean;
          anchor?: string;
          placement?:
            | 'top'
            | 'top-start'
            | 'top-end'
            | 'bottom'
            | 'bottom-start'
            | 'bottom-end'
            | 'right'
            | 'right-start'
            | 'right-end'
            | 'left'
            | 'left-start'
            | 'left-end';
          strategy?: 'absolute' | 'fixed';
          distance?: number;
          skidding?: number;
          arrow?: boolean;
          'arrow-placement'?: 'start' | 'end' | 'center' | 'anchor';
          'arrow-padding'?: number;
          flip?: boolean;
          'flip-fallback-placements'?: string;
          'flip-fallback-strategy'?: 'best-fit' | 'initial';
          'flip-padding'?: number;
          shift?: boolean;
          'shift-padding'?: number;
          'auto-size'?: 'horizontal' | 'vertical' | 'both';
          sync?: 'width' | 'height' | 'both';
          'auto-size-padding'?: number;
        },
        HTMLElement
      >;

      'wa-progress-bar': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: number;
          indeterminate?: boolean;
          label?: string;
        },
        HTMLElement
      >;

      'wa-progress-ring': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: number;
          label?: string;
        },
        HTMLElement
      >;

      'wa-qr-code': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          label?: string;
          size?: number;
          fill?: string;
          background?: string;
          radius?: number;
          'error-correction'?: 'L' | 'M' | 'Q' | 'H';
        },
        HTMLElement
      >;

      'wa-radio': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          disabled?: boolean;
          size?: 'small' | 'medium' | 'large';
        },
        HTMLElement
      >;

      'wa-radio-group': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          label?: string;
          hint?: string;
          name?: string;
          value?: string;
          size?: 'small' | 'medium' | 'large';
          required?: boolean;
        },
        HTMLElement
      >;

      'wa-rating': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          label?: string;
          value?: number;
          max?: number;
          precision?: number;
          readonly?: boolean;
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-relative-time': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          date?: string;
          format?: 'long' | 'short' | 'narrow';
          numeric?: 'always' | 'auto';
          sync?: boolean;
          lang?: string;
        },
        HTMLElement
      >;

      'wa-resize-observer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-scroller': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          orientation?: 'horizontal' | 'vertical' | 'both';
          'with-scroll-indicator'?: boolean;
        },
        HTMLElement
      >;

      'wa-select': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          value?: string;
          appearance?: 'filled' | 'outlined' | 'filled-outlined';
          size?: 'small' | 'medium' | 'large';
          placeholder?: string;
          multiple?: boolean;
          'max-options-visible'?: number;
          disabled?: boolean;
          'with-clear'?: boolean;
          open?: boolean;
          hoist?: boolean;
          placement?: 'top' | 'bottom';
          pill?: boolean;
          label?: string;
          hint?: string;
          required?: boolean;
        },
        HTMLElement
      >;

      'wa-skeleton': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          effect?: 'pulse' | 'sheen' | 'none';
        },
        HTMLElement
      >;

      'wa-slider': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          value?: number;
          label?: string;
          hint?: string;
          min?: number;
          max?: number;
          step?: number;
          tooltip?: 'top' | 'bottom' | 'none';
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-spinner': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {},
        HTMLElement
      >;

      'wa-split-panel': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          position?: number;
          'position-in-pixels'?: number;
          orientation?: 'horizontal' | 'vertical';
          primary?: 'start' | 'end';
          disabled?: boolean;
          snap?: string;
          'snap-threshold'?: number;
        },
        HTMLElement
      >;

      'wa-switch': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          value?: string;
          size?: 'small' | 'medium' | 'large';
          disabled?: boolean;
          checked?: boolean;
          required?: boolean;
          hint?: string;
        },
        HTMLElement
      >;

      'wa-tab': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          panel?: string;
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-tab-group': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          placement?: 'top' | 'bottom' | 'start' | 'end';
          activation?: 'auto' | 'manual';
          'without-scroll-controls'?: boolean;
        },
        HTMLElement
      >;

      'wa-tab-panel': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          active?: boolean;
        },
        HTMLElement
      >;

      'wa-tag': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
          pill?: boolean;
          size?: 'small' | 'medium' | 'large';
          variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
          'with-remove'?: boolean;
        },
        HTMLElement
      >;

      'wa-textarea': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          name?: string;
          value?: string;
          appearance?: 'filled' | 'outlined' | 'filled-outlined';
          size?: 'small' | 'medium' | 'large';
          label?: string;
          hint?: string;
          placeholder?: string;
          rows?: number;
          resize?: 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';
          disabled?: boolean;
          readonly?: boolean;
          required?: boolean;
          minlength?: number;
          maxlength?: number;
          spellcheck?: boolean;
        },
        HTMLElement
      >;

      'wa-tooltip': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          content?: string;
          placement?:
            | 'top'
            | 'top-start'
            | 'top-end'
            | 'bottom'
            | 'bottom-start'
            | 'bottom-end'
            | 'right'
            | 'right-start'
            | 'right-end'
            | 'left'
            | 'left-start'
            | 'left-end';
          disabled?: boolean;
          distance?: number;
          open?: boolean;
          skidding?: number;
          trigger?: string;
          'without-arrow'?: boolean;
          'show-delay'?: number;
          'hide-delay'?: number;
        },
        HTMLElement
      >;

      'wa-tree': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          selection?: 'single' | 'multiple' | 'leaf';
        },
        HTMLElement
      >;

      'wa-tree-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          expanded?: boolean;
          selected?: boolean;
          disabled?: boolean;
          lazy?: boolean;
        },
        HTMLElement
      >;

      'wa-zoomable-frame': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          srcdoc?: string;
          zoom?: number;
          'zoom-levels'?: string;
          allowfullscreen?: boolean;
          loading?: 'eager' | 'lazy';
          'without-controls'?: boolean;
          'without-interaction'?: boolean;
          sandbox?: string;
          referrerpolicy?: string;
        },
        HTMLElement
      >;

      'wa-callout': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          appearance?:
            | 'accent'
            | 'filled'
            | 'outlined'
            | 'plain'
            | 'filled-outlined';
          size?: 'small' | 'medium' | 'large';
          variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
        },
        HTMLElement
      >;

      'wa-page': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          'disable-navigation-toggle'?: boolean;
          'mobile-breakpoint'?: string;
          'navigation-placement'?: 'start' | 'end';
          'nav-open'?: boolean;
          view?: 'mobile' | 'desktop';
        },
        HTMLElement
      >;

      'wa-file-input': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          label?: string;
          hint?: string;
          accept?: string;
          multiple?: boolean;
          disabled?: boolean;
          required?: boolean;
          size?: 'small' | 'medium' | 'large';
          appearance?: 'filled' | 'outlined' | 'filled-outlined';
          'max-file-size'?: number;
          'max-files'?: number;
        },
        HTMLElement
      >;

      'wa-number-input': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          label?: string;
          hint?: string;
          value?: number;
          min?: number;
          max?: number;
          step?: number;
          disabled?: boolean;
          required?: boolean;
          placeholder?: string;
          size?: 'small' | 'medium' | 'large';
          appearance?: 'filled' | 'outlined' | 'filled-outlined';
          'no-spin-buttons'?: boolean;
        },
        HTMLElement
      >;

      'wa-sparkline': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          data?: string;
          type?: 'line' | 'bar' | 'area';
          width?: number;
          height?: number;
          color?: string;
          'fill-color'?: string;
          'line-width'?: number;
          'show-tooltip'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export {};
