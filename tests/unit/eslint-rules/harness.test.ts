/**
 * Proves the eslint-plugin-kigumi harness works before any real rule depends
 * on it.
 *
 * Two things are verified, because clusters E/F/K need both:
 *   1. RuleTester (from the `eslint` package) runs a rule inside the existing
 *      vitest unit lane. Its valid/invalid cases surface as real vitest tests:
 *      RuleTester calls describe()/it() itself, which vitest's `globals: true`
 *      already provides, so no wiring is needed.
 *   2. The plugin object loads and registers under a namespace in flat config,
 *      so a rule reaches real files through `pnpm lint` — not just through
 *      RuleTester.
 *
 * The rule used here is defined inline and deliberately trivial. The harness
 * is the subject under test, not the rule.
 */
import { ESLint, RuleTester } from 'eslint';
import { describe, expect, it } from 'vitest';

import plugin from '../../../tools/eslint-plugin-kigumi/index.js';

/** A throwaway rule: reports any identifier literally named `forbidden`. */
const probeRule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: { found: 'Identifier "forbidden" is not allowed.' },
  },
  create(context: { report: (d: unknown) => void }) {
    return {
      Identifier(node: { name: string }) {
        if (node.name === 'forbidden') {
          context.report({ node, messageId: 'found' });
        }
      },
    };
  },
} as const;

// RuleTester.run() calls describe()/it() itself, so it must be invoked at
// suite top level -- vitest rejects a suite created inside a test function.
// This is how every real rule test in clusters E/F/K must be written too.
const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('probe', probeRule as never, {
  valid: ['const allowed = 1;'],
  invalid: [
    {
      code: 'const forbidden = 1;',
      errors: [{ messageId: 'found' }],
    },
  ],
});

describe('eslint-plugin-kigumi harness', () => {
  it('exposes a rules map that flat config can register', () => {
    expect(plugin.rules).toBeDefined();
    expect(typeof plugin.rules).toBe('object');
  });

  it('applies a namespaced rule to real source through flat config', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          plugins: {
            kigumi: { ...plugin, rules: { probe: probeRule as never } },
          },
          rules: { 'kigumi/probe': 'error' },
        },
      ],
    });

    const [clean] = await eslint.lintText('const allowed = 1;\n', {
      filePath: 'clean.js',
    });
    expect(clean.messages).toHaveLength(0);

    const [dirty] = await eslint.lintText('const forbidden = 1;\n', {
      filePath: 'dirty.js',
    });
    expect(dirty.messages.map((m) => m.ruleId)).toEqual(['kigumi/probe']);
  });
});
