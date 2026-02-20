import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tree, TreeItem, Icon } from '@/components/ui';

const meta = {
  title: 'Navigation/Tree',
  component: Tree,
  tags: ['autodocs'],
  argTypes: {
    selection: {
      control: 'select',
      options: ['single', 'multiple', 'leaf'],
      table: { defaultValue: { summary: 'single' } },
    },
    onSelectionChange: { action: 'selection-change' },
  },
  args: { onSelectionChange: fn() },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tree {...args}>
      <TreeItem>
        <Icon name="folder" /> Documents
        <TreeItem>
          <Icon name="folder" /> Projects
          <TreeItem>
            <Icon name="file" /> report.pdf
          </TreeItem>
          <TreeItem>
            <Icon name="file" /> design.fig
          </TreeItem>
        </TreeItem>
        <TreeItem>
          <Icon name="file" /> notes.txt
        </TreeItem>
      </TreeItem>
      <TreeItem>
        <Icon name="folder" /> Downloads
        <TreeItem>
          <Icon name="file" /> archive.zip
        </TreeItem>
      </TreeItem>
      <TreeItem>
        <Icon name="folder" /> Pictures
      </TreeItem>
    </Tree>
  ),
};

export const MultipleSelection: Story = {
  args: { selection: 'multiple' },
  render: (args) => (
    <Tree {...args}>
      <TreeItem>
        Fruits
        <TreeItem>Apple</TreeItem>
        <TreeItem>Banana</TreeItem>
        <TreeItem>Cherry</TreeItem>
      </TreeItem>
      <TreeItem>
        Vegetables
        <TreeItem>Carrot</TreeItem>
        <TreeItem>Broccoli</TreeItem>
      </TreeItem>
    </Tree>
  ),
};

export const LeafSelection: Story = {
  args: { selection: 'leaf' },
  render: (args) => (
    <Tree {...args}>
      <TreeItem>
        Formats
        <TreeItem>PNG</TreeItem>
        <TreeItem>JPG</TreeItem>
        <TreeItem>SVG</TreeItem>
      </TreeItem>
      <TreeItem>
        Colors
        <TreeItem>RGB</TreeItem>
        <TreeItem>HEX</TreeItem>
      </TreeItem>
    </Tree>
  ),
};

export const WithDisabledItems: Story = {
  render: (args) => (
    <Tree {...args}>
      <TreeItem>
        Permissions
        <TreeItem>Read</TreeItem>
        <TreeItem>Write</TreeItem>
        <TreeItem disabled>Admin</TreeItem>
        <TreeItem disabled>Delete all</TreeItem>
      </TreeItem>
    </Tree>
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
      <Tree style={{ maxWidth: '300px' }}>
        <TreeItem expanded>
          <Icon name="folder" slot="expand-icon" />
          <Icon name="folder-open" slot="collapse-icon" />
          Documents
          <TreeItem>
            <Icon name="file-earmark" slot="expand-icon" />
            Resume.pdf
          </TreeItem>
          <TreeItem>
            <Icon name="file-earmark" slot="expand-icon" />
            Cover Letter.docx
          </TreeItem>
        </TreeItem>
        <TreeItem>
          <Icon name="folder" slot="expand-icon" />
          <Icon name="folder-open" slot="collapse-icon" />
          Pictures
          <TreeItem>Photo.jpg</TreeItem>
        </TreeItem>
        <TreeItem>Downloads</TreeItem>
      </Tree>
    </div>
  ),
};
