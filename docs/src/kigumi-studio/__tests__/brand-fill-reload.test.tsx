// @vitest-environment jsdom
import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { generateBrandVariables } from '../lib/color-utils';
import { modifiedProperties } from '../lib/css-generator';
import { buildDefaultValues } from '../lib/defaults';

const FILL = '--wa-color-brand-fill-loud';
const BRAND = '--wa-color-brand';

/**
 * Studio as a reload finds it: `stored` (the values as the export writes
 * them, which is what Studio keeps in localStorage) read by a fresh module,
 * since StudioContext reads the stored state once per page.
 */
async function reloadWith(stored: ReturnType<typeof modifiedProperties>) {
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
  vi.resetModules();
  const { StudioProvider, useStudio } =
    await import('../contexts/StudioContext');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StudioProvider>{children}</StudioProvider>
  );
  return renderHook(() => useStudio(), { wrapper }).result;
}

beforeEach(() => {
  localStorage.clear();
});

describe('brand fill: reload', () => {
  it('comes back unset after a brand change, and follows the next one', async () => {
    const red = buildDefaultValues();
    red[BRAND] = { light: '#dc2626', dark: '#dc2626' };

    const studio = await reloadWith(modifiedProperties(red));

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

    const studio = await reloadWith(modifiedProperties(values));

    expect(studio.current.values[FILL]).toEqual({ light: '', dark: '#7a1010' });
  });
});
