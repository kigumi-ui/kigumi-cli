import { RuleTester } from 'eslint';
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
