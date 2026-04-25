// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

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
      '*.config.js',
      '*.config.ts',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  // Templates ship as real framework source files. ESLint can syntactically
  // check them without resolving framework imports (typescript-eslint's parser
  // doesn't require resolution by default). Type-check coverage runs as a
  // separate `pnpm typecheck:templates` step, not via parserOptions.project.
  {
    files: ['templates/**/*.{ts,tsx,js,jsx}'],
    rules: {
      // Templates intentionally widen to `unknown` / use bare `any` casts in
      // a few spots (Angular CVA, React forwarded attrs).
      '@typescript-eslint/no-explicit-any': 'off',
      // Test templates use vitest / DOM globals; we don't wire parserOptions.project here.
      'no-undef': 'off',
      // Wrappers re-export named symbols that are unused at the wrapper level.
      '@typescript-eslint/no-unused-vars': 'off',
      // JSDoc examples and comments may include console.log() snippets.
      'no-console': 'off',
      // `interface XProps extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {}`
      // is the canonical wrapper-with-no-extra-props pattern. Switching to a
      // type alias would change the user-facing template output.
      '@typescript-eslint/no-empty-object-type': 'off',
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
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  }
);
