# Analytics Dashboard Layout

## Layout Diagram

```
+------------------------------------------+
|  header: .wa-split                       |
|  [Analytics]              [Badge: Live]  |
+------------------------------------------+
|  metrics: .wa-grid (4 cards)             |
|  [Total Users] [Revenue] [Conversion]   |
|  [Active Sessions]                       |
+------------------------------------------+
|  content: .wa-grid (2 columns)           |
|  +--chart-area--+--activity-list--+      |
|  |              |  Recent Activity|      |
|  |  Chart       |  - item 1      |      |
|  |  Placeholder |  - item 2      |      |
|  |              |  - item 3      |      |
|  +--------------+-----------------+      |
+------------------------------------------+
```

## Install Missing Components

Both projects already have `Card`, `Icon`, `Badge`, and `Divider` installed. You need `FormatNumber` for the metric values:

```bash
npx kigumi add format-number
```

## React Implementation

```tsx
import { Badge, Card, Divider, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  type: 'currency' | 'decimal' | 'percent';
  currency?: string;
}

const metrics: Metric[] = [
  { label: 'Total Users', value: 24531, icon: 'users', type: 'decimal' },
  {
    label: 'Revenue',
    value: 148200,
    icon: 'dollar-sign',
    type: 'currency',
    currency: 'USD',
  },
  {
    label: 'Conversion',
    value: 0.034,
    icon: 'arrow-trend-up',
    type: 'percent',
  },
  { label: 'Active Sessions', value: 1847, icon: 'signal', type: 'decimal' },
];

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
}

const recentActivity: ActivityItem[] = [
  { id: '1', user: 'Alice', action: 'completed onboarding', time: '2 min ago' },
  { id: '2', user: 'Bob', action: 'upgraded to Pro', time: '5 min ago' },
  { id: '3', user: 'Carol', action: 'exported report', time: '12 min ago' },
  {
    id: '4',
    user: 'Dave',
    action: 'invited 3 team members',
    time: '18 min ago',
  },
  { id: '5', user: 'Eve', action: 'created new project', time: '25 min ago' },
];

export function AnalyticsDashboard() {
  return (
    <div className="wa-stack wa-gap-l" style={{ padding: 'var(--wa-space-l)' }}>
      {/* Header */}
      <header className="wa-split wa-align-items-center">
        <h1 className="wa-heading-xl">Analytics</h1>
        <Badge variant="success">
          <Icon slot="start" name="circle-dot" />
          Live
        </Badge>
      </header>

      <Divider />

      {/* Metric Cards Row */}
      <div
        className="wa-grid"
        style={{ '--min-column-size': '220px' } as React.CSSProperties}
      >
        {metrics.map((m) => (
          <Card key={m.label}>
            <div className="wa-split">
              <div className="wa-stack wa-gap-2xs">
                <span
                  className="wa-body-s"
                  style={{ color: 'var(--wa-color-text-quiet)' }}
                >
                  {m.label}
                </span>
                <strong className="wa-heading-l">
                  <FormatNumber
                    value={m.value}
                    type={m.type}
                    currency={m.type === 'currency' ? m.currency : undefined}
                  />
                </strong>
              </div>
              <Icon
                name={m.icon}
                style={{
                  fontSize: '1.5rem',
                  color: 'var(--wa-color-brand)',
                  flexShrink: 0,
                }}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Two-Column Content: Chart + Activity */}
      <div
        className="wa-grid"
        style={{ '--min-column-size': '350px' } as React.CSSProperties}
      >
        {/* Chart Area */}
        <Card>
          <div className="wa-stack wa-gap-m">
            <div className="wa-split wa-align-items-center">
              <h2 className="wa-heading-m">Revenue Over Time</h2>
              <span
                className="wa-body-s"
                style={{ color: 'var(--wa-color-text-quiet)' }}
              >
                Last 30 days
              </span>
            </div>
            <div
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--wa-border-radius-m)',
                backgroundColor: 'var(--wa-color-surface-lowered)',
                color: 'var(--wa-color-text-quiet)',
              }}
            >
              {/* Replace with your chart library (Recharts, Chart.js, etc.) */}
              <span className="wa-body-m">Chart placeholder</span>
            </div>
          </div>
        </Card>

        {/* Recent Activity List */}
        <Card>
          <div className="wa-stack wa-gap-m">
            <h2 className="wa-heading-m">Recent Activity</h2>
            <ul
              className="wa-list-plain wa-stack wa-gap-0"
              style={{ margin: 0, padding: 0 }}
            >
              {recentActivity.map((item, index) => (
                <li key={item.id}>
                  <div
                    className="wa-split wa-align-items-center"
                    style={{ padding: 'var(--wa-space-s) 0' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="wa-body-m" style={{ margin: 0 }}>
                        <strong>{item.user}</strong> {item.action}
                      </p>
                    </div>
                    <span
                      className="wa-body-xs"
                      style={{
                        color: 'var(--wa-color-text-quiet)',
                        flexShrink: 0,
                        marginLeft: 'var(--wa-space-s)',
                      }}
                    >
                      {item.time}
                    </span>
                  </div>
                  {index < recentActivity.length - 1 && <Divider />}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

## Vue Implementation

```vue
<script setup lang="ts">
import { Badge, Card, Divider, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  type: 'currency' | 'decimal' | 'percent';
  currency?: string;
}

const metrics: Metric[] = [
  { label: 'Total Users', value: 24531, icon: 'users', type: 'decimal' },
  {
    label: 'Revenue',
    value: 148200,
    icon: 'dollar-sign',
    type: 'currency',
    currency: 'USD',
  },
  {
    label: 'Conversion',
    value: 0.034,
    icon: 'arrow-trend-up',
    type: 'percent',
  },
  { label: 'Active Sessions', value: 1847, icon: 'signal', type: 'decimal' },
];

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
}

const recentActivity: ActivityItem[] = [
  { id: '1', user: 'Alice', action: 'completed onboarding', time: '2 min ago' },
  { id: '2', user: 'Bob', action: 'upgraded to Pro', time: '5 min ago' },
  { id: '3', user: 'Carol', action: 'exported report', time: '12 min ago' },
  {
    id: '4',
    user: 'Dave',
    action: 'invited 3 team members',
    time: '18 min ago',
  },
  { id: '5', user: 'Eve', action: 'created new project', time: '25 min ago' },
];
</script>

<template>
  <div class="wa-stack wa-gap-l" style="padding: var(--wa-space-l)">
    <!-- Header -->
    <header class="wa-split wa-align-items-center">
      <h1 class="wa-heading-xl">Analytics</h1>
      <Badge variant="success">
        <Icon slot="start" name="circle-dot" />
        Live
      </Badge>
    </header>

    <Divider />

    <!-- Metric Cards Row -->
    <div class="wa-grid" style="--min-column-size: 220px">
      <Card v-for="m in metrics" :key="m.label">
        <div class="wa-split">
          <div class="wa-stack wa-gap-2xs">
            <span class="wa-body-s" style="color: var(--wa-color-text-quiet)">
              {{ m.label }}
            </span>
            <strong class="wa-heading-l">
              <FormatNumber
                :value="m.value"
                :type="m.type"
                :currency="m.type === 'currency' ? m.currency : undefined"
              />
            </strong>
          </div>
          <Icon
            :name="m.icon"
            style="font-size: 1.5rem; color: var(--wa-color-brand); flex-shrink: 0"
          />
        </div>
      </Card>
    </div>

    <!-- Two-Column Content: Chart + Activity -->
    <div class="wa-grid" style="--min-column-size: 350px">
      <!-- Chart Area -->
      <Card>
        <div class="wa-stack wa-gap-m">
          <div class="wa-split wa-align-items-center">
            <h2 class="wa-heading-m">Revenue Over Time</h2>
            <span class="wa-body-s" style="color: var(--wa-color-text-quiet)">
              Last 30 days
            </span>
          </div>
          <div
            style="
              height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: var(--wa-border-radius-m);
              background-color: var(--wa-color-surface-lowered);
              color: var(--wa-color-text-quiet);
            "
          >
            <!-- Replace with your chart library (Chart.js, ApexCharts, etc.) -->
            <span class="wa-body-m">Chart placeholder</span>
          </div>
        </div>
      </Card>

      <!-- Recent Activity List -->
      <Card>
        <div class="wa-stack wa-gap-m">
          <h2 class="wa-heading-m">Recent Activity</h2>
          <ul
            class="wa-list-plain wa-stack wa-gap-0"
            style="margin: 0; padding: 0"
          >
            <li v-for="(item, index) in recentActivity" :key="item.id">
              <div
                class="wa-split wa-align-items-center"
                style="padding: var(--wa-space-s) 0"
              >
                <div style="flex: 1; min-width: 0">
                  <p class="wa-body-m" style="margin: 0">
                    <strong>{{ item.user }}</strong> {{ item.action }}
                  </p>
                </div>
                <span
                  class="wa-body-xs"
                  style="
                    color: var(--wa-color-text-quiet);
                    flex-shrink: 0;
                    margin-left: var(--wa-space-s);
                  "
                >
                  {{ item.time }}
                </span>
              </div>
              <Divider v-if="index < recentActivity.length - 1" />
            </li>
          </ul>
        </div>
      </Card>
    </div>
  </div>
</template>
```

## Responsive Behavior

All responsiveness is handled by WA layout utilities with zero `@media` queries:

| Viewport             | Metric Cards                  | Chart + Activity             |
| -------------------- | ----------------------------- | ---------------------------- |
| Desktop (>1100px)    | 4 columns side by side        | 2 columns side by side       |
| Tablet (~700-1100px) | 2 columns, wrapping to 2 rows | 2 columns (narrower)         |
| Mobile (<700px)      | 1 column, stacked vertically  | 1 column, stacked vertically |

- **`.wa-grid` with `--min-column-size: 220px`** for metric cards gives 4 columns on wide screens, gracefully wrapping to 2 then 1 as the viewport narrows.
- **`.wa-grid` with `--min-column-size: 350px`** for the chart/activity section keeps them side by side on desktop and stacks them on smaller screens.
- **`.wa-split`** in the header pushes the title and live badge to opposite ends, collapsing naturally.

## Components Used

| Component      | Status            | Purpose                                                |
| -------------- | ----------------- | ------------------------------------------------------ |
| `Card`         | Installed         | Metric cards, chart container, activity list container |
| `Icon`         | Installed         | Metric icons, live indicator                           |
| `Badge`        | Installed         | Live status indicator                                  |
| `Divider`      | Installed         | Section separation, activity list item separators      |
| `FormatNumber` | **Needs install** | Currency, decimal, and percent formatting              |
