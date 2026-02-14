import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';

export function FocusEditor() {
  const group = PROPERTY_GROUPS.find((g) => g.key === 'focus-ring')!;
  const props = PROPERTIES_BY_GROUP.get('focus-ring') ?? [];

  return (
    <EditorSection group={group}>
      {props.map((p) => (
        <PropertyRow key={p.cssVar} property={p} />
      ))}
    </EditorSection>
  );
}
