import * as p from '@clack/prompts';
import fs from 'fs-extra';
import path from 'path';
import pc from 'picocolors';
import { getConfig, loadConfig } from '../utils/config.js';
import {
  getComponent,
  getAllComponents,
  hasComponent,
  type ComponentDefinition,
} from '../utils/registry.js';
import {
  generateComponent,
  updateTypeDeclarations,
  updateComponentIndex,
} from '../utils/template.js';

interface AddOptions {
  all?: boolean;
  overwrite?: boolean;
  types?: boolean;
}

export async function addCommand(components: string[], options: AddOptions) {
  const cwd = process.cwd();

  // Check if kigumi is initialized
  const userConfig = loadConfig(cwd);
  if (!userConfig) {
    p.intro(pc.bgRed(pc.white(' Error ')));
    p.outro(
      pc.red('kigumi is not initialized in this project.\n') +
        pc.white('Run: ') +
        pc.cyan('npx kigumi init')
    );
    process.exit(1);
  }

  const config = getConfig(cwd);

  p.intro(pc.bgCyan(pc.black(' kigumi add ')));

  // Determine which components to add
  let componentsToAdd: string[] = [];

  if (options.all) {
    const allComponents = getAllComponents();
    componentsToAdd = Object.keys(allComponents);
  } else if (components.length === 0) {
    // Interactive selection
    const allComponents = getAllComponents();
    const choices = Object.entries(allComponents).map(([key, comp]) => ({
      value: key,
      label: comp.name,
      hint: comp.description,
    }));

    const selected = await p.multiselect({
      message: 'Select components to add:',
      options: choices,
      required: true,
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    componentsToAdd = selected as string[];
  } else {
    componentsToAdd = components;
  }

  // Validate components
  const invalidComponents = componentsToAdd.filter((name) => !hasComponent(name));
  if (invalidComponents.length > 0) {
    p.outro(
      pc.red('Unknown components: ') +
        pc.white(invalidComponents.join(', ')) +
        '\n' +
        pc.dim('Run ') +
        pc.cyan('npx kigumi list') +
        pc.dim(' to see available components.')
    );
    process.exit(1);
  }

  // Process each component
  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  for (const componentName of componentsToAdd) {
    const spinner = p.spinner();
    spinner.start(`Adding ${pc.cyan(componentName)}...`);

    try {
      const component = getComponent(componentName);
      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }

      await addComponent(component, config, cwd, options);

      spinner.stop(`${pc.green('✓')} Added ${pc.cyan(componentName)}`);
      results.push({ name: componentName, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      spinner.stop(`${pc.red('✗')} Failed to add ${pc.cyan(componentName)}`);
      results.push({ name: componentName, success: false, error: errorMessage });
    }
  }

  // Summary
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  let summary = '';
  if (successful.length > 0) {
    summary += pc.green(`\n✓ Added ${successful.length} component(s):\n`);
    summary += successful.map((r) => `  ${pc.cyan(r.name)}`).join('\n');
  }

  if (failed.length > 0) {
    summary += pc.red(`\n✗ Failed to add ${failed.length} component(s):\n`);
    summary += failed.map((r) => `  ${pc.cyan(r.name)} - ${r.error}`).join('\n');
  }

  p.note(summary, 'Summary');

  if (successful.length > 0) {
    p.outro(
      pc.green('Components added successfully!\n\n') +
        pc.white('Import them in your code:\n') +
        pc.cyan(
          `import { ${successful.map((r) => getComponent(r.name)?.name).join(', ')} } from '${config.aliases?.['@/components'] || config.componentsDir}';`
        )
    );
  } else {
    p.outro(pc.red('No components were added.'));
  }
}

/**
 * Add a single component to the project
 */
async function addComponent(
  component: ComponentDefinition,
  config: ReturnType<typeof getConfig>,
  cwd: string,
  options: AddOptions
): Promise<void> {
  // Generate component file
  const componentContent = await generateComponent(component, config);

  const ext = config.typescript ? 'tsx' : 'jsx';
  const componentPath = path.join(cwd, config.componentsDir, `${component.name}.${ext}`);

  // Check if file exists
  if ((await fs.pathExists(componentPath)) && !options.overwrite) {
    throw new Error('Component already exists. Use --overwrite to replace.');
  }

  // Write component file
  await fs.ensureDir(path.dirname(componentPath));
  await fs.writeFile(componentPath, componentContent);

  // Update TypeScript declarations
  if (config.typescript && options.types !== false) {
    await updateTypeDeclarations(component, config, cwd);
  }

  // Update component index
  await updateComponentIndex(component, config, cwd);
}
