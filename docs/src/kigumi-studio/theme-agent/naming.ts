import {
  PROPERTY_DEFINITIONS,
  PROPERTY_GROUP_LABELS,
} from '../lib/property-definitions';
import { SHADOW_COMPONENTS_KEY } from './proposal';

// Whether a message names a value decides only whether a kept value may be
// asked about again. The guarantee that a hand-set value never changes
// silently does not depend on it. A false match costs at most one more
// change request, so matching is generous; a missed one leaves a kept value
// unchanged without asking, which is why the sections carry everyday words
// in English and German, and why a kept change request tells the user to
// name the value to change it.

/** Label words too common to name one value. */
const GENERIC_WORDS = new Set([
  'and',
  'color',
  'colors',
  'colour',
  'colours',
  'dark',
  'default',
  'font',
  'fonts',
  'light',
  'mode',
  'normal',
  'scale',
  'style',
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function terms(...labels: string[]): string[] {
  return [
    ...new Set(
      labels.flatMap(words).filter((w) => w.length > 2 && !GENERIC_WORDS.has(w))
    ),
  ];
}

/**
 * Everyday words for each sidebar section, English and German (the user may
 * write either). Matched as word beginnings: "round" matches "rounded".
 */
const GROUP_ALIASES: Record<string, string[]> = {
  'colors-brand': ['primary', 'accent', 'akzent', 'marke'],
  'colors-surface': ['background', 'hintergrund', 'fläche', 'oberfläche'],
  'colors-text': ['schrift', 'link'],
  'colors-semantic': ['status', 'erfolg', 'warnung', 'fehler', 'gefahr'],
  'typography-families': ['typeface', 'serif', 'sans', 'mono', 'schrift'],
  'typography-weights': ['weight', 'gewicht', 'fett', 'dünn'],
  'typography-sizes': [
    'size',
    'small',
    'big',
    'large',
    'größe',
    'klein',
    'groß',
  ],
  'typography-line-heights': ['leading', 'zeilen'],
  spacing: [
    'padding',
    'gap',
    'dense',
    'compact',
    'airy',
    'abstand',
    'abstände',
    'luftig',
    'kompakt',
  ],
  'border-radius': ['corner', 'round', 'ecke', 'rund', 'abgerundet'],
  'border-width': ['outline', 'stroke', 'rahmen', 'linie'],
  shadows: ['elevation', 'flat', 'schatten', 'flach'],
  'form-controls': ['input', 'field', 'eingabe', 'formular', 'feld'],
  'focus-ring': ['fokus'],
  transitions: [
    'animation',
    'motion',
    'speed',
    'duration',
    'übergang',
    'animiert',
  ],
};

/** Every value a message can name, with the words that name it. */
const NAMEABLE: Array<{ key: string; literal?: string; terms: string[] }> = [
  ...PROPERTY_DEFINITIONS.map((property) => ({
    key: property.cssVar,
    literal: property.cssVar,
    terms: [
      ...terms(property.label, PROPERTY_GROUP_LABELS.get(property.group) ?? ''),
      ...(GROUP_ALIASES[property.group] ?? []),
    ],
  })),
  {
    key: SHADOW_COMPONENTS_KEY,
    terms: ['shadow', ...GROUP_ALIASES.shadows],
  },
];

/**
 * The values `text` names: CSS custom properties, and `SHADOW_COMPONENTS_KEY`
 * for the shadow component list. A value is named by its custom property, by
 * a word of its sidebar label or section ("radius", "surfaces"), or by an
 * everyday word for its section ("corners", "Schatten").
 */
export function namedValues(text: string): Set<string> {
  const lower = text.toLowerCase();
  const said = words(text);
  const named = new Set<string>();
  for (const { key, literal, terms: valueTerms } of NAMEABLE) {
    if (
      (literal && lower.includes(literal)) ||
      valueTerms.some((term) => said.some((word) => word.startsWith(term)))
    ) {
      named.add(key);
    }
  }
  return named;
}
