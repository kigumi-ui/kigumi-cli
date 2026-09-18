import { ESLint, RuleTester } from 'eslint';
import { describe, it, expect } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - plain .js rule, see tools/eslint-plugin-kigumi/index.js
import rule from '../../../tools/eslint-plugin-kigumi/rules/no-cross-command-import.js';

/**
 * Commands are leaf nodes. The rule exists because upgrade.ts imported
 * init/installer.ts — the one cross-command import in the codebase, and the
 * reason installDependencies now lives in utils/. See issue #4.
 *
 * The interesting cases are the negative ones: a barrel importing its own
 * subdirectory (`commands/add.ts` -> `./add/index.js`) is the same *shape* as
 * a violation (`commands/upgrade.ts` -> `./init/installer.js`), so a rule that
 * matched on the import string alone would either miss one or flag the other.
 */
const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
});

ruleTester.run('no-cross-command-import', rule, {
  valid: [
    {
      name: 'command importing from utils/',
      filename: '/repo/src/commands/upgrade.ts',
      code: "import { x } from '../utils/dependency-installer.js';",
    },
    {
      name: 'nested command importing from utils/',
      filename: '/repo/src/commands/add/index.ts',
      code: "import { x } from '../../utils/registry.js';",
    },
    {
      name: 'command importing within its own directory',
      filename: '/repo/src/commands/add/index.ts',
      code: "import { x } from './installer.js';",
    },
    {
      name: 'barrel re-exporting its own subdirectory',
      filename: '/repo/src/commands/add.ts',
      code: "export { addCommand } from './add/index.js';",
    },
    {
      name: 'barrel importing several files from its own subdirectory',
      filename: '/repo/src/commands/registry.ts',
      code: "import { a } from './registry/init.js';",
    },
    {
      name: 'bare package import',
      filename: '/repo/src/commands/upgrade.ts',
      code: "import { execa } from 'execa';",
    },
    {
      name: 'file outside commands/ is not governed',
      filename: '/repo/src/utils/dependency-installer.ts',
      code: "import { x } from '../commands/init/installer.js';",
    },
  ],

  invalid: [
    {
      name: 'the original violation: upgrade.ts -> init/installer.ts',
      filename: '/repo/src/commands/upgrade.ts',
      code: "import { installDependencies } from './init/installer.js';",
      errors: [{ messageId: 'crossCommand' }],
    },
    {
      name: 'nested command reaching sideways into another command',
      filename: '/repo/src/commands/add/index.ts',
      code: "import { x } from '../init/installer.js';",
      errors: [{ messageId: 'crossCommand' }],
    },
    {
      name: 're-export across commands',
      filename: '/repo/src/commands/upgrade.ts',
      code: "export { x } from './init/installer.js';",
      errors: [{ messageId: 'crossCommand' }],
    },
    {
      name: 'export * across commands',
      filename: '/repo/src/commands/upgrade.ts',
      code: "export * from './init/installer.js';",
      errors: [{ messageId: 'crossCommand' }],
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
describe('no-cross-command-import is wired up, not just written', () => {
  it('is registered in the plugin under its own name', async () => {
    const plugin = (
      await import('../../../tools/eslint-plugin-kigumi/index.js')
    ).default;
    expect(Object.keys(plugin.rules ?? {})).toContain(
      'no-cross-command-import'
    );
  });

  it('reports through a real ESLint run over src/commands/', async () => {
    const eslint = new ESLint({
      overrideConfigFile: new URL('../../../eslint.config.js', import.meta.url)
        .pathname,
    });
    const [result] = await eslint.lintText(
      "import { x } from './init/installer.js';\nexport const y = x;\n",
      {
        filePath: new URL(
          '../../../src/commands/__wiring-probe.ts',
          import.meta.url
        ).pathname,
      }
    );
    expect(result.messages.map((m) => m.ruleId)).toContain(
      'kigumi/no-cross-command-import'
    );
  });
});
