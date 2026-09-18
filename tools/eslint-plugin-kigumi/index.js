// @ts-check
/**
 * eslint-plugin-kigumi — house rules for this repository.
 *
 * WHY THIS IS A PLAIN DIRECTORY, NOT A PACKAGE:
 * ESLint flat config accepts any object with a `rules` map as a plugin, so a
 * relative import is enough. There is exactly one consumer (eslint.config.js),
 * and the rules are never published. Making this a workspace package would
 * mean adding a `packages:` key to pnpm-workspace.yaml — converting a
 * deliberately single-package repo into a workspace and rewriting the lockfile
 * that 18 `pnpm install --frozen-lockfile` CI steps consume — to buy nothing.
 *
 * WHY THE RULES ARE .js, NOT .ts:
 * `pnpm lint` runs with no build step in front of it, and lint-staged invokes
 * a bare `eslint --fix` on staged files with no opportunity to inject a
 * loader. A .ts rule would need compiling before ESLint could load it, so
 * every lint would depend on a prior build. Rules are plain .js with
 * `// @ts-check` + JSDoc instead, exactly like eslint.config.js itself.
 *
 * ADDING A RULE:
 *   1. tools/eslint-plugin-kigumi/rules/<rule-name>.js
 *   2. import + register it in the `rules` map below
 *   3. tests/unit/eslint-rules/<rule-name>.test.ts using RuleTester
 *   4. turn it on in eslint.config.js as 'kigumi/<rule-name>'
 *
 * Rules must be AST-based. A regex over source text is what let the
 * `className` anti-pattern check sit dead for months (see cluster A).
 * no-cross-command-import is a worked example of why: it resolves each import
 * against the importing file's own path, because `commands/add.ts` importing
 * `./add/index.js` (legitimate) and `commands/upgrade.ts` importing
 * `./init/installer.js` (a violation) are indistinguishable as strings.
 */

import noCrossCommandImport from './rules/no-cross-command-import.js';

/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  meta: {
    name: 'eslint-plugin-kigumi',
    version: '0.0.0',
  },
  rules: {
    'no-cross-command-import': noCrossCommandImport,
  },
};

export default plugin;
