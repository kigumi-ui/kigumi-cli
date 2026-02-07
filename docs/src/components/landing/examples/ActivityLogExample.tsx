import React from 'react';
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  Divider,
  Icon,
  RelativeTime,
} from '@/components/ui';

export function ActivityLogExample() {
  return (
    <Card
      {...{ 'with-header': true }}
      style={{ maxWidth: '54ch', margin: '0 auto' }}
    >
      <div slot="header" className="wa-split">
        <div>
          <span>Notifications</span>
          <Badge appearance="filled" variant="success" pill>
            2
          </Badge>
        </div>
        <Icon name="close" />
      </div>
      <div className="wa-stack">
        <article>
          <div className="wa-flank wa-align-items-start">
            <Avatar
              image="https://images.unsplash.com/photo-1614807547811-4174d3582092?q=80&w=2932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="profile image"
            />
            <div className="wa-stack wa-gap-2xs">
              <div className="wa-split">
                <span>
                  <strong>Happy</strong> commented in{' '}
                  <a href="#">Reporting Dashboard</a>
                </span>
                <Icon
                  name="circle"
                  style={
                    { color: 'var(--wa-color-green)' } as React.CSSProperties
                  }
                />
              </div>
              <div className="wa-split">
                <span className="wa-caption-s">Friday 3:12PM</span>
                <RelativeTime
                  className="wa-caption-s"
                  date="2025-02-15T09:17:00-04:00"
                />
              </div>
              <Callout variant="neutral">
                Really love this approach. I think this is the best solution for
                the sync issue.
              </Callout>
            </div>
          </div>
          <Divider />
        </article>
        <article>
          <div className="wa-flank wa-align-items-start">
            <Avatar
              image="https://images.unsplash.com/photo-1613428800237-c86372070fab?q=80&w=3017&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="profile image"
            />
            <div className="wa-stack wa-gap-2xs">
              <div className="wa-split">
                <span>
                  <strong>Charlotte</strong> followed you
                </span>
                <Icon
                  name="circle"
                  style={
                    { color: 'var(--wa-color-green)' } as React.CSSProperties
                  }
                />
              </div>
              <div className="wa-split">
                <span className="wa-caption-s">Friday 3:04PM</span>
                <RelativeTime
                  className="wa-caption-s"
                  date="2025-02-15T09:17:00-04:00"
                />
              </div>
            </div>
          </div>
          <Divider />
        </article>
        <article>
          <div className="wa-flank wa-align-items-start">
            <Avatar
              image="https://images.unsplash.com/photo-1645288059073-af3e9eb62a29?q=80&w=2936&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="Profile image"
            />
            <div className="wa-stack wa-gap-2xs">
              <div className="wa-split">
                <span>
                  <strong>Tavitian</strong> invited you to{' '}
                  <a href="#">Homepage Redesign</a>
                </span>
              </div>
              <div className="wa-split">
                <span className="wa-caption-s">Friday 2:22PM</span>
                <RelativeTime
                  className="wa-caption-s"
                  date="2025-02-15T09:17:00-04:00"
                />
              </div>
              <div className="wa-cluster wa-gap-xs">
                <Button appearance="outlined" size="small">
                  Decline
                </Button>
                <Button variant="brand" size="small">
                  Accept
                </Button>
              </div>
            </div>
          </div>
          <Divider />
        </article>
      </div>
    </Card>
  );
}
