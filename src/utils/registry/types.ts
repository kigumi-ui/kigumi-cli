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
   * Marks a prop that is still accepted but should no longer be used, with
   * the message a consumer sees: what to do instead, and when it goes if
   * Kigumi removes it (a `major` changeset). Every TypeScript Template and
   * docs wrapper carries it as a JSDoc `@deprecated` tag, so editors strike
   * the prop through; the `.jsx` typedef, the stories and the skill API
   * surfaces state it in text (issue #129).
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
