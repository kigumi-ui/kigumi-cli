import React from 'react';
import { Badge, Card, Divider, Icon, ProgressRing } from '@/components/ui';

export function DataDisplayExample() {
  return (
    <Card>
      <div slot="header" className="wa-split">
        <h3 className="wa-heading-l">Activity</h3>
      </div>
      <div className="wa-grid wa-grid-cols-2 wa-gap-xl">
        {/* Activity Rings */}
        <div className="wa-split wa-align-items-center">
          <div
            style={{ position: 'relative', width: '150px', height: '150px' }}
          >
            <ProgressRing
              value={65}
              style={
                {
                  position: 'absolute',
                  '--size': '150px',
                  '--track-width': '18px',
                  '--indicator-color': 'var(--wa-color-danger-fill-loud)',
                } as React.CSSProperties
              }
            />
            <ProgressRing
              value={6}
              style={
                {
                  position: 'absolute',
                  '--size': '110px',
                  '--track-width': '18px',
                  '--indicator-color': 'var(--wa-color-success-fill-loud)',
                  left: '20px',
                  top: '20px',
                } as React.CSSProperties
              }
            />
            <ProgressRing
              value={66}
              style={
                {
                  position: 'absolute',
                  '--size': '70px',
                  '--track-width': '18px',
                  '--indicator-color': 'var(--wa-color-brand-fill-loud)',
                  left: '40px',
                  top: '40px',
                } as React.CSSProperties
              }
            />
          </div>
          <div className="wa-stack wa-gap-s">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Icon
                name="running"
                style={{
                  color: 'var(--wa-color-danger-fill-loud)',
                  fontSize: '12px',
                }}
                label="move"
              />
              <div className="wa-stack wa-gap-2xs">
                <span className="wa-heading-s">MOVE 65%</span>
                <span
                  className="wa-caption-s"
                  style={{ color: 'var(--wa-color-danger-fill-loud)' }}
                >
                  338/520 CAL
                </span>
              </div>
            </div>
            <Divider />
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Icon
                name="dumbbell"
                style={{
                  color: 'var(--wa-color-success-fill-loud)',
                  fontSize: '12px',
                }}
                label="exercise"
              />
              <div className="wa-stack wa-gap-2xs">
                <span className="wa-heading-s">EXERCISE 6%</span>
                <span
                  className="wa-caption-s"
                  style={{ color: 'var(--wa-color-success-fill-loud)' }}
                >
                  2/30 MIN
                </span>
              </div>
            </div>
            <Divider />
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Icon
                name="person"
                style={{
                  color: 'var(--wa-color-brand-fill-loud)',
                  fontSize: '12px',
                }}
                label="stand"
              />
              <div className="wa-stack wa-gap-2xs">
                <span className="wa-heading-s">STAND 66%</span>
                <span
                  className="wa-caption-s"
                  style={{ color: 'var(--wa-color-brand-fill-loud)' }}
                >
                  8/12 HR
                </span>
              </div>
            </div>
          </div>
        </div>
        <Divider />
        {/* Additional Stats */}
        <div className="wa-cluster wa-justify-content-space-between">
          <article className="wa-stack wa-align-items-start wa-gap-xs">
            <h4 className="wa-caption-m">Steps</h4>
            <span className="wa-heading-3xl">8,247</span>
            <Badge appearance="filled-outlined" variant="success">
              <Icon name="arrow-up" />
              +12% increase
            </Badge>
          </article>
          <article className="wa-stack wa-gap-xs wa-align-items-start">
            <h4 className="wa-caption-m">Heart Rate</h4>
            <span className="wa-heading-3xl">72 BPM</span>
            <Badge appearance="filled-outlined" variant="neutral">
              <Icon name="heart-pulse" />
              Resting
            </Badge>
          </article>
        </div>
      </div>
    </Card>
  );
}
