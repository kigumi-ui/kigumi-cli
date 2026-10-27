// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StudioProvider } from '../contexts/StudioContext';
import { StudioSidebar } from '../components/StudioSidebar';

// The UI barrel registers every Web Awesome component on import, which
// jsdom cannot run. Buttons become native buttons so they can be found by
// name and clicked; the accordion renders nothing, so the editors stay out.
vi.mock('@/components/ui', () => ({
  Accordion: () => null,
  Button: ({
    children,
    onClick,
  }: {
    children?: ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  ButtonGroup: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Dialog: () => null,
  Divider: () => null,
  Icon: () => null,
  Option: () => null,
  Select: () => null,
}));

afterEach(cleanup);

function renderSidebar(onThemeCSS = vi.fn()) {
  render(
    <StudioProvider>
      <StudioSidebar
        collapsed={false}
        onToggle={() => {}}
        onThemeCSS={onThemeCSS}
      />
    </StudioProvider>
  );
  return onThemeCSS;
}

describe('StudioSidebar: toolbar', () => {
  it('opens the theme CSS dialog from the Customize button under "Theme CSS"', () => {
    const onThemeCSS = renderSidebar();
    expect(screen.getByText('Theme CSS')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Customize' }));
    expect(onThemeCSS).toHaveBeenCalledOnce();
  });

  it('offers no colour mode generator', () => {
    renderSidebar();
    expect(screen.queryByText('Color mode')).toBeNull();
    expect(screen.queryByRole('button', { name: /generate from/i })).toBeNull();
  });
});
