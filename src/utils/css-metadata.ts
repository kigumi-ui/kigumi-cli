/**
 * CSS Metadata for Web Awesome Components
 *
 * Maps component names to their CSS parts and custom properties
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
};

/**
 * Get CSS metadata for a component
 */
export function getCSSMetadata(
  componentName: string
): ComponentCSSMetadata | null {
  return CSS_METADATA[componentName.toLowerCase()] || null;
}

/**
 * Generate CSS template content with parts and custom properties
 */
export function generateCSSTemplate(componentName: string): string {
  const metadata = getCSSMetadata(componentName.toLowerCase());

  if (!metadata) {
    return `/*
 * ${componentName}
 *
 * No CSS metadata available.
 * See Web Awesome docs for styling options.
 */
`;
  }

  let content = `/*
 * ${componentName}
 *
 * Documentation: ${metadata.docsUrl}
 */

`;

  // Add CSS Custom Properties section
  if (metadata.customProperties.length > 0) {
    content += `/* CSS Custom Properties\n`;
    content += ` * ${metadata.docsUrl}#css-custom-properties\n`;
    content += ` */\n\n`;
    content += `.${componentName} {\n`;

    for (const prop of metadata.customProperties) {
      content += `  /* ${prop.description} */\n`;
      if (prop.default) {
        content += `  /* ${prop.name}: ${prop.default}; */\n`;
      } else {
        content += `  /* ${prop.name}: ...; */\n`;
      }
    }

    content += `}\n\n`;
  }

  // Add CSS Parts section
  if (metadata.parts.length > 0) {
    content += `/* CSS Parts\n`;
    content += ` * ${metadata.docsUrl}#css-parts\n`;
    content += ` */\n\n`;

    for (const part of metadata.parts) {
      content += `.${componentName}::part(${part.name}) {\n`;
      content += `  /* ${part.description} */\n`;
      content += `}\n\n`;
    }
  }

  return content;
}
