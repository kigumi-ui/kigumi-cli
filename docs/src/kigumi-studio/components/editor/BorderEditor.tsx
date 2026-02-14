import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';

export function BorderEditor() {
  const radiusGroup = PROPERTY_GROUPS.find((g) => g.key === 'border-radius')!;
  const widthGroup = PROPERTY_GROUPS.find((g) => g.key === 'border-width')!;

  const radiusProps = PROPERTIES_BY_GROUP.get('border-radius') ?? [];
  const widthProps = PROPERTIES_BY_GROUP.get('border-width') ?? [];

  return (
    <>
      <EditorSection group={radiusGroup}>
        {radiusProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
      <EditorSection group={widthGroup}>
        {widthProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
    </>
  );
}
