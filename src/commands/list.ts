/**
 * List Command
 *
 * Lists all available Web Awesome components, grouped by category,
 * with tier-aware rendering: on Free tier, Pro components are shown
 * dimmed and prefixed with "(Pro)" so users can discover what Pro
 * unlocks. On Pro tier, Pro components carry a "[Pro]" badge so they
 * stay distinguishable from Free ones.
 */

import pc from 'picocolors';
import { getOutput } from '../output/index.js';
import { handleError } from '../errors/index.js';
import { getAllComponents } from '../utils/registry.js';
import { detectTier } from '../utils/tier.js';

interface ListOptions {
  json?: boolean;
  cwd?: string;
}

/**
 * List command
 *
 * Shows all available components grouped by category.
 * On Free tier, Pro components are rendered dimmed with a "(Pro)" prefix.
 */
export async function listCommand(options: ListOptions = {}) {
  const output = getOutput();

  try {
    const components = getAllComponents();

    // JSON output mode — always returns the full registry so machine
    // consumers get a complete view regardless of tier.
    if (options.json) {
      const data = Object.entries(components).map(([name, comp]) => ({
        name,
        category: comp.category,
        description: comp.description,
        tier: comp.tier,
      }));
      process.stdout.write(JSON.stringify(data, null, 2) + '\n');
      return;
    }

    output.intro('kigumi list');

    const cwd = options.cwd ?? process.cwd();

    // Detect tier so we can dim Pro components on Free.
    const tier = await detectTier(cwd);

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
    let proCount = 0;
    for (const [category, items] of Object.entries(byCategory)) {
      content += pc.bold(pc.cyan(`\n${category}`)) + '\n';
      // Sort items alphabetically within each category
      const sortedItems = items.sort((a, b) => a.localeCompare(b));
      for (const item of sortedItems) {
        const component = components[item];
        const isProOnFree = tier === 'free' && component.tier === 'pro';
        if (isProOnFree) {
          proCount += 1;
          // Dimmed row with explicit (Pro) prefix on the description
          content +=
            pc.dim(`  ○ ${item.padEnd(15)} (Pro) ${component.description}`) +
            '\n';
        } else {
          const proBadge =
            component.tier === 'pro' ? `${pc.magenta('[Pro]')} ` : '';
          content += `  ${pc.green('○')} ${pc.white(item.padEnd(15))} ${proBadge}${pc.dim(component.description)}\n`;
        }
      }
    }

    output.note('Available Components', content);

    const total = Object.keys(components).length;
    const summary =
      tier === 'free' && proCount > 0
        ? `\nTotal: ${pc.cyan(total)} components (${pc.cyan(proCount)} Pro — require Web Awesome Pro token)\n`
        : `\nTotal: ${pc.cyan(total)} components\n`;

    output.outro(
      pc.dim(summary) +
        pc.white('Add a component: ') +
        pc.cyan('npx kigumi add <component>')
    );
  } catch (error) {
    handleError(error, output);
  }
}
