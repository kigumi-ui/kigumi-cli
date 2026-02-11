import { Badge, Card } from '@/components/ui';
import { CopyButton } from '@/components/ui';

export function GettingStarted() {
  return (
    <section className="getting-started">
      <div className="wa-stack wa-gap-4xl">
        {/* Quick Start Section */}
        <div className="wa-stack wa-gap-xl">
          <h2 className="wa-heading-2xl" id="getting-started">
            Getting started
          </h2>

          {/* Step 1: Initialize */}
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>1</Badge>
              <h3 className="wa-heading-l">Initialize Kigumi</h3>
            </div>
            <p className="wa-caption-m">
              Run the <code>init</code> command to set up Kigumi in your
              project. During that process you can add your Web Awesome Pro
              token and choose your framework (Currently React and Vue).
            </p>
            <Card appearance="outlined" style={{ '--spacing': '0' }}>
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
                  <CopyButton value="npx kigumi add button input" />
                </span>
              </div>
            </Card>

            <h4 className="wa-heading-m wa-cluster wa-gap-xs wa-align-items-center">
              Working with AI?
            </h4>
            <p className="wa-caption-m">
              Install the Kigumi skills to easily convert Web Awesome code to
              your framework, to customize themes and much more.
            </p>
            <pre>
              <code>npx skills add https://kigumi.style/skills/kigumi</code>
            </pre>
          </div>

          {/* Step 2: Add Components */}
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>2</Badge>
              <h3 className="wa-heading-l">Add components</h3>
            </div>
            <Card appearance="outlined" style={{ '--spacing': '0' }}>
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

          {/* Step 3: Import & Use */}
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>3</Badge>
              <h3 className="wa-heading-l">Import and use</h3>
            </div>

            <p className="wa-caption-m">
              Import in your entry file (e.g. <code>src/main.tsx</code>):
            </p>

            <Card appearance="outlined" style={{ '--spacing': '0' }}>
              <div
                className="wa-flank:end wa-align-items-center wa-gap-xs"
                style={{ position: 'relative' }}
              >
                <pre>
                  <code>import '@/lib/webawesome';</code>
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
                  <CopyButton value="import '@/lib/webawesome';" />
                </span>
              </div>
            </Card>
          </div>

          {/* Step 4: Build your UI */}
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>4</Badge>
              <h3 className="wa-heading-l">Build your UI</h3>
            </div>

            <p className="wa-caption-m">Use components in your code:</p>
            <Card appearance="outlined" style={{ '--spacing': '0' }}>
              <div
                className="wa-flank:end wa-align-items-start wa-gap-xs"
                style={{ position: 'relative' }}
              >
                <pre>
                  <code>{`import { Button, Input } from '@/components/ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log('Email:', email);
    }}>
      <Input
        type="email"
        label="Email"
        value={email}
        onInput={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="brand">
        Sign In
      </Button>
    </form>
  );
}`}</code>
                </pre>
                <span
                  style={{
                    position: 'absolute',
                    right: 'var(--wa-space-xs)',
                    top: 'var(--wa-space-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CopyButton
                    value={`import { Button, Input } from '@/components/ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      console.log('Email:', email);
    }}>
      <Input
        type="email"
        label="Email"
        value={email}
        onInput={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="brand">
        Sign In
      </Button>
    </form>
  );
}`}
                  />
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
