import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Shared Vite `resolve.alias` entry: every Web Awesome component deep-import
 * (`.../dist/components/**\/*.js`, Free or Pro) resolves to a stub module.
 *
 * The Free package is a real devDependency, so its modules would resolve; the
 * Pro package is not installed at all, and a Pro Template's import cannot
 * resolve on a Free checkout. Loading the real Free modules is also unwanted:
 * the registry-wide React function harness
 * (`tests/unit/react-function-harness-registry.test.ts`, issue #75) imports
 * every Template, and pulling in each component's real runtime buys nothing
 * for a contract proof while costing the whole WA chunk graph per test.
 *
 * `vi.mock`/`vi.doMock` cannot cover this: mock hoisting needs literal call
 * sites, and the loop resolves 87 specifiers dynamically. Used by both
 * `vitest.config.ts` (the default config, e.g. `vitest related`) and
 * `vitest.unit.config.ts` (`pnpm test`), so the two cannot drift on this entry.
 */
export const WA_COMPONENT_STUB_ALIAS = {
  find: /^@awesome\.me\/webawesome(-pro)?\/dist\/components\/.+\.js$/,
  replacement: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    'tests/unit/_helpers/wa-component-stub.ts'
  ),
};
