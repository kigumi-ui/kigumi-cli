import { Button, Dropdown, DropdownItem, Divider, Icon } from '@/components/ui';

interface DropdownMenuProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function DropdownMenu({ onEdit, onDuplicate, onDelete }: DropdownMenuProps) {
  return (
    <Dropdown>
      <Button slot="trigger" size="small" appearance="plain" aria-label="More options">
        <Icon name="ellipsis-vertical" />
      </Button>
      <DropdownItem onClick={onEdit}>
        <Icon slot="icon" name="pen-to-square" />
        Edit
      </DropdownItem>
      <DropdownItem onClick={onDuplicate}>
        <Icon slot="icon" name="clone" />
        Duplicate
      </DropdownItem>
      <Divider />
      <DropdownItem variant="danger" onClick={onDelete}>
        <Icon slot="icon" name="trash-can" />
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
