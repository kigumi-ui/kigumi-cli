import { Card } from '@/components/ui/Card/Card';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Icon } from '@/components/ui/Icon/Icon';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';
import { DropdownItem } from '@/components/ui/DropdownItem/DropdownItem';
import { Button } from '@/components/ui/Button/Button';

export function OrderManagementExample() {
  return (
    <Card appearance="outlined">
      <div className="wa-flank:end wa-align-items-center">
        <div className="wa-cluster wa-gap-xs wa-align-items-center">
          <Avatar
            shape="rounded"
            style={{
              backgroundColor: 'var(--wa-color-yellow-60)',
              color: 'var(--wa-color-yellow-95)',
            }}
          >
            <Icon name="pancakes" />
          </Avatar>
          <div className="wa-stack wa-gap-2xs">
            <h3 className="wa-heading-s" style={{ margin: 0 }}>
              Second Breakfast
            </h3>
            <p
              className="wa-caption-s"
              style={{ color: 'var(--wa-color-neutral-60)', margin: 0 }}
            >
              19 items
            </p>
          </div>
        </div>

        <Dropdown placement="bottom-end">
          <Button slot="trigger" appearance="plain" size="small">
            <Icon name="ellipsis-vertical" />
          </Button>
          <DropdownItem>
            <Icon name="share-nodes" />
            Share with Bilbo
          </DropdownItem>
          <DropdownItem>
            <Icon name="clock" />
            Wait until elevensies
          </DropdownItem>
          <DropdownItem>
            <Icon name="trash" />
            Cancel order
          </DropdownItem>
        </Dropdown>
      </div>
    </Card>
  );
}
