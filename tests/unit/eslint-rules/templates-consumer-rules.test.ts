/**
 * Templates are copied verbatim into consumer projects, so `pnpm lint` must
 * hold them to the rules a consumer's lint config runs. Issue #136: the
 * repo turned `no-explicit-any` and `no-empty-object-type` off for
 * `templates/**`, and a default create-vite React project failed on three
 * generated wrappers that this repo never saw fail.
 *
 * The check compares resolved configs, not lint output: it fails the moment
 * the repo config drops or weakens a consumer rule for any Template file,
 * whether or not a Template currently violates that rule. `pnpm lint` then
 * runs those rules over every Template. The one deliberate difference is
 * `SETUP_DEPENDENT_RULES` (`no-undef`), and a separate case fails once that
 * exception no longer excuses anything.
 */
import path from 'node:path';

import { ESLint, type Linter } from 'eslint';
import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';

import {
  ROOT,
  SETUP_DEPENDENT_RULES,
  consumerESLint,
} from '../_helpers/consumer-lint.js';

const repoESLint = new ESLint({ cwd: ROOT });

/** Every Template kind a consumer receives, keyed by its file suffix. */
const KINDS: Record<string, RegExp> = {
  'react .tsx': /\/react\/.*(?<!\.test)\.tsx$/,
  'react .jsx': /\/react\/.*(?<!\.test)\.jsx$/,
  'react .test.tsx': /\/react\/.*\.test\.tsx$/,
  'react .test.jsx': /\/react\/.*\.test\.jsx$/,
  'vue .vue': /\/vue\/.*(?<!\.js)\.vue$/,
  'vue .js.vue': /\/vue\/.*\.js\.vue$/,
  'vue .test.ts': /\/vue\/.*\.test\.ts$/,
  'vue .test.js': /\/vue\/.*\.test\.js$/,
  'angular .component.ts': /\/angular\/.*\.component\.ts$/,
  'angular .component.spec.ts': /\/angular\/.*\.component\.spec\.ts$/,
};

function templateFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?|vue)$/.test(entry.name)) out.push(full);
    }
  };
  walk(path.join(ROOT, 'templates'));
  return out.sort();
}

const FILES = templateFiles();

type RuleEntry = Linter.RuleEntry | undefined;

function isEnabled(entry: RuleEntry): boolean {
  const severity = Array.isArray(entry) ? entry[0] : entry;
  return severity !== undefined && severity !== 0 && severity !== 'off';
}

async function enabledRules(
  eslint: ESLint,
  file: string
): Promise<Record<string, RuleEntry>> {
  const config = (await eslint.calculateConfigForFile(file)) as Linter.Config;
  return Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(([, entry]) => isEnabled(entry))
  );
}

/** `rule: consumer X, repo Y` for each consumer rule the repo differs on. */
async function drift(file: string): Promise<string[]> {
  const expected = await enabledRules(consumerESLint, file);
  // Premise: the baseline resolved for this file. An empty rule set would
  // make the comparison pass without checking anything.
  expect(expected, path.relative(ROOT, file)).toHaveProperty(
    '@typescript-eslint/no-explicit-any'
  );
  const actual = await enabledRules(repoESLint, file);
  return Object.entries(expected)
    .filter(
      ([rule, entry]) => JSON.stringify(actual[rule]) !== JSON.stringify(entry)
    )
    .map(
      ([rule, entry]) =>
        `${rule}: consumer ${JSON.stringify(entry)}, repo ${JSON.stringify(actual[rule] ?? 'off')}`
    );
}

describe('Template lint rules match a consumer baseline (issue #136)', () => {
  it('sorts every Template file into exactly one kind', () => {
    const unsorted = FILES.filter(
      (file) =>
        Object.values(KINDS).filter((pattern) => pattern.test(file)).length !==
        1
    ).map((file) => path.relative(ROOT, file));
    expect(unsorted).toEqual([]);
  });

  it.each(Object.entries(KINDS))(
    'every %s Template gets each consumer rule, with the consumer options',
    async (_kind, pattern) => {
      const files = FILES.filter((file) => pattern.test(file));
      expect(files.length).toBeGreaterThan(0);
      const findings: string[] = [];
      for (const file of files) {
        for (const line of await drift(file)) {
          const rule = line.slice(0, line.indexOf(':'));
          if (!SETUP_DEPENDENT_RULES.has(rule)) {
            findings.push(`${path.relative(ROOT, file)}: ${line}`);
          }
        }
      }
      expect(findings).toEqual([]);
    }
  );

  it('still needs every setup-dependent exception somewhere', async () => {
    // A stale exception would silently widen what the repo may turn off.
    const excused = new Set<string>();
    for (const file of FILES) {
      for (const line of await drift(file)) {
        excused.add(line.slice(0, line.indexOf(':')));
      }
    }
    expect([...excused].sort()).toEqual([...SETUP_DEPENDENT_RULES].sort());
  });
});
