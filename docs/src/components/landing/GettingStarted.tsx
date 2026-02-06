import { Badge, Card, Icon } from '@/components/ui';
import { CopyButton } from '@/components/ui';

const features = [
  {
    icon: 'cubes',
    title: 'Framework-agnostic by design',
    description:
      'Build your UI once. Web Components work in React, Vue, Angular, Svelte, or vanilla JS.',
  },
  {
    icon: 'code-branch',
    title: 'You own the code',
    description:
      'Components are copied to your project. Modify, extend, or remove whatever you need.',
  },
  {
    icon: 'rocket',
    title: 'Production-ready',
    description:
      '50+ components (including Pro-only advanced components) with TypeScript support, accessibility built-in, and 11 themes included.',
  },
];

export function GettingStarted() {
  return (
    <section className="getting-started">
      <div className="wa-stack wa-gap-4xl">
        {/* Quick Start Section */}
        <div className="wa-stack wa-gap-xl">
          <h2 className="wa-heading-2xl">Quick Start</h2>

          {/* Step 1: Initialize */}
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>1</Badge>
              <h3 className="wa-heading-l">Initialize Kigumi</h3>
            </div>
            <p className="wa-caption-m">
              Run the init command above to set up Kigumi in your project.
            </p>
          </div>

          {/* Step 2: Add Components */}
          <div className="wa-stack wa-gap-m">
            <div className="wa-cluster wa-gap-xs wa-align-items-center">
              <Badge pill>2</Badge>
              <h3 className="wa-heading-l">Add Components</h3>
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
              <h3 className="wa-heading-l">Import and Use</h3>
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

            <p className="wa-caption-m">Use components:</p>

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

        {/* Why Kigumi Section */}
        <div className="wa-stack wa-gap-xl">
          <h2 className="wa-heading-2xl">Why Kigumi</h2>

          <div className="features-grid">
            {features.map((feature) => (
              <Card key={feature.title} appearance="outlined">
                <div className="wa-stack wa-gap-m">
                  <Icon
                    name={feature.icon}
                    style={{
                      fontSize: '2rem',
                      color: 'var(--wa-color-brand-600)',
                    }}
                  />
                  <h3 className="wa-heading-m">{feature.title}</h3>
                  <p className="wa-caption-m">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
