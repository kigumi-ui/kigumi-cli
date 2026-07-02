import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Accordion, AccordionItem } from '@/components/ui';

/** Accordion items are the individual disclosure panels placed inside an accordion */
const meta = {
  title: 'Components/AccordionItem',
  component: AccordionItem,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description:
        'The header text. Use the `label` slot for markup-rich headers.',
    },
    expanded: {
      control: 'boolean',
      description: 'Whether the item is expanded',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the item is disabled and cannot be toggled',
      table: { defaultValue: { summary: 'false' } },
    },
  },
} satisfies Meta<typeof AccordionItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single accordion item inside an accordion container. */
export const Default: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector<
      HTMLElement & {
        expand?: () => void;
        expanded?: boolean;
        updateComplete?: Promise<unknown>;
      }
    >('wa-accordion-item');
    if (!item) throw new Error('wa-accordion-item not found');
    await item.updateComplete;
    // The item header lives in the shadow root, so call expand() rather than
    // synthesizing a click on slotted content.
    item.expand?.();
    await waitFor(() => expect(item.expanded).toBe(true));
  },
  render: (args) => (
    <Accordion>
      <AccordionItem {...args} label="What is Web Awesome?">
        Web Awesome is a library of accessible, framework-agnostic web
        components built on the Web Components standard.
      </AccordionItem>
    </Accordion>
  ),
};

/** The item starts in the expanded state. */
export const Expanded: Story = {
  render: (args) => (
    <Accordion>
      <AccordionItem {...args} label="Already open" expanded>
        This panel starts in the expanded state via the `expanded` prop.
      </AccordionItem>
      <AccordionItem label="Collapsed by default">
        This panel is closed by default.
      </AccordionItem>
    </Accordion>
  ),
};

/** A disabled item cannot be toggled by the user. */
export const Disabled: Story = {
  render: (args) => (
    <Accordion>
      <AccordionItem label="Available item">
        This item can be toggled normally.
      </AccordionItem>
      <AccordionItem {...args} label="Disabled item" disabled>
        This item is disabled and cannot be opened by the user.
      </AccordionItem>
    </Accordion>
  ),
};

/** Static snapshot for visual regression testing. */
export const ChromaticOnly: Story = {
  tags: ['!dev', '!autodocs'],
  parameters: {
    chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true },
  },
  render: () => (
    <div style={{ padding: '1.5rem', maxWidth: '600px' }}>
      <Accordion>
        <AccordionItem label="Default">Default content</AccordionItem>
        <AccordionItem label="Expanded" expanded>
          Expanded content
        </AccordionItem>
        <AccordionItem label="Disabled" disabled>
          Disabled content
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
