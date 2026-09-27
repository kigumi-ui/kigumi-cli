/**
 * The lint baseline a consumer project runs over the wrappers Kigumi copies
 * into it: `@eslint/js` + typescript-eslint `recommended`, unmodified. It is
 * the part create-vite (react-ts), create-vue (`@vue/eslint-config-typescript`)
 * and angular-eslint configs share (issue #136). The framework plugins they
 * add on top are not installed here, so this is not any one of those configs.
 */
import path from 'node:path';

import js from '@eslint/js';
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export const ROOT = path.resolve(import.meta.dirname, '../../..');

export const CONSUMER_BASELINE: Linter.Config[] = [
  // Flat config only lints .js/.mjs/.cjs by default; consumer configs add
  // their own extensions the same way.
  { files: ['**/*.{js,jsx,ts,tsx,vue}'] },
  js.configs.recommended,
  ...(tseslint.configs.recommended as Linter.Config[]),
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
  },
];

/** The one ESLint instance that resolves and runs the consumer baseline. */
export const consumerESLint = new ESLint({
  cwd: ROOT,
  overrideConfigFile: true,
  overrideConfig: CONSUMER_BASELINE,
});

/**
 * Rules whose result depends on the consumer's own setup rather than on the
 * wrapper, so neither `lintAsConsumer()` nor the repo config holds Templates
 * to them. `no-undef` reports every global a project has not declared
 * (`document`, vitest's `describe`, Vue's compiler macros), and which globals
 * exist is each project's choice. typescript-eslint already turns it off for
 * `.ts`/`.tsx`, where the compiler checks names.
 */
export const SETUP_DEPENDENT_RULES: ReadonlySet<string> = new Set(['no-undef']);

/**
 * Lint `source` as if it sat at `filePath` in a consumer project, and return
 * each finding as `rule (line): message`, minus `SETUP_DEPENDENT_RULES`.
 * `filePath` picks the parser (.vue).
 */
export async function lintAsConsumer(
  source: string,
  filePath: string
): Promise<string[]> {
  const [result] = await consumerESLint.lintText(source, {
    filePath: path.join(ROOT, filePath),
  });
  return result.messages
    .filter((m) => !(m.ruleId && SETUP_DEPENDENT_RULES.has(m.ruleId)))
    .map((m) => `${m.ruleId ?? 'parse'} (${m.line}): ${m.message}`);
}
