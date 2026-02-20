import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb, BreadcrumbItem, Icon } from '@/components/ui';

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Accessibility label',
      table: { defaultValue: { summary: 'Breadcrumb' } },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

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
