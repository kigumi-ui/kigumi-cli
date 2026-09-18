import { ESLint, RuleTester } from 'eslint';
import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .js rule, see tools/eslint-plugin-kigumi/index.js
import rule from '../../../tools/eslint-plugin-kigumi/rules/no-raw-throw.js';

/**
 * A raw Error reaches handleError as UnknownError: exit code 1 whatever went
 * wrong, no semantic code, and a generic suggestion. Issue #1 converted 32
 * such throws; this rule keeps the count at zero.
 */
const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-raw-throw', rule, {
  valid: [
    {
      name: 'throwing a typed Kigumi error',
      code: "throw new ValidationError('registry', name);",
    },
    {
      name: 'throwing an internal invariant',
      code: "throw new InternalInvariantError('unreachable');",
    },
    {
      name: 'rethrowing a caught error',
      code: 'try { f(); } catch (e) { throw e; }',
    },
    {
      name: 'constructing an Error without throwing it',
      code: "const cause = new Error('inner'); report(cause);",
    },
    {
      name: 'passing an Error as a cause',
      code: "throw new RegistryFetchError('a', 'b', 'c', { cause: new Error('x') });",
    },
  ],

  invalid: [
    {
      name: 'raw Error',
      code: "throw new Error('boom');",
      errors: [{ messageId: 'rawThrow' }],
    },
    {
      name: 'raw TypeError',
      code: "throw new TypeError('boom');",
      errors: [{ messageId: 'rawThrow' }],
    },
    {
      name: 'raw RangeError',
      code: "throw new RangeError('boom');",
      errors: [{ messageId: 'rawThrow' }],
    },
    {
      name: 'raw Error with a cause option',
      code: "throw new Error('boom', { cause: err });",
      errors: [{ messageId: 'rawThrow' }],
    },
  ],
});

/**
 * A rule file that exists but is never registered is dead code, and its
 * RuleTester cases keep passing because they import the rule directly. This
 * asserts the wiring instead: the plugin registers it, and `pnpm lint` would
 * actually reach a real file through it.
 *
 * The plugin's rules map and eslint.config.js are both one-line edits that
 * every new rule makes in the same place, so they are exactly where a merge
 * resolution silently drops one.
 */
describe('no-raw-throw is wired up, not just written', () => {
  it('is registered in the plugin under its own name', async () => {
    const plugin = (
      await import('../../../tools/eslint-plugin-kigumi/index.js')
    ).default;
    expect(Object.keys(plugin.rules ?? {})).toContain('no-raw-throw');
  });

  it('reports through a real ESLint run over src/', async () => {
    const eslint = new ESLint({
      overrideConfigFile: new URL('../../../eslint.config.js', import.meta.url)
        .pathname,
    });
    const [result] = await eslint.lintText("throw new Error('x');", {
      filePath: new URL('../../../src/__wiring-probe.ts', import.meta.url)
        .pathname,
    });
    expect(result.messages.map((m) => m.ruleId)).toContain(
      'kigumi/no-raw-throw'
    );
  });
});
