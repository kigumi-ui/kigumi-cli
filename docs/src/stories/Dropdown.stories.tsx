import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Dropdown, DropdownItem, Button, Icon } from '@/components/ui';

/**
 * Dropdown attaches a contextual menu to a trigger element, typically a button, and
 * displays a list of actions or options when activated. It positions itself automatically
 * to stay within the viewport, supports nested items, and can carry checkbox items for
 * multi-select scenarios.
 */
const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
        'right',
        'left',
      ],
      table: { defaultValue: { summary: 'bottom-start' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      table: { defaultValue: { summary: 'medium' } },
    },
    onShow: { action: 'show' },
    onHide: { action: 'hide' },
    onSelect: { action: 'select' },
    open: { table: { disable: true } },
  },
  args: {
    onShow: fn(),
    onHide: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic dropdown with three text action items. */
export const Default: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button slot="trigger" with-caret>
        Actions
      </Button>
      <DropdownItem value="edit">
        <Icon slot="prefix" name="pencil" /> Edit
      </DropdownItem>
      <DropdownItem value="duplicate">
        <Icon slot="prefix" name="copy" /> Duplicate
      </DropdownItem>
      <DropdownItem value="delete" variant="danger">
        <Icon slot="prefix" name="trash" /> Delete
      </DropdownItem>
    </Dropdown>
  ),
};

/** Uses checkbox-type items to build a multi-select menu. */
export const WithCheckboxItems: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button slot="trigger" with-caret>
        Columns
      </Button>
      <DropdownItem type="checkbox" value="name" checked>
        Name
      </DropdownItem>
      <DropdownItem type="checkbox" value="email" checked>
        Email
      </DropdownItem>
      <DropdownItem type="checkbox" value="role">
        Role
      </DropdownItem>
      <DropdownItem type="checkbox" value="date">
        Created date
      </DropdownItem>
    </Dropdown>
  ),
};

/** Compares small, medium, and large dropdown sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {(['small', 'medium', 'large'] as const).map((size) => (
        <Dropdown key={size} size={size}>
          <Button slot="trigger" size={size} with-caret>
            {size}
          </Button>
          <DropdownItem value="a">Option A</DropdownItem>
          <DropdownItem value="b">Option B</DropdownItem>
          <DropdownItem value="c">Option C</DropdownItem>
        </Dropdown>
      ))}
    </div>
  ),
};

/** Shows one menu item in a non-interactive disabled state. */
export const WithDisabledItem: Story = {
  render: (args) => (
    <Dropdown {...args}>
      <Button slot="trigger" with-caret>
        More
      </Button>
      <DropdownItem value="share">Share</DropdownItem>
      <DropdownItem value="export">Export</DropdownItem>
      <DropdownItem value="admin" disabled>
        Admin settings (no access)
      </DropdownItem>
      <DropdownItem value="delete" variant="danger">
        Delete
      </DropdownItem>
    </Dropdown>
  ),
};

/** Triggers the dropdown on right-click as a context menu. */
export const ContextMenu: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Dropdown {...args}>
        <Button slot="trigger" appearance="plain">
          <Icon name="ellipsis-vertical" />
        </Button>
        <DropdownItem value="view">View details</DropdownItem>
        <DropdownItem value="edit">Edit</DropdownItem>
        <DropdownItem value="move">Move to...</DropdownItem>
        <DropdownItem value="delete" variant="danger">
          Delete
        </DropdownItem>
      </Dropdown>
    </div>
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
      <Dropdown open>
        <Button slot="trigger" with-caret>
          Dropdown
        </Button>
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
        <DropdownItem>Item 3</DropdownItem>
      </Dropdown>
    </div>
  ),
};
