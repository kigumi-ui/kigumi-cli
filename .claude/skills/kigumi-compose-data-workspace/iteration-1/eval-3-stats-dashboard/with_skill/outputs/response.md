# Eval 3: Stats Dashboard with Metric Cards

## Install Dependencies

```bash
npx kigumi add card avatar badge icon format-number
```

## Implementation

A stats dashboard with 4 metric cards: Total Revenue, Active Users, Conversion Rate, and Average Order Value. Each card displays a formatted value, a trend badge, and an icon. Uses the WA grid layout for responsive columns and `FormatNumber` for locale-aware formatting.

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
```

## Usage

```tsx
const dashboardMetrics: Metric[] = [
  {
    label: 'Total Revenue',
    value: 284350.75,
    type: 'currency',
    currency: 'USD',
    icon: 'currency-dollar',
    change: { value: '12.5%', trend: 'up' },
  },
  {
    label: 'Active Users',
    value: 14832,
    type: 'decimal',
    icon: 'users',
    change: { value: 842, trend: 'up' },
  },
  {
    label: 'Conversion Rate',
    value: 0.0342,
    type: 'percent',
    icon: 'chart-line',
    change: { value: '0.8%', trend: 'down' },
  },
  {
    label: 'Average Order Value',
    value: 67.43,
    type: 'currency',
    currency: 'USD',
    icon: 'shopping-cart',
    change: { value: '$4.20', trend: 'up' },
  },
];

<StatsDashboard metrics={dashboardMetrics} />;
```

## How FormatNumber Handles Each Metric

| Metric              | Props                            | Rendered Output |
| ------------------- | -------------------------------- | --------------- |
| Total Revenue       | `type="currency" currency="USD"` | $284,350.75     |
| Active Users        | `type="decimal"`                 | 14,832          |
| Conversion Rate     | `type="percent"`                 | 3%              |
| Average Order Value | `type="currency" currency="USD"` | $67.43          |

For the Conversion Rate, if you need more precision (e.g., "3.42%"), add `minimum-fraction-digits` and `maximum-fraction-digits`:

```tsx
<FormatNumber
  value={0.0342}
  type="percent"
  minimum-fraction-digits={2}
  maximum-fraction-digits={2}
/>
```

This renders "3.42%" instead of "3%".

## Key Points

- **`FormatNumber`** handles all three value types: currency (`$284,350.75`), decimal with grouping (`14,832`), and percent (`3.42%`). All formatting is locale-aware.
- **`wa-grid`** with `--min-column-size: 30ch` creates a responsive grid that automatically wraps to fewer columns on smaller viewports. No media queries needed.
- **`wa-flank`** positions the icon avatar to the left of the metric content in a consistent layout.
- **`wa-heading-xl`** and **`wa-caption-s`** are WA typography utility classes for the large value and small label, keeping font sizing consistent with the design system.
- **`Badge`** with `appearance="filled-outlined"` and `pill` creates a compact trend indicator. Variant is `success` for upward trends and `danger` for downward trends.
- **`Avatar`** with `shape="rounded"` and a slotted `Icon` creates a styled icon container without needing a user image.
- The `Metric` interface is generic enough to add more cards later without changing the component.
