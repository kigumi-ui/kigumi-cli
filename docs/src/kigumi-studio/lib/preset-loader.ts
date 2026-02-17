import type { PresetJSON } from './preset-schema';

export interface ThemePreset {
  name: string;
  filename: string;
  values: {
    light: Record<string, string>;
    dark: Record<string, string>;
    warnings: string[];
  };
  shadowComponents: string[];
  customCSS: string;
}

/**
 * Convert a kebab-case filename to a display name.
 * Example: "neo-brutalism" -> "Neo Brutalism"
 */
export function filenameToDisplayName(filename: string): string {
  return filename
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Load all theme presets from the themes/ directory.
 * Each preset consists of a required .json file (tokens + shadow components)
 * and an optional .css file (custom CSS overrides).
 */
export async function loadPresets(): Promise<ThemePreset[]> {
  const jsonModules = import.meta.glob('../themes/*.json', {
    import: 'default',
  });

  const cssModules = import.meta.glob('../themes/*.css', {
    query: '?raw',
    import: 'default',
  });

  const presets: ThemePreset[] = [];

  for (const [path, loader] of Object.entries(jsonModules)) {
    const json = (await loader()) as PresetJSON;
    const match = path.match(/\/([^/]+)\.json$/);
    if (!match) continue;

    const filename = match[1];

    // Load optional companion CSS file for custom overrides
    const cssPath = path.replace(/\.json$/, '.css');
    let customCSS = '';
    if (cssModules[cssPath]) {
      customCSS = ((await cssModules[cssPath]()) as string).trim();
    }

    presets.push({
      name: json.name || filenameToDisplayName(filename),
      filename,
      values: {
        light: json.light,
        dark: json.dark,
        warnings: [],
      },
      shadowComponents: json.shadowComponents ?? [],
      customCSS,
    });
  }

  return presets.sort((a, b) => a.name.localeCompare(b.name));
}
