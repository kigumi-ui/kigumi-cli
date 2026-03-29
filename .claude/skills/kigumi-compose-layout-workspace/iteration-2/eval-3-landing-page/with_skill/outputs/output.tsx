import { Button, Card, Divider, Icon } from '@/components/ui';

const features = [
  {
    icon: 'bolt',
    title: 'Fast by Default',
    description:
      'Zero-config setup with optimized builds out of the box. Go from idea to production in minutes, not hours.',
  },
  {
    icon: 'shield-halved',
    title: 'Accessible Components',
    description:
      'Every component ships with WCAG 2.1 AA compliance built in. Accessibility is a feature, not an afterthought.',
  },
  {
    icon: 'palette',
    title: 'Fully Themeable',
    description:
      'Design tokens via CSS custom properties let you match any brand. Override at the root and watch every component respond.',
  },
];

const footerLinks = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Components', href: '/components' },
  { label: 'GitHub', href: '/github' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'License', href: '/license' },
];

export function LandingPage() {
  return (
    <div className="wa-stack wa-gap-0">
      {/* Hero -- .wa-dark inverts all --wa-color-* tokens in this section */}
      <section
        className="wa-dark"
        style={{
          padding: 'var(--wa-space-4xl) var(--wa-space-l)',
          background: 'var(--wa-color-surface-default)',
        }}
      >
        <div
          className="wa-stack wa-gap-m wa-align-items-center"
          style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}
        >
          <h1
            className="wa-heading-2xl"
            style={{ color: 'var(--wa-color-text-normal)' }}
          >
            Build faster with Kigumi
          </h1>
          <p
            className="wa-body-l"
            style={{ color: 'var(--wa-color-text-quiet)' }}
          >
            A CLI that scaffolds accessible, framework-agnostic Web Awesome
            components directly into your project. No black box. Your code, your
            rules.
          </p>
          <div className="wa-cluster wa-gap-s wa-justify-content-center">
            <Button variant="brand" size="large">
              Get Started
            </Button>
            <Button variant="neutral" size="large" appearance="outlined">
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Features -- .wa-grid auto-wraps to fewer columns on narrow screens */}
      <section
        className="wa-stack wa-gap-l"
        style={{ padding: 'var(--wa-space-2xl) var(--wa-space-l)' }}
      >
        <h2 className="wa-heading-xl" style={{ textAlign: 'center' }}>
          Why Kigumi?
        </h2>
        <div
          className="wa-grid"
          style={{ '--min-column-size': '280px' } as React.CSSProperties}
        >
          {features.map((f) => (
            <Card key={f.icon}>
              <div
                className="wa-stack wa-gap-s wa-align-items-center"
                style={{ textAlign: 'center', padding: 'var(--wa-space-m)' }}
              >
                <Icon
                  name={f.icon}
                  style={{ fontSize: '2rem', color: 'var(--wa-color-brand)' }}
                />
                <strong className="wa-heading-s">{f.title}</strong>
                <p
                  className="wa-body-m"
                  style={{ color: 'var(--wa-color-text-quiet)', margin: 0 }}
                >
                  {f.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Divider />
      <footer
        className="wa-split wa-align-items-center"
        style={{ padding: 'var(--wa-space-m) var(--wa-space-l)' }}
        aria-label="Site footer"
      >
        <small style={{ color: 'var(--wa-color-text-quiet)' }}>
          &copy; {new Date().getFullYear()} Kigumi. MIT License.
        </small>
        <nav aria-label="Footer navigation">
          <div className="wa-cluster wa-gap-m">
            {footerLinks.map((link) => (
              <a key={link.label} href={link.href} className="wa-link">
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      </footer>
    </div>
  );
}
