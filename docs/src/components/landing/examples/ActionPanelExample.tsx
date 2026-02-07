import { Avatar, Button, Card, Icon, ProgressBar } from '@/components/ui';

export function ActionPanelExample() {
  return (
    <Card>
      <div className="wa-stack wa-gap-xs">
        {/* Song Info */}
        <div className="wa-cluster wa-gap-s wa-justify-content-space-between">
          <div className="wa-cluster wa-gap-s">
            <Avatar
              image="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              label="album-cover"
            />
            <div className="wa-stack wa-gap-2xs">
              <span className="wa-heading-s">Awesome Theme</span>
              <span
                className="wa-caption-s"
                style={{ color: 'var(--wa-color-neutral-60)' }}
              >
                Kigumi
              </span>
            </div>
          </div>
          <span>
            <Button appearance="plain" size="small">
              <Icon name="heart" label="like" />
            </Button>
            <Button appearance="plain" size="small">
              <Icon name="ellipsis" label="like" />
            </Button>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="wa-stack wa-gap-2xs">
          <ProgressBar value={15} style={{ width: '100%' }} />
          <div className="wa-split">
            <span
              className="wa-caption-s"
              style={{ color: 'var(--wa-color-neutral-60)' }}
            >
              0:15
            </span>
            <span
              className="wa-caption-s"
              style={{ color: 'var(--wa-color-neutral-60)' }}
            >
              3:53
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div
          className="wa-cluster wa-gap-xs"
          style={{ justifyContent: 'center' }}
        >
          <Button appearance="plain" size="small">
            <Icon name="shuffle" label="shuffle" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="backward-step" label="previous" />
          </Button>
          <Button variant="brand" size="medium" style={{ borderRadius: '50%' }}>
            <Icon name="play" label="play" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="forward-step" label="next" />
          </Button>
          <Button appearance="plain" size="small">
            <Icon name="repeat" label="repeat" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
