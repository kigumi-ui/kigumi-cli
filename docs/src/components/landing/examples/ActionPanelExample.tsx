import { Avatar, Button, Card, Icon } from '@/components/ui';

export function ActionPanelExample() {
  return (
    <Card>
      <div className="wa-flank">
        <Avatar
          image="https://images.unsplash.com/photo-1532202802379-df93d543bac3?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          label="profile-image"
        />
        <div className="wa-split">
          <div className="wa-stack wa-gap-2xs">
            <span className="wa-heading-m">Super Dog</span>
            <div className="wa-caption-s wa-cluster wa-gap-xs">
              <span>Online</span>
              <Icon
                name="circle"
                label="audio-status"
                style={{
                  color: 'var(--wa-color-green)',
                  fontSize: '10px',
                }}
              />
            </div>
          </div>
          <div className="wa-cluster wa-gap-2xs">
            <Button appearance="plain" size="large">
              <Icon name="microphone" label="audio-input" />
            </Button>
            <Button appearance="plain" size="large">
              <Icon name="headphones" label="audio-output" />
            </Button>
            <Button appearance="plain" size="large">
              <Icon name="gear" label="settings" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
