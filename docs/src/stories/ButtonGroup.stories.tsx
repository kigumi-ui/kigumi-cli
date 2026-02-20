import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, Button, Icon } from '@/components/ui';

const meta = {
  title: 'Inputs/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'Accessibility label (not visible, announced by screen readers)',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      table: { defaultValue: { summary: 'horizontal' } },
    },
    children: { table: { disable: true } },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args} label="Actions">
      <Button>Left</Button>
      <Button>Middle</Button>
      <Button>Right</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: (args) => (
    <ButtonGroup {...args} orientation="vertical" label="Vertical actions">
      <Button>Top</Button>
      <Button>Middle</Button>
      <Button>Bottom</Button>
    </ButtonGroup>
  ),
};

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
