/**
 * CSS Metadata for Web Awesome Components
 *
 * Build-time data consumed by generate-{angular,react,vue}-templates.ts to
 * emit CSS parts / custom-property comments into the generated CSS templates.
 * Not used at runtime.
 */

export interface CSSPart {
  name: string;
  description: string;
}

export interface CSSCustomProperty {
  name: string;
  default?: string;
  description: string;
}

export interface ComponentCSSMetadata {
  parts: CSSPart[];
  customProperties: CSSCustomProperty[];
  docsUrl: string;
}

// CSS metadata for each component
// Extracted from https://webawesome.com/docs/components/[component]
export const CSS_METADATA: Record<string, ComponentCSSMetadata> = {
  button: {
    docsUrl: 'https://webawesome.com/docs/components/button',
    parts: [
      { name: 'base', description: "The component's base wrapper" },
      { name: 'prefix', description: 'The container that wraps the prefix' },
      { name: 'label', description: 'The button label' },
      { name: 'suffix', description: 'The container that wraps the suffix' },
      { name: 'caret', description: 'The dropdown caret icon' },
      { name: 'spinner', description: 'The loading spinner' },
    ],
    customProperties: [
      { name: '--wa-spacing-small', description: 'Spacing for small size' },
      { name: '--wa-spacing-medium', description: 'Spacing for medium size' },
      { name: '--wa-spacing-large', description: 'Spacing for large size' },
    ],
  },
  input: {
    docsUrl: 'https://webawesome.com/docs/components/input',
    parts: [
      { name: 'form-control', description: 'The form control wrapper' },
      { name: 'form-control-label', description: 'The label wrapper' },
      { name: 'form-control-input', description: 'The input wrapper' },
      { name: 'form-control-help-text', description: 'The help text wrapper' },
      { name: 'base', description: "The component's base wrapper" },
      { name: 'input', description: 'The internal input element' },
      { name: 'prefix', description: 'The container that wraps the prefix' },
      { name: 'clear-button', description: 'The clear button' },
      {
        name: 'password-toggle-button',
        description: 'The password toggle button',
      },
      { name: 'suffix', description: 'The container that wraps the suffix' },
    ],
    customProperties: [
      { name: '--wa-spacing-small', description: 'Spacing for small size' },
      { name: '--wa-spacing-medium', description: 'Spacing for medium size' },
      { name: '--wa-spacing-large', description: 'Spacing for large size' },
    ],
  },
  card: {
    docsUrl: 'https://webawesome.com/docs/components/card',
    parts: [
      { name: 'base', description: "The component's base wrapper" },
      { name: 'media', description: 'The media container' },
      { name: 'header', description: 'The header wrapper' },
      { name: 'body', description: 'The body wrapper' },
      { name: 'footer', description: 'The footer wrapper' },
    ],
    customProperties: [
      { name: '--spacing', description: 'The spacing between sections' },
    ],
  },
  dialog: {
    docsUrl: 'https://webawesome.com/docs/components/dialog',
    parts: [
      { name: 'dialog', description: "The dialog's internal <dialog> element" },
      { name: 'header', description: 'Wraps the title and header actions' },
      {
        name: 'header-actions',
        description: 'Container for optional header actions',
      },
      { name: 'title', description: "The dialog's title" },
      { name: 'close-button', description: 'The close button (<wa-button>)' },
      {
        name: 'close-button__base',
        description: "The close button's exported base part",
      },
      { name: 'body', description: "The dialog's body content area" },
      { name: 'footer', description: "The dialog's footer section" },
    ],
    customProperties: [
      {
        name: '--spacing',
        description: 'Controls space around and between the dialog content',
      },
      { name: '--width', description: 'Sets the preferred dialog width' },
      {
        name: '--show-duration',
        default: '200ms',
        description: 'Animation duration when displaying',
      },
      {
        name: '--hide-duration',
        default: '200ms',
        description: 'Animation duration when hiding',
      },
    ],
  },
  'file-input': {
    docsUrl: 'https://webawesome.com/docs/components/file-input',
    parts: [
      { name: 'base', description: "The component's base wrapper" },
      { name: 'form-control', description: 'The form control wrapper' },
      { name: 'form-control-label', description: 'The label' },
      { name: 'form-control-input', description: 'The input area' },
      { name: 'form-control-help-text', description: 'The help text' },
      { name: 'dropzone', description: 'The file drop zone' },
      { name: 'file-list', description: 'The list of selected files' },
    ],
    customProperties: [],
  },
  'number-input': {
    docsUrl: 'https://webawesome.com/docs/components/number-input',
    parts: [
      { name: 'base', description: "The component's base wrapper" },
      { name: 'form-control', description: 'The form control wrapper' },
      { name: 'form-control-label', description: 'The label' },
      { name: 'form-control-input', description: 'The input wrapper' },
      { name: 'input', description: 'The internal input element' },
      { name: 'decrement-button', description: 'The decrement stepper button' },
      { name: 'increment-button', description: 'The increment stepper button' },
    ],
    customProperties: [],
  },
  sparkline: {
    docsUrl: 'https://webawesome.com/docs/components/sparkline',
    parts: [
      { name: 'base', description: "The component's base wrapper" },
      { name: 'svg', description: 'The SVG element' },
    ],
    customProperties: [],
  },
};
