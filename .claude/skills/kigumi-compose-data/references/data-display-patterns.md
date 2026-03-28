# Data Display Patterns

## A: Stats Dashboard

Uses WA typography utility classes (`wa-caption-s`, `wa-heading-xl`) and layout utilities
instead of inline styles. Pattern inspired by Web Awesome's own dashboard examples.

**Components:** `npx kigumi add card avatar badge icon format-number`

### React

```tsx
import { Avatar, Badge, Card, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  change?: { value: number | string; trend: 'up' | 'down' };
  type?: 'currency' | 'decimal' | 'percent';
  currency?: string;
}

export function StatsDashboard({ metrics }: { metrics: Metric[] }) {
  return (
    <div
      className="wa-grid"
      style={{ '--min-column-size': '30ch' } as React.CSSProperties}
    >
      {metrics.map((m) => (
        <Card key={m.label}>
          <div className="wa-flank wa-align-items-start">
            <Avatar shape="rounded">
              <Icon slot="icon" name={m.icon} />
            </Avatar>
            <div className="wa-stack wa-gap-2xs">
              <h3 className="wa-caption-s">{m.label}</h3>
              <div className="wa-cluster wa-gap-xs">
                <span className="wa-heading-xl">
                  <FormatNumber
                    value={m.value}
                    type={m.type || 'decimal'}
                    currency={m.currency}
                  />
                </span>
                {m.change && (
                  <Badge
                    variant={m.change.trend === 'up' ? 'success' : 'danger'}
                    appearance="filled-outlined"
                    pill
                  >
                    <Icon
                      name={m.change.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                      label={m.change.trend === 'up' ? 'Up' : 'Down'}
                    />
                    {m.change.value}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Usage
<StatsDashboard
  metrics={[
    {
      label: 'Total Subscribers',
      value: 81779,
      icon: 'user-group',
      change: { value: 212, trend: 'up' },
    },
    {
      label: 'Open Rate',
      value: 0.6158,
      type: 'percent',
      icon: 'envelope-open',
      change: { value: '4.5%', trend: 'up' },
    },
    {
      label: 'Click Rate',
      value: 0.2574,
      type: 'percent',
      icon: 'arrow-pointer',
      change: { value: '2.1%', trend: 'down' },
    },
  ]}
/>;
```

### Vue

```vue
<script setup lang="ts">
import { Avatar, Badge, Card, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  change?: { value: number | string; trend: 'up' | 'down' };
  type?: 'currency' | 'decimal' | 'percent';
  currency?: string;
}

defineProps<{ metrics: Metric[] }>();
</script>

<template>
  <div class="wa-grid" style="--min-column-size: 30ch">
    <Card v-for="m in metrics" :key="m.label">
      <div class="wa-flank wa-align-items-start">
        <Avatar shape="rounded">
          <Icon slot="icon" :name="m.icon" />
        </Avatar>
        <div class="wa-stack wa-gap-2xs">
          <h3 class="wa-caption-s">{{ m.label }}</h3>
          <div class="wa-cluster wa-gap-xs">
            <span class="wa-heading-xl">
              <FormatNumber
                :value="m.value"
                :type="m.type || 'decimal'"
                :currency="m.currency"
              />
            </span>
            <Badge
              v-if="m.change"
              :variant="m.change.trend === 'up' ? 'success' : 'danger'"
              appearance="filled-outlined"
              pill
            >
              <Icon
                :name="m.change.trend === 'up' ? 'arrow-up' : 'arrow-down'"
                :label="m.change.trend === 'up' ? 'Up' : 'Down'"
              />
              {{ m.change.value }}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
```

---

## B: Data Table (Free Tier)

Native HTML table with WA utility classes. No wa-table component exists.
Use `wa-zebra-rows` for alternating row colors and `wa-hover-rows` for hover highlighting.

All tables must include:

- `<caption>` (use `className="wa-visually-hidden"` for visually hidden but accessible captions)
- `scope="col"` on every `<th>`
- A responsive wrapper `<div>` with `overflowX: 'auto'` around the `<table>`

**Components:** `npx kigumi add badge button icon relative-time skeleton`

### React

```tsx
import { Badge, Button, Icon, RelativeTime, Skeleton } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;

export function UserTable({
  users,
  loading,
}: {
  users: User[];
  loading?: boolean;
}) {
  const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
  const headerStyle = {
    ...cellStyle,
    borderBottom: '2px solid var(--wa-color-surface-border)',
    textAlign: 'left' as const,
  };

  if (loading) {
    return (
      <div className="wa-stack wa-gap-s">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            key={i}
            effect="sheen"
            style={{ height: '48px', width: '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="wa-stack wa-gap-m">
      <div className="wa-split wa-align-items-center">
        <h2>Users ({users.length})</h2>
        <Button variant="brand" size="small">
          <Icon slot="start" name="plus" />
          Add User
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          className="wa-zebra-rows wa-hover-rows"
          style={{ width: '100%', minWidth: '600px' }}
        >
          <caption className="wa-visually-hidden">
            User accounts with status and join date
          </caption>
          <thead>
            <tr>
              <th scope="col" style={headerStyle}>
                Name
              </th>
              <th scope="col" style={headerStyle}>
                Email
              </th>
              <th scope="col" style={headerStyle}>
                Status
              </th>
              <th scope="col" style={headerStyle}>
                Joined
              </th>
              <th scope="col" style={headerStyle}>
                <span className="wa-visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: '1px solid var(--wa-color-surface-border)',
                }}
              >
                <td style={cellStyle}>{user.name}</td>
                <td style={cellStyle}>{user.email}</td>
                <td style={cellStyle}>
                  <Badge variant={statusVariant[user.status]}>
                    {user.status}
                  </Badge>
                </td>
                <td style={cellStyle}>
                  <RelativeTime date={user.createdAt} />
                </td>
                <td style={cellStyle}>
                  <Button
                    variant="neutral"
                    size="small"
                    appearance="plain"
                    aria-label="Edit"
                  >
                    <Icon name="pen" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Badge, Button, Icon, RelativeTime, Skeleton } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;

defineProps<{ users: User[]; loading?: boolean }>();

const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
const headerStyle = {
  ...cellStyle,
  borderBottom: '2px solid var(--wa-color-surface-border)',
  textAlign: 'left' as const,
};
</script>

<template>
  <div class="wa-stack wa-gap-s" v-if="loading">
    <Skeleton
      v-for="i in 5"
      :key="i"
      effect="sheen"
      style="height: 48px; width: 100%"
    />
  </div>

  <div v-else class="wa-stack wa-gap-m">
    <div class="wa-split wa-align-items-center">
      <h2>Users ({{ users.length }})</h2>
      <Button variant="brand" size="small"
        ><Icon slot="start" name="plus" />Add User</Button
      >
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
            <th scope="col" :style="headerStyle">Name</th>
            <th scope="col" :style="headerStyle">Email</th>
            <th scope="col" :style="headerStyle">Status</th>
            <th scope="col" :style="headerStyle">Joined</th>
            <th scope="col" :style="headerStyle">
              <span class="wa-visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            style="border-bottom: 1px solid var(--wa-color-surface-border)"
          >
            <td :style="cellStyle">{{ user.name }}</td>
            <td :style="cellStyle">{{ user.email }}</td>
            <td :style="cellStyle">
              <Badge :variant="statusVariant[user.status]">{{
                user.status
              }}</Badge>
            </td>
            <td :style="cellStyle"><RelativeTime :date="user.createdAt" /></td>
            <td :style="cellStyle">
              <Button
                variant="neutral"
                size="small"
                appearance="plain"
                aria-label="Edit"
              >
                <Icon name="pen" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

---

## B2: Sortable Table

Extends the Data Table with client-side column sorting. Uses `aria-sort` for accessibility
and visual sort indicators via Icon.

**Components:** `npx kigumi add badge button icon relative-time`

### React

```tsx
import { useState, useMemo } from 'react';
import { Badge, Button, Icon, RelativeTime } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

interface SortConfig {
  key: keyof User;
  direction: 'asc' | 'desc';
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;

export function SortableUserTable({ users }: { users: User[] }) {
  const [sort, setSort] = useState<SortConfig>({
    key: 'name',
    direction: 'asc',
  });

  const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
  const headerStyle = {
    ...cellStyle,
    borderBottom: '2px solid var(--wa-color-surface-border)',
    textAlign: 'left' as const,
    cursor: 'pointer',
    userSelect: 'none' as const,
  };

  function handleSort(key: keyof User) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function ariaSortValue(key: keyof User): 'ascending' | 'descending' | 'none' {
    if (sort.key !== key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  function sortIcon(key: keyof User): string {
    if (sort.key !== key) return 'arrow-down-up';
    return sort.direction === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [users, sort]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        className="wa-zebra-rows wa-hover-rows"
        style={{ width: '100%', minWidth: '600px' }}
      >
        <caption className="wa-visually-hidden">
          Sortable user accounts table
        </caption>
        <thead>
          <tr>
            <th
              scope="col"
              style={headerStyle}
              aria-sort={ariaSortValue('name')}
              onClick={() => handleSort('name')}
            >
              Name{' '}
              <Icon
                name={sortIcon('name')}
                style={{ fontSize: 'var(--wa-font-size-s)' }}
              />
            </th>
            <th
              scope="col"
              style={headerStyle}
              aria-sort={ariaSortValue('email')}
              onClick={() => handleSort('email')}
            >
              Email{' '}
              <Icon
                name={sortIcon('email')}
                style={{ fontSize: 'var(--wa-font-size-s)' }}
              />
            </th>
            <th
              scope="col"
              style={headerStyle}
              aria-sort={ariaSortValue('status')}
              onClick={() => handleSort('status')}
            >
              Status{' '}
              <Icon
                name={sortIcon('status')}
                style={{ fontSize: 'var(--wa-font-size-s)' }}
              />
            </th>
            <th
              scope="col"
              style={headerStyle}
              aria-sort={ariaSortValue('createdAt')}
              onClick={() => handleSort('createdAt')}
            >
              Joined{' '}
              <Icon
                name={sortIcon('createdAt')}
                style={{ fontSize: 'var(--wa-font-size-s)' }}
              />
            </th>
            <th
              scope="col"
              style={{
                ...cellStyle,
                borderBottom: '2px solid var(--wa-color-surface-border)',
              }}
            >
              <span className="wa-visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((user) => (
            <tr
              key={user.id}
              style={{
                borderBottom: '1px solid var(--wa-color-surface-border)',
              }}
            >
              <td style={cellStyle}>{user.name}</td>
              <td style={cellStyle}>{user.email}</td>
              <td style={cellStyle}>
                <Badge variant={statusVariant[user.status]}>
                  {user.status}
                </Badge>
              </td>
              <td style={cellStyle}>
                <RelativeTime date={user.createdAt} />
              </td>
              <td style={cellStyle}>
                <Button
                  variant="neutral"
                  size="small"
                  appearance="plain"
                  aria-label="Edit"
                >
                  <Icon name="pen" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Badge, Button, Icon, RelativeTime } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;

const props = defineProps<{ users: User[] }>();

const sortKey = ref<keyof User>('name');
const sortDirection = ref<'asc' | 'desc'>('asc');

function handleSort(key: keyof User) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDirection.value = 'asc';
  }
}

function ariaSortValue(key: keyof User): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none';
  return sortDirection.value === 'asc' ? 'ascending' : 'descending';
}

function sortIcon(key: keyof User): string {
  if (sortKey.value !== key) return 'arrow-down-up';
  return sortDirection.value === 'asc' ? 'arrow-up' : 'arrow-down';
}

const sorted = computed(() => {
  return [...props.users].sort((a, b) => {
    const aVal = a[sortKey.value];
    const bVal = b[sortKey.value];
    const cmp = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortDirection.value === 'asc' ? cmp : -cmp;
  });
});

const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
const headerStyle = {
  ...cellStyle,
  borderBottom: '2px solid var(--wa-color-surface-border)',
  textAlign: 'left' as const,
  cursor: 'pointer',
  userSelect: 'none' as const,
};
</script>

<template>
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
          <th
            scope="col"
            :style="headerStyle"
            :aria-sort="ariaSortValue('name')"
            @click="handleSort('name')"
          >
            Name
            <Icon
              :name="sortIcon('name')"
              style="font-size: var(--wa-font-size-s)"
            />
          </th>
          <th
            scope="col"
            :style="headerStyle"
            :aria-sort="ariaSortValue('email')"
            @click="handleSort('email')"
          >
            Email
            <Icon
              :name="sortIcon('email')"
              style="font-size: var(--wa-font-size-s)"
            />
          </th>
          <th
            scope="col"
            :style="headerStyle"
            :aria-sort="ariaSortValue('status')"
            @click="handleSort('status')"
          >
            Status
            <Icon
              :name="sortIcon('status')"
              style="font-size: var(--wa-font-size-s)"
            />
          </th>
          <th
            scope="col"
            :style="headerStyle"
            :aria-sort="ariaSortValue('createdAt')"
            @click="handleSort('createdAt')"
          >
            Joined
            <Icon
              :name="sortIcon('createdAt')"
              style="font-size: var(--wa-font-size-s)"
            />
          </th>
          <th
            scope="col"
            :style="{
              ...cellStyle,
              borderBottom: '2px solid var(--wa-color-surface-border)',
            }"
          >
            <span class="wa-visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="user in sorted"
          :key="user.id"
          style="border-bottom: 1px solid var(--wa-color-surface-border)"
        >
          <td :style="cellStyle">{{ user.name }}</td>
          <td :style="cellStyle">{{ user.email }}</td>
          <td :style="cellStyle">
            <Badge :variant="statusVariant[user.status]">{{
              user.status
            }}</Badge>
          </td>
          <td :style="cellStyle"><RelativeTime :date="user.createdAt" /></td>
          <td :style="cellStyle">
            <Button
              variant="neutral"
              size="small"
              appearance="plain"
              aria-label="Edit"
            >
              <Icon name="pen" />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## B3: Paginated Table

Table with page navigation, page size selector, and "Showing X-Y of Z" summary.

**Components:** `npx kigumi add badge button icon select`

### React

```tsx
import { useState, useMemo } from 'react';
import { Badge, Button, Icon, Select } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function PaginatedUserTable({ users }: { users: User[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.ceil(users.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, users.length);

  const paginatedUsers = useMemo(
    () => users.slice(start, end),
    [users, start, end]
  );

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setPage(1);
  }

  const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
  const headerStyle = {
    ...cellStyle,
    borderBottom: '2px solid var(--wa-color-surface-border)',
    textAlign: 'left' as const,
  };

  return (
    <div className="wa-stack wa-gap-m">
      <div style={{ overflowX: 'auto' }}>
        <table
          className="wa-zebra-rows wa-hover-rows"
          style={{ width: '100%', minWidth: '600px' }}
        >
          <caption className="wa-visually-hidden">
            Paginated user accounts table
          </caption>
          <thead>
            <tr>
              <th scope="col" style={headerStyle}>
                Name
              </th>
              <th scope="col" style={headerStyle}>
                Email
              </th>
              <th scope="col" style={headerStyle}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: '1px solid var(--wa-color-surface-border)',
                }}
              >
                <td style={cellStyle}>{user.name}</td>
                <td style={cellStyle}>{user.email}</td>
                <td style={cellStyle}>
                  <Badge variant={statusVariant[user.status]}>
                    {user.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="wa-split wa-align-items-center">
        <span
          style={{
            color: 'var(--wa-color-text-quiet)',
            fontSize: 'var(--wa-font-size-s)',
          }}
        >
          Showing {start + 1}-{end} of {users.length}
        </span>
        <div className="wa-cluster wa-gap-s wa-align-items-center">
          <Select
            value={String(pageSize)}
            onWaChange={(e: CustomEvent) =>
              handlePageSizeChange(
                Number((e.target as HTMLSelectElement).value)
              )
            }
            size="small"
            style={{ width: '80px' }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
          <Button
            variant="neutral"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <Icon name="chevron-left" label="Previous page" />
          </Button>
          <span style={{ fontSize: 'var(--wa-font-size-s)' }}>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="neutral"
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <Icon name="chevron-right" label="Next page" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Badge, Button, Icon, Select } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const props = defineProps<{ users: User[] }>();

const page = ref(1);
const pageSize = ref(10);

const totalPages = computed(() =>
  Math.ceil(props.users.length / pageSize.value)
);
const start = computed(() => (page.value - 1) * pageSize.value);
const end = computed(() =>
  Math.min(start.value + pageSize.value, props.users.length)
);

const paginatedUsers = computed(() =>
  props.users.slice(start.value, end.value)
);

function handlePageSizeChange(event: CustomEvent) {
  pageSize.value = Number((event.target as HTMLSelectElement).value);
  page.value = 1;
}

const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
const headerStyle = {
  ...cellStyle,
  borderBottom: '2px solid var(--wa-color-surface-border)',
  textAlign: 'left' as const,
};
</script>

<template>
  <div class="wa-stack wa-gap-m">
    <div style="overflow-x: auto">
      <table
        class="wa-zebra-rows wa-hover-rows"
        style="width: 100%; min-width: 600px"
      >
        <caption class="wa-visually-hidden">
          Paginated user accounts table
        </caption>
        <thead>
          <tr>
            <th scope="col" :style="headerStyle">Name</th>
            <th scope="col" :style="headerStyle">Email</th>
            <th scope="col" :style="headerStyle">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in paginatedUsers"
            :key="user.id"
            style="border-bottom: 1px solid var(--wa-color-surface-border)"
          >
            <td :style="cellStyle">{{ user.name }}</td>
            <td :style="cellStyle">{{ user.email }}</td>
            <td :style="cellStyle">
              <Badge :variant="statusVariant[user.status]">{{
                user.status
              }}</Badge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination controls -->
    <div class="wa-split wa-align-items-center">
      <span
        style="color: var(--wa-color-text-quiet); font-size: var(--wa-font-size-s)"
      >
        Showing {{ start + 1 }}-{{ end }} of {{ users.length }}
      </span>
      <div class="wa-cluster wa-gap-s wa-align-items-center">
        <Select
          :value="String(pageSize)"
          size="small"
          style="width: 80px"
          @wa-change="handlePageSizeChange"
        >
          <option v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="size">
            {{ size }}
          </option>
        </Select>
        <Button
          variant="neutral"
          size="small"
          :disabled="page <= 1"
          @click="page--"
        >
          <Icon name="chevron-left" label="Previous page" />
        </Button>
        <span style="font-size: var(--wa-font-size-s)">
          Page {{ page }} of {{ totalPages }}
        </span>
        <Button
          variant="neutral"
          size="small"
          :disabled="page >= totalPages"
          @click="page++"
        >
          <Icon name="chevron-right" label="Next page" />
        </Button>
      </div>
    </div>
  </div>
</template>
```

---

## B4: Filtered Table

Table with a debounced search input that filters rows across all text columns.

**Components:** `npx kigumi add badge input icon`

### React

```tsx
import { useState, useMemo, useRef, useCallback } from 'react';
import { Badge, Icon, Input } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;

export function FilteredUserTable({ users }: { users: User[] }) {
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback((e: CustomEvent) => {
    const value = (e.target as HTMLInputElement).value;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.status.includes(q)
    );
  }, [users, search]);

  const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
  const headerStyle = {
    ...cellStyle,
    borderBottom: '2px solid var(--wa-color-surface-border)',
    textAlign: 'left' as const,
  };

  return (
    <div className="wa-stack wa-gap-m">
      <Input
        placeholder="Search users..."
        clearable
        onWaInput={handleSearch}
        style={{ maxWidth: '320px' }}
      >
        <Icon slot="start" name="magnifying-glass" />
      </Input>

      <div style={{ overflowX: 'auto' }}>
        <table
          className="wa-zebra-rows wa-hover-rows"
          style={{ width: '100%', minWidth: '600px' }}
        >
          <caption className="wa-visually-hidden">
            Filtered user accounts table
          </caption>
          <thead>
            <tr>
              <th scope="col" style={headerStyle}>
                Name
              </th>
              <th scope="col" style={headerStyle}>
                Email
              </th>
              <th scope="col" style={headerStyle}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    ...cellStyle,
                    textAlign: 'center',
                    color: 'var(--wa-color-text-quiet)',
                  }}
                >
                  No matching users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: '1px solid var(--wa-color-surface-border)',
                  }}
                >
                  <td style={cellStyle}>{user.name}</td>
                  <td style={cellStyle}>{user.email}</td>
                  <td style={cellStyle}>
                    <Badge variant={statusVariant[user.status]}>
                      {user.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <span
        style={{
          color: 'var(--wa-color-text-quiet)',
          fontSize: 'var(--wa-font-size-s)',
        }}
      >
        {filtered.length} of {users.length} users
      </span>
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { Badge, Icon, Input } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
}

const statusVariant = {
  active: 'success',
  inactive: 'neutral',
  pending: 'warning',
} as const;

const props = defineProps<{ users: User[] }>();

const search = ref('');
let debounceTimer: ReturnType<typeof setTimeout>;

function handleSearch(event: CustomEvent) {
  const value = (event.target as HTMLInputElement).value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    search.value = value;
  }, 300);
}

onUnmounted(() => clearTimeout(debounceTimer));

const filtered = computed(() => {
  if (!search.value) return props.users;
  const q = search.value.toLowerCase();
  return props.users.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.status.includes(q)
  );
});

const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
const headerStyle = {
  ...cellStyle,
  borderBottom: '2px solid var(--wa-color-surface-border)',
  textAlign: 'left' as const,
};
</script>

<template>
  <div class="wa-stack wa-gap-m">
    <Input
      placeholder="Search users..."
      clearable
      style="max-width: 320px"
      @wa-input="handleSearch"
    >
      <Icon slot="start" name="magnifying-glass" />
    </Input>

    <div style="overflow-x: auto">
      <table
        class="wa-zebra-rows wa-hover-rows"
        style="width: 100%; min-width: 600px"
      >
        <caption class="wa-visually-hidden">
          Filtered user accounts table
        </caption>
        <thead>
          <tr>
            <th scope="col" :style="headerStyle">Name</th>
            <th scope="col" :style="headerStyle">Email</th>
            <th scope="col" :style="headerStyle">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filtered.length === 0">
            <td
              colspan="3"
              :style="{
                ...cellStyle,
                textAlign: 'center',
                color: 'var(--wa-color-text-quiet)',
              }"
            >
              No matching users found.
            </td>
          </tr>
          <tr
            v-for="user in filtered"
            :key="user.id"
            style="border-bottom: 1px solid var(--wa-color-surface-border)"
          >
            <td :style="cellStyle">{{ user.name }}</td>
            <td :style="cellStyle">{{ user.email }}</td>
            <td :style="cellStyle">
              <Badge :variant="statusVariant[user.status]">{{
                user.status
              }}</Badge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <span
      style="color: var(--wa-color-text-quiet); font-size: var(--wa-font-size-s)"
    >
      {{ filtered.length }} of {{ users.length }} users
    </span>
  </div>
</template>
```

---

## C: List View

Cards in a vertical stack with flank layout per item.

**Components:** `npx kigumi add card avatar badge button icon relative-time`

### React

```tsx
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  RelativeTime,
} from '@/components/ui';

interface Item {
  id: number;
  name: string;
  description: string;
  avatar: string;
  status: 'active' | 'draft';
  updatedAt: string;
}

export function ListView({ items }: { items: Item[] }) {
  return (
    <div className="wa-stack wa-gap-s">
      {items.map((item) => (
        <Card key={item.id}>
          <div
            className="wa-flank wa-align-items-center"
            style={{ '--flank-size': '48px' } as React.CSSProperties}
          >
            <Avatar image={item.avatar} label={item.name} />
            <div className="wa-split wa-align-items-center" style={{ flex: 1 }}>
              <div className="wa-stack wa-gap-2xs">
                <strong>{item.name}</strong>
                <span
                  style={{
                    color: 'var(--wa-color-text-quiet)',
                    fontSize: 'var(--wa-font-size-s)',
                  }}
                >
                  {item.description} &middot;{' '}
                  <RelativeTime date={item.updatedAt} />
                </span>
              </div>
              <div className="wa-cluster wa-gap-xs wa-align-items-center">
                <Badge
                  variant={item.status === 'active' ? 'success' : 'neutral'}
                >
                  {item.status}
                </Badge>
                <Button
                  variant="neutral"
                  size="small"
                  appearance="plain"
                  aria-label="More actions"
                >
                  <Icon name="ellipsis-vertical" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import {
  Avatar,
  Badge,
  Button,
  Card,
  Icon,
  RelativeTime,
} from '@/components/ui';

interface Item {
  id: number;
  name: string;
  description: string;
  avatar: string;
  status: 'active' | 'draft';
  updatedAt: string;
}

defineProps<{ items: Item[] }>();
</script>

<template>
  <div class="wa-stack wa-gap-s">
    <Card v-for="item in items" :key="item.id">
      <div class="wa-flank wa-align-items-center" style="--flank-size: 48px">
        <Avatar :image="item.avatar" :label="item.name" />
        <div class="wa-split wa-align-items-center" style="flex: 1">
          <div class="wa-stack wa-gap-2xs">
            <strong>{{ item.name }}</strong>
            <span
              style="color: var(--wa-color-text-quiet); font-size: var(--wa-font-size-s)"
            >
              {{ item.description }} &middot;
              <RelativeTime :date="item.updatedAt" />
            </span>
          </div>
          <div class="wa-cluster wa-gap-xs wa-align-items-center">
            <Badge
              :variant="item.status === 'active' ? 'success' : 'neutral'"
              >{{ item.status }}</Badge
            >
            <Button
              variant="neutral"
              size="small"
              appearance="plain"
              aria-label="More actions"
            >
              <Icon name="ellipsis-vertical" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
```

---

## D: Detail View

Single card with key-value pairs.

**Components:** `npx kigumi add card button divider`

### React

```tsx
import { Button, Card, Divider } from '@/components/ui';

export function DetailView({ data }: { data: Record<string, string> }) {
  return (
    <Card>
      <div slot="header" className="wa-split wa-align-items-center">
        <h3>Details</h3>
        <Button variant="neutral" size="small">
          Edit
        </Button>
      </div>

      <div
        className="wa-grid"
        style={
          {
            '--min-column-size': '200px',
            gap: 'var(--wa-space-m)',
          } as React.CSSProperties
        }
      >
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="wa-stack wa-gap-2xs">
            <small style={{ color: 'var(--wa-color-text-quiet)' }}>{key}</small>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" size="small">
          Cancel
        </Button>
        <Button variant="brand" size="small">
          Save
        </Button>
      </div>
    </Card>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Button, Card, Divider } from '@/components/ui';

defineProps<{ data: Record<string, string> }>();
</script>

<template>
  <Card>
    <div slot="header" class="wa-split wa-align-items-center">
      <h3>Details</h3>
      <Button variant="neutral" size="small">Edit</Button>
    </div>

    <div
      class="wa-grid"
      style="--min-column-size: 200px; gap: var(--wa-space-m)"
    >
      <div v-for="(value, key) in data" :key="key" class="wa-stack wa-gap-2xs">
        <small style="color: var(--wa-color-text-quiet)">{{ key }}</small>
        <span>{{ value }}</span>
      </div>
    </div>

    <div slot="footer" class="wa-cluster wa-justify-content-end wa-gap-s">
      <Button variant="neutral" size="small">Cancel</Button>
      <Button variant="brand" size="small">Save</Button>
    </div>
  </Card>
</template>
```

---

## E: Empty State

Placeholder when no data is available.

**Components:** `npx kigumi add card button icon`

### React

```tsx
import { Button, Card, Icon } from '@/components/ui';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card>
      <div
        className="wa-stack wa-gap-m wa-align-items-center"
        style={{
          textAlign: 'center',
          padding: 'var(--wa-space-2xl) var(--wa-space-l)',
        }}
      >
        <Icon
          name="inbox"
          style={{ fontSize: '3rem', color: 'var(--wa-color-text-quiet)' }}
        />
        <div className="wa-stack wa-gap-xs">
          <strong style={{ fontSize: 'var(--wa-font-size-l)' }}>{title}</strong>
          <p style={{ color: 'var(--wa-color-text-quiet)' }}>{description}</p>
        </div>
        <Button variant="brand" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

// Usage
<EmptyState
  title="No items yet"
  description="Create your first item to get started."
  actionLabel="Create Item"
  onAction={() => {}}
/>;
```

### Vue

```vue
<script setup lang="ts">
import { Button, Card, Icon } from '@/components/ui';

defineProps<{
  title: string;
  description: string;
  actionLabel: string;
}>();

const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <Card>
    <div
      class="wa-stack wa-gap-m wa-align-items-center"
      style="text-align: center; padding: var(--wa-space-2xl) var(--wa-space-l)"
    >
      <Icon
        name="inbox"
        style="font-size: 3rem; color: var(--wa-color-text-quiet)"
      />
      <div class="wa-stack wa-gap-xs">
        <strong style="font-size: var(--wa-font-size-l)">{{ title }}</strong>
        <p style="color: var(--wa-color-text-quiet)">{{ description }}</p>
      </div>
      <Button variant="brand" @click="emit('action')">{{ actionLabel }}</Button>
    </div>
  </Card>
</template>
```

---

## F: Loading State

Skeleton screens that match the expected layout.

**Components:** `npx kigumi add skeleton`

### React

```tsx
import { Skeleton } from '@/components/ui';

// Table loading skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="wa-stack wa-gap-s">
      <Skeleton effect="sheen" style={{ height: '40px', width: '100%' }} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          effect="sheen"
          style={{ height: '48px', width: '100%' }}
        />
      ))}
    </div>
  );
}

// Card grid loading skeleton
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="wa-grid"
      style={{ '--min-column-size': '250px' } as React.CSSProperties}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          effect="sheen"
          style={{ height: '120px', borderRadius: 'var(--wa-border-radius-m)' }}
        />
      ))}
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { Skeleton } from '@/components/ui';

withDefaults(defineProps<{ rows?: number; count?: number }>(), {
  rows: 5,
  count: 6,
});
</script>

<template>
  <!-- Table loading skeleton -->
  <div class="wa-stack wa-gap-s">
    <Skeleton effect="sheen" style="height: 40px; width: 100%" />
    <Skeleton
      v-for="i in rows"
      :key="i"
      effect="sheen"
      style="height: 48px; width: 100%"
    />
  </div>
</template>
```

```vue
<!-- Card grid loading skeleton (separate component) -->
<script setup lang="ts">
import { Skeleton } from '@/components/ui';

withDefaults(defineProps<{ count?: number }>(), { count: 6 });
</script>

<template>
  <div class="wa-grid" style="--min-column-size: 250px">
    <Skeleton
      v-for="i in count"
      :key="i"
      effect="sheen"
      style="height: 120px; border-radius: var(--wa-border-radius-m)"
    />
  </div>
</template>
```
