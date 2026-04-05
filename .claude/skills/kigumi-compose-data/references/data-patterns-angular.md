# Data Display Patterns -- Angular

Angular standalone component versions of data display patterns.
Use native HTML `<table>` with WA utility classes. No `<wa-table>` component exists.
Use `@for` with `track` for all iteration.

## A: Stats Dashboard

**Components:** `npx kigumi add card avatar badge icon format-number`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { AvatarComponent } from '@/components/ui/Avatar/avatar.component';
import { BadgeComponent } from '@/components/ui/Badge/badge.component';
import { CardComponent } from '@/components/ui/Card/card.component';
import { FormatNumberComponent } from '@/components/ui/FormatNumber/format-number.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

interface Metric {
  label: string;
  value: number;
  icon: string;
  change?: { value: number | string; trend: 'up' | 'down' };
  type?: 'currency' | 'decimal' | 'percent';
  currency?: string;
}

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [
    AvatarComponent,
    BadgeComponent,
    CardComponent,
    FormatNumberComponent,
    IconComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-grid" style="--min-column-size: 30ch">
      @for (m of metrics; track m.label) {
        <k-card>
          <div class="wa-flank wa-align-items-start">
            <k-avatar shape="rounded">
              <k-icon slot="icon" [name]="m.icon" />
            </k-avatar>
            <div class="wa-stack wa-gap-2xs">
              <h3 class="wa-caption-s">{{ m.label }}</h3>
              <div class="wa-cluster wa-gap-xs">
                <span class="wa-heading-xl">
                  <k-format-number
                    [value]="m.value"
                    [type]="m.type || 'decimal'"
                    [currency]="m.currency"
                  />
                </span>
                @if (m.change) {
                  <k-badge
                    [variant]="m.change.trend === 'up' ? 'success' : 'danger'"
                    appearance="filled-outlined"
                    [pill]="true"
                  >
                    <k-icon
                      [name]="
                        m.change.trend === 'up' ? 'arrow-up' : 'arrow-down'
                      "
                      [label]="m.change.trend === 'up' ? 'Up' : 'Down'"
                    />
                    {{ m.change.value }}
                  </k-badge>
                }
              </div>
            </div>
          </div>
        </k-card>
      }
    </div>
  `,
})
export class StatsDashboardComponent {
  @Input() metrics: Metric[] = [];
}
```

---

## B: Data Table

Native HTML table with WA utility classes. All tables must include:

- `<caption>` (use `class="wa-visually-hidden"` for visually hidden but accessible)
- `scope="col"` on every `<th>`
- A responsive wrapper `<div style="overflow-x: auto">` around the `<table>`

**Components:** `npx kigumi add badge button icon relative-time skeleton`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { BadgeComponent } from '@/components/ui/Badge/badge.component';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';
import { RelativeTimeComponent } from '@/components/ui/RelativeTime/relative-time.component';
import { SkeletonComponent } from '@/components/ui/Skeleton/skeleton.component';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    RelativeTimeComponent,
    SkeletonComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: `
    .cell {
      padding: var(--wa-space-s) var(--wa-space-m);
    }
    .header {
      padding: var(--wa-space-s) var(--wa-space-m);
      border-bottom: 2px solid var(--wa-color-surface-border);
      text-align: left;
    }
    .row {
      border-bottom: 1px solid var(--wa-color-surface-border);
    }
  `,
  template: `
    @if (loading) {
      <div class="wa-stack wa-gap-s">
        @for (i of skeletonRows; track i) {
          <k-skeleton effect="sheen" style="height: 48px; width: 100%" />
        }
      </div>
    } @else {
      <div class="wa-stack wa-gap-m">
        <div class="wa-split wa-align-items-center">
          <h2>Users ({{ users.length }})</h2>
          <k-button variant="brand" size="small">
            <k-icon slot="start" name="plus" />Add User
          </k-button>
        </div>

        <div style="overflow-x: auto">
          <table
            class="wa-zebra-rows wa-hover-rows"
            style="width: 100%; min-width: 600px"
          >
            <caption class="wa-visually-hidden">
              User accounts with status and join date
            </caption>
            <thead>
              <tr>
                <th scope="col" class="header">Name</th>
                <th scope="col" class="header">Email</th>
                <th scope="col" class="header">Status</th>
                <th scope="col" class="header">Joined</th>
                <th scope="col" class="header">
                  <span class="wa-visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              @for (user of users; track user.id) {
                <tr class="row">
                  <td class="cell">{{ user.name }}</td>
                  <td class="cell">{{ user.email }}</td>
                  <td class="cell">
                    <k-badge [variant]="statusVariant[user.status]">{{
                      user.status
                    }}</k-badge>
                  </td>
                  <td class="cell">
                    <k-relative-time [date]="user.createdAt" />
                  </td>
                  <td class="cell">
                    <k-button
                      variant="neutral"
                      size="small"
                      appearance="plain"
                      aria-label="Edit"
                    >
                      <k-icon name="pen" />
                    </k-button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
})
export class UserTableComponent {
  @Input() users: User[] = [];
  @Input() loading = false;

  skeletonRows = [1, 2, 3, 4, 5];

  statusVariant: Record<string, string> = {
    active: 'success',
    inactive: 'neutral',
    pending: 'warning',
  };
}
```

---

## B2: Sortable Table

Extends the Data Table with client-side column sorting. Uses `aria-sort` for accessibility.

**Components:** `npx kigumi add badge button icon relative-time`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { BadgeComponent } from '@/components/ui/Badge/badge.component';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';
import { RelativeTimeComponent } from '@/components/ui/RelativeTime/relative-time.component';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-sortable-table',
  standalone: true,
  imports: [
    BadgeComponent,
    ButtonComponent,
    IconComponent,
    RelativeTimeComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: `
    .cell {
      padding: var(--wa-space-s) var(--wa-space-m);
    }
    .header {
      padding: var(--wa-space-s) var(--wa-space-m);
      border-bottom: 2px solid var(--wa-color-surface-border);
      text-align: left;
      cursor: pointer;
      user-select: none;
    }
    .header:hover {
      background: var(--wa-color-surface-hovered);
    }
    .row {
      border-bottom: 1px solid var(--wa-color-surface-border);
    }
  `,
  template: `
    <div style="overflow-x: auto">
      <table
        class="wa-zebra-rows wa-hover-rows"
        style="width: 100%; min-width: 600px"
      >
        <caption class="wa-visually-hidden">
          Sortable user accounts table
        </caption>
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th
                scope="col"
                class="header"
                [attr.aria-sort]="
                  sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                "
                (click)="toggleSort(col.key)"
              >
                <span class="wa-cluster wa-gap-2xs">
                  {{ col.label }}
                  @if (sortKey === col.key) {
                    <k-icon
                      [name]="sortDir === 'asc' ? 'arrow-up' : 'arrow-down'"
                    />
                  }
                </span>
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (user of sortedUsers; track user.id) {
            <tr class="row">
              <td class="cell">{{ user.name }}</td>
              <td class="cell">{{ user.email }}</td>
              <td class="cell">
                <k-badge [variant]="statusVariant[user.status]">{{
                  user.status
                }}</k-badge>
              </td>
              <td class="cell">
                <k-relative-time [date]="user.createdAt" />
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class SortableTableComponent {
  @Input() users: User[] = [];

  columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Joined' },
  ];

  sortKey = 'name';
  sortDir: SortDir = 'asc';

  statusVariant: Record<string, string> = {
    active: 'success',
    inactive: 'neutral',
    pending: 'warning',
  };

  get sortedUsers(): User[] {
    return [...this.users].sort((a, b) => {
      const aVal = a[this.sortKey as keyof User];
      const bVal = b[this.sortKey as keyof User];
      const cmp = String(aVal).localeCompare(String(bVal));
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  toggleSort(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
  }
}
```

---

## C: List View

Compact list with avatar, text, and action button.

**Components:** `npx kigumi add avatar badge button icon`

```typescript
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { AvatarComponent } from '@/components/ui/Avatar/avatar.component';
import { BadgeComponent } from '@/components/ui/Badge/badge.component';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

interface ListItem {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  status?: string;
}

@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [AvatarComponent, BadgeComponent, ButtonComponent, IconComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-stack wa-gap-0">
      @for (item of items; track item.id) {
        <div
          class="wa-flank wa-align-items-center"
          style="padding: var(--wa-space-s) var(--wa-space-m); border-bottom: 1px solid var(--wa-color-surface-border)"
        >
          <k-avatar [image]="item.avatar" [initials]="item.name.charAt(0)" />
          <div class="wa-stack wa-gap-2xs" style="flex: 1; min-width: 0">
            <strong>{{ item.name }}</strong>
            <span class="wa-body-s" style="color: var(--wa-color-text-quiet)">
              {{ item.description }}
            </span>
          </div>
          @if (item.status) {
            <k-badge variant="success">{{ item.status }}</k-badge>
          }
          <k-button
            variant="neutral"
            size="small"
            appearance="plain"
            (click)="select.emit(item.id)"
          >
            <k-icon name="chevron-right" />
          </k-button>
        </div>
      }
    </div>
  `,
})
export class ListViewComponent {
  @Input() items: ListItem[] = [];
  @Output() select = new EventEmitter<string>();
}
```

---

## D: Detail View

Key-value display using a description list with `wa-grid`.

**Components:** `npx kigumi add badge format-date`

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { BadgeComponent } from '@/components/ui/Badge/badge.component';

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [BadgeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <dl
      class="wa-grid"
      style="--min-column-size: 200px; gap: var(--wa-space-m)"
    >
      @for (field of fields; track field.label) {
        <div class="wa-stack wa-gap-2xs">
          <dt class="wa-caption-s" style="color: var(--wa-color-text-quiet)">
            {{ field.label }}
          </dt>
          <dd style="margin: 0">
            @if (field.badge) {
              <k-badge [variant]="field.badge">{{ field.value }}</k-badge>
            } @else {
              {{ field.value }}
            }
          </dd>
        </div>
      }
    </dl>
  `,
})
export class DetailViewComponent {
  @Input() fields: Array<{ label: string; value: string; badge?: string }> = [];
}
```

---

## E: Empty State

Shown when a query returns no results.

**Components:** `npx kigumi add button icon`

```typescript
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { IconComponent } from '@/components/ui/Icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      class="wa-stack wa-gap-m wa-align-items-center"
      style="padding: var(--wa-space-2xl); text-align: center"
    >
      <k-icon
        [name]="icon"
        style="font-size: 3rem; color: var(--wa-color-text-quiet)"
      />
      <h3 class="wa-heading-m">{{ title }}</h3>
      <p
        class="wa-body-m"
        style="color: var(--wa-color-text-quiet); max-width: 40ch"
      >
        {{ description }}
      </p>
      @if (actionLabel) {
        <k-button variant="brand" (click)="action.emit()">{{
          actionLabel
        }}</k-button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'No results';
  @Input() description = 'Try adjusting your search or filter criteria.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
```

---

## F: Loading State

Skeleton placeholders that match expected layout shape.

**Components:** `npx kigumi add skeleton`

### Table Skeleton

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SkeletonComponent } from '@/components/ui/Skeleton/skeleton.component';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-stack wa-gap-s">
      @for (i of rows; track i) {
        <k-skeleton effect="sheen" style="height: 48px; width: 100%" />
      }
    </div>
  `,
})
export class TableSkeletonComponent {
  rows = [1, 2, 3, 4, 5];
}
```

### Card Grid Skeleton

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SkeletonComponent } from '@/components/ui/Skeleton/skeleton.component';

@Component({
  selector: 'app-card-grid-skeleton',
  standalone: true,
  imports: [SkeletonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-grid" style="--min-column-size: 250px">
      @for (i of cards; track i) {
        <k-skeleton
          effect="sheen"
          style="height: 160px; border-radius: var(--wa-border-radius-m)"
        />
      }
    </div>
  `,
})
export class CardGridSkeletonComponent {
  cards = [1, 2, 3, 4, 5, 6];
}
```
