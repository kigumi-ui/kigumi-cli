import { AccordionItem, Button, Icon } from '@/components/ui';
import { useStudio } from '../../contexts/StudioContext';
import type { PropertyGroupInfo } from '../../lib/property-definitions';
import './EditorSection.css';

interface EditorSectionProps {
  group: PropertyGroupInfo;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * One section of the sidebar: an item of the sidebar's single accordion
 * (StudioSidebar), so the sections read as one group.
 */
export function EditorSection({
  group,
  children,
  defaultOpen = false,
}: EditorSectionProps) {
  const { resetGroup } = useStudio();

  return (
    <AccordionItem
      label={group.label}
      expanded={defaultOpen}
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
    </AccordionItem>
  );
}
