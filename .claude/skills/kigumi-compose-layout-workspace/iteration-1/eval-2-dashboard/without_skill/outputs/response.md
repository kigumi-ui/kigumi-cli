# Analytics Dashboard Layout

## Prerequisites

Install the required Kigumi components:

```bash
npx kigumi add card icon badge divider
```

## Component Code

### `DashboardLayout.tsx`

```tsx
import { Badge, Card, Divider, Icon } from '@/components/ui';

const metrics = [
  {
    label: 'Total Users',
    value: '24,521',
    change: '+12.5%',
    trend: 'up',
    icon: 'users',
  },
  {
    label: 'Revenue',
    value: '$48,290',
    change: '+8.2%',
    trend: 'up',
    icon: 'dollar-sign',
  },
  {
    label: 'Conversion',
    value: '3.6%',
    change: '-0.4%',
    trend: 'down',
    icon: 'chart-line',
  },
  {
    label: 'Active Sessions',
    value: '1,429',
    change: '+24.1%',
    trend: 'up',
    icon: 'signal',
  },
];

const recentActivity = [
  { user: 'Sarah Chen', action: 'Completed onboarding', time: '2 min ago' },
  { user: 'Marcus Johnson', action: 'Upgraded to Pro', time: '15 min ago' },
  {
    user: 'Aiko Tanaka',
    action: 'Submitted support ticket',
    time: '32 min ago',
  },
  { user: 'David Park', action: 'Exported monthly report', time: '1 hr ago' },
  { user: 'Elena Rossi', action: 'Added 3 team members', time: '2 hr ago' },
];

export function DashboardLayout() {
  return (
    <div className="wa-stack wa-gap-l" style={{ padding: 'var(--wa-space-l)' }}>
      {/* Page header */}
      <header className="wa-split wa-align-items-center">
        <h1 className="wa-heading-l" style={{ margin: 0 }}>
          Analytics
        </h1>
        <Badge variant="success" pill>
          Live
        </Badge>
      </header>

      <Divider />

      {/* Metric cards row */}
      <div
        className="wa-grid"
        style={{ '--min-item-size': '220px' } as React.CSSProperties}
      >
        {metrics.map((metric) => (
          <Card key={metric.label} appearance="outlined">
            <div
              className="wa-stack wa-gap-xs"
              style={{ padding: 'var(--wa-space-m)' }}
            >
              <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
                <span
                  className="wa-caption-m"
                  style={{ color: 'var(--wa-color-neutral-60)' }}
                >
                  {metric.label}
                </span>
                <Icon
                  name={metric.icon}
                  style={{ color: 'var(--wa-color-neutral-50)' }}
                />
              </div>
              <span className="wa-heading-l">{metric.value}</span>
              <span
                className="wa-caption-s"
                style={{
                  color:
                    metric.trend === 'up'
                      ? 'var(--wa-color-success-50)'
                      : 'var(--wa-color-danger-50)',
                }}
              >
                <Icon
                  name={metric.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                  style={{
                    fontSize: '0.75em',
                    marginRight: 'var(--wa-space-3xs)',
                  }}
                />
                {metric.change} from last month
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Two-column content area */}
      <div
        className="wa-grid"
        style={{ '--min-item-size': '360px' } as React.CSSProperties}
      >
        {/* Chart area */}
        <Card appearance="outlined">
          <div
            slot="header"
            className="wa-cluster wa-justify-content-space-between wa-align-items-center"
            style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
          >
            <span className="wa-label-m">Revenue Over Time</span>
            <Badge variant="neutral" appearance="outlined" pill>
              Last 30 days
            </Badge>
          </div>
          <div
            style={{
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--wa-space-m)',
              color: 'var(--wa-color-neutral-50)',
            }}
          >
            <div className="wa-stack wa-align-items-center wa-gap-s">
              <Icon name="chart-mixed" style={{ fontSize: '2rem' }} />
              <span className="wa-body-s">Chart component renders here</span>
            </div>
          </div>
        </Card>

        {/* Recent activity list */}
        <Card appearance="outlined">
          <div
            slot="header"
            style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
          >
            <span className="wa-label-m">Recent Activity</span>
          </div>
          <div className="wa-stack wa-gap-none">
            {recentActivity.map((item, index) => (
              <div key={item.user}>
                <div
                  className="wa-cluster wa-justify-content-space-between wa-align-items-center"
                  style={{ padding: 'var(--wa-space-s) var(--wa-space-m)' }}
                >
                  <div className="wa-stack wa-gap-3xs">
                    <span className="wa-label-s">{item.user}</span>
                    <span
                      className="wa-caption-s"
                      style={{ color: 'var(--wa-color-neutral-60)' }}
                    >
                      {item.action}
                    </span>
                  </div>
                  <span
                    className="wa-caption-s"
                    style={{
                      color: 'var(--wa-color-neutral-50)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.time}
                  </span>
                </div>
                {index < recentActivity.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### `DashboardLayout.css`

No custom CSS is needed. The layout uses Web Awesome's built-in utility classes:

- `.wa-stack` with `.wa-gap-l` for the page-level vertical flow
- `.wa-grid` with `--min-item-size: 220px` for the responsive 4-column metric cards
- `.wa-grid` with `--min-item-size: 360px` for the two-column content area
- `.wa-cluster` for horizontal alignment (header row, metric label + icon)
- `.wa-split` for the page header with space-between alignment

## Layout Structure

```
wa-stack (vertical page flow)
 +-- header (wa-split) ...................... page title + live badge
 +-- Divider
 +-- wa-grid (min 220px) ................... 4 metric cards
 |    +-- Card: Total Users
 |    +-- Card: Revenue
 |    +-- Card: Conversion
 |    +-- Card: Active Sessions
 +-- wa-grid (min 360px) ................... 2-column content
      +-- Card: Revenue Over Time (chart)
      +-- Card: Recent Activity (list)
```

## How It Works

**Metric cards** use `.wa-grid` which auto-fills columns based on `--min-item-size`. At 220px minimum, four cards fit side-by-side on desktop, then wrap to 2x2 or stacked on smaller screens.

**Two-column content** uses the same `.wa-grid` with a 360px minimum, giving a side-by-side layout on desktop that collapses to stacked on tablet/mobile.

**Card slots**: The chart and activity cards use `slot="header"` to render a styled header section via Web Awesome's card component.

**Responsive by default**: No media queries needed. The `.wa-grid` utility handles breakpoint-free responsive layout through CSS `auto-fill` and `minmax()`.
