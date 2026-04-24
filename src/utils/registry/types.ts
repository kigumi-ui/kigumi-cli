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
