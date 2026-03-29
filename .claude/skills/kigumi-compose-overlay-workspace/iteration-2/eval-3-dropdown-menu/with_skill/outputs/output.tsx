import { Button, Dropdown, DropdownItem, Icon } from '@/components/ui';

interface DropdownMenuProps {
  onAction?: (action: 'edit' | 'duplicate' | 'delete') => void;
}

export function DropdownMenu({ onAction }: DropdownMenuProps) {
  const handleSelect = (e: CustomEvent) => {
    const value = (e.detail.item as HTMLElement).getAttribute('value') as
      | 'edit'
      | 'duplicate'
      | 'delete'
      | null;
    if (value && onAction) {
      onAction(value);
    }
  };

  return (
    <Dropdown onSelect={handleSelect}>
      <Button slot="trigger" variant="neutral" size="small" aria-label="More actions">
        <Icon name="ellipsis-vertical" />
      </Button>
      <DropdownItem value="edit">
        <Icon slot="icon" name="pen" />
        Edit
      </DropdownItem>
      <DropdownItem value="duplicate">
        <Icon slot="icon" name="copy" />
        Duplicate
      </DropdownItem>
      <wa-divider />
      <DropdownItem value="delete" variant="danger">
        <Icon slot="icon" name="trash" />
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
