import { useState, useMemo } from 'react';
import { Badge, Icon, RelativeTime } from '@/components/ui';

// Install: npx kigumi add badge icon relative-time

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  lastActive: string;
}

type SortKey = 'name' | 'email' | 'role' | 'lastActive';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const roleVariant = {
  admin: 'danger',
  editor: 'warning',
  viewer: 'neutral',
} as const;

const sampleUsers: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', lastActive: '2026-03-29T09:15:00Z' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'editor', lastActive: '2026-03-28T14:30:00Z' },
  { id: 3, name: 'Carol Lee', email: 'carol@example.com', role: 'viewer', lastActive: '2026-03-25T08:00:00Z' },
  { id: 4, name: 'Dan Park', email: 'dan@example.com', role: 'editor', lastActive: '2026-03-27T17:45:00Z' },
  { id: 5, name: 'Eva Chen', email: 'eva@example.com', role: 'admin', lastActive: '2026-03-29T11:00:00Z' },
  { id: 6, name: 'Frank Torres', email: 'frank@example.com', role: 'viewer', lastActive: '2026-03-20T10:30:00Z' },
];

export function SortableUserTable({ users = sampleUsers }: { users?: User[] }) {
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
    <div style={{ overflowX: 'auto' }}>
      <table
        className="wa-zebra-rows wa-hover-rows"
        style={{ width: '100%', minWidth: '600px' }}
      >
        <caption className="wa-visually-hidden">
          Sortable user directory table
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
                <Badge variant={roleVariant[user.role]} pill>
                  {user.role}
                </Badge>
              </td>
              <td style={cellStyle}>
                <RelativeTime date={user.lastActive} sync />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
