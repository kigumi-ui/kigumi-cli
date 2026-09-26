/**
 * Stub for every Web Awesome component deep-import (`.../dist/components/**\/*.js`),
 * aliased in `vitest.config.ts`. Neither the Free nor the Pro package is a real
 * dependency of this repo, so a Template's dynamic `import('@awesome.me/webawesome...')`
 * cannot resolve at the module-graph level — Vite's import analysis needs
 * something resolvable before a `vi.mock`/`vi.doMock` factory can intercept it
 * (see the registry-wide React function harness, issue #75).
 *
 * The stub registers nothing: `customElements.get(tagName)` staying undefined
 * after mount is itself one of the harness's assertions.
 */
export default class WebAwesomeComponentStub {}
