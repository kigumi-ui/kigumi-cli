/**
 * List Command
 *
 * Lists all available Web Awesome components
 */

import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { handleError } from '../errors/index.js';
import { getAllComponents } from '../utils/registry.js';

interface ListOptions {
  json?: boolean;
}

/**
 * List command
 *
 * Shows all available components grouped by category
 */
export async function listCommand(options: ListOptions = {}) {
  const output = getOutput();

  try {
    const components = getAllComponents();

    // JSON output mode
    if (options.json) {
      const data = Object.entries(components).map(([name, comp]) => ({
        name,
        category: comp.category,
        description: comp.description,
      }));
      process.stdout.write(JSON.stringify(data, null, 2) + '\n');
      return;
    }

    output.intro('kigumi list');

    // Group by category
    const byCategory: Record<string, string[]> = {};

    for (const [key, component] of Object.entries(components)) {
      if (!byCategory[component.category]) {
        byCategory[component.category] = [];
      }
      byCategory[component.category].push(key);
    }

    // Display components grouped by category
    let content = '';
    for (const [category, items] of Object.entries(byCategory)) {
      content += pc.bold(pc.cyan(`\n${category}`)) + '\n';
      // Sort items alphabetically within each category
      const sortedItems = items.sort((a, b) => a.localeCompare(b));
      for (const item of sortedItems) {
        const component = components[item];
        content += `  ${pc.green('○')} ${pc.white(item.padEnd(15))} ${pc.dim(component.description)}\n`;
      }
    }

    output.note('Available Components', content);

    output.outro(
      pc.dim(
        `\nTotal: ${pc.cyan(Object.keys(components).length)} components\n`
      ) +
        pc.white('Add a component: ') +
        pc.cyan('npx kigumi add <component>')
    );
  } catch (error) {
    handleError(error, output);
  }
}
