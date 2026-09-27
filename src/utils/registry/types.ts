/**
 * Component Registry Types
 *
 * Shared type definitions for component metadata and registry structure.
 */

export interface ComponentProp {
  name: string;
  type: string;
  values?: string[];
  default?: string;
  description?: string;
  required?: boolean;
  /**
   * For a boolean prop Web Awesome reads as an enumerated attribute rather
   * than by presence: the attribute value meaning true and the one meaning
   * false (`spellcheck` is "true"/"false", `autocorrect` is "on"/"off").
   * Templates write `false` as its keyword instead of dropping the attribute,
   * and leave it off only when the prop is unset, so such a prop takes no
   * `default`.
   */
  keywords?: { true: string; false: string };
  /**
   * Marks a prop that is still accepted but scheduled for removal in the
   * next major, with the message a consumer sees: what to do instead. Every
   * Template carries it as a JSDoc `@deprecated` tag on the prop, so editors
   * strike the prop through, and the skill API surfaces label it.
   */
  deprecated?: string;
}

export interface ComponentDefinition {
  name: string;
  tagName: string;
  category: string;
  description: string;
  dependencies: string[];
  files: {
    react?: string[];
    vue?: string[];
    angular?: string[];
  };
  props: ComponentProp[];
  importPath: string;
  tier: 'free' | 'pro';
}

export interface ComponentRegistry {
  [key: string]: ComponentDefinition;
}
