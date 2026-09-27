/**
 * Templates are copied verbatim into consumer projects, so `pnpm lint` must
 * hold them to the rules a consumer's lint config runs. Issue #136: the
 * repo turned `no-explicit-any` and `no-empty-object-type` off for
 * `templates/**`, and a default create-vite React project failed on three
 * generated wrappers that this repo never saw fail.
 *
 * The check compares resolved configs, not lint output: it fails the moment
 * the repo config drops or weakens a consumer rule for a Template file,
 * whether or not any Template currently violates that rule. `pnpm lint`
 * then runs those rules over every Template.
 */
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { CONSUMER_BASELINE, ROOT } from '../_helpers/consumer-lint.js';

// One file per Template glob: component, JS variant and test for each
// framework. Real files, so a renamed glob cannot silently match nothing.
const TEMPLATE_FILES = [
  'templates/react/Spinner/Spinner.tsx',
  'templates/react/Spinner/Spinner.jsx',
  'templates/react/Spinner/Spinner.test.tsx',
  'templates/react/Spinner/Spinner.test.jsx',
  'templates/vue/Spinner/Spinner.vue',
  'templates/vue/Spinner/Spinner.js.vue',
  'templates/vue/Spinner/Spinner.test.ts',
  'templates/vue/Spinner/Spinner.test.js',
  'templates/angular/Spinner/spinner.component.ts',
  'templates/angular/Spinner/spinner.component.spec.ts',
];

const consumer = new ESLint({
  cwd: ROOT,
  overrideConfigFile: true,
  overrideConfig: CONSUMER_BASELINE,
});

const repo = new ESLint({ cwd: ROOT });

type RuleEntry = Linter.RuleEntry | undefined;

function isEnabled(entry: RuleEntry): boolean {
  const severity = Array.isArray(entry) ? entry[0] : entry;
  return severity !== undefined && severity !== 0 && severity !== 'off';
}

async function enabledRules(
  eslint: ESLint,
  file: string
): Promise<Record<string, RuleEntry>> {
  const config = (await eslint.calculateConfigForFile(
    path.join(ROOT, file)
  )) as Linter.Config;
  return Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(([, entry]) => isEnabled(entry))
  );
}

describe('Template lint rules match a consumer baseline (issue #136)', () => {
  it.each(TEMPLATE_FILES)(
    '%s gets every consumer rule, with the consumer options',
    async (file) => {
      const expected = await enabledRules(consumer, file);
      // Premise: the baseline resolved for this file. An empty rule set would
      // make the comparison below pass without checking anything.
      expect(expected).toHaveProperty('@typescript-eslint/no-explicit-any');

      const actual = await enabledRules(repo, file);
      const drift = Object.entries(expected)
        .filter(
          ([rule, entry]) =>
            JSON.stringify(actual[rule]) !== JSON.stringify(entry)
        )
        .map(
          ([rule, entry]) =>
            `${rule}: consumer ${JSON.stringify(entry)}, repo ${JSON.stringify(actual[rule] ?? 'off')}`
        );

      expect(drift).toEqual([]);
    }
  );
});
