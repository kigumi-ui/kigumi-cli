import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent } from 'storybook/test';
import { Pagination } from '@/components/ui';
import { installEventProbe, waitForCalled } from '@/test-utils/play-helpers';

/** Pagination splits long lists of content into pages, letting users navigate between them */
const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    total: {
      control: 'number',
      description: 'The total number of items to paginate',
      table: { defaultValue: { summary: '0' } },
    },
    'page-size': {
      control: 'number',
      description: 'The number of items shown per page',
      table: { defaultValue: { summary: '10' } },
    },
    page: {
      control: 'number',
      description: 'The current page, starting at 1',
      table: { defaultValue: { summary: '1' } },
    },
    'sibling-count': {
      control: 'number',
      description:
        'The number of pages to show on each side of the current page',
      table: { defaultValue: { summary: '2' } },
    },
    'boundary-count': {
      control: 'number',
      description: 'The number of pages to always show at the start and end',
      table: { defaultValue: { summary: '1' } },
    },
    'without-nav': {
      control: 'boolean',
      description: 'Hides the previous and next buttons',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-edges': {
      control: 'boolean',
      description: 'Shows buttons that jump to the first and last pages',
      table: { defaultValue: { summary: 'false' } },
    },
    'with-summary': {
      control: 'boolean',
      description: 'Shows a summary of the items on the current page',
      table: { defaultValue: { summary: 'false' } },
    },
    format: {
      control: 'select',
      options: ['standard', 'compact'],
      description: 'The pagination layout',
      table: { defaultValue: { summary: 'standard' } },
    },
    'href-template': {
      control: 'text',
      description:
        'URL template with {page} placeholder to render page items as links',
    },
    'hide-single-page': {
      control: 'boolean',
      description: 'Renders nothing when there is only one page',
      table: { defaultValue: { summary: 'false' } },
    },
    label: {
      control: 'text',
      description: 'Accessible name announced by screen readers',
    },
    appearance: {
      control: 'select',
      options: ['outlined', 'filled', 'plain'],
      description: 'Visual appearance',
      table: { defaultValue: { summary: 'outlined' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the pagination',
      table: { defaultValue: { summary: 'false' } },
    },
    onBeforePageChange: {
      action: 'before-page-change',
      description:
        'Emitted when the page is about to change but before it does. Canceling this event with `event.preventDefault()` prevents the page from changing.',
      table: { category: 'Events' },
    },
    onPageChange: {
      action: 'page-change',
      description: 'Emitted after the page changes.',
      table: { category: 'Events' },
    },
  },
  args: {
    onBeforePageChange: fn(),
    onPageChange: fn(),
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Numbered pages with previous and next controls. */
export const Default: Story = {
  tags: ['interaction'],
  args: { total: 237, 'page-size': 10, page: 3, label: 'Search results' },
  play: async ({ args, canvasElement }) => {
    const host = canvasElement.querySelector<HTMLElement>('wa-pagination');
    if (!host) throw new Error('wa-pagination not found');
    const cleanup = installEventProbe(
      host,
      'wa-page-change',
      args.onPageChange
    );
    const pageButton = Array.from(
      host.shadowRoot?.querySelectorAll('button, a') ?? []
    ).find((el) => el.textContent?.trim() === '4');
    if (!pageButton) throw new Error('page 4 control not found');
    await userEvent.click(pageButton);
    await waitForCalled(args, 'onPageChange');
    cleanup();
  },
};

/** Compact layout for tight toolbars. */
export const Compact: Story = {
  args: {
    total: 237,
    'page-size': 10,
    page: 3,
    format: 'compact',
    label: 'Compact',
  },
};

/** First/last buttons plus a "1–10 of 237" summary. */
export const WithEdgesAndSummary: Story = {
  args: {
    total: 237,
    'page-size': 10,
    page: 3,
    'with-edges': true,
    'with-summary': true,
    label: 'Search results',
  },
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
        gap: '1.5rem',
        padding: '1.5rem',
      }}
    >
      <Pagination
        total={237}
        {...{ 'page-size': 10 }}
        page={3}
        label="Default"
      />
      <Pagination
        total={237}
        {...{ 'page-size': 10 }}
        page={3}
        format="compact"
        label="Compact"
      />
      <Pagination
        total={237}
        {...{ 'page-size': 10 }}
        page={3}
        {...{ 'with-edges': true, 'with-summary': true }}
        label="Edges and summary"
      />
      <Pagination
        total={50}
        {...{ 'page-size': 10 }}
        page={1}
        disabled
        label="Disabled"
      />
    </div>
  ),
};
