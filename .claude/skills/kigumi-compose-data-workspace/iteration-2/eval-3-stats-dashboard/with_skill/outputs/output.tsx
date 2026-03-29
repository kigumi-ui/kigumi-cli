// Install: npx kigumi add card avatar badge icon format-number

import { Avatar, Badge, Card, FormatNumber, Icon } from '@/components/ui';

interface Metric {
  label: string;
  value: number;
  icon: string;
  change?: { value: number | string; trend: 'up' | 'down' };
  type?: 'currency' | 'decimal' | 'percent';
  currency?: string;
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card>
      <div className="wa-flank wa-align-items-start">
        <Avatar shape="rounded">
          <Icon slot="icon" name={metric.icon} />
        </Avatar>
        <div className="wa-stack wa-gap-2xs">
          <h3 className="wa-caption-s">{metric.label}</h3>
          <div className="wa-cluster wa-gap-xs">
            <span className="wa-heading-xl">
              <FormatNumber
                value={metric.value}
                type={metric.type || 'decimal'}
                currency={metric.currency}
              />
            </span>
            {metric.change && (
              <Badge
                variant={metric.change.trend === 'up' ? 'success' : 'danger'}
                appearance="filled-outlined"
                pill
              >
                <Icon
                  name={metric.change.trend === 'up' ? 'arrow-up' : 'arrow-down'}
                  label={metric.change.trend === 'up' ? 'Up' : 'Down'}
                />
                {metric.change.value}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

const metrics: Metric[] = [
  {
    label: 'Total Revenue',
    value: 284530.75,
    type: 'currency',
    currency: 'USD',
    icon: 'dollar-sign',
    change: { value: '12.5%', trend: 'up' },
  },
  {
    label: 'Active Users',
    value: 14832,
    icon: 'users',
    change: { value: '8.2%', trend: 'up' },
  },
  {
    label: 'Conversion Rate',
    value: 0.0342,
    type: 'percent',
    icon: 'chart-line',
    change: { value: '1.1%', trend: 'down' },
  },
  {
    label: 'Average Order Value',
    value: 68.42,
    type: 'currency',
    currency: 'USD',
    icon: 'receipt',
    change: { value: '3.7%', trend: 'up' },
  },
];

export default function StatsDashboard() {
  return (
    <div
      className="wa-grid"
      style={{ '--min-column-size': '30ch' } as React.CSSProperties}
    >
      {metrics.map((m) => (
        <MetricCard key={m.label} metric={m} />
      ))}
    </div>
  );
}
