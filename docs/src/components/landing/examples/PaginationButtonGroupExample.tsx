import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Icon } from '@/components/ui/Icon/Icon';

export function PaginationButtonGroupExample() {
  const tasks = [
    { title: 'Review designs for project Catalyst', attachments: 1 },
    { title: 'Clean up icon tech debt', date: 'Jun 20' },
    { title: 'Refactor component library', date: 'Jun 24' },
  ];

  return (
    <Card>
      <div className="wa-stack wa-gap-m" slot="header">
        <div className="wa-split">
          <h3 className="wa-heading-m">In progress</h3>
          <div className="wa-cluster wa-gap-xs">
            <Button appearance="plain" size="small">
              <Icon name="ellipsis" />
            </Button>
          </div>
        </div>

        <div className="wa-stack wa-gap-s">
          {tasks.map((task, index) => (
            <Card key={index}>
              <div className="wa-stack wa-gap-xs">
                <span className="wa-caption-m">{task.title}</span>
                <div className="wa-cluster wa-gap-xs">
                  {task.attachments && (
                    <div className="wa-grid wa-gap-xs">
                      <div className="wa-cluster wa-gap-2xs wa-align-items-center">
                        <Icon
                          name="paperclip"
                          style={{
                            fontSize: '14px',
                            color: 'var(--wa-color-neutral-60)',
                          }}
                        />
                        <span
                          className="wa-caption-s"
                          style={{ color: 'var(--wa-color-neutral-60)' }}
                        >
                          {task.attachments}
                        </span>
                      </div>
                      <Badge>Design</Badge>
                    </div>
                  )}
                  {task.date && (
                    <div className="wa-cluster wa-gap-2xs wa-align-items-center">
                      <Icon
                        name="clock"
                        style={{
                          fontSize: '14px',
                          color: 'var(--wa-color-neutral-60)',
                        }}
                      />
                      <span
                        className="wa-caption-s"
                        style={{ color: 'var(--wa-color-neutral-60)' }}
                      >
                        {task.date}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <div>
            <Button appearance="plain" size="small">
              <Icon name="plus" slot="start" />
              Add a card
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
