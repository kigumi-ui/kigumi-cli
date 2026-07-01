import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Callout } from '@/components/ui/Callout/Callout';
import { Card } from '@/components/ui/Card/Card';
import { Divider } from '@/components/ui/Divider/Divider';
import { RelativeTime } from '@/components/ui/RelativeTime/RelativeTime';

export function ActivityLogExample() {
  return (
    <Card>
      <div slot="header" className="wa-split">
        <div className="wa-cluster wa-gap-2xs">
          <span>Network activities</span>
          <Badge appearance="filled" variant="brand" pill>
            3
          </Badge>
        </div>
      </div>
      <div className="wa-stack">
        <article>
          <div className="wa-flank wa-align-items-start">
            <Avatar
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="profile image"
            />
            <div className="wa-stack wa-gap-2xs">
              <div className="wa-split">
                <span>
                  <strong>Marcus Chen</strong> posted a new article{' '}
                  <a href="#">
                    5 Design Principles Every Developer Should Know
                  </a>
                </span>
              </div>
              <div className="wa-split">
                <span className="wa-caption-s">Today 9:24AM</span>
                <RelativeTime
                  className="wa-caption-s"
                  date="2025-02-07T09:24:00-04:00"
                />
              </div>
              <Callout variant="neutral">
                After 10 years in the industry, these principles transformed how
                I approach UI development. #WebDesign #DeveloperTips
              </Callout>
            </div>
          </div>
          <Divider />
        </article>
        <article>
          <div className="wa-flank wa-align-items-start">
            <Avatar
              image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="profile image"
            />
            <div className="wa-stack wa-gap-2xs">
              <div className="wa-split">
                <span>
                  <strong>Sarah Mitchell</strong> started a new position as
                  Senior Product Designer at <a href="#">TechFlow Inc.</a>
                </span>
              </div>
              <div className="wa-split">
                <span className="wa-caption-s">Yesterday 2:15PM</span>
                <RelativeTime
                  className="wa-caption-s"
                  date="2025-02-06T14:15:00-04:00"
                />
              </div>
            </div>
          </div>
          <Divider />
        </article>
        <article>
          <div className="wa-flank wa-align-items-start">
            <Avatar
              image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2787&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="Profile image"
            />
            <div className="wa-stack wa-gap-2xs">
              <div className="wa-split">
                <span>
                  <strong>David Rodriguez</strong> wants to connect
                </span>
              </div>
              <div className="wa-split">
                <span className="wa-caption-s">Yesterday 4:37PM</span>
                <RelativeTime
                  className="wa-caption-s"
                  date="2025-02-06T16:37:00-04:00"
                />
              </div>
              <div className="wa-cluster wa-gap-xs">
                <Button appearance="outlined" size="small">
                  Ignore
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
