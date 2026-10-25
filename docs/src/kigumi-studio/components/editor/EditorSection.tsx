import { Details, Button, Icon } from '@/components/ui';
import { useStudio } from '../../contexts/StudioContext';
import { groupLockKeys } from '../../lib/locks';
import type { PropertyGroupInfo } from '../../lib/property-definitions';
import { LockSwitch } from './LockSwitch';
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
          <LockSwitch
            keys={groupLockKeys(group.key)}
            label="Lock all"
            context={group.label}
          />
          <Button
            className="editor-section__reset"
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
