import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Tree, TreeItem, Icon } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Trees allow you to display a hierarchical list of selectable tree items */
const meta = {
  title: 'Components/Tree',
  component: Tree,
  tags: ['autodocs'],
  argTypes: {
    selection: {
      control: 'select',
      options: ['single', 'multiple', 'leaf', 'leaf-multiple'],
      description: 'Selection behavior',
      table: { defaultValue: { summary: 'single' } },
    },
    onSelectionChange: {
      action: 'selection-change',
      description: 'Emitted when a tree item is selected or deselected.',
      table: { category: 'Events' },
    },
  },
  args: {
    onSelectionChange: fn(),
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A file-system-style tree with nested folders and files. */
export const Default: Story = {
  tags: ['interaction'],
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
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-tree');
    if (!host) throw new Error('wa-tree not found');
    await (host as HTMLElement & { updateComplete?: Promise<unknown> })
      .updateComplete;
    const cleanup = installEventProbe(
      host,
      'wa-selection-change',
      args.onSelectionChange
    );
    const item = host.querySelector<HTMLElement>('wa-tree-item');
    if (!item) throw new Error('wa-tree-item not found');
    await userEvent.click(item);
    await waitForCalled(args, 'onSelectionChange');
    cleanup();
  },
};

/** Enables multi-select with checkboxes on all items. */
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

/** Restricts selection to leaf nodes only. */
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

/** Some tree items are disabled and cannot be selected. */
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

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
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
