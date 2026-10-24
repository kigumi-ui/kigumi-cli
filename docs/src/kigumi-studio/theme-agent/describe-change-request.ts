import {
  PROPERTIES_BY_VAR,
  PROPERTY_GROUP_LABELS,
} from '../lib/property-definitions';
import type { ChangeRequest } from './conversation';

export interface ChangeRequestDescription {
  /** The sidebar name, with its section when the label alone is ambiguous. */
  label: string;
  current: string;
  proposed: string;
}

function valueLabel(cssVar: string, modes: string[]): string {
  const property = PROPERTIES_BY_VAR.get(cssVar);
  if (!property) return cssVar;
  const group = PROPERTY_GROUP_LABELS.get(property.group) ?? '';
  const words = (text: string) => text.toLowerCase().split(/\W+/);
  const sharesWord = words(property.label).some(
    (word) => word.length > 2 && words(group).includes(word)
  );
  // "Transitions Fast", not "Fast"; "Surface Default", not "Surface Colors …".
  const label =
    sharesWord || !group ? property.label : `${group} ${property.label}`;
  return modes.length === 1 ? `${label}, ${modes[0]} mode` : label;
}

/** How the chat names a change request and shows its two values. */
export function describeChangeRequest(
  request: ChangeRequest
): ChangeRequestDescription {
  if (request.kind === 'shadowComponents') {
    const list = (components: string[]) =>
      components.length > 0 ? components.join(', ') : 'none';
    return {
      label: 'Components with a shadow',
      current: list(request.current),
      proposed: list(request.proposed),
    };
  }
  const unit = PROPERTIES_BY_VAR.get(request.cssVar)?.unit ?? '';
  return {
    label: valueLabel(request.cssVar, request.modes),
    current: `${request.current}${unit}`,
    proposed: `${request.proposed}${unit}`,
  };
}
