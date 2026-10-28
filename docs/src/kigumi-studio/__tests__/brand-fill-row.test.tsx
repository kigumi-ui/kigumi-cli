// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { act, cleanup, fireEvent, renderHook } from '@testing-library/react';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import { generateBrandVariables } from '../lib/color-utils';
import { PROPERTIES_BY_VAR } from '../lib/property-definitions';
import { PropertyRow } from '../components/editor/PropertyRow';

// The UI barrel registers every Web Awesome component on import, which
// jsdom cannot run; a colour row renders native inputs only.
vi.mock('@/components/ui', () => ({
  Select: () => null,
  Option: () => null,
  Switch: () => null,
}));

const FILL = '--wa-color-brand-fill-loud';
const fillProperty = PROPERTIES_BY_VAR.get(FILL)!;

/** The fill row's colour picker and text field, and Studio beside it. */
function renderFillRow() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StudioProvider>
      <PropertyRow property={fillProperty} />
      {children}
    </StudioProvider>
  );
  const { result } = renderHook(() => useStudio(), { wrapper });
  const inputs = [...document.querySelectorAll('input')];
  expect(inputs).toHaveLength(2);
  return { studio: result, picker: inputs[0], text: inputs[1] };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('brand fill: sidebar row', () => {
  it('shows the fill the brand derives while unset, with an empty field', () => {
    const { studio, picker, text } = renderFillRow();
    act(() => studio.current.setProperty('--wa-color-brand', '#dc2626'));

    // Studio edits dark mode by default.
    const derived = generateBrandVariables('#dc2626', 'dark')[FILL];
    expect(picker.value).toBe(derived);
    expect(text.value).toBe('');
    expect(text.placeholder).toBe(derived);
  });

  it('sets the fill in the edited mode only', () => {
    const { studio, text } = renderFillRow();
    fireEvent.change(text, { target: { value: '#7a1010' } });

    expect(studio.current.values[FILL]).toEqual({ light: '', dark: '#7a1010' });
  });
});
