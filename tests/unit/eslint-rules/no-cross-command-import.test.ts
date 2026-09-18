import { RuleTester } from 'eslint';
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
