# Overlay Patterns -- Angular

Angular standalone component versions of overlay patterns.
Overlays emit `@Output()` events: `(hide)`, `(showEvent)`, `(afterShow)`, `(afterHide)`.
Use `requestClose()` over `hide()` for programmatic close.

## A: Confirmation Dialog

**Components:** `npx kigumi add dialog button`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { DialogComponent } from '@/components/ui/Dialog/dialog.component';

@Component({
  selector: 'app-confirm-example',
  standalone: true,
  imports: [ButtonComponent, DialogComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-button variant="danger" (click)="open = true">Delete Item</k-button>

    <k-dialog [open]="open" label="Delete Item" (hide)="open = false">
      <p>Are you sure? This action cannot be undone.</p>
      <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
        <k-button variant="neutral" (click)="open = false">Cancel</k-button>
        <k-button
          variant="danger"
          [loading]="loading"
          (click)="handleConfirm()"
        >
          Delete
        </k-button>
      </div>
    </k-dialog>
  `,
})
export class ConfirmExampleComponent {
  open = false;
  loading = false;

  async handleConfirm() {
    this.loading = true;
    await this.deleteItem();
    this.loading = false;
    this.open = false;
  }

  private async deleteItem() {
    await fetch('/api/items/1', { method: 'DELETE' });
  }
}
```

**Key points:**

- `(hide)="open = false"` handles ESC, backdrop click, and `requestClose()`
- `[open]="open"` is the controlled pattern (class property, not useState/ref)
- Use `(hide)` not `(onHide)` or `(waHide)` -- `wa-hide` maps to `(hide)` (no collision)

---

## B: Form Dialog

**Components:** `npx kigumi add dialog input button callout`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { CalloutComponent } from '@/components/ui/Callout/callout.component';
import { DialogComponent } from '@/components/ui/Dialog/dialog.component';
import { InputComponent } from '@/components/ui/Input/input.component';

@Component({
  selector: 'app-create-item-dialog',
  standalone: true,
  imports: [ButtonComponent, CalloutComponent, DialogComponent, InputComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-button variant="brand" (click)="open = true">Create Item</k-button>

    <k-dialog [open]="open" label="Create New Item" (hide)="open = false">
      <form
        id="create-item"
        class="wa-stack wa-gap-m"
        (submit)="handleSubmit($event)"
      >
        @if (error) {
          <k-callout variant="danger">{{ error }}</k-callout>
        }
        <k-input label="Name" name="name" [required]="true" />
        <k-input label="Description" name="description" />
      </form>
      <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
        <k-button variant="neutral" (click)="open = false">Cancel</k-button>
        <k-button
          variant="brand"
          type="submit"
          form="create-item"
          [loading]="loading"
        >
          Create
        </k-button>
      </div>
    </k-dialog>
  `,
})
export class CreateItemDialogComponent {
  open = false;
  loading = false;
  error = '';

  async handleSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;
    this.error = '';
    try {
      await fetch('/api/items', {
        method: 'POST',
        body: new FormData(e.target as HTMLFormElement),
      });
      this.open = false;
    } catch {
      this.error = 'Failed to create item.';
    } finally {
      this.loading = false;
    }
  }
}
```

**Tip:** The `form="create-item"` attribute on the submit button connects it to the form inside the dialog body. This allows the button to live in the footer slot while submitting the form.

---

## C: Side Panel (Drawer)

**Components:** `npx kigumi add drawer button`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { DrawerComponent } from '@/components/ui/Drawer/drawer.component';

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  imports: [ButtonComponent, DrawerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-drawer
      [open]="!!item"
      label="Item Details"
      placement="end"
      (hide)="onClose()"
    >
      <div class="wa-stack wa-gap-m">
        @for (entry of itemEntries; track entry[0]) {
          <div>
            <small style="color: var(--wa-color-text-quiet)">{{
              entry[0]
            }}</small>
            <div>{{ entry[1] }}</div>
          </div>
        }
      </div>
      <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
        <k-button variant="neutral" (click)="onClose()">Close</k-button>
        <k-button variant="brand">Edit</k-button>
      </div>
    </k-drawer>
  `,
})
export class DetailPanelComponent {
  @Input() item: Record<string, string> | null = null;

  get itemEntries(): [string, string][] {
    return this.item ? Object.entries(this.item) : [];
  }

  onClose() {
    this.item = null;
  }
}
```

---

## D: Dropdown Menu

**Components:** `npx kigumi add dropdown dropdown-item button icon divider`

### Basic Actions Menu

```typescript
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Output,
  EventEmitter,
} from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { DividerComponent } from '@/components/ui/Divider/divider.component';
import { DropdownComponent } from '@/components/ui/Dropdown/dropdown.component';
import { DropdownItemComponent } from '@/components/ui/DropdownItem/dropdown-item.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

@Component({
  selector: 'app-actions-menu',
  standalone: true,
  imports: [
    ButtonComponent,
    DividerComponent,
    DropdownComponent,
    DropdownItemComponent,
    IconComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-dropdown (select)="handleSelect($event)">
      <k-button slot="trigger" variant="neutral" [withCaret]="true">
        <k-icon slot="start" name="ellipsis-vertical" />
        Actions
      </k-button>
      <k-dropdown-item value="edit">
        <k-icon slot="icon" name="pen" />Edit
      </k-dropdown-item>
      <k-dropdown-item value="duplicate">
        <k-icon slot="icon" name="copy" />Duplicate
      </k-dropdown-item>
      <k-divider />
      <k-dropdown-item value="delete" variant="danger">
        <k-icon slot="icon" name="trash" />Delete
      </k-dropdown-item>
    </k-dropdown>
  `,
})
export class ActionsMenuComponent {
  @Output() action = new EventEmitter<string>();

  handleSelect(e: Event) {
    const ce = e as CustomEvent;
    const value = (ce.detail.item as HTMLElement).getAttribute('value') || '';
    this.action.emit(value);
  }
}
```

### Hoisted Dropdown (z-index escape)

Use `hoist` when inside Cards, Dialogs, Drawers, or overflow-constrained containers:

```html
<k-dropdown [hoist]="true">
  <k-button
    slot="trigger"
    variant="neutral"
    size="small"
    aria-label="More actions"
  >
    <k-icon name="ellipsis-vertical" />
  </k-button>
  <k-dropdown-item>Edit</k-dropdown-item>
  <k-dropdown-item>Delete</k-dropdown-item>
</k-dropdown>
```

---

## E: Tooltip

**Components:** `npx kigumi add tooltip button icon`

```html
<k-button id="copy-btn" variant="neutral" aria-label="Copy">
  <k-icon name="copy" />
</k-button>
<k-tooltip for="copy-btn" placement="top"> Copy to clipboard </k-tooltip>
```

Tooltip uses the `for` attribute to target an element by ID. No event binding needed.

---

## F: Popover

**Components:** `npx kigumi add popover button input`

### Basic Filter Panel

```html
<k-popover placement="bottom-start">
  <k-button slot="trigger" variant="neutral">
    <k-icon slot="start" name="filter" />Filters
  </k-button>
  <div
    class="wa-stack wa-gap-s"
    style="padding: var(--wa-space-m); min-width: 200px"
  >
    <k-input label="Search" type="search" size="small" />
    <k-checkbox>Active only</k-checkbox>
    <k-button variant="brand" size="small" style="width: 100%">Apply</k-button>
  </div>
</k-popover>
```

### Hover Info Popover with Arrow

```html
<k-popover trigger="hover focus" placement="top" with-arrow>
  <k-icon slot="trigger" name="circle-info" style="cursor: help" />
  <div style="padding: var(--wa-space-s); max-width: 200px">
    <p class="wa-body-s">Hover and focus both activate this popover.</p>
  </div>
</k-popover>
```

### Key Props

| Prop         | Default | Description                                                           |
| ------------ | ------- | --------------------------------------------------------------------- |
| `trigger`    | `click` | Activation events: `click`, `hover`, `focus` (space-separated)        |
| `placement`  | `top`   | Position: `top`, `bottom`, `left`, `right` + `-start`/`-end` variants |
| `with-arrow` | `false` | Shows arrow pointing to trigger                                       |
| `distance`   | `8`     | Distance (px) from trigger                                            |
| `hoist`      | `false` | Escape overflow constraints                                           |

---

## G: Toast Notifications (Pro)

**Components:** `npx kigumi add toast` (Pro tier)

Toast is a wrapper around WA's toast utility. Usage in Angular:

```typescript
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { ToastComponent } from '@/components/ui/Toast/toast.component';

@Component({
  selector: 'app-toast-example',
  standalone: true,
  imports: [ButtonComponent, ToastComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-button variant="brand" (click)="showToast()">Show Toast</k-button>

    <k-toast #toastEl variant="success" duration="3000">
      Item saved successfully.
    </k-toast>
  `,
})
export class ToastExampleComponent {
  @ViewChild('toastEl', { read: ElementRef }) toastRef!: ElementRef;

  showToast() {
    const el = this.toastRef.nativeElement as HTMLElement;
    // WA toast method
    (el as unknown as { toast: () => void }).toast();
  }
}
```

**Free tier alternative:** Use Callout with a timed removal:

```typescript
@Component({
  template: `
    @if (message) {
      <div style="position: fixed; bottom: var(--wa-space-l); right: var(--wa-space-l); z-index: 1000">
        <k-callout variant="success">
          {{ message }}
        </k-callout>
      </div>
    }
  `,
})
```

---

## CSS Sizing for Dialog and Drawer

### Dialog

```css
/* Set dialog width via custom property */
k-dialog::part(panel) {
  --width: 600px;
}

/* Or use the --width CSS prop directly */
k-dialog {
  --width: 80vw;
  --show-duration: 200ms;
  --hide-duration: 200ms;
}
```

### Drawer

```css
/* Drawer size via custom property */
k-drawer {
  --size: 400px; /* width for start/end, height for top/bottom */
  --show-duration: 200ms;
  --hide-duration: 200ms;
}
```
