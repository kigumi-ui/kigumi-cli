import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ButtonGroup, Button, Icon } from '@/components/ui';

/**
 * Groups related buttons into organized sections, supporting both horizontal and vertical
 * layouts
 */
const meta = {
  title: 'Components/Button Group',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        "A label to use for the button group. This won't be displayed on the screen, but it will be announced by assistive devices",
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: "Controls the button group's layout direction",
      table: { defaultValue: { summary: 'horizontal' } },
    },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three buttons joined in a horizontal group. */
export const Default: Story = {
  tags: ['interaction'],
  render: (args) => (
    <ButtonGroup {...args} label="Actions">
      <Button>Left</Button>
      <Button>Middle</Button>
      <Button>Right</Button>
    </ButtonGroup>
  ),
  // ButtonGroup is composition-only with no shadow-DOM-bound interaction;
  // assert the host renders and its three slotted children land inside it.
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector(
      'wa-button-group'
    ) as HTMLElement | null;
    await expect(group).not.toBeNull();
    await waitFor(() =>
      expect(group!.querySelectorAll('wa-button')).toHaveLength(3)
    );
  },
};

/** Stacks buttons vertically inside the group. */
export const Vertical: Story = {
  render: (args) => (
    <ButtonGroup {...args} orientation="vertical" label="Vertical actions">
      <Button>Top</Button>
      <Button>Middle</Button>
      <Button>Bottom</Button>
    </ButtonGroup>
  ),
};

/** Aligns button labels to start, center, or end within the group. */
export const TextAlignment: Story = {
  render: () => (
    <ButtonGroup label="Text alignment">
      <Button appearance="outlined">
        <Icon name="align-left" />
      </Button>
      <Button appearance="outlined">
        <Icon name="align-center" />
      </Button>
      <Button appearance="outlined">
        <Icon name="align-right" />
      </Button>
      <Button appearance="outlined">
        <Icon name="align-justify" />
      </Button>
    </ButtonGroup>
  ),
};

/** Groups buttons that carry different color variants. */
export const MixedVariants: Story = {
  render: () => (
    <ButtonGroup label="Page navigation">
      <Button appearance="outlined">
        <Icon name="chevron-left" /> Prev
      </Button>
      <Button appearance="outlined">1</Button>
      <Button variant="brand">2</Button>
      <Button appearance="outlined">3</Button>
      <Button appearance="outlined">
        Next <Icon name="chevron-right" />
      </Button>
    </ButtonGroup>
  ),
};

/** Shows groups at small, medium, and large sizes. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ButtonGroup label="Small">
        <Button size="small">Small</Button>
        <Button size="small">Small</Button>
        <Button size="small">Small</Button>
      </ButtonGroup>
      <ButtonGroup label="Medium">
        <Button size="medium">Medium</Button>
        <Button size="medium">Medium</Button>
        <Button size="medium">Medium</Button>
      </ButtonGroup>
      <ButtonGroup label="Large">
        <Button size="large">Large</Button>
        <Button size="large">Large</Button>
        <Button size="large">Large</Button>
      </ButtonGroup>
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
      <ButtonGroup>
        <Button>Left</Button>
        <Button>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="brand">
          <Icon name="align-left" slot="prefix" />
          Left
        </Button>
        <Button variant="brand">
          <Icon name="align-center" slot="prefix" />
          Center
        </Button>
        <Button variant="brand">
          <Icon name="align-right" slot="prefix" />
          Right
        </Button>
      </ButtonGroup>
    </div>
  ),
};
