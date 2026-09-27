/**
 * The lint baseline a consumer project runs over the wrappers Kigumi copies
 * into it: `@eslint/js` + typescript-eslint `recommended`, which create-vite
 * (react-ts), create-vue (`@vue/eslint-config-typescript`) and angular-eslint
 * all build on (issue #136). Framework plugins on top are not installed here.
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
  // Which globals exist (browser, vitest) is each project's own setup, not
  // something a wrapper can satisfy.
  { rules: { 'no-undef': 'off' } },
];

const consumer = new ESLint({
  cwd: ROOT,
  overrideConfigFile: true,
  overrideConfig: CONSUMER_BASELINE,
});

/**
 * Lint `source` as if it sat at `filePath` in a consumer project, and return
 * each finding as `rule (line): message`. `filePath` picks the parser (.vue).
 */
export async function lintAsConsumer(
  source: string,
  filePath: string
): Promise<string[]> {
  const [result] = await consumer.lintText(source, {
    filePath: path.join(ROOT, filePath),
  });
  return result.messages.map(
    (m) => `${m.ruleId ?? 'parse'} (${m.line}): ${m.message}`
  );
}
