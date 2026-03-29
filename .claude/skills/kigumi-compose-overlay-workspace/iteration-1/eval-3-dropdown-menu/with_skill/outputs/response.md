# Dropdown Menu: Edit, Duplicate, Delete

## Install Required Components

Dropdown and DropdownItem are not currently installed. Run these commands first:

**React (`kigumi-react`):**

```bash
cd kigumi-react
npx kigumi add dropdown dropdown-item
```

**Vue (`kigumi-vue`):**

```bash
cd kigumi-vue
npx kigumi add dropdown dropdown-item
```

Both projects already have `Button`, `Icon`, and `Divider` installed.

---

## React Implementation

```tsx
import { Button, Dropdown, DropdownItem, Icon, Divider } from '@/components/ui';

interface ActionsMenuProps {
  onAction: (action: string) => void;
}

export function ActionsMenu({ onAction }: ActionsMenuProps) {
  function handleSelect(e: CustomEvent) {
    const value = (e.detail.item as HTMLElement).getAttribute('value') || '';
    onAction(value);
  }

  return (
    <Dropdown onSelect={handleSelect}>
      <Button
        slot="trigger"
        variant="neutral"
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
      <wa-divider />
      <DropdownItem value="delete" variant="danger">
        <Icon slot="icon" name="trash" />
        Delete
      </DropdownItem>
    </Dropdown>
  );
}
```

### Usage

```tsx
function MyComponent() {
  function handleAction(action: string) {
    switch (action) {
      case 'edit':
        // handle edit
        break;
      case 'duplicate':
        // handle duplicate
        break;
      case 'delete':
        // handle delete
        break;
    }
  }

  return <ActionsMenu onAction={handleAction} />;
}
```

---

## Vue Implementation

```vue
<script setup lang="ts">
import { Button, Dropdown, DropdownItem, Icon, Divider } from '@/components/ui';

const emit = defineEmits<{ action: [value: string] }>();

function handleSelect(e: CustomEvent) {
  const value = (e.detail.item as HTMLElement).getAttribute('value') || '';
  emit('action', value);
}
</script>

<template>
  <Dropdown @wa-select="handleSelect">
    <Button
      slot="trigger"
      variant="neutral"
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
    <wa-divider />
    <DropdownItem value="delete" variant="danger">
      <Icon slot="icon" name="trash" />
      Delete
    </DropdownItem>
  </Dropdown>
</template>
```

### Usage

```vue
<script setup lang="ts">
import ActionsMenu from '@/components/examples/ActionsMenu.vue';

function handleAction(value: string) {
  switch (value) {
    case 'edit':
      // handle edit
      break;
    case 'duplicate':
      // handle duplicate
      break;
    case 'delete':
      // handle delete
      break;
  }
}
</script>

<template>
  <ActionsMenu @action="handleAction" />
</template>
```

---

## Key Details

- **Trigger:** Icon-only button (`variant="neutral"`, `size="small"`) displaying the `ellipsis-vertical` icon (three vertical dots). The `aria-label="More actions"` provides accessibility for the icon-only button.
- **Delete styled as danger:** `variant="danger"` on the DropdownItem gives it destructive styling (red text/icon).
- **Visual separator:** A `<wa-divider />` separates the safe actions (Edit, Duplicate) from the destructive action (Delete).
- **Icons:** Each menu item includes a leading icon via `slot="icon"` for visual clarity: `pen` for Edit, `copy` for Duplicate, `trash` for Delete.
- **Event handling:** The `wa-select` CustomEvent (React: `onSelect`, Vue: `@wa-select`) fires when a menu item is chosen. The selected item's `value` attribute identifies the action.

### Hoisting Note

If this dropdown is placed inside a `Card`, `Dialog`, `Drawer`, or any container with `overflow: hidden`, add the `hoist` prop to `<Dropdown hoist>` so the menu panel escapes clipping.
