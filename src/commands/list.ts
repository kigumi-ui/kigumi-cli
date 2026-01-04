import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getAllComponents } from '../utils/registry.js';

export async function listCommand() {
  const components = getAllComponents();

  p.intro(pc.bgCyan(pc.black(' kigumi list ')));

  // Group by category
  const byCategory: Record<string, string[]> = {};

  for (const [key, component] of Object.entries(components)) {
    if (!byCategory[component.category]) {
      byCategory[component.category] = [];
    }
    byCategory[component.category].push(key);
  }

  // Display components grouped by category
  let output = '';
  for (const [category, items] of Object.entries(byCategory)) {
    output += pc.bold(pc.cyan(`\n${category}`)) + '\n';
    for (const item of items) {
      const component = components[item];
      output += `  ${pc.green('○')} ${pc.white(item.padEnd(15))} ${pc.dim(component.description)}\n`;
    }
  }

  p.note(output, 'Available Components');

  p.outro(
    pc.dim(`\nTotal: ${pc.cyan(Object.keys(components).length)} components\n`) +
      pc.white('Add a component: ') +
      pc.cyan('npx kigumi add <component>')
  );
}
