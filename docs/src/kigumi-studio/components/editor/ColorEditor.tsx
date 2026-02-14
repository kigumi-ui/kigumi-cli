import { EditorSection } from './EditorSection';
import { PropertyRow } from './PropertyRow';
import {
  PROPERTIES_BY_GROUP,
  PROPERTY_GROUPS,
} from '../../lib/property-definitions';

export function ColorEditor() {
  const brandGroup = PROPERTY_GROUPS.find((g) => g.key === 'colors-brand')!;
  const surfaceGroup = PROPERTY_GROUPS.find((g) => g.key === 'colors-surface')!;
  const textGroup = PROPERTY_GROUPS.find((g) => g.key === 'colors-text')!;
  const semanticGroup = PROPERTY_GROUPS.find(
    (g) => g.key === 'colors-semantic'
  )!;

  const brandProps = PROPERTIES_BY_GROUP.get('colors-brand') ?? [];
  const surfaceProps = PROPERTIES_BY_GROUP.get('colors-surface') ?? [];
  const textProps = PROPERTIES_BY_GROUP.get('colors-text') ?? [];
  const semanticProps = PROPERTIES_BY_GROUP.get('colors-semantic') ?? [];

  return (
    <>
      <EditorSection group={brandGroup}>
        {brandProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
      <EditorSection group={surfaceGroup}>
        {surfaceProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
      <EditorSection group={textGroup}>
        {textProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
      <EditorSection group={semanticGroup}>
        {semanticProps.map((p) => (
          <PropertyRow key={p.cssVar} property={p} />
        ))}
      </EditorSection>
    </>
  );
}
