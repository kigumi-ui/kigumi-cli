import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';

export function FormControlEditor() {
  const group = PROPERTY_GROUPS.find((g) => g.key === 'form-controls')!;
  const props = PROPERTIES_BY_GROUP.get('form-controls') ?? [];

  return (
    <EditorSection group={group}>
      {props.map((p) => (
        <PropertyRow key={p.cssVar} property={p} />
      ))}
    </EditorSection>
  );
}
