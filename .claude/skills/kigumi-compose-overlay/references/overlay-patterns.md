# Overlay Patterns

## A: Confirmation Dialog

**Components:** `npx kigumi add dialog button`

### React

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} label={title} onHide={onClose}>
      <p>{message}</p>
      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Delete</Button>
      </div>
    </Dialog>
  );
}

// Usage
function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>Delete Item</Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async () => { await deleteItem(); setOpen(false); }}
        title="Delete Item"
        message="Are you sure? This action cannot be undone."
      />
    </>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Button, Dialog } from '@/components/ui';

const open = ref(false);
const loading = ref(false);

async function handleConfirm() {
  loading.value = true;
  await deleteItem();
  loading.value = false;
  open.value = false;
}
</script>

<template>
  <Button variant="danger" @click="open = true">Delete Item</Button>
  <Dialog :open="open" label="Delete Item" @wa-hide="open = false">
    <p>Are you sure? This action cannot be undone.</p>
    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" @click="open = false">Cancel</Button>
      <Button variant="danger" :loading="loading" @click="handleConfirm">Delete</Button>
    </div>
  </Dialog>
</template>
```

---

## B: Form Dialog

**Components:** `npx kigumi add dialog input button callout`

### React

```tsx
import { useState, type FormEvent } from 'react';
import { Button, Callout, Dialog, Input } from '@/components/ui';

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await fetch('/api/items', { method: 'POST', body: new FormData(e.currentTarget as HTMLFormElement) });
      setOpen(false);
    } catch {
      setError('Failed to create item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)}>Create Item</Button>
      <Dialog open={open} label="Create New Item" onHide={() => setOpen(false)}>
        <form className="wa-stack wa-gap-m" onSubmit={handleSubmit}>
          {error && <Callout variant="danger">{error}</Callout>}
          <Input label="Name" name="name" required />
          <Input label="Description" name="description" />
          <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
            <Button variant="neutral" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="brand" type="submit" loading={loading}>Create</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
```

---

## C: Side Panel (Drawer)

**Components:** `npx kigumi add drawer button divider`

### React

```tsx
import { useState } from 'react';
import { Button, Divider, Drawer } from '@/components/ui';

export function DetailPanel({ item, onClose }: { item: Record<string, string>; onClose: () => void }) {
  return (
    <Drawer open={!!item} label="Item Details" placement="end" onHide={onClose}>
      <div className="wa-stack wa-gap-m">
        {Object.entries(item).map(([key, val]) => (
          <div key={key}>
            <small style={{ color: 'var(--wa-color-text-quiet)' }}>{key}</small>
            <div>{val}</div>
          </div>
        ))}
      </div>
      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" onClick={onClose}>Close</Button>
        <Button variant="brand">Edit</Button>
      </div>
    </Drawer>
  );
}
```

---

## D: Dropdown Menu

**Components:** `npx kigumi add dropdown dropdown-item button icon divider`

### Basic Actions Menu

#### React

```tsx
import { Button, Dropdown, DropdownItem, Icon } from '@/components/ui';

export function ActionsMenu({ onAction }: { onAction: (action: string) => void }) {
  return (
    <Dropdown onSelect={(e: CustomEvent) => onAction((e.detail.item as HTMLElement).getAttribute('value') || '')}>
      <Button slot="trigger" variant="neutral" with-caret>
        <Icon slot="start" name="ellipsis-vertical" />
        Actions
      </Button>
      <DropdownItem value="edit"><Icon slot="icon" name="pen" />Edit</DropdownItem>
      <DropdownItem value="duplicate"><Icon slot="icon" name="copy" />Duplicate</DropdownItem>
      <wa-divider />
      <DropdownItem value="delete" variant="danger"><Icon slot="icon" name="trash" />Delete</DropdownItem>
    </Dropdown>
  );
}
```

#### Vue

```vue
<script setup lang="ts">
import { Dropdown, DropdownItem, Button, Icon } from '@/components/ui';
const emit = defineEmits<{ action: [value: string] }>();
function handleSelect(e: CustomEvent) {
  emit('action', (e.detail.item as HTMLElement).getAttribute('value') || '');
}
</script>

<template>
  <Dropdown @wa-select="handleSelect">
    <Button slot="trigger" variant="neutral" with-caret>
      <Icon slot="start" name="ellipsis-vertical" />Actions
    </Button>
    <DropdownItem value="edit"><Icon slot="icon" name="pen" />Edit</DropdownItem>
    <DropdownItem value="duplicate"><Icon slot="icon" name="copy" />Duplicate</DropdownItem>
    <wa-divider />
    <DropdownItem value="delete" variant="danger"><Icon slot="icon" name="trash" />Delete</DropdownItem>
  </Dropdown>
</template>
```

### Grouped Dropdown with Categories

Use `<small>` labels and `<wa-divider>` to create visually grouped sections:

```tsx
import { Button, Dropdown, DropdownItem, Icon } from '@/components/ui';

export function GroupedMenu() {
  return (
    <Dropdown>
      <Button slot="trigger" variant="neutral" with-caret>
        <Icon slot="start" name="plus" />
        New
      </Button>

      {/* Group: Content */}
      <small style={{ padding: 'var(--wa-space-xs) var(--wa-space-m)', color: 'var(--wa-color-text-quiet)' }}>
        Content
      </small>
      <DropdownItem value="page"><Icon slot="icon" name="file" />Page</DropdownItem>
      <DropdownItem value="post"><Icon slot="icon" name="pen-nib" />Blog Post</DropdownItem>

      <wa-divider />

      {/* Group: Media */}
      <small style={{ padding: 'var(--wa-space-xs) var(--wa-space-m)', color: 'var(--wa-color-text-quiet)' }}>
        Media
      </small>
      <DropdownItem value="image"><Icon slot="icon" name="image" />Image</DropdownItem>
      <DropdownItem value="video"><Icon slot="icon" name="video" />Video</DropdownItem>
    </Dropdown>
  );
}
```

### Hoisted Dropdown (z-index escape)

Use the `hoist` prop when the Dropdown is inside an overflow-constrained container (e.g., inside a Card, Dialog, or table cell). Hoisting teleports the dropdown panel to the body, escaping `overflow: hidden` and z-index stacking contexts.

```tsx
<Card>
  <div className="wa-split wa-align-items-center">
    <h3>Card Title</h3>
    {/* hoist prevents the dropdown from being clipped by the Card's overflow */}
    <Dropdown hoist>
      <Button slot="trigger" variant="neutral" size="small" aria-label="More actions">
        <Icon name="ellipsis-vertical" />
      </Button>
      <DropdownItem>Edit</DropdownItem>
      <DropdownItem>Delete</DropdownItem>
    </Dropdown>
  </div>
</Card>
```

**When to use `hoist`:**
- Dropdown inside `<Card>`, `<Dialog>`, `<Drawer>`, or `<Details>`
- Dropdown inside table cells
- Any container with `overflow: hidden` or `overflow: auto`

---

## E: Tooltip

**Components:** `npx kigumi add tooltip button icon`

```tsx
import { Button, Icon, Tooltip } from '@/components/ui';

// Tooltip wrapping a button
<Tooltip content="Copy to clipboard" placement="top">
  <Button variant="neutral" aria-label="Copy">
    <Icon name="copy" />
  </Button>
</Tooltip>
```

---

## F: Popover

**Components:** `npx kigumi add popover button input`

```tsx
import { Button, Icon, Input, Popover } from '@/components/ui';

<Popover>
  <Button slot="trigger" variant="neutral"><Icon slot="start" name="filter" />Filters</Button>
  <div className="wa-stack wa-gap-m" style={{ padding: 'var(--wa-space-m)', minWidth: '250px' }}>
    <Input label="Search" type="search" />
    <Button variant="brand" size="small" style={{ width: '100%' }}>Apply</Button>
  </div>
</Popover>
```

---

## G: Toast Notifications (Pro)

**Components:** `npx kigumi add toast` (Pro tier)

```tsx
import { useRef } from 'react';
import { Button } from '@/components/ui';

export function ToastExample() {
  const toastRef = useRef<HTMLElement & { create: (msg: string, opts?: Record<string, unknown>) => void }>(null);

  return (
    <>
      <div className="wa-cluster wa-gap-s">
        <Button variant="success" onClick={() => toastRef.current?.create('Saved!', { variant: 'success', duration: 3000 })}>
          Success
        </Button>
        <Button variant="danger" onClick={() => toastRef.current?.create('Error occurred.', { variant: 'danger', duration: 5000 })}>
          Error
        </Button>
        <Button variant="warning" onClick={() => toastRef.current?.create('Cannot undo.', { variant: 'warning', duration: 0 })}>
          Warning (persistent)
        </Button>
      </div>
      <wa-toast ref={toastRef} placement="top-end" />
    </>
  );
}
```

Placements: `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end`.
Duration `0` = stays until dismissed. Default: 5000ms.
