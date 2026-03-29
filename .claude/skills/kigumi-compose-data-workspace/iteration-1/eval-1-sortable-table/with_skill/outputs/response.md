# Eval 1: Sortable Data Table

## Install Dependencies

```bash
npx kigumi add badge button icon relative-time
```

## Implementation

Here is a sortable user table with clickable column headers. It uses native HTML `<table>` (no `<wa-table>` exists in Web Awesome), `aria-sort` on each sortable `<th>` for screen readers, and visual sort indicator icons.

```tsx
import { useState, useMemo } from 'react';
import { Badge, Button, Icon, RelativeTime } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastActive: string;
}

type SortKey = keyof Pick<User, 'name' | 'email' | 'role' | 'lastActive'>;

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const roleVariant = {
  admin: 'danger',
  editor: 'warning',
  viewer: 'neutral',
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

  function handleSort(key: SortKey) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function ariaSortValue(key: SortKey): 'ascending' | 'descending' | 'none' {
    if (sort.key !== key) return 'none';
    return sort.direction === 'asc' ? 'ascending' : 'descending';
  }

  function sortIcon(key: SortKey): string {
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
          class="wa-zebra-rows wa-hover-rows"
          style={{ width: '100%', minWidth: '700px' }}
        >
          <caption className="wa-sr-only">
            User accounts sortable by name, email, role, and last active date
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
                aria-sort={ariaSortValue('role')}
                onClick={() => handleSort('role')}
              >
                Role{' '}
                <Icon
                  name={sortIcon('role')}
                  style={{ fontSize: 'var(--wa-font-size-s)' }}
                />
              </th>
              <th
                scope="col"
                style={headerStyle}
                aria-sort={ariaSortValue('lastActive')}
                onClick={() => handleSort('lastActive')}
              >
                Last Active{' '}
                <Icon
                  name={sortIcon('lastActive')}
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
                <span className="wa-sr-only">Actions</span>
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
                  <Badge variant={roleVariant[user.role]}>{user.role}</Badge>
                </td>
                <td style={cellStyle}>
                  <RelativeTime date={user.lastActive} />
                </td>
                <td style={cellStyle}>
                  <Button
                    variant="neutral"
                    size="small"
                    appearance="plain"
                    aria-label={`Edit ${user.name}`}
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

## Usage

```tsx
const users: User[] = [
  {
    id: 1,
    name: 'Alice Chen',
    email: 'alice@example.com',
    role: 'admin',
    lastActive: '2026-03-28T09:15:00Z',
  },
  {
    id: 2,
    name: 'Bob Martinez',
    email: 'bob@example.com',
    role: 'editor',
    lastActive: '2026-03-27T14:30:00Z',
  },
  {
    id: 3,
    name: 'Carol Wu',
    email: 'carol@example.com',
    role: 'viewer',
    lastActive: '2026-03-20T08:00:00Z',
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david@example.com',
    role: 'editor',
    lastActive: '2026-03-25T16:45:00Z',
  },
];

<SortableUserTable users={users} />;
```

## Key Points

- **No `<wa-table>` component exists.** This uses a native HTML `<table>` styled with WA utility classes (`wa-zebra-rows`, `wa-hover-rows`) and CSS custom properties.
- **Accessible by default:** `<caption>` (visually hidden via `wa-sr-only`), `scope="col"` on all `<th>` elements, and `aria-sort` indicating the current sort state on each column header.
- **Responsive:** wrapped in a `<div>` with `overflowX: 'auto'` and a `minWidth` on the table to ensure horizontal scrolling on small viewports.
- **Sort toggles:** clicking a column header toggles between ascending and descending. Clicking a different column resets to ascending. The arrow icon updates to reflect state.
- **`RelativeTime`** auto-formats the `lastActive` date as "3 days ago", "just now", etc.
- **`Badge`** with semantic variants maps each role to a color: admin = danger, editor = warning, viewer = neutral.
- Uses `class` (not `className`) on `<wa-*>` web component elements. Native HTML elements use `className` as standard React.
