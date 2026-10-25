import { Details, Button, Icon } from '@/components/ui';
import { useStudio } from '../../contexts/StudioContext';
import type { PropertyGroupInfo } from '../../lib/property-definitions';
import './EditorSection.css';

interface EditorSectionProps {
  group: PropertyGroupInfo;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function EditorSection({
  group,
  children,
  defaultOpen = false,
}: EditorSectionProps) {
  const { resetGroup } = useStudio();

  return (
    <Details
      open={defaultOpen}
      summary={group.label}
      className="editor-section"
    >
      <div className="editor-section__content">
        <div className="editor-section__properties">{children}</div>
        <div className="editor-section__actions">
          <Button
            variant="neutral"
            appearance="plain"
            size="small"
            onClick={() => resetGroup(group.key)}
          >
            <Icon name="arrow-rotate-left" slot="start" />
            Reset
          </Button>
        </div>
      </div>
    </Details>
  );
}
