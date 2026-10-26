import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { DEFAULT_VALUES, type ThemeValue } from '../lib/defaults';
import {
  themeDownloads,
  themeEdits,
  themeFiles,
  themeText,
  withImportedValues,
  type CustomThemeState,
} from '../lib/theme-css';
import type { PresetJSON } from '../lib/preset-schema';
import {
  CUSTOM_CSS_LOCK,
  SHADOW_COMPONENTS_LOCK,
  valueLock,
  withLocks,
} from '../lib/locks';
import { buildPreviewStyle } from '../lib/preview-style';

const THEMES_DIR = join(__dirname, '../themes');

/** Every preset, loaded the way the preset selector loads it. */
function presets(): Array<[string, CustomThemeState]> {
  return readdirSync(THEMES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const json = JSON.parse(
        readFileSync(join(THEMES_DIR, file), 'utf8')
      ) as PresetJSON;
      const cssPath = join(THEMES_DIR, file.replace(/\.json$/, '.css'));
      const imported: Record<string, { light?: string; dark?: string }> = {};
      for (const [cssVar, value] of Object.entries(json.light)) {
        imported[cssVar] = { ...imported[cssVar], light: value };
      }
      for (const [cssVar, value] of Object.entries(json.dark)) {
        imported[cssVar] = { ...imported[cssVar], dark: value };
      }
      return [
        file,
        {
          values: withImportedValues(defaults(), imported),
          shadowComponents: json.shadowComponents ?? [],
          customCSS: existsSync(cssPath)
            ? readFileSync(cssPath, 'utf8').trim() || null
            : null,
        },
      ];
    });
}

function defaults(): Record<string, ThemeValue> {
  return Object.fromEntries(
    Object.entries(DEFAULT_VALUES).map(([cssVar, value]) => [
      cssVar,
      { ...value },
    ])
  );
}

function state(overrides: Partial<CustomThemeState> = {}): CustomThemeState {
  return {
    values: defaults(),
    shadowComponents: [],
    customCSS: null,
    ...overrides,
  };
}

describe('Theme CSS text', () => {
  it('shows theme.css, then overrides.css, each under its header', () => {
    const values = defaults();
    values['--wa-border-radius-scale'] = { light: '2', dark: '2' };
    const text = themeText(
      state({
        values,
        shadowComponents: ['Card'],
        customCSS: '.Card > .Card {\n  box-shadow: none;\n}',
      })
    );

    const themeAt = text.indexOf('theme.css');
    const overridesAt = text.indexOf('overrides.css');
    expect(themeAt).toBeGreaterThanOrEqual(0);
    expect(overridesAt).toBeGreaterThan(themeAt);
    const [themePart, overridesPart] = [
      text.slice(0, overridesAt),
      text.slice(overridesAt),
    ];
    expect(themePart).toContain('--wa-border-radius-scale: 2;');
    expect(themePart).toContain(
      '.Card {\n  box-shadow: var(--wa-shadow-m);\n}'
    );
    expect(themePart).not.toContain('.Card > .Card');
    expect(overridesPart).toContain('.Card > .Card {\n  box-shadow: none;\n}');
  });

  it('says so when there is no custom CSS, and no change from the default theme', () => {
    const text = themeText(state());
    expect(text).toContain('No changes from the default theme yet.');
    expect(text).toContain('No custom CSS yet.');
  });

  it('copies each file without the headers or custom CSS in theme.css', () => {
    const values = defaults();
    values['--wa-border-radius-scale'] = { light: '2', dark: '2' };
    const files = themeFiles(
      state({ values, customCSS: '.Badge { gap: 0; }' })
    );
    expect(files.theme).toContain('--wa-border-radius-scale: 2;');
    expect(files.theme).not.toContain('.Badge');
    expect(files.theme).not.toContain('overrides.css');
    expect(files.overrides).toBe('.Badge { gap: 0; }\n');
    expect(themeFiles(state()).overrides).toBe('');
  });
});

describe('Theme CSS edits', () => {
  it.each([['the default theme', state()], ...presets()])(
    'applying the text of %s unchanged changes nothing',
    (_name, theme) => {
      const text = themeText(theme);
      expect(themeEdits(text, text)).toEqual({
        errors: [],
        warnings: [],
        values: {},
      });
    }
  );

  it.each(presets())(
    'pasting the text of %s over the default theme gives its preview',
    (_name, preset) => {
      const edits = themeEdits(themeText(state()), themeText(preset));
      const values = withImportedValues(defaults(), edits.values);

      expect(edits.errors).toEqual([]);
      expect(edits.warnings).toEqual([]);
      for (const mode of ['light', 'dark'] as const) {
        expect(buildPreviewStyle(values, mode)).toEqual(
          buildPreviewStyle(preset.values, mode)
        );
      }
      expect(edits.shadowComponents ?? []).toEqual(preset.shadowComponents);
      expect(edits.customCSS ?? null).toEqual(preset.customCSS);
    }
  );

  it('reads a rule added under overrides.css as custom CSS, comments kept, headers not', () => {
    const before = themeText(state());
    const after = before.replace(
      '/* No custom CSS yet. */',
      '/* Nested cards */\n.Card > .Card {\n  box-shadow: none;\n}\n/* more to come */'
    );
    expect(themeEdits(before, after)).toEqual({
      errors: [],
      warnings: [],
      values: {},
      customCSS:
        '/* Nested cards */\n.Card > .Card {\n  box-shadow: none;\n}\n\n/* more to come */',
    });
  });

  it('reads a shadow colour the export wrote with its opacity back into both values', () => {
    const values = defaults();
    values['--wa-color-shadow'] = { light: '#112233', dark: '#445566' };
    values['--wa-shadow-opacity'] = { light: '0.3', dark: '0.7' };
    const shadowed = state({ values });

    const edits = themeEdits(themeText(state()), themeText(shadowed));
    const applied = withImportedValues(defaults(), edits.values);

    expect(applied['--wa-color-shadow']).toEqual(values['--wa-color-shadow']);
    expect(applied['--wa-shadow-opacity']).toEqual(
      values['--wa-shadow-opacity']
    );
  });

  it('reads a :root block under overrides.css as values, a custom rule under theme.css as custom CSS', () => {
    const values = defaults();
    values['--wa-space-scale'] = { light: '1.5', dark: '1.5' };
    const before = themeText(state({ values }));
    const after = before
      .replace(':root {', '.Badge { gap: 0; }\n:root {')
      .replace(
        '/* No custom CSS yet. */',
        ':root {\n  --wa-border-radius-scale: 2;\n}'
      );
    expect(themeEdits(before, after)).toEqual({
      errors: [],
      warnings: [],
      values: { '--wa-border-radius-scale': { light: '2', dark: '2' } },
      customCSS: '.Badge {\n  gap: 0;\n}',
    });
  });

  it('puts a value removed from the text back to its default', () => {
    const values = defaults();
    values['--wa-color-surface-default'] = {
      light: '#fafafa',
      dark: '#0a0a0a',
    };
    const before = themeText(state({ values }));
    const after = before.replace(/\.wa-dark \{[^}]*\}/, '');
    expect(themeEdits(before, after).values).toEqual({
      '--wa-color-surface-default': {
        dark: DEFAULT_VALUES['--wa-color-surface-default'].dark,
      },
    });
  });

  it('reports an unknown property and does not take it', () => {
    const before = themeText(state());
    const after = `${before}\n:root { --wa-color-sparkle: #fff; }`;
    expect(themeEdits(before, after)).toEqual({
      errors: [],
      warnings: ['Unknown property: --wa-color-sparkle'],
      values: {},
    });
  });

  it('refuses a text that does not parse and changes nothing', () => {
    const before = themeText(state());
    expect(themeEdits(before, `${before}\n.Card { color: red;`)).toEqual({
      errors: ['".Card" opens a block that is never closed.'],
      warnings: [],
      values: {},
    });
  });

  it('keeps a locked value and a locked shadow list as they are, and says so', () => {
    const before = themeText(state());
    // Edited by hand: a brand, a surface for both modes, a shadow.
    const after = `${before}
:root {
  --wa-color-brand: #c2410c;
  --wa-color-surface-default: #fafafa;
}
.wa-dark {
  --wa-color-surface-default: #0a0a0a;
}
.Card {
  box-shadow: var(--wa-shadow-m);
}`;
    const locked = withLocks(
      withLocks(
        valueLock('--wa-color-brand', ['light', 'dark']),
        valueLock('--wa-color-surface-default', ['dark']),
        true
      ),
      SHADOW_COMPONENTS_LOCK,
      true
    );

    expect(themeEdits(before, after, locked)).toEqual({
      errors: [],
      warnings: [
        'Brand Color is locked and keeps its value.',
        'Surface Default (dark) is locked and keeps its value.',
        'The shadow components are locked and keep their list.',
      ],
      values: { '--wa-color-surface-default': { light: '#fafafa' } },
    });
  });

  it('keeps locked custom CSS as it is, and says so', () => {
    const before = themeText(state({ customCSS: '.Card { gap: 0; }' }));
    const after = before.replace('.Card { gap: 0; }', '.Card { gap: 1rem; }');
    expect(after).not.toBe(before);

    expect(themeEdits(before, after, CUSTOM_CSS_LOCK)).toEqual({
      errors: [],
      warnings: ['The custom CSS is locked and keeps its rules.'],
      values: {},
    });
    expect(themeEdits(before, after).customCSS).toContain('gap: 1rem');
  });

  it('applies a mode-independent value edited only in :root to dark mode too', () => {
    const values = defaults();
    values['--wa-border-radius-scale'] = { light: '2', dark: '2' };
    const before = themeText(state({ values }));
    // The .wa-dark block still names the old value; only :root was edited.
    const after = before.replace(
      '--wa-border-radius-scale: 2;',
      '--wa-border-radius-scale: 3;'
    );
    expect(after.match(/--wa-border-radius-scale: 2;/g)).toHaveLength(1);
    expect(themeEdits(before, after).values).toEqual({
      '--wa-border-radius-scale': { light: '3', dark: '3' },
    });
  });
});

describe('Theme CSS downloads', () => {
  it('offers theme.css and overrides.css, each as a project gets it', () => {
    const values = defaults();
    values['--wa-border-radius-scale'] = { light: '2', dark: '2' };
    const downloads = themeDownloads(
      state({ values, customCSS: '.Badge { gap: 0; }' })
    );
    expect(downloads.map((file) => file.name)).toEqual([
      'theme.css',
      'overrides.css',
    ]);
    expect(downloads[0].content).toContain('--wa-border-radius-scale: 2;');
    expect(downloads[0].content).not.toContain('.Badge');
    expect(downloads[1].content).toBe('.Badge { gap: 0; }\n');
  });

  it('says so in a file with nothing to put in it', () => {
    const [theme, overrides] = themeDownloads(state());
    expect(theme.content).toBe(
      '/* No changes from the default theme yet. */\n'
    );
    expect(overrides.content).toBe('/* No custom CSS yet. */\n');
  });
});
