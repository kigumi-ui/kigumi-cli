import { parseThemeCSS, type ParseResult } from './css-parser';

export interface ThemePreset {
  name: string;
  filename: string;
  values: ParseResult;
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
 * Load all theme preset CSS files from the themes/ directory.
 * Uses Vite's import.meta.glob for automatic discovery.
 */
export async function loadPresets(): Promise<ThemePreset[]> {
  const modules = import.meta.glob('../themes/*.css', {
    query: '?raw',
    import: 'default',
  });

  const presets: ThemePreset[] = [];

  for (const [path, loader] of Object.entries(modules)) {
    const css = (await loader()) as string;
    const match = path.match(/\/([^/]+)\.css$/);
    if (!match) continue;

    const filename = match[1];
    const name = filenameToDisplayName(filename);
    const values = parseThemeCSS(css);

    presets.push({ name, filename, values });
  }

  return presets.sort((a, b) => a.name.localeCompare(b.name));
}
