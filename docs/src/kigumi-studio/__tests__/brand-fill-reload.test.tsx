// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { generateBrandVariables } from '../lib/color-utils';
import { modifiedProperties } from '../lib/css-generator';
import { buildDefaultValues } from '../lib/defaults';

const FILL = '--wa-color-brand-fill-loud';
const BRAND = '--wa-color-brand';

/** A fresh StudioContext, as a reload has it: it reads the stored state once per page. */
async function reload() {
  vi.resetModules();
  const { StudioProvider, useStudio } =
    await import('../contexts/StudioContext');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StudioProvider>{children}</StudioProvider>
  );
  return renderHook(() => useStudio(), { wrapper });
}

/**
 * Studio as a reload finds a state an earlier Studio stored: version 2.0
 * kept the values as the export writes them, derived ones included.
 */
async function reloadWithStoredExport(
  stored: ReturnType<typeof modifiedProperties>
) {
  localStorage.setItem(
    'kigumi-studio-state',
    JSON.stringify({
      version: '2.0',
      editMode: 'light',
      previewMode: 'light',
      modifiedProperties: stored,
      shadowComponents: [],
      customCSS: null,
      selectedPreset: null,
      timestamp: 0,
    })
  );
  return (await reload()).result;
}

beforeEach(() => {
  localStorage.clear();
});

describe('brand fill: reload of a state stored as the export (2.0)', () => {
  it('comes back unset after a brand change, and follows the next one', async () => {
    const red = buildDefaultValues();
    red[BRAND] = { light: '#dc2626', dark: '#dc2626' };

    const studio = await reloadWithStoredExport(modifiedProperties(red));

    expect(studio.current.values[FILL]).toEqual({ light: '', dark: '' });
    act(() => studio.current.setProperty(BRAND, '#16a34a'));
    expect(studio.current.getStyleObject('light')[FILL]).toBe(
      generateBrandVariables('#16a34a', 'light')[FILL]
    );
  });

  it('keeps a fill the user set', async () => {
    const values = buildDefaultValues();
    values[BRAND] = { light: '#dc2626', dark: '#dc2626' };
    values[FILL] = { light: '', dark: '#7a1010' };

    const studio = await reloadWithStoredExport(modifiedProperties(values));

    expect(studio.current.values[FILL]).toEqual({ light: '', dark: '#7a1010' });
  });
});

describe('brand fill: reload', () => {
  it('keeps a fill set to exactly the derived colour, which then stays put', async () => {
    const before = await reload();
    act(() => {
      before.result.current.setEditMode('light');
      before.result.current.setProperty(BRAND, '#dc2626');
    });
    const derived = generateBrandVariables('#dc2626', 'light')[FILL];
    act(() => before.result.current.setProperty(FILL, derived));
    // Leaving the page writes the state at once.
    before.unmount();

    const after = (await reload()).result;
    expect(after.current.values[FILL].light).toBe(derived);
    act(() => after.current.setProperty(BRAND, '#16a34a'));
    expect(after.current.getStyleObject('light')[FILL]).toBe(derived);
  });

  it('keeps an unset fill following the brand', async () => {
    const before = await reload();
    act(() => before.result.current.setProperty(BRAND, '#dc2626'));
    before.unmount();

    const after = (await reload()).result;
    expect(after.current.values[FILL]).toEqual({ light: '', dark: '' });
    act(() => after.current.setProperty(BRAND, '#16a34a'));
    expect(after.current.getStyleObject('dark')[FILL]).toBe(
      generateBrandVariables('#16a34a', 'dark')[FILL]
    );
  });
});
