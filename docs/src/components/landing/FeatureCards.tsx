import { Card, Icon } from '@/components/ui';

const features = [
  {
    icon: 'globe',
    title: 'Framework-Agnostic',
    description:
      'Same components for React, Vue, and more. Built on Web Components that work everywhere.',
  },
  {
    icon: 'terminal',
    title: 'CLI-Powered',
    description:
      'Add components, change themes, work with other registries, and much more via the CLI.',
  },
  {
    icon: 'universal-access',
    title: 'Accessible by Default',
    description:
      'WCAG 2.1 AA built into every component. Keyboard navigation, screen readers, focus management.',
  },
  {
    icon: 'palette',
    title: 'Fully Themeable',
    description:
      'Customize colors, spacing, typography, and radii with CSS custom properties.',
  },
] as const;

export function FeatureCards() {
  return (
    <section className="feature-cards section">
      <div className="wa-stack wa-gap-xl">
        <div className="wa-stack wa-gap-xs">
          <h2 className="wa-heading-2xl">Why Kigumi</h2>
          <p className="wa-color-text-quiet">
            Everything you need for modern design systems, projects and
            products.
          </p>
        </div>
        <div className="feature-cards__grid">
          {features.map((feature) => (
            <Card key={feature.title} appearance="outlined">
              <div className="wa-stack wa-gap-s">
                <div className="wa-cluster wa-gap-s wa-align-items-center">
                  <Icon
                    name={feature.icon}
                    style={{ fontSize: 'var(--wa-font-size-xl)' }}
                  />
                  <h3 className="wa-heading-m">{feature.title}</h3>
                </div>
                <p className="wa-caption-m">{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
