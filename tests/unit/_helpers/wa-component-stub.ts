/**
 * Stub every Web Awesome component deep-import (`.../dist/components/**\/*.js`)
 * resolves to, aliased from `vitest.config.ts` and `vitest.unit.config.ts` via
 * `vitest.wa-stub-alias.ts`. See that file for why the real modules are not
 * loaded: Pro is not installed, and Free's runtime is dead weight for a
 * contract proof.
 *
 * The default export stands in for a component class, which is what a
 * Template's `import(...)` reads. It registers nothing, so the harness's
 * `customElements.get(tagName)` assertion stays meaningful.
 */
export default class WebAwesomeComponentStub {}
