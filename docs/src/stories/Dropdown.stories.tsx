import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, within } from 'storybook/test';
import { Dropdown, DropdownItem, Button, Icon } from '@/components/ui';
import {
  clickTrigger,
  installEventProbe,
  waitForCalled,
} from '@/test-utils/play-helpers';

/** Dropdowns expose additional content that pops up when the user interacts with a trigger */
const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Indicates whether the dropdown is open',
      table: { disable: true, defaultValue: { summary: 'false' } },
    },
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
        'right-start',
        'right-end',
        'left',
        'left-start',
        'left-end',
      ],
      description: 'Preferred placement of the dropdown panel',
      table: { defaultValue: { summary: 'bottom-start' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the dropdown',
      table: { defaultValue: { summary: 'false' } },
    },
    'stay-open-on-select': {
      control: 'boolean',
      description: 'Keeps the dropdown open when an item is selected',
      table: { defaultValue: { summary: 'false' } },
    },
    distance: {
      control: 'number',
      description: 'Distance from the panel to the trigger',
      table: { defaultValue: { summary: '0' } },
    },
    skidding: {
      control: 'number',
      description: 'Offset along the trigger',
      table: { defaultValue: { summary: '0' } },
    },
    hoist: {
      control: 'boolean',
      description: 'Hoists the dropdown panel to the body',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large', 'xs', 's', 'm', 'l', 'xl'],
      description: 'Dropdown size',
      table: { defaultValue: { summary: 'medium' } },
    },
    onShow: {
      action: 'show',
      description: 'Emitted when the dropdown is about to show.',
      table: { category: 'Events' },
    },
    onAfterShow: {
      action: 'after-show',
      description: 'Emitted after the dropdown has been shown.',
      table: { category: 'Events' },
    },
    onHide: {
      action: 'hide',
      description: 'Emitted when the dropdown is about to hide.',
      table: { category: 'Events' },
    },
    onAfterHide: {
      action: 'after-hide',
      description: 'Emitted after the dropdown has been hidden.',
      table: { category: 'Events' },
    },
    onSelect: {
      action: 'select',
      description: 'Emitted when an item in the dropdown is selected.',
      table: { category: 'Events' },
    },
  },
  args: {
    onShow: fn(),
    onAfterShow: fn(),
    onHide: fn(),
    onAfterHide: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A basic dropdown with three text action items. */
export const Default: Story = {
  tags: ['interaction'],
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
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const cleanup = installEventProbe(
      canvasElement.querySelector('wa-dropdown'),
      'wa-show',
      args.onShow
    );
    await clickTrigger(canvas, 'Actions');
    await waitForCalled(args, 'onShow');
    cleanup();
  },
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
