/**
 * Registry Add Component Command
 *
 * Interactively adds a component entry to registry.json.
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
  type CommunityComponent,
} from '../../schemas/community-registry.js';

interface AddComponentOptions {
  slug?: string;
  name?: string;
  component?: string;
  css?: string;
  cwd?: string;
}

const FRAMEWORK_EXTENSIONS: Record<string, string[]> = {
  react: ['.tsx', '.jsx', '.ts', '.js'],
  vue: ['.vue', '.js.vue', '.ts', '.js'],
  angular: ['.ts', '.js'],
};

export async function registryAddComponentAction(
  options?: AddComponentOptions
) {
  const output = getOutput();
  output.intro('kigumi registry add-component');

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
    const existingKeys = new Set(Object.keys(registry.components));

    // Prompt: slug
    let slug: string;
    if (options?.slug) {
      slug = options.slug;
    } else {
      const slugResult = await p.text({
        message: 'Component slug (kebab-case key):',
        placeholder: 'button',
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
    let componentName: string;
    if (options?.name) {
      componentName = options.name;
    } else {
      const defaultName =
        slug.charAt(0).toUpperCase() +
        slug.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      const nameResult = await p.text({
        message: 'Display name:',
        placeholder: defaultName,
        defaultValue: defaultName,
        validate: (v) =>
          !v || v.length === 0 ? 'Name cannot be empty' : undefined,
      });
      if (p.isCancel(nameResult)) throw new UserCancelledError();
      componentName = nameResult;
    }

    // Prompt: description
    const descResult = await p.text({
      message: 'Description (optional):',
      placeholder: `${componentName} component`,
    });
    if (p.isCancel(descResult)) throw new UserCancelledError();
    const description = descResult || undefined;

    // Prompt: category
    const catResult = await p.text({
      message: 'Category (optional):',
      placeholder: 'e.g. Actions, Layout, Overlays, Forms',
    });
    if (p.isCancel(catResult)) throw new UserCancelledError();
    const category = catResult || undefined;

    // Prompt: files per framework
    const files: Record<
      string,
      { component: string; css?: string; test?: string; extras: string[] }
    > = {};

    for (const fw of registry.frameworks) {
      const validExts = FRAMEWORK_EXTENSIONS[fw] || ['.ts', '.js'];

      // Component file (required)
      let componentFile: string;
      if (options?.component && registry.frameworks.length === 1) {
        componentFile = options.component;
      } else {
        const compResult = await p.text({
          message: `${fw} component file (from repo root):`,
          placeholder: `components/${fw}/${componentName}/${componentName}.tsx`,
          validate: (v) => {
            if (!v || v.length === 0) return 'Component file is required';
            const ext = v.includes('.js.vue') ? '.js.vue' : path.extname(v);
            if (!validExts.includes(ext))
              return `Expected one of: ${validExts.join(', ')}`;
            const fullPath = path.join(cwd, v);
            if (!fs.pathExistsSync(fullPath)) return `File not found: ${v}`;
            return undefined;
          },
        });
        if (p.isCancel(compResult)) throw new UserCancelledError();
        componentFile = compResult;
      }

      // CSS file (optional)
      let cssFile: string | undefined;
      if (options?.css && registry.frameworks.length === 1) {
        cssFile = options.css;
      } else {
        const cssResult = await p.text({
          message: `${fw} CSS file (optional, press Enter to skip):`,
          placeholder: `components/${fw}/${componentName}/${componentName}.css`,
        });
        if (p.isCancel(cssResult)) throw new UserCancelledError();
        if (cssResult) {
          const fullPath = path.join(cwd, cssResult);
          if (!(await fs.pathExists(fullPath))) {
            output.warning(`CSS file not found: ${cssResult}`);
          }
          cssFile = cssResult;
        }
      }

      // Test file (optional)
      const testResult = await p.text({
        message: `${fw} test file (optional, press Enter to skip):`,
      });
      if (p.isCancel(testResult)) throw new UserCancelledError();
      const testFile = testResult || undefined;

      files[fw] = {
        component: componentFile,
        ...(cssFile && { css: cssFile }),
        ...(testFile && { test: testFile }),
        extras: [],
      };
    }

    // Prompt: dependencies (if other components exist)
    let dependencies: string[] = [];
    if (existingKeys.size > 0) {
      const depResult = await p.multiselect({
        message: 'Depends on other registry components? (Space to select)',
        options: [...existingKeys].map((key) => ({
          value: key,
          label: registry.components[key].name,
        })),
        required: false,
      });
      if (p.isCancel(depResult)) throw new UserCancelledError();
      dependencies = depResult as string[];
    }

    // Build component entry
    const entry: CommunityComponent = {
      name: componentName,
      ...(description && { description }),
      ...(category && { category }),
      dependencies,
      files,
    };

    // Write updated registry.json
    registry.components[slug] = entry;
    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    output.success(
      `Added component "${pc.bold(componentName)}" as "${pc.cyan(slug)}"`
    );

    const frameworkList = Object.entries(files)
      .map(([fw, f]) => `  ${fw}: ${f.component}`)
      .join('\n');
    output.info(`Files:\n${frameworkList}`);

    if (dependencies.length > 0) {
      output.info(`Dependencies: ${dependencies.join(', ')}`);
    }

    output.outro(`Run ${pc.cyan('kigumi registry validate')} to verify`);
  } catch (error) {
    handleError(error, output);
  }
}
