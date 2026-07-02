import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Accordion, AccordionItem } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Accordions group related disclosure panels and control how many can be open at once */
const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['single', 'single-collapsible', 'multiple'],
      description:
        'Controls how many items can be expanded at once. `single` keeps one open, `single-collapsible` allows all to be closed, `multiple` allows any number open.',
      table: { defaultValue: { summary: 'multiple' } },
    },
    'icon-placement': {
      control: 'select',
      options: ['start', 'end'],
      description: 'Where the expand/collapse icon is placed on each item',
      table: { defaultValue: { summary: 'end' } },
    },
    'heading-level': {
      control: 'text',
      description:
        'The heading level applied to each item header for assistive technology',
      table: { defaultValue: { summary: '3' } },
    },
    appearance: {
      control: 'select',
      options: ['filled', 'outlined', 'filled-outlined', 'plain'],
      description: 'The visual style of the accordion',
      table: { defaultValue: { summary: 'outlined' } },
    },
    onExpand: {
      action: 'expand',
      description: 'Emitted before an item expands. Cancelable.',
      table: { category: 'Events' },
    },
    onAfterExpand: {
      action: 'after-expand',
      description: 'Emitted after an item finishes expanding.',
      table: { category: 'Events' },
    },
    onCollapse: {
      action: 'collapse',
      description: 'Emitted before an item collapses. Cancelable.',
      table: { category: 'Events' },
    },
    onAfterCollapse: {
      action: 'after-collapse',
      description: 'Emitted after an item finishes collapsing.',
      table: { category: 'Events' },
    },
  },
  args: {
    onExpand: fn(),
    onAfterExpand: fn(),
    onCollapse: fn(),
    onAfterCollapse: fn(),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A default accordion allowing multiple panels open at once. */
export const Default: Story = {
  tags: ['interaction'],
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<
      HTMLElement & { updateComplete?: Promise<unknown> }
    >('wa-accordion');
    if (!host) throw new Error('wa-accordion not found');
    await host.updateComplete;
    const cleanup = installEventProbe(host, 'wa-expand', args.onExpand);
    const item = host.querySelector<HTMLElement>('wa-accordion-item');
    if (!item) throw new Error('wa-accordion-item not found');
    await (item as HTMLElement & { updateComplete?: Promise<unknown> })
      .updateComplete;
    // wa-expand only fires for the header-click path (item.expand() bypasses
    // the accordion), so click the header button inside the item shadow root.
    const button =
      item.shadowRoot?.querySelector<HTMLElement>('[part~="button"]');
    if (!button) throw new Error('accordion-item header button not found');
    button.click();
    await waitForCalled(args, 'onExpand');
    cleanup();
  },
  render: (args) => (
    <Accordion {...args}>
      <AccordionItem label="What is Kigumi?">
        Kigumi is a CLI that copies Web Awesome component wrappers into your
        project, giving you full ownership of the source code.
      </AccordionItem>
      <AccordionItem label="Which frameworks are supported?">
        Kigumi supports React (TypeScript and JavaScript), Vue 3, Angular, and
        Next.js.
      </AccordionItem>
      <AccordionItem label="Is it free?">
        Yes! The core component set is free and open source. A Pro tier unlocks
        additional components.
      </AccordionItem>
    </Accordion>
  ),
};

/** Only one panel can be open at a time. Opening a new panel closes the previous one. */
export const SingleMode: Story = {
  render: (args) => (
    <Accordion {...args} mode="single">
      <AccordionItem label="Step 1: Install">
        Run <code>npx kigumi init</code> in your project directory.
      </AccordionItem>
      <AccordionItem label="Step 2: Add components">
        Use <code>kigumi add button</code> to add individual components.
      </AccordionItem>
      <AccordionItem label="Step 3: Customize">
        Edit the copied source files to match your design system.
      </AccordionItem>
    </Accordion>
  ),
};

/** Filled-outlined appearance with icon placed at the start. */
export const FilledIconStart: Story = {
  render: (args) => (
    <Accordion {...args} appearance="filled-outlined" icon-placement="start">
      <AccordionItem label="Accessibility">
        All Web Awesome components meet WCAG 2.1 AA standards out of the box.
      </AccordionItem>
      <AccordionItem label="Theming">
        Override CSS custom properties at <code>:root</code> to apply your brand
        tokens globally.
      </AccordionItem>
      <AccordionItem label="Framework support" expanded>
        Kigumi generates wrappers for React, Vue, Angular, and Next.js from the
        same template source.
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
        maxWidth: '600px',
      }}
    >
      <Accordion>
        <AccordionItem label="Default item 1">Content one</AccordionItem>
        <AccordionItem label="Default item 2" expanded>
          Content two (expanded)
        </AccordionItem>
      </Accordion>
      <Accordion appearance="filled" mode="single">
        <AccordionItem label="Filled item 1">Content one</AccordionItem>
        <AccordionItem label="Filled item 2">Content two</AccordionItem>
      </Accordion>
    </div>
  ),
};
