/**
 * Shared CEM-metadata types owned by `scripts/parse-custom-elements.ts`.
 *
 * Generated modules (`src/utils/component-metadata.ts`,
 * `scripts/css-metadata.ts`) import and re-export these so a shape change
 * is edited once. Regenerating metadata must not rewrite this file.
 */

export interface ComponentMetadata {
  tagName: string;
  className: string;
  events: Array<{
    name: string;
    /**
     * Absent for Pro components. Web Awesome Pro documentation prose is not
     * committed (see the header on `src/utils/component-metadata.ts`).
     */
    description?: string;
    reactName?: string;
    eventType: string;
  }>;
  slots: Array<{
    name: string;
    description?: string;
  }>;
  methods: Array<{
    name: string;
    description?: string;
    parameters?: Array<{ name: string; type: string }>;
  }>;
}

export interface CSSPart {
  name: string;
  description: string;
}

export interface CSSCustomProperty {
  name: string;
  description: string;
  default?: string;
}

export interface ComponentCSSMetadata {
  parts: CSSPart[];
  customProperties: CSSCustomProperty[];
  docsUrl: string;
}
