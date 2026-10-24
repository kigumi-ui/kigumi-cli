import {
  PROPERTIES_BY_VAR,
  PROPERTY_GROUP_LABELS,
} from '../lib/property-definitions';
import type { ChangeRequest } from './conversation';

/** The class of an open request; the sidebar moves focus to the next one. */
export const OPEN_REQUEST_CLASS = 'theme-agent__request--open';

/**
 * The sidebar name of what a change request is about, with its section when
 * the label alone is ambiguous ("Transitions Fast", not "Fast").
 */
export function changeRequestLabel(request: ChangeRequest): string {
  if (request.kind === 'shadowComponents') return 'Components with a shadow';
  const property = PROPERTIES_BY_VAR.get(request.cssVar);
  if (!property) return request.cssVar;
  const group = PROPERTY_GROUP_LABELS.get(property.group) ?? '';
  const words = (text: string) => text.toLowerCase().split(/\W+/);
  const sharesWord = words(property.label).some(
    (word) => word.length > 2 && words(group).includes(word)
  );
  const label =
    sharesWord || !group ? property.label : `${group} ${property.label}`;
  return request.modes.length === 1
    ? `${label}, ${request.modes[0]} mode`
    : label;
}
