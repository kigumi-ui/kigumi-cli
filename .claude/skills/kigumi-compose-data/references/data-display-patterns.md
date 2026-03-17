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
    <div className="wa-grid" style={{ '--min-column-size': '30ch' } as React.CSSProperties}>
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
                  <FormatNumber value={m.value} type={m.type || 'decimal'} currency={m.currency} />
                </span>
                {m.change && (
                  <Badge variant={m.change.trend === 'up' ? 'success' : 'danger'} appearance="filled-outlined" pill>
                    <Icon name={m.change.trend === 'up' ? 'arrow-up' : 'arrow-down'} label={m.change.trend === 'up' ? 'Up' : 'Down'} />
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
<StatsDashboard metrics={[
  { label: 'Total Subscribers', value: 81779, icon: 'user-group', change: { value: 212, trend: 'up' } },
  { label: 'Open Rate', value: 0.6158, type: 'percent', icon: 'envelope-open', change: { value: '4.5%', trend: 'up' } },
  { label: 'Click Rate', value: 0.2574, type: 'percent', icon: 'arrow-pointer', change: { value: '2.1%', trend: 'down' } },
]} />
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
              <FormatNumber :value="m.value" :type="m.type || 'decimal'" :currency="m.currency" />
            </span>
            <Badge
              v-if="m.change"
              :variant="m.change.trend === 'up' ? 'success' : 'danger'"
              appearance="filled-outlined"
              pill
            >
              <Icon :name="m.change.trend === 'up' ? 'arrow-up' : 'arrow-down'" :label="m.change.trend === 'up' ? 'Up' : 'Down'" />
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

const statusVariant = { active: 'success', inactive: 'neutral', pending: 'warning' } as const;

export function UserTable({ users, loading }: { users: User[]; loading?: boolean }) {
  const cellStyle = { padding: 'var(--wa-space-s) var(--wa-space-m)' };
  const headerStyle = { ...cellStyle, borderBottom: '2px solid var(--wa-color-surface-border)', textAlign: 'left' as const };

  if (loading) {
    return (
      <div className="wa-stack wa-gap-s">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} effect="sheen" style={{ height: '48px', width: '100%' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="wa-stack wa-gap-m">
      <div className="wa-split wa-align-items-center">
        <h2>Users ({users.length})</h2>
        <Button variant="brand" size="small"><Icon slot="start" name="plus" />Add User</Button>
      </div>

      <table className="wa-zebra-rows wa-hover-rows" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={headerStyle}>Name</th>
            <th style={headerStyle}>Email</th>
            <th style={headerStyle}>Status</th>
            <th style={headerStyle}>Joined</th>
            <th style={headerStyle}></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid var(--wa-color-surface-border)' }}>
              <td style={cellStyle}>{user.name}</td>
              <td style={cellStyle}>{user.email}</td>
              <td style={cellStyle}><Badge variant={statusVariant[user.status]}>{user.status}</Badge></td>
              <td style={cellStyle}><RelativeTime date={user.createdAt} /></td>
              <td style={cellStyle}>
                <Button variant="neutral" size="small" appearance="plain" aria-label="Edit">
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

---

## C: List View

Cards in a vertical stack with flank layout per item.

**Components:** `npx kigumi add card avatar badge button icon relative-time`

### React

```tsx
import { Avatar, Badge, Button, Card, Icon, RelativeTime } from '@/components/ui';

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
          <div className="wa-flank wa-align-items-center" style={{ '--flank-size': '48px' } as React.CSSProperties}>
            <Avatar image={item.avatar} label={item.name} />
            <div className="wa-split wa-align-items-center" style={{ flex: 1 }}>
              <div className="wa-stack wa-gap-2xs">
                <strong>{item.name}</strong>
                <span style={{ color: 'var(--wa-color-text-quiet)', fontSize: 'var(--wa-font-size-s)' }}>
                  {item.description} &middot; <RelativeTime date={item.updatedAt} />
                </span>
              </div>
              <div className="wa-cluster wa-gap-xs wa-align-items-center">
                <Badge variant={item.status === 'active' ? 'success' : 'neutral'}>{item.status}</Badge>
                <Button variant="neutral" size="small" appearance="plain" aria-label="More actions">
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
        <Button variant="neutral" size="small">Edit</Button>
      </div>

      <div className="wa-grid" style={{ '--min-column-size': '200px', gap: 'var(--wa-space-m)' } as React.CSSProperties}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="wa-stack wa-gap-2xs">
            <small style={{ color: 'var(--wa-color-text-quiet)' }}>{key}</small>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div slot="footer" className="wa-cluster wa-justify-content-end wa-gap-s">
        <Button variant="neutral" size="small">Cancel</Button>
        <Button variant="brand" size="small">Save</Button>
      </div>
    </Card>
  );
}
```

---

## E: Empty State

Placeholder when no data is available.

**Components:** `npx kigumi add card button icon`

### React

```tsx
import { Button, Card, Icon } from '@/components/ui';

export function EmptyState({ title, description, actionLabel, onAction }: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card>
      <div className="wa-stack wa-gap-m wa-align-items-center" style={{ textAlign: 'center', padding: 'var(--wa-space-2xl) var(--wa-space-l)' }}>
        <Icon name="inbox" style={{ fontSize: '3rem', color: 'var(--wa-color-text-quiet)' }} />
        <div className="wa-stack wa-gap-xs">
          <strong style={{ fontSize: 'var(--wa-font-size-l)' }}>{title}</strong>
          <p style={{ color: 'var(--wa-color-text-quiet)' }}>{description}</p>
        </div>
        <Button variant="brand" onClick={onAction}>{actionLabel}</Button>
      </div>
    </Card>
  );
}

// Usage
<EmptyState title="No items yet" description="Create your first item to get started." actionLabel="Create Item" onAction={() => {}} />
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
        <Skeleton key={i} effect="sheen" style={{ height: '48px', width: '100%' }} />
      ))}
    </div>
  );
}

// Card grid loading skeleton
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="wa-grid" style={{ '--min-column-size': '250px' } as React.CSSProperties}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} effect="sheen" style={{ height: '120px', borderRadius: 'var(--wa-border-radius-m)' }} />
      ))}
    </div>
  );
}
```
