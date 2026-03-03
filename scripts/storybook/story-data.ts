/**
 * Story Data Pipeline
 *
 * Merges component registry (props) + component metadata (events, slots, methods)
 * into a unified data structure for Storybook story generation and validation.
 *
 * Usage: Import buildAllStoryData() or buildStoryData() in other storybook scripts.
 */

import { LOCAL_REGISTRY } from '../../src/utils/registry.js';
import { COMPONENT_METADATA } from '../../src/utils/component-metadata.js';
import type { ComponentProp } from '../../src/utils/registry/types.js';
import type { ComponentMetadata } from '../../src/utils/component-metadata.js';
import { STORY_OVERRIDES } from './overrides.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoryArgType {
  control?: string | { type: string } | false;
  options?: string[];
  description?: string;
  action?: string;
  table?: {
    disable?: boolean;
    defaultValue?: { summary: string };
    category?: string;
  };
}

export interface StoryData {
  /** PascalCase component name, e.g. "Button" */
  componentName: string;
  /** kebab-case registry key, e.g. "button" */
  componentKey: string;
  /** Storybook title, e.g. "Components/Button" */
  title: string;
  /** JSDoc description from registry */
  description: string;
  /** Merged argTypes from registry props + metadata events/slots/methods */
  argTypes: Record<string, StoryArgType>;
  /** Default args (fn() for events, custom overrides for children etc.) */
  args: Record<string, string>;
  /** List of event prop names that need fn() in args */
  eventPropNames: string[];
}

// ─── Event Name Helpers ──────────────────────────────────────────────────────

/**
 * Simplify React event names: onWaShow → onShow, onBlur → onBlur
 * Matches the transformation applied to generated React component templates.
 */
export function simplifyReactEventName(reactName: string): string {
  return reactName.replace(/^onWa/, 'on');
}

/**
 * Derive a Storybook action name from a simplified React event name.
 * onShow → 'show', onAfterHide → 'after-hide', onBlur → 'blur'
 */
export function eventNameToAction(simplifiedName: string): string {
  const withoutOn = simplifiedName.replace(/^on/, '');
  return withoutOn
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

// ─── Control Mapping ─────────────────────────────────────────────────────────

function propToArgType(prop: ComponentProp): StoryArgType {
  const argType: StoryArgType = {};

  if (prop.type === 'boolean') {
    argType.control = 'boolean';
  } else if (prop.type === 'number') {
    argType.control = 'number';
  } else if (prop.values && prop.values.length > 0) {
    argType.control = 'select';
    argType.options = [...prop.values];
  } else {
    argType.control = 'text';
  }

  if (prop.description) {
    argType.description = prop.description;
  }

  if (
    prop.default !== undefined &&
    prop.default !== '' &&
    prop.default !== "''"
  ) {
    argType.table = { defaultValue: { summary: prop.default } };
  }

  return argType;
}

// ─── Main Builder ────────────────────────────────────────────────────────────

export function buildStoryData(componentKey: string): StoryData | null {
  const definition = LOCAL_REGISTRY[componentKey];
  if (!definition) return null;

  const metadata: ComponentMetadata | undefined =
    COMPONENT_METADATA[componentKey];
  const overrides = STORY_OVERRIDES[componentKey];

  const argTypes: Record<string, StoryArgType> = {};
  const args: Record<string, string> = {};
  const eventPropNames: string[] = [];

  // 1. Props from registry
  for (const prop of definition.props) {
    argTypes[prop.name] = propToArgType(prop);

    // Required props need default args to satisfy Meta<typeof X>
    if (prop.required) {
      const defaultVal =
        prop.default && prop.default !== "''"
          ? prop.default
          : prop.type === 'boolean'
            ? 'false'
            : '';
      if (defaultVal) {
        args[prop.name] = `'${defaultVal}'`;
      }
    }
  }

  // 2. Events from metadata
  if (metadata?.events) {
    for (const event of metadata.events) {
      const reactName =
        event.reactName ||
        `on${event.name.charAt(0).toUpperCase()}${event.name.slice(1)}`;
      const simplified = simplifyReactEventName(reactName);
      const action = eventNameToAction(simplified);

      argTypes[simplified] = {
        action,
        description: event.description,
        table: { category: 'Events' },
      };

      eventPropNames.push(simplified);
      args[simplified] = 'fn()';
    }
  }

  // Note: Slots and Methods are NOT added as argTypes because Storybook's
  // Meta<typeof X> type only accepts known prop names. Slot/method documentation
  // is handled by Storybook's autodocs via the component's TypeScript types.

  // 5. Apply overrides
  if (overrides) {
    // Hidden props
    if (overrides.hiddenProps) {
      for (const prop of overrides.hiddenProps) {
        if (argTypes[prop]) {
          argTypes[prop].table = { ...argTypes[prop].table, disable: true };
        } else {
          argTypes[prop] = { table: { disable: true } };
        }
      }
    }

    // Children default
    if (overrides.childrenDefault) {
      args['children'] = `'${overrides.childrenDefault}'`;
      argTypes['children'] = { control: 'text' };
    }

    // Extra argTypes
    if (overrides.extraArgTypes) {
      for (const [key, value] of Object.entries(overrides.extraArgTypes)) {
        argTypes[key] = value;
      }
    }

    // Extra args
    if (overrides.extraArgs) {
      for (const [key, value] of Object.entries(overrides.extraArgs)) {
        args[key] = value;
      }
    }
  }

  // Build title: use override or derive from component name
  const title = overrides?.title || `Components/${definition.name}`;

  return {
    componentName: definition.name,
    componentKey,
    title,
    description: definition.description,
    argTypes,
    args,
    eventPropNames,
  };
}

export function buildAllStoryData(): Map<string, StoryData> {
  const result = new Map<string, StoryData>();

  for (const key of Object.keys(LOCAL_REGISTRY)) {
    const data = buildStoryData(key);
    if (data) {
      result.set(key, data);
    }
  }

  return result;
}
