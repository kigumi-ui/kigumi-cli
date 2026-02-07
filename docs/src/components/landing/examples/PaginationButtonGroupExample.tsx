import { Button, ButtonGroup, Card, Divider, Icon } from '@/components/ui';

export function PaginationButtonGroupExample() {
  return (
    <Card>
      <div className="wa-stack">
        <div className="wa-placeholder" />
        <Divider />
        <div className="wa-split">
          <span className="wa-caption-m">Showing 1 to 10 of 50 Results</span>
          <ButtonGroup orientation="horizontal">
            <Button appearance="outlined">
              <Icon name="chevron-left" />
            </Button>
            <Button appearance="accent" variant="brand">
              1
            </Button>
            <Button appearance="outlined">2</Button>
            <Button appearance="outlined">3</Button>
            <Button appearance="outlined" disabled>
              ...
            </Button>
            <Button appearance="outlined">10</Button>
            <Button appearance="outlined">
              <Icon name="chevron-right" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </Card>
  );
}
