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
  generateComponentCSS,
  generateComponentTest,
} from '../utils/template.js';
import { isComponentAvailable } from '../utils/tier-restrictions.js';

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
  const tier = config.webAwesome?.tier || 'free';

  if (options.all) {
    const allComponents = getAllComponents();
    // Filter by tier
    componentsToAdd = Object.keys(allComponents).filter((key) =>
      isComponentAvailable(key, tier)
    );
  } else if (components.length === 0) {
    // Interactive multi-select with tier awareness
    const allComponents = getAllComponents();

    const choices = Object.entries(allComponents)
      .filter(([key]) => isComponentAvailable(key, tier))
      .map(([key, comp]) => ({
        value: key,
        label: comp.name,
        hint: `${comp.category}${comp.tier === 'pro' ? ' • Pro' : ''}`,
      }));

    const selected = await p.multiselect({
      message: 'Select components (space to select, enter to confirm):',
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

  // Validate tier restrictions
  const unavailableComponents = componentsToAdd.filter(
    (name) => !isComponentAvailable(name, tier)
  );

  if (unavailableComponents.length > 0) {
    p.outro(
      pc.red('These components require Web Awesome Pro:') +
        '\n  ' +
        pc.white(unavailableComponents.join(', ')) +
        '\n\n' +
        pc.yellow('Upgrade to Pro:') +
        '\n  ' +
        pc.dim('Run: ') +
        pc.cyan('kigumi init') +
        '\n  ' +
        pc.dim('Select "Pro" tier and enter your token')
    );
    process.exit(1);
  }

  // Validate components exist
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
  // Component goes into its own directory
  const componentDir = path.join(cwd, config.componentsDir, component.name);
  const componentPath = path.join(componentDir, `${component.name}.${ext}`);

  // Check if file exists
  if ((await fs.pathExists(componentPath)) && !options.overwrite) {
    throw new Error('Component already exists. Use --overwrite to replace.');
  }

  // Create component directory
  await fs.ensureDir(componentDir);

  // Write component file
  await fs.writeFile(componentPath, componentContent);

  // Generate CSS file
  await generateComponentCSS(component, config, cwd);

  // Generate unit test
  await generateComponentTest(component, config, cwd);

  // Update TypeScript declarations
  if (config.typescript && options.types !== false) {
    await updateTypeDeclarations(component, config, cwd);
  }

  // Update component index
  await updateComponentIndex(component, config, cwd);

  // Update webawesome.ts to include component JS import
  await updateWebAwesomeImports(component, config, cwd);
}

/**
 * Update webawesome.ts to include component JS imports
 */
async function updateWebAwesomeImports(
  component: ComponentDefinition,
  config: ReturnType<typeof getConfig>,
  cwd: string
): Promise<void> {
  const tier = config.webAwesome?.tier || 'free';
  const packageName = tier === 'pro' ? '@awesome.me/webawesome-pro' : '@awesome.me/webawesome';

  const webawesomePath = path.join(cwd, config.utilsDir || 'src/lib', 'webawesome.ts');

  // Check if file exists
  if (!(await fs.pathExists(webawesomePath))) {
    return; // Skip if webawesome.ts doesn't exist
  }

  const content = await fs.readFile(webawesomePath, 'utf-8');
  const componentImport = `import '${packageName}/dist/components/${component.tagName.replace('wa-', '')}/${component.tagName.replace('wa-', '')}.js';`;

  // Check if import already exists
  if (content.includes(componentImport)) {
    return; // Already imported
  }

  // Find the section with component imports
  const importMarker = '// Import Web Awesome components (registers web components)';
  if (!content.includes(importMarker)) {
    return; // Can't find marker, skip
  }

  // Insert the new import after the marker
  const lines = content.split('\n');
  const markerIndex = lines.findIndex(line => line.includes(importMarker));

  if (markerIndex !== -1) {
    // Find the last import line after the marker
    let insertIndex = markerIndex + 1;
    while (insertIndex < lines.length && lines[insertIndex].trim().startsWith('import ')) {
      insertIndex++;
    }

    // Insert the new import
    lines.splice(insertIndex, 0, componentImport);

    // Write back
    await fs.writeFile(webawesomePath, lines.join('\n'));
  }
}
