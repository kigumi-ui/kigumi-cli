import { Badge, Button, Card, CopyButton, Icon } from '@/components/ui';

export function GettingStartedLanding() {
  return (
    <section
      className="getting-started section"
      aria-labelledby="getting-started"
    >
      <div className="wa-stack wa-gap-xl">
        <div className="wa-stack wa-gap-xs">
          <h2 className="wa-heading-2xl" id="getting-started">
            Getting started
          </h2>
          <p className="wa-color-text-quiet">
            Two commands to go from zero to components
          </p>
        </div>

        <div className="wa-stack wa-gap-xl">
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>1</Badge>
              <h3 className="wa-heading-l">Initialize your project</h3>
            </div>
            <Card
              appearance="outlined"
              style={
                {
                  '--spacing': '0',
                  '--wa-panel-border-radius': 'var(--wa-border-radius-m)',
                } as React.CSSProperties
              }
            >
              <div
                className="wa-flank:end wa-align-items-center wa-gap-xs"
                style={{ position: 'relative' }}
              >
                <pre>
                  <code>
                    <span
                      style={{
                        opacity: 0.6,
                        pointerEvents: 'none',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 'inherit',
                        zIndex: 1,
                        userSelect: 'none',
                      }}
                      aria-hidden="true"
                    >
                      ${' '}
                    </span>
                    <span
                      style={{
                        paddingLeft: 'var(--wa-space-m)',
                        display: 'inline-block',
                      }}
                    >
                      npx kigumi init
                    </span>
                  </code>
                </pre>
                <span
                  style={{
                    position: 'absolute',
                    right: 'var(--wa-space-xs)',
                    top: '0',
                    bottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CopyButton value="npx kigumi init" />
                </span>
              </div>
            </Card>
          </div>

          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>2</Badge>
              <h3 className="wa-heading-l">Add components</h3>
            </div>
            <Card
              appearance="outlined"
              style={
                {
                  '--spacing': '0',
                  '--wa-panel-border-radius': 'var(--wa-border-radius-m)',
                } as React.CSSProperties
              }
            >
              <div
                className="wa-flank:end wa-align-items-center wa-gap-xs"
                style={{ position: 'relative' }}
              >
                <pre>
                  <code>
                    <span
                      style={{
                        opacity: 0.6,
                        pointerEvents: 'none',
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 'inherit',
                        zIndex: 1,
                        userSelect: 'none',
                      }}
                      aria-hidden="true"
                    >
                      ${' '}
                    </span>
                    <span
                      style={{
                        paddingLeft: 'var(--wa-space-m)',
                        display: 'inline-block',
                      }}
                    >
                      npx kigumi add button input
                    </span>
                  </code>
                </pre>
                <span
                  style={{
                    position: 'absolute',
                    right: 'var(--wa-space-xs)',
                    top: '0',
                    bottom: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CopyButton value="npx kigumi add button input" />
                </span>
              </div>
            </Card>
          </div>
        </div>

        <Button
          variant="brand"
          appearance="outlined"
          size="medium"
          href={
            import.meta.env.DEV
              ? 'http://localhost:6006/?path=/docs/general-getting-started--docs'
              : 'https://docs.kigumi.style/?path=/docs/general-getting-started--docs'
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the full guide
          <Icon name="arrow-up-right-from-square" slot="suffix" />
        </Button>
      </div>
    </section>
  );
}
