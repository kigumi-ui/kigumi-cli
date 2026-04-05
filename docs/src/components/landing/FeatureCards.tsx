import { Card, Icon } from '@/components/ui';

const features = [
  {
    icon: 'globe',
    title: 'Framework-Agnostic',
    description:
      'Build your design system once. Use it in React, Vue, and Angular without maintaining separate libraries.',
    url: 'https://docs.kigumi.style/?path=/docs/general-getting-started--docs',
  },
  {
    icon: 'terminal',
    title: 'CLI-Driven',
    description:
      'Add components, switch themes, and keep everything up to date from the terminal.',
    url: '',
  },
  {
    icon: 'robot',
    title: 'AI-Powered',
    description:
      'Skills that teach AI agents to build with your actual components instead of generic code.',
  },
  {
    icon: 'code',
    title: 'Highly Customizable',
    description:
      'Your code, in your repo. Change anything you want and keep those changes through upgrades.',
  },
  {
    icon: 'universal-access',
    title: 'Accessible for Everyone',
    description:
      'Every component ships WCAG 2.1 AA compliant with keyboard and focus management built in.',
  },
  {
    icon: 'palette',
    title: 'Fully Themeable',
    description:
      'Match your brand with themes, palettes, and colors. Customize with CSS custom properties or design your own in Studio.',
  },
  {
    icon: 'share-nodes',
    title: 'Spead your work',
    description:
      'Easily share your components and themes through registries, within your org or with the community.',
  },
  {
    icon: 'bolt',
    title: 'Start in minutes',
    description:
      'Starter templates for every supported framework so you can focus on building, not configuring.',
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
              <div
                className="wa-cluster wa-gap-s wa-align-items-center"
                slot="header"
              >
                <Icon
                  name={feature.icon}
                  style={{ fontSize: 'var(--wa-font-size-l)' }}
                />
                <h3 className="wa-heading-l">{feature.title}</h3>
              </div>
              {feature.description}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
