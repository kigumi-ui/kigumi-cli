import { Badge, Card, Divider, Icon } from '@/components/ui';

const metrics = [
  {
    label: 'Total Users',
    value: '124,532',
    change: '+12%',
    trend: 'up',
    icon: 'users',
  },
  {
    label: 'Revenue',
    value: '$48,295',
    change: '+8.3%',
    trend: 'up',
    icon: 'circle-dollar',
  },
  {
    label: 'Conversion',
    value: '3.24%',
    change: '-0.4%',
    trend: 'down',
    icon: 'chart-line',
  },
  {
    label: 'Active Sessions',
    value: '2,847',
    change: '+21%',
    trend: 'up',
    icon: 'wave-pulse',
  },
];

const recentActivity = [
  { user: 'Alice Martin', action: 'Signed up', time: '2 min ago' },
  { user: 'Bob Chen', action: 'Made a purchase', time: '8 min ago' },
  { user: 'Carol Davis', action: 'Submitted feedback', time: '15 min ago' },
  { user: 'Dan Okafor', action: 'Upgraded plan', time: '32 min ago' },
  { user: 'Eva Rossi', action: 'Signed up', time: '1 hr ago' },
];

export function AnalyticsDashboard() {
  return (
    <div
      className="wa-stack wa-gap-l"
      style={{ padding: 'var(--wa-space-l)', maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header */}
      <header className="wa-cluster wa-justify-content-space-between wa-align-items-center">
        <h1 className="wa-heading-l" style={{ margin: 0 }}>
          Analytics
        </h1>
        <Badge variant="neutral" appearance="filled-outlined">
          Last 30 days
        </Badge>
      </header>

      <Divider />

      {/* Metric Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--wa-space-m)',
        }}
      >
        {metrics.map((metric) => (
          <Card key={metric.label} appearance="outlined">
            <div className="wa-stack wa-gap-s" style={{ padding: 'var(--wa-space-m)' }}>
              <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
                <span
                  className="wa-label-s"
                  style={{ color: 'var(--wa-color-neutral-60)', textTransform: 'uppercase' }}
                >
                  {metric.label}
                </span>
                <Icon
                  name={metric.icon}
                  style={{ color: 'var(--wa-color-neutral-50)', fontSize: '1rem' }}
                />
              </div>

              <span className="wa-heading-l">{metric.value}</span>

              <div className="wa-cluster wa-gap-2xs wa-align-items-center">
                <Icon
                  name={metric.trend === 'up' ? 'arrow-trend-up' : 'arrow-trend-down'}
                  style={{
                    color:
                      metric.trend === 'up'
                        ? 'var(--wa-color-success-60)'
                        : 'var(--wa-color-danger-60)',
                    fontSize: '0.875rem',
                  }}
                />
                <span
                  className="wa-caption-s"
                  style={{
                    color:
                      metric.trend === 'up'
                        ? 'var(--wa-color-success-60)'
                        : 'var(--wa-color-danger-60)',
                  }}
                >
                  {metric.change} vs last month
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Two-Column Grid: Chart Area + Recent Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--wa-space-m)',
          alignItems: 'start',
        }}
      >
        {/* Chart Area */}
        <Card appearance="outlined">
          <div className="wa-stack wa-gap-m" style={{ padding: 'var(--wa-space-m)' }}>
            <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
              <h2 className="wa-heading-s" style={{ margin: 0 }}>
                Traffic Overview
              </h2>
              <Badge variant="brand" appearance="filled" pill>
                Live
              </Badge>
            </div>

            <Divider />

            {/* Chart placeholder */}
            <div
              style={{
                height: '240px',
                background: 'var(--wa-color-neutral-10)',
                borderRadius: 'var(--wa-border-radius-m)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 'var(--wa-space-s)',
                color: 'var(--wa-color-neutral-50)',
              }}
            >
              <Icon name="chart-area" style={{ fontSize: '2.5rem' }} />
              <span className="wa-caption-s">Chart renders here</span>
            </div>
          </div>
        </Card>

        {/* Recent Activity List */}
        <Card appearance="outlined">
          <div className="wa-stack wa-gap-m" style={{ padding: 'var(--wa-space-m)' }}>
            <h2 className="wa-heading-s" style={{ margin: 0 }}>
              Recent Activity
            </h2>

            <Divider />

            <ul className="wa-stack wa-gap-xs" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {recentActivity.map((item, index) => (
                <li key={index}>
                  <div className="wa-cluster wa-justify-content-space-between wa-align-items-center">
                    <div className="wa-cluster wa-gap-s wa-align-items-center">
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--wa-color-brand-20)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          name="user"
                          style={{ fontSize: '0.875rem', color: 'var(--wa-color-brand-60)' }}
                        />
                      </div>
                      <div className="wa-stack" style={{ gap: '2px' }}>
                        <span className="wa-body-s" style={{ fontWeight: 600 }}>
                          {item.user}
                        </span>
                        <span className="wa-caption-s" style={{ color: 'var(--wa-color-neutral-60)' }}>
                          {item.action}
                        </span>
                      </div>
                    </div>
                    <span className="wa-caption-s" style={{ color: 'var(--wa-color-neutral-50)' }}>
                      {item.time}
                    </span>
                  </div>
                  {index < recentActivity.length - 1 && (
                    <Divider style={{ marginTop: 'var(--wa-space-xs)' }} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
