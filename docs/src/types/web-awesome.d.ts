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
          class?: string;
          src?: string;
          alt?: string;
          play?: boolean;
        },
        HTMLElement
      >;

      'wa-animation': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
          class?: string;
          variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
          appearance?: 'accent' | 'filled' | 'outlined' | 'filled-outlined';
          pill?: boolean;
          attention?: 'none' | 'pulse' | 'bounce';
        },
        HTMLElement
      >;

      'wa-breadcrumb': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
        },
        HTMLElement
      >;

      'wa-breadcrumb-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          href?: string;
          target?: '_blank' | '_parent' | '_self' | '_top';
          rel?: string;
        },
        HTMLElement
      >;

      'wa-button': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          type?: 'button' | 'submit' | 'reset';
          name?: string;
          value?: string;
          formaction?: string;
          formenctype?: string;
          formmethod?: string;
          formnovalidate?: boolean;
          formtarget?: string;
        },
        HTMLElement
      >;

      'wa-button-group': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          orientation?: 'horizontal' | 'vertical';
        },
        HTMLElement
      >;

      'wa-callout': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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

      'wa-card': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
        HTMLAttributes<HTMLElement> & {
          class?: string;
        },
        HTMLElement
      >;

      'wa-checkbox': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
          inline?: boolean;
        },
        HTMLElement
      >;

      'wa-combobox': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          value?: string;
        },
        HTMLElement
      >;

      'wa-comparison': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          position?: number;
        },
        HTMLElement
      >;

      'wa-copy-button': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
          class?: string;
          open?: boolean;
          label?: string;
          'without-header'?: boolean;
          'light-dismiss'?: boolean;
        },
        HTMLElement
      >;

      'wa-divider': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          orientation?: 'horizontal' | 'vertical';
        },
        HTMLElement
      >;

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

      'wa-dropdown': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          size?: 'small' | 'medium' | 'large';
        },
        HTMLElement
      >;

      'wa-dropdown-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          type?: 'normal' | 'checkbox';
          checked?: boolean;
          value?: string;
          disabled?: boolean;
          loading?: boolean;
          variant?: 'neutral' | 'danger';
        },
        HTMLElement
      >;

      'wa-file-input': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          hint?: string;
          accept?: string;
          multiple?: boolean;
          disabled?: boolean;
          required?: boolean;
          size?: 'small' | 'medium' | 'large';
        },
        HTMLElement
      >;

      'wa-format-bytes': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          value?: number;
          unit?: 'byte' | 'bit';
          display?: 'long' | 'short' | 'narrow';
          lang?: string;
        },
        HTMLElement
      >;

      'wa-format-date': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
          class?: string;
          name?: string;
          library?: string;
          src?: string;
          label?: string;
          family?: string;
          variant?: string;
          'auto-width'?: boolean;
          'swap-opacity'?: boolean;
          rotate?: number;
          flip?: 'horizontal' | 'vertical' | 'both';
          animation?: string;
        },
        HTMLElement
      >;

      'wa-include': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          src?: string;
          mode?: 'cors' | 'no-cors' | 'same-origin';
          'allow-scripts'?: boolean;
        },
        HTMLElement
      >;

      'wa-input': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          'password-visible'?: boolean;
          readonly?: boolean;
          required?: boolean;
          name?: string;
          pattern?: string;
          minlength?: number;
          maxlength?: number;
          min?: string;
          max?: string;
          step?: string;
          'without-spin-buttons'?: boolean;
          autocomplete?: string;
          autocapitalize?:
            | 'off'
            | 'none'
            | 'on'
            | 'sentences'
            | 'words'
            | 'characters';
          autocorrect?: 'off' | 'on';
          autofocus?: boolean;
          inputmode?:
            | 'none'
            | 'text'
            | 'decimal'
            | 'numeric'
            | 'tel'
            | 'search'
            | 'email'
            | 'url';
          enterkeyhint?:
            | 'enter'
            | 'done'
            | 'go'
            | 'next'
            | 'previous'
            | 'search'
            | 'send';
        },
        HTMLElement
      >;

      'wa-intersection-observer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          disabled?: boolean;
          once?: boolean;
          threshold?: string;
          'root-margin'?: string;
          'intersect-class'?: string;
        },
        HTMLElement
      >;

      'wa-mutation-observer': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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

      'wa-number-input': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          'without-steppers'?: boolean;
        },
        HTMLElement
      >;

      'wa-option': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          value?: string;
          disabled?: boolean;
          selected?: boolean;
          label?: string;
        },
        HTMLElement
      >;

      'wa-page': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          'disable-navigation-toggle'?: boolean;
          'mobile-breakpoint'?: string;
          'navigation-placement'?: 'start' | 'end';
          'nav-open'?: boolean;
          view?: 'mobile' | 'desktop';
        },
        HTMLElement
      >;

      'wa-popover': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          'without-arrow'?: boolean;
          for?: string;
        },
        HTMLElement
      >;

      'wa-popup': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
          value?: number;
          indeterminate?: boolean;
          label?: string;
        },
        HTMLElement
      >;

      'wa-progress-ring': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          value?: number;
          label?: string;
        },
        HTMLElement
      >;

      'wa-qr-code': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
          value?: string;
          disabled?: boolean;
          size?: 'small' | 'medium' | 'large';
          appearance?: 'default' | 'button';
        },
        HTMLElement
      >;

      'wa-radio-group': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          hint?: string;
          name?: string;
          value?: string;
          size?: 'small' | 'medium' | 'large';
          required?: boolean;
          orientation?: 'horizontal' | 'vertical';
          disabled?: boolean;
          invalid?: boolean;
          'help-text'?: string;
        },
        HTMLElement
      >;

      'wa-rating': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          value?: number;
          max?: number;
          precision?: number;
          readonly?: boolean;
          disabled?: boolean;
          size?: 'small' | 'medium' | 'large';
        },
        HTMLElement
      >;

      'wa-relative-time': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-scroller': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          orientation?: 'horizontal' | 'vertical' | 'both';
          'with-scroll-indicator'?: boolean;
          'without-scrollbar'?: boolean;
          'without-shadow'?: boolean;
        },
        HTMLElement
      >;

      'wa-select': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          invalid?: boolean;
          'help-text'?: string;
        },
        HTMLElement
      >;

      'wa-skeleton': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          effect?: 'pulse' | 'sheen' | 'none';
        },
        HTMLElement
      >;

      'wa-slider': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          name?: string;
          value?: number;
          label?: string;
          hint?: string;
          min?: number;
          max?: number;
          step?: number;
          orientation?: 'horizontal' | 'vertical';
          disabled?: boolean;
          readonly?: boolean;
          required?: boolean;
          range?: boolean;
          'with-markers'?: boolean;
          'with-tooltip'?: boolean;
          size?: 'small' | 'medium' | 'large';
          autofocus?: boolean;
        },
        HTMLElement
      >;

      'wa-sparkline': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          data?: string;
          label?: string;
          appearance?: 'gradient' | 'line' | 'solid';
          trend?: 'positive' | 'negative' | 'neutral';
          curve?: 'linear' | 'natural' | 'step';
        },
        HTMLElement
      >;

      'wa-spinner': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
        },
        HTMLElement
      >;

      'wa-split-panel': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
          class?: string;
          panel?: string;
          disabled?: boolean;
        },
        HTMLElement
      >;

      'wa-tab-group': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          placement?: 'top' | 'bottom' | 'start' | 'end';
          activation?: 'auto' | 'manual';
          'without-scroll-controls'?: boolean;
          active?: string;
        },
        HTMLElement
      >;

      'wa-tab-panel': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          name?: string;
          active?: boolean;
        },
        HTMLElement
      >;

      'wa-tag': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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
          class?: string;
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
          class?: string;
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
          for?: string;
        },
        HTMLElement
      >;

      'wa-tree': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          selection?: 'single' | 'multiple' | 'leaf';
        },
        HTMLElement
      >;

      'wa-tree-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          expanded?: boolean;
          selected?: boolean;
          disabled?: boolean;
          lazy?: boolean;
        },
        HTMLElement
      >;

      'wa-zoomable-frame': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
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

      'wa-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          type?:
            | 'bar'
            | 'line'
            | 'pie'
            | 'doughnut'
            | 'polarArea'
            | 'radar'
            | 'scatter'
            | 'bubble';
          'x-label'?: string;
          'y-label'?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          stacked?: boolean;
          'index-axis'?: 'x' | 'y';
          grid?: 'x' | 'y' | 'both' | 'none';
          min?: number;
          max?: number;
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-toast': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          placement?:
            | 'top-start'
            | 'top-center'
            | 'top-end'
            | 'bottom-start'
            | 'bottom-center'
            | 'bottom-end';
        },
        HTMLElement
      >;

      'wa-toast-item': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
          size?: 'small' | 'medium' | 'large';
          duration?: number;
        },
        HTMLElement
      >;

      'wa-bar-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          orientation?: 'vertical' | 'horizontal';
          'x-label'?: string;
          'y-label'?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          stacked?: boolean;
          'index-axis'?: 'x' | 'y';
          grid?: 'x' | 'y' | 'both' | 'none';
          min?: number;
          max?: number;
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-line-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'x-label'?: string;
          'y-label'?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          stacked?: boolean;
          'index-axis'?: 'x' | 'y';
          grid?: 'x' | 'y' | 'both' | 'none';
          min?: number;
          max?: number;
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-bubble-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'x-label'?: string;
          'y-label'?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          stacked?: boolean;
          'index-axis'?: 'x' | 'y';
          grid?: 'x' | 'y' | 'both' | 'none';
          min?: number;
          max?: number;
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-doughnut-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-pie-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-polar-area-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-radar-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          stacked?: boolean;
          grid?: 'x' | 'y' | 'both' | 'none';
          min?: number;
          max?: number;
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;

      'wa-scatter-chart': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          class?: string;
          label?: string;
          description?: string;
          'x-label'?: string;
          'y-label'?: string;
          'legend-position'?:
            | 'top'
            | 'right'
            | 'bottom'
            | 'left'
            | 'start'
            | 'end';
          grid?: 'x' | 'y' | 'both' | 'none';
          min?: number;
          max?: number;
          'without-animation'?: boolean;
          'without-legend'?: boolean;
          'without-tooltip'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export {};
