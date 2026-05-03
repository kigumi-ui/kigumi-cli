/**
 * Registry Init Command
 *
 * Scaffolds a new community registry repository structure.
 */

import fs from 'fs-extra';
import path from 'path';
import * as p from '../../prompts/index.js';
import pc from 'picocolors';
import { getOutput } from '../../output/index.js';
import { handleError, UserCancelledError } from '../../errors/index.js';
import { REGISTRY_FILE_NAME } from '../../constants.js';
import { FRAMEWORKS } from '../../schemas/config.js';
import type { CommunityRegistry } from '../../schemas/community-registry.js';

interface RegistryInitOptions {
  name?: string;
  cwd?: string;
  yes?: boolean;
}

export async function registryInitAction(options?: RegistryInitOptions) {
  const output = getOutput();
  output.intro('kigumi registry init');

  const cwd = options?.cwd || process.cwd();

  try {
    // Check if registry.json already exists
    const registryPath = path.join(cwd, REGISTRY_FILE_NAME);
    if (await fs.pathExists(registryPath)) {
      output.warning('registry.json already exists in this directory');
      output.outro('Use "kigumi registry validate" to check your registry');
      return;
    }

    let name: string;
    let description: string;
    let author: string;
    let frameworks: string[];

    if (options?.yes) {
      name = options.name || path.basename(cwd);
      description = '';
      author = '';
      frameworks = ['react'];
    } else {
      const nameResult = await p.text({
        message: 'Registry name:',
        placeholder: path.basename(cwd),
        defaultValue: options?.name || path.basename(cwd),
        validate: (v) =>
          !v || v.length === 0 ? 'Name cannot be empty' : undefined,
      });
      if (p.isCancel(nameResult)) throw new UserCancelledError();
      name = nameResult;

      const descResult = await p.text({
        message: 'Description:',
        placeholder: 'Community components and themes for Kigumi',
      });
      if (p.isCancel(descResult)) throw new UserCancelledError();
      description = descResult || '';

      const authorResult = await p.text({
        message: 'Author:',
        placeholder: 'Your Name',
      });
      if (p.isCancel(authorResult)) throw new UserCancelledError();
      author = authorResult || '';

      const fwResult = await p.multiselect({
        message: 'Which frameworks will this registry support?',
        options: FRAMEWORKS.map((fw) => ({
          value: fw,
          label: fw.charAt(0).toUpperCase() + fw.slice(1),
        })),
        required: true,
      });
      if (p.isCancel(fwResult)) throw new UserCancelledError();
      frameworks = fwResult as string[];
    }

    const spinner = output.spinner('Creating registry structure...');

    // Build registry.json
    const registry: CommunityRegistry = {
      name,
      ...(description && { description }),
      ...(author && { author }),
      version: '0.1.0',
      frameworks: frameworks as CommunityRegistry['frameworks'],
      components: {},
      themes: {},
    };

    // Write registry.json
    await fs.writeJSON(registryPath, registry, { spaces: 2 });

    // Create directory structure
    const dirs = [
      ...frameworks.map((fw) => path.join(cwd, 'components', fw)),
      path.join(cwd, 'themes'),
    ];

    await Promise.all(
      dirs.map(async (dir) => {
        await fs.ensureDir(dir);
        await fs.writeFile(path.join(dir, '.gitkeep'), '');
      })
    );

    // Write README
    const readme = generateReadme(name, description, frameworks);
    await fs.writeFile(path.join(cwd, 'README.md'), readme);

    spinner.stop('Registry structure created');

    output.note(
      'Next steps',
      [
        '1. Add components to components/{framework}/',
        '2. Add themes to themes/',
        '3. Update registry.json with component/theme metadata',
        '4. Run "kigumi registry validate" to verify',
        '5. Push to GitHub and share the URL',
      ].join('\n')
    );

    output.outro(`${pc.green('✓')} Registry "${name}" initialized`);
  } catch (error) {
    handleError(error, output);
  }
}

function generateReadme(
  name: string,
  description: string,
  frameworks: string[]
): string {
  return `# ${name}

${description || 'A community component registry for Kigumi CLI.'}

## Frameworks

${frameworks.map((fw) => `- ${fw}`).join('\n')}

## Usage

Add this registry to your project:

\`\`\`bash
kigumi registry add https://github.com/YOUR_USERNAME/${name}
\`\`\`

Install a component:

\`\`\`bash
kigumi add --from https://github.com/YOUR_USERNAME/${name} COMPONENT_NAME
\`\`\`

## Adding Components

1. Create your component in \`components/{framework}/{ComponentName}/\`
2. Add the component metadata to \`registry.json\`
3. Run \`kigumi registry validate\` to verify
4. Commit and push

## Adding Themes

1. Create your theme CSS in \`themes/{theme-name}/\`
2. Add the theme metadata to \`registry.json\`
3. Run \`kigumi registry validate\` to verify
4. Commit and push
`;
}
