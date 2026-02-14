import { useCallback, useRef, useEffect } from 'react';
import { Button, Icon, Dropdown, DropdownItem, Divider } from '@/components/ui';
import {
  PROPERTY_GROUPS,
  type PropertyGroup,
} from '../../lib/property-definitions';
import { useStudio } from '../../contexts/StudioContext';

export function ResetButton() {
  const { resetAll, resetGroup } = useStudio();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback(
    (e: Event) => {
      const customEvent = e as CustomEvent;
      const item = customEvent.detail?.item as HTMLElement;
      if (!item) return;

      const value = item.getAttribute('value');
      if (!value) return;

      if (value === '__all__') {
        resetAll();
      } else {
        resetGroup(value as PropertyGroup);
      }
    },
    [resetAll, resetGroup]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dropdown = container.querySelector('wa-dropdown');
    if (!dropdown) return;

    dropdown.addEventListener('wa-select', handleSelect);
    return () => {
      dropdown.removeEventListener('wa-select', handleSelect);
    };
  }, [handleSelect]);

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      <Dropdown>
        <Button
          slot="trigger"
          variant="neutral"
          appearance="outlined"
          size="small"
          with-caret
        >
          <Icon name="arrow-rotate-left" slot="start" />
          Reset
        </Button>

        <DropdownItem value="__all__">
          <Icon name="arrows-rotate" slot="start" />
          Reset All
        </DropdownItem>

        <Divider />

        {PROPERTY_GROUPS.map((group) => (
          <DropdownItem key={group.key} value={group.key}>
            {group.label}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}
