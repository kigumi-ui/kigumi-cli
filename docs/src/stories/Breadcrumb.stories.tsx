import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb, BreadcrumbItem, Icon } from '@/components/ui';

/** Breadcrumbs provide a group of links so users can easily navigate a website hierarchy */
const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'The label to use for the breadcrumb control for assistive devices',
    },
    'slot:separator': {
      control: false,
      description:
        'The separator to use between breadcrumb items. Works best with `<wa-icon>`.',
      table: { category: 'Slots' },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Shows a standard three-level breadcrumb trail. */
export const Default: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem href="#">Products</BreadcrumbItem>
      <BreadcrumbItem href="#">Components</BreadcrumbItem>
      <BreadcrumbItem>Breadcrumb</BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Adds icons to breadcrumb items for a richer visual hierarchy. */
export const WithIcons: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbItem href="#">
        <Icon slot="prefix" name="house" />
        Home
      </BreadcrumbItem>
      <BreadcrumbItem href="#">
        <Icon slot="prefix" name="folder" />
        Projects
      </BreadcrumbItem>
      <BreadcrumbItem>
        <Icon slot="prefix" name="file" />
        Report.pdf
      </BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Replaces the default separator with a custom character or element. */
export const CustomSeparator: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <Icon slot="separator" name="chevron-right" />
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem href="#">Library</BreadcrumbItem>
      <BreadcrumbItem>Data</BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Demonstrates breadcrumb items that link to external URLs. */
export const WithExternalLinks: Story = {
  render: (args) => (
    <Breadcrumb {...args}>
      <BreadcrumbItem href="#" target="_blank">
        External Home
      </BreadcrumbItem>
      <BreadcrumbItem href="#">Docs</BreadcrumbItem>
      <BreadcrumbItem>Current Page</BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  // tags: ['!dev', '!autodocs'],
  parameters: { chromatic: { pauseAnimationAtEnd: true } },
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
      }}
    >
      <Breadcrumb>
        <BreadcrumbItem href="#">Home</BreadcrumbItem>
        <BreadcrumbItem href="#">Products</BreadcrumbItem>
        <BreadcrumbItem>Current Page</BreadcrumbItem>
      </Breadcrumb>
      <Breadcrumb>
        <BreadcrumbItem href="#">
          <Icon name="house" slot="prefix" />
          Home
        </BreadcrumbItem>
        <BreadcrumbItem href="#">
          <Icon name="folder" slot="prefix" />
          Projects
        </BreadcrumbItem>
        <BreadcrumbItem>
          <Icon name="file-earmark-code" slot="prefix" />
          index.tsx
        </BreadcrumbItem>
      </Breadcrumb>
    </div>
  ),
};
