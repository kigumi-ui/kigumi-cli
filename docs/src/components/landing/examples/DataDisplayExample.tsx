import React from 'react';
import {
  Badge,
  Button,
  Card,
  Divider,
  Icon,
  ProgressBar,
  ProgressRing,
  Tooltip,
} from '@/components/ui';

export function DataDisplayExample() {
  return (
    <Card style={{ maxWidth: '50ch', margin: 'auto' }}>
      <div slot="header" className="wa-split">
        <h3 className="wa-heading-l">
          <span
            style={
              { color: 'var(--wa-color-text-quiet)' } as React.CSSProperties
            }
          >
            query
          </span>{' '}
          getUser
        </h3>
        <Button appearance="plain" size="small">
          <Icon
            id="go-to-query-button"
            name="chevron-right"
            label="Go to Query"
          />
        </Button>
        <Tooltip for="go-to-query-button">Go to Query</Tooltip>
      </div>
      <div className="wa-stack wa-gap-xl">
        <div className="wa-split wa-align-items-stretch">
          <article className="wa-stack wa-align-items-start wa-gap-xs">
            <h4 className="wa-caption-m">Cache Hit Rate</h4>
            <div className="wa-cluster wa-heading-3xl">
              <ProgressRing
                value={12.3}
                style={
                  {
                    '--size': '1em',
                    '--track-width': '0.125em',
                  } as React.CSSProperties
                }
              />
              <span>12.3%</span>
            </div>
            <Badge appearance="filled-outlined" variant="danger">
              <Icon name="arrow-down" />
              down from 19.6%
            </Badge>
          </article>
          <article className="wa-stack wa-gap-xs wa-align-items-end">
            <h4 className="wa-caption-m">Max CHR</h4>
            <span className="wa-heading-3xl">72.6%</span>
            <Badge appearance="filled-outlined" variant="success">
              <Icon name="sparkles" />
              CHR Impact +5.4%
            </Badge>
          </article>
        </div>
        <Divider />
        <article className="wa-stack wa-gap-xl">
          <div className="wa-stack wa-gap-xs">
            <h4 className="wa-caption-m">Cacheable Bandwidth</h4>
            <div className="wa-split">
              <span className="wa-heading-3xl">90.5 GB</span>
              <span className="wa-caption-l">69.9%</span>
            </div>
            <ProgressBar
              value={30.1}
              label="Cached and non-cacheable bandwidth"
            />
          </div>
          <dl className="wa-stack wa-caption-s">
            <div className="wa-cluster">
              <dt>Cached</dt>
              <dd>12.8 GB (9.8%)</dd>
            </div>
            <div className="wa-cluster">
              <dt>Non-Cacheable</dt>
              <dd>26.3 GB (20.3%)</dd>
            </div>
            <div className="wa-cluster">
              <dt>Total</dt>
              <dd>129.6 GB</dd>
            </div>
          </dl>
        </article>
      </div>
    </Card>
  );
}
