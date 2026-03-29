import { Card, Badge } from '@/components/ui';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  const badgeVariant =
    changeType === 'positive' ? 'success' : changeType === 'negative' ? 'danger' : 'neutral';

  return (
    <Card appearance="outlined" style={{ flex: '1 1 220px', minWidth: '200px' }}>
      <div className="wa-stack wa-gap-s" style={{ padding: 'var(--wa-space-m)' }}>
        <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
          <span
            className="wa-caption-m"
            style={{ color: 'var(--wa-color-neutral-60)', fontWeight: 500 }}
          >
            {title}
          </span>
          <wa-icon name={icon} style={{ fontSize: '1.25rem', color: 'var(--wa-color-neutral-50)' }} />
        </div>

        <div
          className="wa-heading-l"
          style={{ fontWeight: 700, color: 'var(--wa-color-neutral-90)' }}
        >
          {value}
        </div>

        <div className="wa-cluster wa-align-items-center wa-gap-xs">
          <Badge variant={badgeVariant} appearance="filled" pill>
            {change}
          </Badge>
          <span className="wa-caption-s" style={{ color: 'var(--wa-color-neutral-50)' }}>
            vs last month
          </span>
        </div>
      </div>
    </Card>
  );
}

export function StatsDashboard() {
  const metrics: MetricCardProps[] = [
    {
      title: 'Total Revenue',
      value: '$48,295',
      change: '+12.5%',
      changeType: 'positive',
      icon: 'chart-line',
    },
    {
      title: 'Active Users',
      value: '3,842',
      change: '+8.1%',
      changeType: 'positive',
      icon: 'users',
    },
    {
      title: 'Conversion Rate',
      value: '4.6%',
      change: '-0.3%',
      changeType: 'negative',
      icon: 'arrow-trend-up',
    },
    {
      title: 'Avg. Order Value',
      value: '$126.40',
      change: '+2.7%',
      changeType: 'positive',
      icon: 'bag-shopping',
    },
  ];

  return (
    <div className="wa-stack wa-gap-l" style={{ padding: 'var(--wa-space-xl)' }}>
      <div className="wa-stack wa-gap-2xs">
        <h1 className="wa-heading-xl" style={{ margin: 0 }}>
          Dashboard
        </h1>
        <p
          className="wa-body-m"
          style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
        >
          Overview of key metrics for this month.
        </p>
      </div>

      <div
        className="wa-cluster wa-gap-m wa-align-items-stretch"
        style={{ flexWrap: 'wrap' }}
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>
    </div>
  );
}
