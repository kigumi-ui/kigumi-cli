import { Badge, Card, Icon, Scroller, Tag } from '@/components/ui';
import './RoadmapBoard.css';

type Status = 'exploring' | 'planned' | 'in-progress' | 'shipped';
type Category = 'cli' | 'components' | 'frameworks' | 'docs' | 'tooling';

interface RoadmapItem {
  title: string;
  description?: string;
  category: Category;
}

const categoryConfig: Record<
  Category,
  {
    label: string;
    variant: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  }
> = {
  cli: { label: 'CLI', variant: 'brand' },
  components: { label: 'Components', variant: 'success' },
  frameworks: { label: 'Frameworks', variant: 'warning' },
  docs: { label: 'Docs', variant: 'neutral' },
  tooling: { label: 'Tooling', variant: 'danger' },
};

const columns: { status: Status; label: string; icon: string }[] = [
  { status: 'exploring', label: 'Exploring', icon: 'lightbulb' },
  { status: 'planned', label: 'Planned', icon: 'map' },
  { status: 'in-progress', label: 'In Progress', icon: 'hammer' },
  { status: 'shipped', label: 'Shipped', icon: 'check-circle' },
];

const items: Record<Status, RoadmapItem[]> = {
  exploring: [
    {
      title: 'Svelte framework support',
      description: 'Generate Svelte wrapper components with proper bindings.',
      category: 'frameworks',
    },
    {
      title: 'Angular framework support',
      description: 'Generate Angular wrapper components with proper bindings.',
      category: 'frameworks',
    },
    {
      title: 'Component playground',
      description:
        'Interactive playground for trying components in the browser.',
      category: 'docs',
    },
  ],
  planned: [
    {
      title: 'Visual component composition',
      description:
        'Pre-built page patterns like login forms and data explorers that wire together components with layout, state, and a11y.',
      category: 'components',
    },
    {
      title: 'Accessibility auditing',
      description:
        'Audit components for ARIA gaps, contrast violations, and keyboard navigation — with theme-aware fix suggestions.',
      category: 'tooling',
    },
    {
      title: 'Live theme preview server',
      description:
        'Local gallery of all installed components with live theme, palette, and brand switching plus side-by-side comparison.',
      category: 'tooling',
    },
    {
      title: 'Scoped component variants',
      description:
        'Create named variants like IconButton or DangerButton with default props, styles, and automatic update propagation.',
      category: 'components',
    },
    {
      title: 'Framework migration',
      description:
        'Move a project from React to Vue (or future Svelte/Angular) preserving all config and customizations.',
      category: 'frameworks',
    },
    {
      title: 'Design token management',
      description:
        'Import and export tokens from Figma or Style Dictionary. Framework-agnostic CSS custom properties, not locked to Tailwind.',
      category: 'tooling',
    },
    {
      title: 'Component dependency graph',
      description:
        'Visualize dependencies and answer "what breaks if I remove Dialog?" with integrated impact analysis.',
      category: 'cli',
    },
    {
      title: 'Component test runner',
      description:
        'Dedicated runner for generated test files with visual regression testing built in.',
      category: 'tooling',
    },
    {
      title: 'AI page scaffolding',
      description:
        'Describe a page in natural language, generate it using only installed components with active theming and tier awareness.',
      category: 'cli',
    },
  ],
  'in-progress': [
    {
      title: 'Kigumi Studio',
      description: 'Visual theme editor for customizing design tokens.',
      category: 'tooling',
    },
    {
      title: 'Documentation site',
      description: 'Comprehensive Storybook-based docs with examples.',
      category: 'docs',
    },
  ],
  shipped: [
    {
      title: 'Smart component updates',
      description:
        'Three-way merge that preserves your edits when templates update. Never lose local changes again.',
      category: 'cli',
    },
    {
      title: 'React framework support',
      description: 'Full React wrapper generation with TypeScript support.',
      category: 'frameworks',
    },
    {
      title: 'Vue framework support',
      description: 'Vue wrapper generation with generic prop/slot forwarding.',
      category: 'frameworks',
    },
    {
      title: 'Community registries',
      description: 'Install components from community-maintained registries.',
      category: 'cli',
    },
    {
      title: 'Theme presets',
      description: 'Ship with multiple theme, palette, and brand presets.',
      category: 'components',
    },
    {
      title: 'CSS layer architecture',
      description: 'Predictable cascade via @layer ordering.',
      category: 'components',
    },
  ],
};

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const cat = categoryConfig[item.category];
  return (
    <Card appearance="outlined" className="roadmap-card">
      <div className="wa-stack wa-gap-xs">
        <span className="wa-heading-s" style={{ margin: 0 }}>
          {item.title}
        </span>
        {item.description && (
          <span
            className="wa-body-s"
            style={{ color: 'var(--wa-color-text-subtle)' }}
          >
            {item.description}
          </span>
        )}
        <div>
          <Tag size="small" variant={cat.variant} appearance="filled">
            {cat.label}
          </Tag>
        </div>
      </div>
    </Card>
  );
}

export function RoadmapBoard() {
  return (
    <div className="roadmap">
      <div className="wa-stack wa-gap-s wa-border-radius-m">
        <h1 className="wa-heading-2xl">Roadmap</h1>
        <p
          className="wa-body-l"
          style={{ color: 'var(--wa-color-text-subtle)', margin: 0 }}
        >
          A high-level overview of what we're working on and what's next for
          Kigumi. Items may shift between columns as priorities evolve.
        </p>
      </div>

      <Scroller
        orientation="vertical"
        className="roadmap-scroller wa-border-radius-l"
      >
        <div className="roadmap-board">
          {columns.map((col) => {
            const colItems = items[col.status];
            return (
              <div key={col.status} className="roadmap-column">
                <div className="roadmap-column-header">
                  <div className="wa-cluster wa-gap-xs wa-align-items-center">
                    <Icon
                      name={col.icon}
                      style={{ fontSize: 'var(--wa-font-size-body-l)' }}
                    />
                    <span className="wa-heading-m">{col.label}</span>
                  </div>
                  <Badge variant="neutral" appearance="filled" pill>
                    {colItems.length}
                  </Badge>
                </div>
                <div className="wa-stack wa-gap-s">
                  {colItems.map((item) => (
                    <RoadmapCard key={item.title} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Scroller>
    </div>
  );
}
