import type { ThemeMode } from '../lib/defaults';
import { THEME_MODES } from '../lib/locks';
import {
  PROPERTIES_BY_VAR,
  PROPERTY_GROUP_LABELS,
} from '../lib/property-definitions';
import type { HeldChange } from './conversation';

/**
 * The sidebar name of a value, with its section when the label alone is
 * ambiguous: "Transitions Fast", not "Fast"; "Surface Default", not
 * "Surface Colors Surface Default". A value meant in one mode only says
 * which: "Surface Default (dark)".
 */
export function valueLabel(
  cssVar: string,
  modes: readonly ThemeMode[]
): string {
  const mode = modes.length === 1 ? ` (${modes[0]})` : '';
  const property = PROPERTIES_BY_VAR.get(cssVar);
  if (!property) return `${cssVar}${mode}`;
  const group = PROPERTY_GROUP_LABELS.get(property.group) ?? '';
  const words = (text: string) => text.toLowerCase().split(/\W+/);
  const sharesWord = words(property.label).some(
    (word) => word.length > 2 && words(group).includes(word)
  );
  const label =
    sharesWord || !group ? property.label : `${group} ${property.label}`;
  return `${label}${mode}`;
}

/** The sidebar name of a held change, as `valueLabel()` writes it. */
export function heldChangeLabel(change: HeldChange): string {
  if (change.kind === 'shadowComponents') return 'Components with a shadow';
  return valueLabel(
    change.cssVar,
    THEME_MODES.filter((mode) => mode in change.proposed)
  );
}
