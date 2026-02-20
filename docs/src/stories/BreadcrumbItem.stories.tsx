import type { Meta, StoryObj } from '@storybook/react-vite';
import { BreadcrumbItem, Breadcrumb, Icon } from '@/components/ui';

const meta = {
  title: 'Navigation/BreadcrumbItem',
  component: BreadcrumbItem,
  tags: ['autodocs'],
  argTypes: {
    href: { control: 'text', description: 'URL for the breadcrumb link' },
    target: {
      control: 'select',
      options: ['_blank', '_parent', '_self', '_top'],
    },
    rel: { control: 'text' },
  },
} satisfies Meta<typeof BreadcrumbItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem href="#">Products</BreadcrumbItem>
      <BreadcrumbItem {...args}>Current Page</BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const WithLink: Story = {
  args: { href: '#', target: '_self' },
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem {...args}>Category</BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const ExternalLink: Story = {
  args: {
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Docs</BreadcrumbItem>
      <BreadcrumbItem {...args}>
        External Resource
        <Icon
          name="box-arrow-up-right"
          slot="suffix"
          style={{ fontSize: '0.75em' }}
        />
      </BreadcrumbItem>
    </Breadcrumb>
  ),
};

export const WithIcons: Story = {
  render: () => (
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
  ),
};

export const LongPath: Story = {
  render: () => (
    <Breadcrumb>
      {[
        'Home',
        'Company',
        'Department',
        'Team',
        'Projects',
        'Current Project',
      ].map((item, i, arr) => (
        <BreadcrumbItem key={item} href={i < arr.length - 1 ? '#' : undefined}>
          {item}
        </BreadcrumbItem>
      ))}
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
