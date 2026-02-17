// @vitest-environment jsdom
import React, { type ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import { PROPERTY_DEFINITIONS } from '../lib/property-definitions';
import { PALETTE_STEPS } from '../lib/color-utils';

function wrapper({ children }: { children: ReactNode }) {
  return <StudioProvider>{children}</StudioProvider>;
}

beforeEach(() => {
  localStorage.clear();
  document
    .querySelectorAll('link[data-kigumi-font]')
    .forEach((el) => el.remove());
});

describe('useStudio - initial state', () => {
  it('throws when used outside StudioProvider', () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useStudio());
    }).toThrow('useStudio must be used within a StudioProvider');
    spy.mockRestore();
  });

  it('initializes with default values for all properties', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    for (const prop of PROPERTY_DEFINITIONS) {
      expect(result.current.values[prop.cssVar].light).toBe(prop.defaultLight);
      expect(result.current.values[prop.cssVar].dark).toBe(prop.defaultDark);
    }
  });

  it('initializes editMode as dark', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.editMode).toBe('dark');
  });

  it('initializes previewMode as dark', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.previewMode).toBe('dark');
  });

  it('initializes shadowComponents as empty array', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.shadowComponents).toEqual([]);
  });

  it('initializes customCSS as null', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.customCSS).toBeNull();
  });

  it('initializes selectedPreset as null', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.selectedPreset).toBeNull();
  });
});

describe('useStudio - setProperty', () => {
  it('updates a property value for the current edit mode (dark)', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setProperty('--wa-color-brand', '#ff0000');
    });
    expect(result.current.values['--wa-color-brand'].dark).toBe('#ff0000');
    expect(result.current.values['--wa-color-brand'].light).toBe('#0071ec');
  });

  it('updates light mode when editMode is light', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setEditMode('light');
    });
    act(() => {
      result.current.setProperty('--wa-color-brand', '#00ff00');
    });
    expect(result.current.values['--wa-color-brand'].light).toBe('#00ff00');
    expect(result.current.values['--wa-color-brand'].dark).toBe('#0071ec');
  });

  it('ignores unknown CSS variable names', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const keysBefore = Object.keys(result.current.values);
    act(() => {
      result.current.setProperty('--wa-nonexistent', 'value');
    });
    expect(Object.keys(result.current.values)).toEqual(keysBefore);
  });
});

describe('useStudio - isModified', () => {
  it('returns false for unmodified property', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.isModified('--wa-color-brand')).toBe(false);
  });

  it('returns true after property is changed', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setProperty('--wa-color-brand', '#ff0000');
    });
    expect(result.current.isModified('--wa-color-brand')).toBe(true);
  });

  it('returns false for unknown property', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.isModified('--wa-nonexistent')).toBe(false);
  });
});

describe('useStudio - getModifiedProperties', () => {
  it('returns empty light and dark when nothing modified', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const modified = result.current.getModifiedProperties();
    expect(Object.keys(modified.light)).toHaveLength(0);
    expect(Object.keys(modified.dark)).toHaveLength(0);
  });

  it('returns modified property with unit suffix appended', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setProperty('--wa-transition-fast', '100');
    });
    const modified = result.current.getModifiedProperties();
    expect(modified.dark['--wa-transition-fast']).toBe('100ms');
  });
});

describe('useStudio - resetAll', () => {
  it('resets all values to defaults', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setProperty('--wa-color-brand', '#ff0000');
      result.current.setShadowComponents(['Card']);
      result.current.setCustomCSS('.test {}');
      result.current.setSelectedPreset('test');
    });
    act(() => {
      result.current.resetAll();
    });
    expect(result.current.values['--wa-color-brand'].dark).toBe('#0071ec');
    expect(result.current.shadowComponents).toEqual([]);
    expect(result.current.customCSS).toBeNull();
    expect(result.current.selectedPreset).toBeNull();
  });

  it('clears localStorage', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    localStorage.setItem('kigumi-studio-state', '{"test": true}');
    act(() => {
      result.current.resetAll();
    });
    expect(localStorage.getItem('kigumi-studio-state')).toBeNull();
  });
});

describe('useStudio - resetGroup', () => {
  it('resets only properties in the specified group', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setEditMode('light');
    });
    act(() => {
      result.current.setProperty('--wa-color-brand', '#ff0000');
      result.current.setProperty('--wa-space-scale', '2');
    });
    act(() => {
      result.current.resetGroup('colors-brand');
    });
    expect(result.current.values['--wa-color-brand'].light).toBe('#0071ec');
    expect(result.current.values['--wa-space-scale'].light).toBe('2');
  });
});

describe('useStudio - importValues', () => {
  it('applies imported light and dark values', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.importValues({
        '--wa-color-brand': { light: '#ff0000', dark: '#00ff00' },
      });
    });
    expect(result.current.values['--wa-color-brand'].light).toBe('#ff0000');
    expect(result.current.values['--wa-color-brand'].dark).toBe('#00ff00');
  });

  it('strips unit suffix from imported values', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.importValues({
        '--wa-transition-fast': { light: '100ms', dark: '200ms' },
      });
    });
    expect(result.current.values['--wa-transition-fast'].light).toBe('100');
    expect(result.current.values['--wa-transition-fast'].dark).toBe('200');
  });

  it('for mode-independent tokens, uses light value for dark when dark not provided', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.importValues({
        '--wa-border-radius-scale': { light: '2' },
      });
    });
    expect(result.current.values['--wa-border-radius-scale'].light).toBe('2');
    expect(result.current.values['--wa-border-radius-scale'].dark).toBe('2');
  });

  it('ignores unknown CSS variables', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const countBefore = Object.keys(result.current.values).length;
    act(() => {
      result.current.importValues({
        '--wa-nonexistent': { light: 'value' },
      });
    });
    expect(Object.keys(result.current.values).length).toBe(countBefore);
  });
});

describe('useStudio - getStyleObject', () => {
  it('returns CSS variables with values for the given mode', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const style = result.current.getStyleObject('light');
    expect(style['--wa-color-brand']).toBe('#0071ec');
  });

  it('appends unit suffix to properties that have one', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const style = result.current.getStyleObject('light');
    expect(style['--wa-transition-fast']).toMatch(/\d+ms$/);
  });

  it('generates derived brand palette variables', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const style = result.current.getStyleObject('light');
    for (const step of PALETTE_STEPS) {
      expect(style[`--wa-color-brand-${step}`]).toBeDefined();
    }
    expect(style['--wa-color-brand-fill-loud']).toBeDefined();
    expect(style['--wa-color-focus']).toBeDefined();
  });

  it('generates derived semantic color variables', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const style = result.current.getStyleObject('light');
    expect(style['--wa-color-success-50']).toBeDefined();
    expect(style['--wa-color-danger-fill-loud']).toBeDefined();
    expect(style['--wa-color-warning-on-loud']).toBeDefined();
    expect(style['--wa-color-neutral-border-normal']).toBeDefined();
  });

  it('combines shadow color and opacity into rgb()', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const style = result.current.getStyleObject('light');
    expect(style['--wa-color-shadow']).toMatch(/^rgb\(/);
    expect(style['--wa-shadow-opacity']).toBeUndefined();
  });

  it('neutralizes built-in shadow variables to none', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    const style = result.current.getStyleObject('light');
    expect(style['--wa-shadow-s']).toBe('none');
    expect(style['--wa-shadow-m']).toBe('none');
    expect(style['--wa-shadow-l']).toBe('none');
    expect(style['--wa-shadow-xl']).toBe('none');
  });
});

describe('useStudio - mode switching', () => {
  it('setEditMode switches the edit mode', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.editMode).toBe('dark');
    act(() => {
      result.current.setEditMode('light');
    });
    expect(result.current.editMode).toBe('light');
  });

  it('setPreviewMode switches the preview mode', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    expect(result.current.previewMode).toBe('dark');
    act(() => {
      result.current.setPreviewMode('light');
    });
    expect(result.current.previewMode).toBe('light');
  });
});

describe('useStudio - shadow and custom CSS', () => {
  it('setShadowComponents updates the shadow components list', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setShadowComponents(['Card', 'Button']);
    });
    expect(result.current.shadowComponents).toEqual(['Card', 'Button']);
  });

  it('setCustomCSS updates custom CSS', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setCustomCSS('.test { color: red; }');
    });
    expect(result.current.customCSS).toBe('.test { color: red; }');
  });

  it('setSelectedPreset updates the selected preset', () => {
    const { result } = renderHook(() => useStudio(), { wrapper });
    act(() => {
      result.current.setSelectedPreset('midnight-blue');
    });
    expect(result.current.selectedPreset).toBe('midnight-blue');
  });
});
