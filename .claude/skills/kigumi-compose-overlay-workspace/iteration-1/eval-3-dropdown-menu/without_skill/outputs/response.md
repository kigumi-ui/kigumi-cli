# Dropdown Menu: Edit, Duplicate, Delete

## Install Required Components

The Dropdown and DropdownItem components need to be installed first. There is no separate IconButton component in Kigumi; use Button with an icon child instead.

```bash
npx kigumi add dropdown dropdown-item button icon
```

## Component Code

```tsx
// src/components/examples/ActionsMenu.tsx
import { Dropdown, DropdownItem, Button, Icon } from '@/components/ui';

interface ActionsMenuProps {
  onAction?: (action: string) => void;
}

export function ActionsMenu({ onAction }: ActionsMenuProps) {
  function handleSelect(e: CustomEvent) {
    const item = e.detail.item as HTMLElement;
    const value = item.getAttribute('value');
    if (value && onAction) {
      onAction(value);
    }
  }

  return (
    <Dropdown onSelect={handleSelect}>
      <Button
        slot="trigger"
        variant="neutral"
        appearance="plain"
        size="small"
        aria-label="More actions"
      >
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

      <DropdownItem value="delete" variant="danger">
        <Icon slot="icon" name="trash" />
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
```

## Usage

```tsx
function MyPage() {
  function handleAction(action: string) {
    switch (action) {
      case 'edit':
        console.log('Edit selected');
        break;
      case 'duplicate':
        console.log('Duplicate selected');
        break;
      case 'delete':
        console.log('Delete selected');
        break;
    }
  }

  return <ActionsMenu onAction={handleAction} />;
}
```

## How It Works

- **Trigger:** A `Button` with `slot="trigger"` tells the Dropdown which element opens the menu. The `appearance="plain"` and icon-only content create an icon button look. The `aria-label` provides an accessible name since there is no visible text.
- **Three dots icon:** The `ellipsis-vertical` Font Awesome icon renders as three vertical dots.
- **Menu items:** Each `DropdownItem` has a `value` attribute used to identify the selected action and an `Icon` in `slot="icon"` for a leading icon.
- **Danger styling:** `variant="danger"` on the Delete item applies destructive (red) styling from the Web Awesome theme tokens.
- **Selection event:** The Dropdown's `onSelect` callback fires when any item is clicked. The event's `detail.item` references the selected DOM element, and its `value` attribute identifies which action was chosen.
- **No IconButton component:** Kigumi does not ship a separate IconButton wrapper. An icon-only button is achieved by placing an `Icon` inside a `Button` with no text content.
