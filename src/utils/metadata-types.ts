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
  attributes: Array<{
    name: string;
    /**
     * Boolean versus string is the only distinction the function harness
     * needs to pick a probe value. Absent when the CEM lists no type (e.g.
     * `did-ssr`, inherited from `WebAwesomeElement`) — the attribute stays in
     * the list and is probed as a string.
     */
    type?: 'boolean' | 'string';
  }>;
  events: Array<{
    name: string;
    /**
     * Absent for Pro components. Web Awesome Pro documentation prose is not
     * committed (see the header on `src/utils/component-metadata.ts`).
     */
    description?: string;
    reactName?: string;
    /**
     * The type a handler receives: the Web Awesome class the component
     * dispatches (`WaHideEvent`), or a DOM interface for a native event
     * (`FocusEvent`). Resolved by `scripts/event-types.ts`, never from the
     * manifest's `eventName`.
     */
    eventType: string;
    /**
     * File basename under Web Awesome's `dist/events/` that declares
     * `eventType` (`hide` for `hide.js`). Present exactly when `eventType`
     * is a Web Awesome class a Template must import.
     */
    eventTypeModule?: string;
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
