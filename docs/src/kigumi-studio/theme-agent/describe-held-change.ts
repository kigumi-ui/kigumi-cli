import {
  PROPERTIES_BY_VAR,
  PROPERTY_GROUP_LABELS,
} from '../lib/property-definitions';
import type { HeldChange } from './conversation';

/**
 * The sidebar name of a held change, with its section when the label alone
 * is ambiguous: "Transitions Fast", not "Fast"; "Surface Default", not
 * "Surface Colors Surface Default".
 */
export function heldChangeLabel(change: HeldChange): string {
  if (change.kind === 'shadowComponents') return 'Components with a shadow';
  const property = PROPERTIES_BY_VAR.get(change.cssVar);
  if (!property) return change.cssVar;
  const group = PROPERTY_GROUP_LABELS.get(property.group) ?? '';
  const words = (text: string) => text.toLowerCase().split(/\W+/);
  const sharesWord = words(property.label).some(
    (word) => word.length > 2 && words(group).includes(word)
  );
  return sharesWord || !group ? property.label : `${group} ${property.label}`;
}
