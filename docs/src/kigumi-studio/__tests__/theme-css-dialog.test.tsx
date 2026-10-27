// @vitest-environment jsdom
import { type FormEvent, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import { ThemeCSSDialog } from '../components/toolbar/ThemeCSSDialog';

// The last hide request the dialog got, as Escape or the overlay sends it.
const hide = vi.hoisted(() => ({ event: null as Event | null }));

// The UI barrel registers every Web Awesome component on import, which
// jsdom cannot run. Buttons and the text field become native elements so
// they can be found by name, typed into and clicked; `loading` shows as
// aria-busy and an icon by its name. The dialog gets a Dismiss button that
// sends a cancelable hide request, as Escape does.
vi.mock('@/components/ui', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    loading,
  }: {
    children?: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} aria-busy={loading}>
      {children}
    </button>
  ),
  ButtonGroup: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Callout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Dialog: ({
    children,
    onHide,
  }: {
    children?: ReactNode;
    onHide?: (event: Event) => void;
  }) => (
    <div>
      {children}
      <button
        onClick={() => {
          hide.event = new Event('wa-hide', { cancelable: true });
          onHide?.(hide.event);
        }}
      >
        Dismiss
      </button>
    </div>
  ),
  Dropdown: () => null,
  DropdownItem: () => null,
  Icon: ({ name }: { name: string }) => <span data-icon={name} />,
  Switch: () => null,
  Textarea: ({
    label,
    value,
    onInput,
  }: {
    label?: string;
    value?: string;
    onInput?: (event: FormEvent<HTMLTextAreaElement>) => void;
  }) => (
    <textarea
      aria-label={label}
      value={value}
      onInput={onInput}
      onChange={() => {}}
    />
  ),
}));

/** The custom CSS the Studio holds, as the preview would get it. */
function SavedCustomCSS() {
  const { customCSS } = useStudio();
  return <div data-testid="saved">{customCSS ?? ''}</div>;
}

function renderDialog(onClose = vi.fn()) {
  render(
    <StudioProvider>
      <ThemeCSSDialog open onClose={onClose} />
      <SavedCustomCSS />
    </StudioProvider>
  );
  return onClose;
}

const editor = () =>
  screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'Theme CSS' });
const saved = () => screen.getByTestId('saved').textContent;
const saveButton = () => screen.getByRole('button', { name: /^Save/ });
// The callout; the status region repeats its first line for screen readers.
const errorCallout = () => screen.getByText(/Not saved/, { selector: 'div' });
const announced = () => screen.getByRole('status').textContent;
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name }));

function type(text: string) {
  fireEvent.input(editor(), { target: { value: text } });
}

const validEdit = () => `${editor().value}\n.Card { color: red; }`;
const invalidEdit = () => `${editor().value}\n.Card { color: red;`;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ThemeCSSDialog: saving', () => {
  it('opens with Save, and nothing disabled', () => {
    renderDialog();
    expect(saveButton().textContent).toBe('Save');
    expect(saveButton().querySelector('[data-icon]')).toBeNull();
    expect(
      screen.getByRole('button', { name: /Download all/ })
    ).not.toHaveProperty('disabled', true);
  });

  it('saves an edit a second after the last keystroke, then says so for a second', () => {
    renderDialog();
    type(validEdit());
    expect(saveButton().textContent).toBe('Save');
    expect(saveButton().querySelector('[data-icon]')).toBeNull();

    act(() => vi.advanceTimersByTime(999));
    expect(saved()).toBe('');

    act(() => vi.advanceTimersByTime(1));
    expect(saved()).toMatch(/\.Card \{\s*color: red;\s*\}/);
    expect(saveButton().getAttribute('aria-busy')).toBe('true');

    act(() => vi.advanceTimersByTime(400));
    expect(saveButton().getAttribute('aria-busy')).not.toBe('true');
    expect(saveButton().textContent).toBe('Saved');
    expect(saveButton().querySelector('[data-icon="check"]')).not.toBeNull();
    expect(announced()).toBe('Saved');

    act(() => vi.advanceTimersByTime(999));
    expect(saveButton().textContent).toBe('Saved');
    act(() => vi.advanceTimersByTime(1));
    expect(saveButton().textContent).toBe('Save');
    expect(saveButton().querySelector('[data-icon]')).toBeNull();
  });

  it('says Saved for a second from Save with nothing to save', () => {
    renderDialog();
    click(/^Save/);
    expect(saveButton().textContent).toBe('Saved');
    act(() => vi.advanceTimersByTime(1000));
    expect(saveButton().textContent).toBe('Save');
  });

  it('saves at once from the Save button', () => {
    renderDialog();
    type(validEdit());
    fireEvent.click(saveButton());
    expect(saved()).toMatch(/\.Card \{\s*color: red;\s*\}/);
  });

  it('does not save text that does not parse, and says why', () => {
    renderDialog();
    type(invalidEdit());
    act(() => vi.advanceTimersByTime(1000));
    // The saving state's own timer starts only once React has rendered it.
    act(() => vi.advanceTimersByTime(400));
    expect(saved()).toBe('');
    expect(errorCallout()).toBeTruthy();
    expect(announced()).toMatch(/^Not saved/);
    expect(saveButton().textContent).toBe('Save');
    expect(saveButton().querySelector('[data-icon]')).toBeNull();
  });

  it('saves an edit still waiting for the delay on Close', () => {
    const onClose = renderDialog();
    type(validEdit());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(saved()).toMatch(/\.Card \{\s*color: red;\s*\}/);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('stays open on Close to show why text that does not parse is not saved, then closes without it', () => {
    const onClose = renderDialog();
    type(invalidEdit());
    click('Close');
    expect(onClose).not.toHaveBeenCalled();
    expect(errorCallout()).toBeTruthy();

    click('Close');
    expect(saved()).toBe('');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes at once without text that does not parse when the error already shows', () => {
    const onClose = renderDialog();
    type(invalidEdit());
    act(() => vi.advanceTimersByTime(1000));
    click('Close');
    expect(saved()).toBe('');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('treats Escape as Close: saves a pending edit', () => {
    const onClose = renderDialog();
    type(validEdit());
    click('Dismiss');
    expect(saved()).toMatch(/\.Card \{\s*color: red;\s*\}/);
    expect(hide.event?.defaultPrevented).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('treats Escape as Close: stays open to show the error first', () => {
    const onClose = renderDialog();
    type(invalidEdit());
    click('Dismiss');
    expect(hide.event?.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    expect(errorCallout()).toBeTruthy();
  });
});

describe('ThemeCSSDialog: download', () => {
  let files: Blob[];

  beforeEach(() => {
    files = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      files.push(blob);
      return 'blob:theme';
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('downloads an edit still waiting for the delay', async () => {
    renderDialog();
    type(validEdit());
    fireEvent.click(screen.getByRole('button', { name: /Download all/ }));

    expect(files).toHaveLength(2);
    const contents = await Promise.all(files.map((file) => file.text()));
    expect(contents.join('\n')).toMatch(/\.Card \{\s*color: red;\s*\}/);
  });

  it('downloads nothing from text that does not parse, and says why', () => {
    renderDialog();
    type(invalidEdit());
    click(/Download all/);
    expect(files).toHaveLength(0);
    expect(errorCallout()).toBeTruthy();
  });
});
