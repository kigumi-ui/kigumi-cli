import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '@/components/ui';
import { StudioConsole } from '@/kigumi-studio/components/console/StudioConsole';
import { StudioConsoleProvider } from '@/kigumi-studio/components/console/StudioConsoleProvider';
import {
  StudioProvider,
  useStudio,
} from '@/kigumi-studio/contexts/StudioContext';

// The Studio console in a real browser, where Web Awesome runs: its bar,
// opening and closing by keyboard, and the Accessibility tab following an
// edit. The two buttons stand in for the sidebar's colour editor: they set
// the value through the same `setProperty` the editor calls.

const STATE_KEY = 'kigumi-studio-state';

/** Start from Studio's defaults; the page's storage is put back after. */
function withDefaults() {
  const saved = localStorage.getItem(STATE_KEY);
  localStorage.removeItem(STATE_KEY);
  return () => {
    if (saved === null) localStorage.removeItem(STATE_KEY);
    else localStorage.setItem(STATE_KEY, saved);
  };
}

/** Quiet text in light mode, set by hand as the colour editor sets it. */
function QuietTextEditor() {
  const { setEditMode, setProperty } = useStudio();
  useEffect(() => setEditMode('light'), [setEditMode]);
  return (
    <div className="wa-cluster wa-gap-xs">
      <Button
        size="small"
        onClick={() => setProperty('--wa-color-text-quiet', '#949494')}
      >
        Light quiet text
      </Button>
      <Button
        size="small"
        onClick={() => setProperty('--wa-color-text-quiet', '#595959')}
      >
        Dark quiet text
      </Button>
    </div>
  );
}

/** The bar's count button for the failing contrast pairs. */
function contrastCount(canvasElement: HTMLElement): HTMLElement {
  const count = canvasElement.querySelector<HTMLElement>(
    '.studio-console__count'
  );
  if (!count) throw new Error('contrast count not found');
  return count;
}

/** The row of `label` in `mode`'s table, by its header cell. */
function contrastRow(
  canvasElement: HTMLElement,
  caption: 'Light mode' | 'Dark mode',
  label: string
): HTMLTableRowElement {
  const table = [...canvasElement.querySelectorAll('table')].find(
    (candidate) => candidate.caption?.textContent === caption
  );
  const row = [...(table?.tBodies[0]?.rows ?? [])].find(
    (candidate) =>
      candidate.querySelector('.studio-contrast__label')?.textContent === label
  );
  if (!row) throw new Error(`${caption} row not found: ${label}`);
  return row;
}

const meta = {
  title: 'Studio/Studio Console',
  component: StudioConsole,
  // Studio's own UI, like the Theme Agent sidebar: listed in the local
  // Storybook, tested in the interaction lane, not published.
  tags: ['maintainer', '!autodocs', 'interaction'],
  parameters: { layout: 'fullscreen' },
  beforeEach: withDefaults,
  decorators: [
    (Story) => (
      <StudioProvider>
        <StudioConsoleProvider>
          <div className="wa-stack wa-gap-m">
            <QuietTextEditor />
            <Story />
          </div>
        </StudioConsoleProvider>
      </StudioProvider>
    ),
  ],
} satisfies Meta<typeof StudioConsole>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Collapsed, the bar counts the failing pairs and follows an edit; opened
 * from the count by keyboard, the Accessibility tab shows a pair go from
 * fail to pass; the toggle closes it again.
 */
export const ContrastFollowsAnEdit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const count = contrastCount(canvasElement);

    // Collapsed by default. Studio's defaults fail one pair already: the
    // dark form control border on its background.
    expect(canvasElement.querySelector('wa-tab-group')).toBeNull();
    await waitFor(() =>
      expect(count.textContent).toBe('1 failing contrast pair')
    );

    await userEvent.click(canvas.getByText('Light quiet text'));
    await waitFor(() =>
      expect(count.textContent).toBe('4 failing contrast pairs')
    );

    // Open from the count, by keyboard alone.
    count.focus();
    await userEvent.keyboard('{Enter}');
    const tab = await canvas.findByText('Accessibility');
    expect(tab.closest('wa-tab')?.hasAttribute('active')).toBe(true);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('.studio-console__panel')
      ).toHaveFocus()
    );

    const quiet = contrastRow(
      canvasElement,
      'Light mode',
      'quiet text on the raised surface'
    );
    expect(quiet.textContent).toContain('Text: #949494');
    expect(quiet.textContent).toContain('Background: #ffffff');
    // 3.03:1, truncated, and the minimum beside it.
    expect(quiet.cells[2].textContent).toBe('3.03:1');
    expect(quiet.cells[3].textContent).toBe('4.5:1');
    expect(quiet.cells[4].textContent).toBe('Fails');
    expect(quiet.classList).toContain('studio-contrast__row--failing');

    await userEvent.click(canvas.getByText('Dark quiet text'));
    await waitFor(() => expect(quiet.cells[4].textContent).toBe('Passes'));
    expect(quiet.classList).not.toContain('studio-contrast__row--failing');
    expect(count.textContent).toBe('1 failing contrast pair');

    // Closed again by its toggle, by keyboard alone.
    const toggle = canvas
      .getByLabelText('Hide console')
      .closest<HTMLElement>('wa-button');
    toggle?.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() =>
      expect(canvasElement.querySelector('wa-tab-group')).toBeNull()
    );
    expect(canvas.getByLabelText('Show console')).toBeInTheDocument();
  },
};
