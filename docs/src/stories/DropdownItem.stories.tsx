import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropdownItem, Dropdown, Button, Icon, Divider } from '@/components/ui';

/**
 * Dropdown Item is a single menu entry inside a Dropdown. It can act as a plain action,
 * a checkbox toggle, or a radio choice, and supports prefix/suffix slots for icons and
 * keyboard shortcut labels. Items can be individually disabled without affecting others.
 */
const meta = {
  title: 'Components/Dropdown Item',
  component: DropdownItem,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['normal', 'checkbox'],
      table: { defaultValue: { summary: 'normal' } },
    },
    checked: { control: 'boolean', description: 'Used with type="checkbox"' },
    disabled: { control: 'boolean' },
    variant: {
      control: 'select',
      options: ['default', 'danger'],
      table: { defaultValue: { summary: 'default' } },
    },
    value: { control: 'text' },
  },
  args: { value: 'item', type: 'normal' },
} satisfies Meta<typeof DropdownItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A plain text dropdown item. */
export const Default: Story = {
  render: (args) => (
    <Dropdown>
      <Button slot="trigger" with-caret>
        Actions
      </Button>
      <DropdownItem {...args}>Menu Item</DropdownItem>
      <DropdownItem value="edit">Edit</DropdownItem>
      <DropdownItem value="duplicate">Duplicate</DropdownItem>
    </Dropdown>
  ),
};

/** Shows action, checkbox, and radio item types. */
export const Variants: Story = {
  render: () => (
    <Dropdown>
      <Button slot="trigger" with-caret>
        Options
      </Button>
      <DropdownItem value="edit">
        <Icon name="pencil" slot="prefix" />
        Edit
      </DropdownItem>
      <DropdownItem value="copy">
        <Icon name="copy" slot="prefix" />
        Duplicate
      </DropdownItem>
      <DropdownItem value="share">
        <Icon name="share" slot="prefix" />
        Share
      </DropdownItem>
      <Divider />
      <DropdownItem value="delete" variant="danger">
        <Icon name="trash" slot="prefix" />
        Delete
      </DropdownItem>
    </Dropdown>
  ),
};

/** A checkbox item that toggles its checked state. */
export const Checkbox: Story = {
  render: () => (
    <Dropdown>
      <Button slot="trigger" with-caret>
        View Options
      </Button>
      <DropdownItem type="checkbox" checked value="grid">
        Grid view
      </DropdownItem>
      <DropdownItem type="checkbox" value="labels">
        Show labels
      </DropdownItem>
      <DropdownItem type="checkbox" checked value="details">
        Show details
      </DropdownItem>
      <Divider />
      <DropdownItem type="checkbox" disabled value="experimental">
        Experimental features
      </DropdownItem>
    </Dropdown>
  ),
};

/** A non-interactive disabled dropdown item. */
export const Disabled: Story = {
  render: () => (
    <Dropdown>
      <Button slot="trigger" with-caret>
        Actions
      </Button>
      <DropdownItem value="edit">Edit</DropdownItem>
      <DropdownItem value="archive" disabled>
        Archive (no permission)
      </DropdownItem>
      <DropdownItem value="delete" variant="danger" disabled>
        Delete (no permission)
      </DropdownItem>
    </Dropdown>
  ),
};

/** Adds a keyboard shortcut hint in the suffix slot. */
export const WithSuffixSlot: Story = {
  render: () => (
    <Dropdown>
      <Button slot="trigger" with-caret>
        File
      </Button>
      <DropdownItem value="new">
        New File
        <span
          slot="suffix"
          style={{ fontSize: '0.75rem', color: 'var(--wa-color-neutral-500)' }}
        >
          ⌘N
        </span>
      </DropdownItem>
      <DropdownItem value="open">
        Open…
        <span
          slot="suffix"
          style={{ fontSize: '0.75rem', color: 'var(--wa-color-neutral-500)' }}
        >
          ⌘O
        </span>
      </DropdownItem>
      <DropdownItem value="save">
        Save
        <span
          slot="suffix"
          style={{ fontSize: '0.75rem', color: 'var(--wa-color-neutral-500)' }}
        >
          ⌘S
        </span>
      </DropdownItem>
    </Dropdown>
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
          Items Demo
        </Button>
        <DropdownItem>
          <Icon name="house" slot="prefix" />
          With Icon
        </DropdownItem>
        <DropdownItem type="checkbox" checked>
          Checked Item
        </DropdownItem>
        <DropdownItem disabled>Disabled Item</DropdownItem>
        <Divider />
        <DropdownItem variant="danger">
          <Icon name="trash" slot="prefix" />
          Danger Item
        </DropdownItem>
      </Dropdown>
    </div>
  ),
};
