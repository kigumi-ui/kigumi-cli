import type { Meta, StoryObj } from '@storybook/react-vite';
import { BreadcrumbItem, Breadcrumb, Icon } from '@/components/ui';

/** Breadcrumb Items are used inside breadcrumbs to represent different links */
const meta = {
  title: 'Components/Breadcrumb Item',
  component: BreadcrumbItem,
  tags: ['autodocs'],
  argTypes: {
    href: {
      control: 'text',
      description: 'Optional URL to direct the user to when activated',
    },
    target: {
      control: 'select',
      options: ['_blank', '_parent', '_self', '_top'],
      description: 'Tells the browser where to open the link',
    },
    rel: {
      control: 'text',
      description: 'The rel attribute to use on the link',
      table: { defaultValue: { summary: 'noreferrer noopener' } },
    },
  },
} satisfies Meta<typeof BreadcrumbItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single breadcrumb item without a link (current page). */
export const Default: Story = {
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem href="#">Products</BreadcrumbItem>
      <BreadcrumbItem {...args}>Current Page</BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Renders the item as a clickable anchor when given an href. */
export const WithLink: Story = {
  args: { href: '#', target: '_self' },
  render: (args) => (
    <Breadcrumb>
      <BreadcrumbItem href="#">Home</BreadcrumbItem>
      <BreadcrumbItem {...args}>Category</BreadcrumbItem>
    </Breadcrumb>
  ),
};

/** Shows an item linking to an external URL, opening in a new tab. */
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

/** Adds prefix and suffix icons to a breadcrumb item. */
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

/** Demonstrates wrapping behavior with many nested segments. */
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

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
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
