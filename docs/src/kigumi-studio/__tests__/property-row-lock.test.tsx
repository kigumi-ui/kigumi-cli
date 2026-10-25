// @vitest-environment jsdom
import React, { type ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StudioProvider } from '../contexts/StudioContext';
import { valueLock } from '../lib/locks';
import { PROPERTY_DEFINITIONS } from '../lib/property-definitions';
import { PropertyRow } from '../components/editor/PropertyRow';

// The UI barrel registers every Web Awesome component on import, which
// jsdom cannot run. A colour row renders native inputs only; the switch is
// stubbed out, so what is left is the control the lock disables.
vi.mock('@/components/ui', () => ({
  Select: () => null,
  Option: () => null,
  Switch: () => null,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <StudioProvider>{children}</StudioProvider>;
}

const surface = PROPERTY_DEFINITIONS.find(
  (property) => property.cssVar === '--wa-color-surface-default'
)!;

/** The colour picker and its text field, as the row renders them. */
function surfaceInputs(): HTMLInputElement[] {
  const { container } = render(<PropertyRow property={surface} />, {
    wrapper,
  });
  const inputs = [...container.querySelectorAll('input')];
  expect(inputs).toHaveLength(2);
  return inputs;
}

beforeEach(() => {
  localStorage.clear();
  document.cookie = 'kigumi-theme-agent=test; path=/';
});

afterEach(() => {
  document.cookie = 'kigumi-theme-agent=; path=/; max-age=0';
});

describe('PropertyRow: locked values', () => {
  it("disables a locked value's control in the mode it is locked in", () => {
    // Studio edits dark mode by default.
    localStorage.setItem(
      'kigumi-studio-locks',
      JSON.stringify(valueLock(surface.cssVar, ['dark']))
    );
    expect(surfaceInputs().every((input) => input.disabled)).toBe(true);
  });

  it('leaves the control enabled in the mode that is not locked', () => {
    localStorage.setItem(
      'kigumi-studio-locks',
      JSON.stringify(valueLock(surface.cssVar, ['light']))
    );
    expect(surfaceInputs().some((input) => input.disabled)).toBe(false);
  });

  it('leaves a locked control enabled without the access cookie', () => {
    document.cookie = 'kigumi-theme-agent=; path=/; max-age=0';
    localStorage.setItem(
      'kigumi-studio-locks',
      JSON.stringify(valueLock(surface.cssVar, ['dark']))
    );
    expect(surfaceInputs().some((input) => input.disabled)).toBe(false);
  });
});
