import { Card, Icon } from '@/components/ui';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: 'globe',
    title: 'Framework-Agnostic',
    description:
      'Same components for React, Vue, and more. Built on Web Components that work everywhere.',
  },
  {
    icon: 'universal-access',
    title: 'Accessible by Default',
    description:
      'WCAG 2.1 AA built into every component. Keyboard navigation, screen readers, focus management.',
  },
  {
    icon: 'terminal',
    title: 'CLI-Powered',
    description:
      'Add components individually via CLI. No monolithic installs — full control over your code.',
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
            A design system toolkit that stays out of your way
          </p>
        </div>
        <div className="feature-cards__grid">
          {features.map((feature) => (
            <Card key={feature.title} appearance="outlined">
              <div className="wa-stack wa-gap-s">
                <Icon
                  name={feature.icon}
                  style={{ fontSize: 'var(--wa-font-size-xl)' }}
                />
                <h3 className="wa-heading-m">{feature.title}</h3>
                <p className="wa-caption-s wa-color-text-quiet">
                  {feature.description}
                  {feature.title === 'Fully Themeable' && (
                    <>
                      {' '}
                      <Link to="/kigumi-studio" className="wa-text-link">
                        Open Kigumi Studio
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
