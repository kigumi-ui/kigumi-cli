import { Button, Card, Icon } from '@/components/ui';

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
  { label: 'Documentation', href: '#' },
  { label: 'Components', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'Changelog', href: '#' },
  { label: 'License', href: '#' },
];

export function LandingPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--wa-font-sans)',
        backgroundColor: 'var(--wa-color-surface-default)',
        color: 'var(--wa-color-neutral-90)',
      }}
    >
      {/* Hero */}
      <section
        style={{
          backgroundColor: 'var(--wa-color-neutral-95)',
          color: 'var(--wa-color-neutral-0)',
          padding: 'var(--wa-spacing-3xl) var(--wa-spacing-l)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--wa-spacing-l)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--wa-font-size-4xl)',
            fontWeight: 'var(--wa-font-weight-bold)',
            margin: 0,
            lineHeight: 1.15,
            color: 'var(--wa-color-neutral-0)',
          }}
        >
          Build faster with Kigumi
        </h1>
        <p
          style={{
            fontSize: 'var(--wa-font-size-l)',
            margin: 0,
            maxWidth: '560px',
            color: 'var(--wa-color-neutral-40)',
            lineHeight: 1.6,
          }}
        >
          A CLI that scaffolds accessible, framework-agnostic Web Awesome components directly into
          your project. No black box. Your code, your rules.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--wa-spacing-s)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button variant="brand" appearance="filled" size="large" pill href="#">
            Get Started
          </Button>
          <Button appearance="outlined" size="large" pill href="#">
            View on GitHub
          </Button>
        </div>
      </section>

      {/* Features grid */}
      <section
        style={{
          flex: 1,
          padding: 'var(--wa-spacing-3xl) var(--wa-spacing-l)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--wa-spacing-xl)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--wa-font-size-2xl)',
            fontWeight: 'var(--wa-font-weight-semibold)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Why Kigumi?
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--wa-spacing-l)',
            width: '100%',
            maxWidth: '960px',
          }}
        >
          {features.map((feature) => (
            <Card key={feature.title} appearance="outlined">
              <div
                slot="header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--wa-spacing-s)',
                  padding: 'var(--wa-spacing-m)',
                }}
              >
                <Icon
                  name={feature.icon}
                  style={{
                    fontSize: 'var(--wa-font-size-xl)',
                    color: 'var(--wa-color-brand-60)',
                  }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontWeight: 'var(--wa-font-weight-semibold)',
                    fontSize: 'var(--wa-font-size-m)',
                  }}
                >
                  {feature.title}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  padding: 'var(--wa-spacing-m)',
                  paddingTop: 0,
                  fontSize: 'var(--wa-font-size-s)',
                  color: 'var(--wa-color-neutral-60)',
                  lineHeight: 1.6,
                }}
              >
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--wa-color-neutral-20)',
          padding: 'var(--wa-spacing-l)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--wa-spacing-m)',
        }}
      >
        <nav
          aria-label="Footer navigation"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'var(--wa-spacing-m)',
          }}
        >
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: 'var(--wa-font-size-s)',
                color: 'var(--wa-color-neutral-60)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p
          style={{
            margin: 0,
            fontSize: 'var(--wa-font-size-xs)',
            color: 'var(--wa-color-neutral-40)',
          }}
        >
          &copy; {new Date().getFullYear()} Kigumi. MIT License.
        </p>
      </footer>
    </div>
  );
}
