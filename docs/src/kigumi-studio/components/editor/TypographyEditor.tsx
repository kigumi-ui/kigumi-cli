import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';
import './TypographyEditor.css';

export function TypographyEditor() {
  const familiesGroup = PROPERTY_GROUPS.find(
    (g) => g.key === 'typography-families'
  )!;
  const sizesGroup = PROPERTY_GROUPS.find((g) => g.key === 'typography-sizes')!;
  const lineHeightsGroup = PROPERTY_GROUPS.find(
    (g) => g.key === 'typography-line-heights'
  )!;

  const familyProps = PROPERTIES_BY_GROUP.get('typography-families') ?? [];
  const weightProps = PROPERTIES_BY_GROUP.get('typography-weights') ?? [];
  const sizeProps = PROPERTIES_BY_GROUP.get('typography-sizes') ?? [];
  const lineHeightProps =
    PROPERTIES_BY_GROUP.get('typography-line-heights') ?? [];

  // Match fonts with weights (same order)
  const fontPairs = [
    { family: familyProps[1], weight: weightProps[3], label: 'Heading Font' }, // heading + bold
    { family: familyProps[0], weight: weightProps[1], label: 'Body Font' }, // body + normal
    { family: familyProps[2], weight: weightProps[1], label: 'Code Font' }, // code + normal
    { family: familyProps[3], weight: weightProps[1], label: 'Longform Font' }, // longform + normal
  ];

  return (
    <>
      {/* Font Families + Weights combined */}
      <EditorSection group={familiesGroup}>
        {fontPairs.map((pair) => (
          <div key={pair.family.cssVar} className="typography-font-row">
            <div className="typography-font-row__family">
              <PropertyRow property={pair.family} />
            </div>
            <div className="typography-font-row__weight">
              <PropertyRow property={pair.weight} />
            </div>
          </div>
        ))}
      </EditorSection>

      {/* Font Sizes */}
      <EditorSection group={sizesGroup}>
        {sizeProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>

      {/* Line Heights */}
      <EditorSection group={lineHeightsGroup}>
        {lineHeightProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
    </>
  );
}
