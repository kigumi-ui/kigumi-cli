/**
 * Vite Environment Type Declarations
 *
 * PURPOSE: Updates vite-env.d.ts with component type declarations
 * for React + TypeScript projects. Only modifies auto-managed files.
 *
 * EXPORTS:
 * - updateViteEnvTypes() - Add component IntrinsicElements entries to vite-env.d.ts
 */

import fs from 'fs-extra';
import path from 'path';
import type { OutputInterface } from '../output/types.js';
import { toKebabCase } from './naming.js';

/**
 * Update vite-env.d.ts with new component type declarations.
 *
 * Converts PascalCase component names to kebab-case tag names
 * (e.g. ButtonGroup -> wa-button-group) and inserts them into
 * the IntrinsicElements interface.
 *
 * Guards:
 * - Skips if vite-env.d.ts doesn't exist
 * - Skips if file doesn't contain "auto-managed" comment
 * - Skips components whose tag name already exists in the file
 */
export async function updateViteEnvTypes(
  cwd: string,
  components: string[],
  output: OutputInterface
): Promise<void> {
  const viteEnvPath = path.join(cwd, 'src/vite-env.d.ts');

  if (!(await fs.pathExists(viteEnvPath))) {
    return;
  }

  try {
    let content = await fs.readFile(viteEnvPath, 'utf-8');

    if (!content.includes('auto-managed')) {
      return;
    }

    let modified = false;

    for (const component of components) {
      const tagName = `wa-${toKebabCase(component)}`;

      if (content.includes(`'${tagName}':`)) {
        continue;
      }

      const typeDeclaration = `      '${tagName}': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;\n`;

      const match = content.match(
        /(interface IntrinsicElements \{[\s\S]*?)( {4}\}\s*\}\s*\}\s*(?:export \{\};)?)/
      );

      if (match) {
        content = content.replace(
          match[0],
          `${match[1]}${typeDeclaration}${match[2]}`
        );
        modified = true;
      } else {
        output.warn(
          `Could not find IntrinsicElements insertion point in vite-env.d.ts for ${tagName}`
        );
      }
    }

    if (modified) {
      await fs.writeFile(viteEnvPath, content);
      output.info('Updated vite-env.d.ts with new component types');
    }
  } catch (error) {
    if (error instanceof Error) {
      output.warn(`Could not update vite-env.d.ts: ${error.message}`);
    }
  }
}
