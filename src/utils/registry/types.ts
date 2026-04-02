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

export interface ComponentEvent {
  name: string;
  description: string;
  reactName?: string;
  eventType: string;
}

export interface ComponentSlot {
  name: string;
  description: string;
}

export interface ComponentMethod {
  name: string;
  description: string;
  parameters?: Array<{ name: string; type: string }>;
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
    svelte?: string[];
    angular?: string[];
  };
  props: ComponentProp[];
  importPath: string; // e.g., '@awesome.me/webawesome-pro/dist/components/button/button.js'
  tier: 'free' | 'pro'; // Whether component requires Pro tier
  // Metadata from custom-elements.json (optional - not stored in registry, used by template generators)
  events?: ComponentEvent[];
  slots?: ComponentSlot[];
  methods?: ComponentMethod[];
}

export interface ComponentRegistry {
  [key: string]: ComponentDefinition;
}
