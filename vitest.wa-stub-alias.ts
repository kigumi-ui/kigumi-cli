import path from 'node:path';

/**
 * Shared Vite `resolve.alias` entry: every Web Awesome component deep-import
 * (`.../dist/components/**\/*.js`, Free or Pro) resolves to a stub module.
 *
 * Neither WA package is a real dependency of this repo. The registry-wide
 * React function harness (`tests/unit/react-function-harness-registry.test.ts`,
 * issue #75) dynamically imports every Template, and each Template imports its
 * own `@awesome.me/webawesome(-pro)/dist/components/**` module — without this
 * alias, Vite's import analysis fails to resolve the specifier before any
 * per-test mock factory can intercept it. Used by both `vitest.config.ts`
 * (the default config, e.g. `vitest related`) and `vitest.unit.config.ts`
 * (`pnpm test`), so the two configs cannot drift on this entry.
 */
export const WA_COMPONENT_STUB_ALIAS = {
  find: /^@awesome\.me\/webawesome(-pro)?\/dist\/components\/.+\.js$/,
  replacement: path.resolve(
    __dirname,
    'tests/unit/_helpers/wa-component-stub.ts'
  ),
};
