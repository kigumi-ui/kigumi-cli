import { useState } from 'react';
import { Badge, Icon } from '@/components/ui';

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: keyof User | null;
  direction: SortDirection;
}

interface User {
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

const USERS: User[] = [
  { name: 'Alice Chen', email: 'alice@example.com', role: 'Admin', lastActive: '2026-03-28' },
  { name: 'Bob Martinez', email: 'bob@example.com', role: 'Editor', lastActive: '2026-03-25' },
  { name: 'Carol White', email: 'carol@example.com', role: 'Viewer', lastActive: '2026-03-29' },
  { name: 'David Kim', email: 'david@example.com', role: 'Editor', lastActive: '2026-03-20' },
  { name: 'Eva Patel', email: 'eva@example.com', role: 'Admin', lastActive: '2026-03-27' },
];

const ROLE_VARIANT: Record<string, 'brand' | 'success' | 'neutral'> = {
  Admin: 'brand',
  Editor: 'success',
  Viewer: 'neutral',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sortUsers(users: User[], sort: SortState): User[] {
  if (!sort.column || !sort.direction) return users;
  return [...users].sort((a, b) => {
    const valA = a[sort.column!];
    const valB = b[sort.column!];
    const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}

interface ColumnHeaderProps {
  label: string;
  column: keyof User;
  sort: SortState;
  onSort: (column: keyof User) => void;
}

function ColumnHeader({ label, column, sort, onSort }: ColumnHeaderProps) {
  const isActive = sort.column === column;
  const iconName =
    !isActive || sort.direction === null
      ? 'arrow-up-arrow-down'
      : sort.direction === 'asc'
        ? 'arrow-up'
        : 'arrow-down';

  return (
    <th
      style={{
        padding: 'var(--wa-space-s) var(--wa-space-m)',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        borderBottom: '2px solid var(--wa-color-neutral-20)',
        background: 'var(--wa-color-neutral-5)',
        fontWeight: 'var(--wa-font-weight-semibold)',
        fontSize: 'var(--wa-font-size-s)',
        color: isActive ? 'var(--wa-color-brand-60)' : 'var(--wa-color-neutral-70)',
        userSelect: 'none',
      }}
    >
      <button
        onClick={() => onSort(column)}
        style={{
          all: 'unset',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--wa-space-2xs)',
        }}
        aria-sort={
          isActive && sort.direction
            ? sort.direction === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
      >
        {label}
        <Icon
          name={iconName}
          style={{
            fontSize: '0.75em',
            color: isActive ? 'var(--wa-color-brand-60)' : 'var(--wa-color-neutral-40)',
          }}
        />
      </button>
    </th>
  );
}

export function SortableUsersTable() {
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });

  function handleSort(column: keyof User) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: null };
    });
  }

  const sorted = sortUsers(USERS, sort);

  return (
    <div
      style={{
        borderRadius: 'var(--wa-border-radius-m)',
        border: '1px solid var(--wa-color-neutral-20)',
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'var(--wa-font-size-m)',
          color: 'var(--wa-color-neutral-90)',
        }}
        aria-label="Users"
      >
        <thead>
          <tr>
            <ColumnHeader label="Name" column="name" sort={sort} onSort={handleSort} />
            <ColumnHeader label="Email" column="email" sort={sort} onSort={handleSort} />
            <ColumnHeader label="Role" column="role" sort={sort} onSort={handleSort} />
            <ColumnHeader label="Last Active" column="lastActive" sort={sort} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((user) => (
            <tr
              key={user.email}
              style={{
                borderBottom: '1px solid var(--wa-color-neutral-15)',
                transition: 'background var(--wa-transition-fast)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'var(--wa-color-neutral-5)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              <td
                style={{
                  padding: 'var(--wa-space-s) var(--wa-space-m)',
                  fontWeight: 'var(--wa-font-weight-medium)',
                }}
              >
                {user.name}
              </td>
              <td
                style={{
                  padding: 'var(--wa-space-s) var(--wa-space-m)',
                  color: 'var(--wa-color-neutral-60)',
                  fontSize: 'var(--wa-font-size-s)',
                }}
              >
                {user.email}
              </td>
              <td style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}>
                <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'} pill>
                  {user.role}
                </Badge>
              </td>
              <td
                style={{
                  padding: 'var(--wa-space-s) var(--wa-space-m)',
                  color: 'var(--wa-color-neutral-60)',
                  fontSize: 'var(--wa-font-size-s)',
                }}
              >
                {formatDate(user.lastActive)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
