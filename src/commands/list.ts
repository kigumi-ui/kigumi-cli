/**
 * List Command
 *
 * Lists all available Web Awesome components
 */

import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { handleError } from '../errors/index.js';
import { getAllComponents } from '../utils/registry.js';

/**
 * List command
 *
 * Shows all available components grouped by category
 */
export async function listCommand() {
  const output = getOutput();
  output.intro('kigumi list');

  try {
    const components = getAllComponents();

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
      for (const item of items) {
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
