// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

import kigumiPlugin from './tools/eslint-plugin-kigumi/index.js';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      'dist/**',
      'docs/**',
      'node_modules/**',
      'coverage/**',
      'tests/.tmp-*/**',
      'tests/fixtures/starter-snapshots/**',
    ],
  },
  // House rules live in a local plugin (tools/eslint-plugin-kigumi). It is a
  // plain directory imported by relative path, not an npm package: flat config
  // takes any object with a `rules` map, so no packaging or workspace is
  // needed. Registered here with no rules enabled yet -- clusters E, F and K
  // add the first ones.
  {
    plugins: { kigumi: kigumiPlugin },
  },
  // Commands are leaf nodes: shared code belongs in utils/, never in a sibling
  // command's directory. See issue #4.
  {
    files: ['src/commands/**/*.ts'],
    rules: {
      'kigumi/no-cross-command-import': 'error',
    },
  },
  // Errors carry a semantic code, an exit code and suggestions. A raw Error
  // reaches handleError as UnknownError and loses all three. See issue #1.
  //
  // Scoped to src/: scripts/ and tools/ are build-time code that never runs
  // through the CLI's error handler, so a plain throw is right there.
  {
    files: ['src/**/*.ts'],
    rules: {
      'kigumi/no-raw-throw': 'error',
    },
  },
  {
    // Templates keep the rule's default options, which a consumer runs; see
    // the Templates block below.
    ignores: ['templates/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  // Templates ship as real framework source files. ESLint can syntactically
  // check them without resolving framework imports (typescript-eslint's parser
  // doesn't require resolution by default). Type-check coverage runs as a
  // separate `pnpm typecheck:templates` step, not via parserOptions.project.
  //
  // Templates are copied verbatim into consumer projects, whose lint configs
  // build on `@eslint/js` + typescript-eslint `recommended`. Never turn one of
  // those rules off here: a consumer would see the errors this repo hides
  // (issue #136). The one exception is `no-undef`, below.
  // tests/unit/eslint-rules/templates-consumer-rules.test.ts enforces this.
  {
    files: ['templates/**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Which globals exist (DOM, vitest) is each consumer's own setup, which
      // this repo does not mirror. typescript-eslint already turns it off for
      // .ts/.tsx, so this only differs from a consumer for .js/.jsx.
      'no-undef': 'off',
      // JSDoc examples and comments may include console.log() snippets.
      'no-console': 'off',
    },
  },
  // Vue SFCs need vue-eslint-parser to parse <template>/<script>/<style>.
  // The inner <script> is delegated to typescript-eslint's parser.
  {
    files: ['templates/vue/**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      // As above, plus Vue's compiler macros (`defineProps`), which a Vue
      // consumer's eslint-plugin-vue declares as globals.
      'no-undef': 'off',
      'no-console': 'off',
    },
  }
);
