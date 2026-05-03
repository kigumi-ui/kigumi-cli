/**
 * Registry Add Theme Command
 *
 * Interactively adds a theme entry to registry.json.
 */

import fs from 'fs-extra';
import path from 'path';
import * as p from '../../prompts/index.js';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { handleError, UserCancelledError } from '../../errors/index.js';
import { REGISTRY_FILE_NAME } from '../../constants.js';
import {
  communityRegistrySchema,
  type CommunityRegistry,
  type CommunityTheme,
} from '../../schemas/community-registry.js';

interface AddThemeOptions {
  slug?: string;
  name?: string;
  css?: string;
  cwd?: string;
}

export async function registryAddThemeAction(options?: AddThemeOptions) {
  const output = getOutput();
  output.intro('kigumi registry add-theme');

  const cwd = options?.cwd || process.cwd();

  try {
    // Load and validate registry.json
    const registryPath = path.join(cwd, REGISTRY_FILE_NAME);
    if (!(await fs.pathExists(registryPath))) {
      output.error(
        'registry.json not found. Run "kigumi registry init" first.'
      );
      output.outro('');
      return;
    }

    const rawData = await fs.readJSON(registryPath);
    const parseResult = communityRegistrySchema.safeParse(rawData);
    if (!parseResult.success) {
      output.error(
        'registry.json is invalid. Run "kigumi registry validate" to see errors.'
      );
      output.outro('');
      return;
    }

    const registry: CommunityRegistry = parseResult.data;
    const existingKeys = new Set(Object.keys(registry.themes));

    // Prompt: slug
    let slug: string;
    if (options?.slug) {
      slug = options.slug;
    } else {
      const slugResult = await p.text({
        message: 'Theme slug (kebab-case key):',
        placeholder: 'my-theme',
        validate: (v) => {
          if (!v || v.length === 0) return 'Slug cannot be empty';
          if (!/^[a-z][a-z0-9-]*$/.test(v))
            return 'Must be kebab-case (lowercase, hyphens)';
          if (existingKeys.has(v)) return `"${v}" already exists in registry`;
          return undefined;
        },
      });
      if (p.isCancel(slugResult)) throw new UserCancelledError();
      slug = slugResult;
    }

    // Prompt: name
    let themeName: string;
    if (options?.name) {
      themeName = options.name;
    } else {
      const defaultName = slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const nameResult = await p.text({
        message: 'Display name:',
        placeholder: defaultName,
        defaultValue: defaultName,
        validate: (v) =>
          !v || v.length === 0 ? 'Name cannot be empty' : undefined,
      });
      if (p.isCancel(nameResult)) throw new UserCancelledError();
      themeName = nameResult;
    }

    // Prompt: description
    const descResult = await p.text({
      message: 'Description (optional):',
      placeholder: `A custom theme for Kigumi projects`,
    });
    if (p.isCancel(descResult)) throw new UserCancelledError();
    const description = descResult || undefined;

    // Prompt: CSS file (required)
    let cssFile: string;
    if (options?.css) {
      cssFile = options.css;
    } else {
      const cssResult = await p.text({
        message: 'CSS file path (from repo root):',
        placeholder: `themes/${slug}/theme.css`,
        validate: (v) => {
          if (!v || v.length === 0) return 'CSS file is required';
          if (!v.endsWith('.css')) return 'Must be a .css file';
          const fullPath = path.join(cwd, v);
          if (!fs.pathExistsSync(fullPath)) return `File not found: ${v}`;
          return undefined;
        },
      });
      if (p.isCancel(cssResult)) throw new UserCancelledError();
      cssFile = cssResult;
    }

    // Prompt: variables file (optional)
    const varsResult = await p.text({
      message: 'CSS variables file (optional, press Enter to skip):',
      placeholder: `themes/${slug}/variables.css`,
    });
    if (p.isCancel(varsResult)) throw new UserCancelledError();
    const variablesFile = varsResult || undefined;

    if (variablesFile) {
      const fullPath = path.join(cwd, variablesFile);
      if (!(await fs.pathExists(fullPath))) {
        output.warning(`Variables file not found: ${variablesFile}`);
      }
    }

    // Prompt: extends built-in theme
    const extendsResult = await p.text({
      message: 'Extends built-in theme? (optional, press Enter to skip):',
      placeholder: 'e.g. default, tailspin',
    });
    if (p.isCancel(extendsResult)) throw new UserCancelledError();
    const extendsTheme = extendsResult || undefined;

    // Build theme entry
    const entry: CommunityTheme = {
      name: themeName,
      ...(description && { description }),
      files: {
        css: cssFile,
        ...(variablesFile && { variables: variablesFile }),
      },
      ...(extendsTheme && { extends: extendsTheme }),
    };

    // Write updated registry.json
    registry.themes[slug] = entry;
    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    output.success(`Added theme "${pc.bold(themeName)}" as "${pc.cyan(slug)}"`);
    output.info(`CSS: ${cssFile}`);
    if (variablesFile) output.info(`Variables: ${variablesFile}`);
    if (extendsTheme) output.info(`Extends: ${extendsTheme}`);

    output.outro(`Run ${pc.cyan('kigumi registry validate')} to verify`);
  } catch (error) {
    handleError(error, output);
  }
}
