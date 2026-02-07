import { Button, Card, Divider, Icon } from '@/components/ui';

export function CommentsExample() {
  return (
    <Card>
      <div slot="header" className="wa-split">
        <h3 className="wa-heading-l">Transactions</h3>
        <Button appearance="plain" size="small">
          View All
        </Button>
      </div>
      <div className="wa-stack wa-gap-m">
        {/* Today */}
        <div className="wa-stack wa-gap-xs">
          <h4
            className="wa-caption-m"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          >
            Today
          </h4>
          <div className="wa-split">
            <div className="wa-cluster wa-gap-s">
              <Icon name="water" />
              <div className="wa-stack wa-gap-2xs">
                <span className="wa-heading-s">Water Bill</span>
                <span
                  className="wa-caption-s"
                  style={{ color: 'var(--wa-color-neutral-60)' }}
                >
                  Unsuccessfully
                </span>
              </div>
            </div>
            <span
              className="wa-heading-m"
              style={{ color: 'var(--wa-color-danger)' }}
            >
              - 140 €
            </span>
          </div>
        </div>

        <Divider />

        {/* Tomorrow */}
        <div className="wa-stack wa-gap-xs">
          <h4
            className="wa-caption-m"
            style={{ color: 'var(--wa-color-neutral-60)' }}
          >
            Tomorrow
          </h4>
          <div className="wa-stack wa-gap-s">
            <div className="wa-split">
              <div className="wa-cluster wa-gap-s">
                <Icon name="coins" />
                <div className="wa-stack wa-gap-2xs">
                  <span className="wa-heading-s">Income: Salary</span>
                  <span
                    className="wa-caption-s"
                    style={{ color: 'var(--wa-color-neutral-60)' }}
                  >
                    Successfully
                  </span>
                </div>
              </div>
              <span
                className="wa-heading-m"
                style={{ color: 'var(--wa-color-success)' }}
              >
                + 1450 €
              </span>
            </div>

            <div className="wa-split">
              <div className="wa-cluster wa-gap-s">
                <Icon name="bolt" style={{ color: 'white' }} />
                <div className="wa-stack wa-gap-2xs">
                  <span className="wa-heading-s">Electric Bill</span>
                  <span
                    className="wa-caption-s"
                    style={{ color: 'var(--wa-color-neutral-60)' }}
                  >
                    Successfully
                  </span>
                </div>
              </div>
              <span
                className="wa-heading-m"
                style={{ color: 'var(--wa-color-danger)' }}
              >
                - 78 €
              </span>
            </div>

            <div className="wa-split">
              <div className="wa-cluster wa-gap-s">
                <Icon name="receipt" style={{ color: 'white' }} />
                <div className="wa-stack wa-gap-2xs">
                  <span className="wa-heading-s">Income: Jane transfers</span>
                  <span
                    className="wa-caption-s"
                    style={{ color: 'var(--wa-color-neutral-60)' }}
                  >
                    Successfully
                  </span>
                </div>
              </div>
              <span
                className="wa-heading-m"
                style={{ color: 'var(--wa-color-success)' }}
              >
                + 800 €
              </span>
            </div>

            <div className="wa-split">
              <div className="wa-cluster wa-gap-s">
                <Icon name="receipt" style={{ color: 'white' }} />
                <div className="wa-stack wa-gap-2xs">
                  <span className="wa-heading-s">Income: Jane transfers</span>
                  <span
                    className="wa-caption-s"
                    style={{ color: 'var(--wa-color-neutral-60)' }}
                  >
                    Successfully
                  </span>
                </div>
              </div>
              <span
                className="wa-heading-m"
                style={{ color: 'var(--wa-color-success)' }}
              >
                + 4242 €
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
