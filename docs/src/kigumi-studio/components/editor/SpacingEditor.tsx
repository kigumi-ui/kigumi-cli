import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';

export function SpacingEditor() {
  const group = PROPERTY_GROUPS.find((g) => g.key === 'spacing')!;
  const props = PROPERTIES_BY_GROUP.get('spacing') ?? [];

  return (
    <EditorSection group={group}>
      {props.map((p) => (
        <PropertyRow key={p.cssVar} property={p} />
      ))}
    </EditorSection>
  );
}
