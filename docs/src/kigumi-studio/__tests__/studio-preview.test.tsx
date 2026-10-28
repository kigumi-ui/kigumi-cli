// @vitest-environment jsdom
import { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { StudioProvider, useStudio } from '../contexts/StudioContext';
import { StudioPreview } from '../components/StudioPreview';
import { generateThemeCSS } from '../lib/css-generator';
import { SHADOW_COMPONENTS } from '../lib/shadow-components';

// The showcase renders Web Awesome components; only the preview's own
// <style> elements are under test.
vi.mock('../components/preview/ComponentShowcase', () => ({
  ComponentShowcase: () => null,
}));

const ROOT = '.studio-preview .component-showcase';

function Seed({
  shadowComponents,
  customCSS,
}: {
  shadowComponents: string[];
  customCSS: string | null;
}) {
  const { setShadowComponents, setCustomCSS } = useStudio();
  useEffect(() => {
    setShadowComponents(shadowComponents);
    setCustomCSS(customCSS);
  }, [setShadowComponents, setCustomCSS, shadowComponents, customCSS]);
  return null;
}

function renderPreview(shadowComponents: string[], customCSS: string | null) {
  const { container } = render(
    <StudioProvider>
      <Seed shadowComponents={shadowComponents} customCSS={customCSS} />
      <StudioPreview />
    </StudioProvider>
  );
  return [...container.querySelectorAll('style')];
}

beforeEach(() => {
  localStorage.clear();
});

describe('StudioPreview shadows', () => {
  it("applies the export's shadow rules, scoped to the preview, and nothing else", () => {
    const all = SHADOW_COMPONENTS.map((c) => c.className);
    const [shadows] = renderPreview(all, null);
    const exported = generateThemeCSS({}, {}, { shadowComponents: all })
      .replace('/* Component Shadows */\n', '')
      .trimEnd();

    const rules = shadows.textContent!.split('\n\n');
    expect(rules).toHaveLength(all.length);
    for (const rule of rules) expect(rule.startsWith(`${ROOT} .`)).toBe(true);
    expect(shadows.textContent!.replaceAll(`${ROOT} `, '')).toBe(exported);
  });

  it('applies custom CSS after the shadows, so a rule that removes one wins', () => {
    const styles = renderPreview(
      ['Card', 'Button'],
      '.Card > .Card {\n  box-shadow: none;\n}'
    );
    expect(styles.map((s) => s.textContent)).toEqual([
      `${ROOT} .Card {\n  box-shadow: var(--wa-shadow-m);\n}\n\n` +
        `${ROOT} .Button::part(base) {\n  box-shadow: var(--wa-shadow-m);\n}`,
      `${ROOT} .Card > .Card {\n  box-shadow: none;\n}`,
    ]);
  });
});
