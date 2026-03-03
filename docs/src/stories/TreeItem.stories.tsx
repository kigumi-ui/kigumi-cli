import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TreeItem, Tree, Icon } from '@/components/ui';

/** Tree items are used inside trees to represent hierarchical items */
const meta = {
  title: 'Components/Tree Item',
  component: TreeItem,
  tags: ['autodocs'],
  argTypes: {
    expanded: {
      control: 'boolean',
      description: 'Expands the item',
      table: { defaultValue: { summary: 'false' } },
    },
    selected: {
      control: 'boolean',
      description: 'Selects the item',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the item',
      table: { defaultValue: { summary: 'false' } },
    },
    lazy: {
      control: 'boolean',
      description: 'Enables lazy loading',
      table: { defaultValue: { summary: 'false' } },
    },
    onExpand: {
      action: 'expand',
      description: 'Emitted when the tree item expands.',
      table: { category: 'Events' },
    },
    onAfterExpand: {
      action: 'after-expand',
      description:
        'Emitted after the tree item expands and all animations are complete.',
      table: { category: 'Events' },
    },
    onCollapse: {
      action: 'collapse',
      description: 'Emitted when the tree item collapses.',
      table: { category: 'Events' },
    },
    onAfterCollapse: {
      action: 'after-collapse',
      description:
        'Emitted after the tree item collapses and all animations are complete.',
      table: { category: 'Events' },
    },
    onLazyChange: {
      action: 'lazy-change',
      description: "Emitted when the tree item's lazy state changes.",
      table: { category: 'Events' },
    },
    onLazyLoad: {
      action: 'lazy-load',
      description:
        'Emitted when a lazy item is selected. Use this event to asynchronously load data and append items to the tree before expanding. After appending new items, remove the `lazy` attribute to remove the loading state and update the tree.',
      table: { category: 'Events' },
    },
  },
  args: {
    onExpand: fn(),
    onAfterExpand: fn(),
    onCollapse: fn(),
    onAfterCollapse: fn(),
    onLazyChange: fn(),
    onLazyLoad: fn(),
  },
} satisfies Meta<typeof TreeItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A parent tree item with three child items. */
export const Default: Story = {
  render: (args) => (
    <Tree>
      <TreeItem {...args}>
        Parent Item
        <TreeItem>Child 1</TreeItem>
        <TreeItem>Child 2</TreeItem>
        <TreeItem>Child 3</TreeItem>
      </TreeItem>
    </Tree>
  ),
};

/** The item starts in the expanded state showing all children. */
export const Expanded: Story = {
  args: { expanded: true },
  render: (args) => (
    <Tree>
      <TreeItem {...args}>
        Expanded by default
        <TreeItem>Child 1</TreeItem>
        <TreeItem>Child 2</TreeItem>
      </TreeItem>
    </Tree>
  ),
};

/** One item in the tree is pre-selected. */
export const Selected: Story = {
  args: { selected: true },
  render: (args) => (
    <Tree>
      <TreeItem>Item 1</TreeItem>
      <TreeItem {...args}>Selected Item</TreeItem>
      <TreeItem>Item 3</TreeItem>
    </Tree>
  ),
};

/** Some items are disabled and cannot be interacted with. */
export const Disabled: Story = {
  render: () => (
    <Tree>
      <TreeItem>Enabled Item</TreeItem>
      <TreeItem disabled>Disabled Item</TreeItem>
      <TreeItem>
        Parent (enabled)
        <TreeItem disabled>Disabled Child</TreeItem>
        <TreeItem>Enabled Child</TreeItem>
      </TreeItem>
    </Tree>
  ),
};

/** Custom folder/file icons in the expand-icon and prefix slots. */
export const WithIcons: Story = {
  args: { expanded: true },
  render: (args) => (
    <Tree>
      <TreeItem {...args}>
        <Icon name="folder" slot="expand-icon" />
        <Icon name="folder-open" slot="collapse-icon" />
        Documents
        <TreeItem>
          <Icon name="file-earmark" slot="prefix" />
          Resume.pdf
        </TreeItem>
        <TreeItem>
          <Icon name="file-earmark-image" slot="prefix" />
          Photo.jpg
        </TreeItem>
        <TreeItem>
          <Icon name="folder" slot="expand-icon" />
          <Icon name="folder-open" slot="collapse-icon" />
          Projects
          <TreeItem>
            <Icon name="file-earmark-code" slot="prefix" /> index.html
          </TreeItem>
          <TreeItem>
            <Icon name="file-earmark-code" slot="prefix" /> styles.css
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </Tree>
  ),
};

/** Three levels of nesting showing deep tree structures. */
export const Nested: Story = {
  render: () => (
    <Tree selection="multiple">
      <TreeItem expanded>
        Level 1
        <TreeItem expanded>
          Level 2<TreeItem>Level 3 Leaf A</TreeItem>
          <TreeItem>Level 3 Leaf B</TreeItem>
        </TreeItem>
        <TreeItem>Level 2 Leaf</TreeItem>
      </TreeItem>
    </Tree>
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
      <Tree style={{ maxWidth: '300px' }}>
        <TreeItem expanded>
          Parent
          <TreeItem>Child 1</TreeItem>
          <TreeItem selected>Child 2 (selected)</TreeItem>
          <TreeItem disabled>Child 3 (disabled)</TreeItem>
        </TreeItem>
        <TreeItem>
          <Icon name="folder" slot="expand-icon" />
          <Icon name="folder-open" slot="collapse-icon" />
          With Icons
          <TreeItem>
            <Icon name="file-earmark" slot="expand-icon" />
            file.txt
          </TreeItem>
        </TreeItem>
      </Tree>
    </div>
  ),
};
