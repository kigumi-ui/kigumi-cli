/**
 * Consumer tsc, Angular: Free (issue #78) and Pro (issue #79).
 *
 * An ephemeral `ng new` workspace created with the real CLI (`init`, then
 * `add --all`), typechecked with `ngc -p tsconfig.app.json --noEmit`.
 * `ng new` turns on `strict` and `strictTemplates`, and its
 * `tsconfig.app.json` includes every `.ts` file under `src/`, so every
 * installed Template is compiled without touching the consumer's config.
 *
 * `ngc`, not `tsc`: a Template's markup is a string that only the Angular
 * compiler reads. Plain `tsc` passed on a Template carrying
 * `[attr.once]`, which Angular rejects (NG5002). The planted error sits in a
 * component template for the same reason: `tsc` accepts that file, so the
 * failing run also shows the template type-checker ran.
 *
 * Run with: pnpm test:e2e
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { ANGULAR_CLI_VERSION } from '../../src/constants.js';
import { toKebabCase } from '../../src/utils/naming.js';
import { describeConsumers } from './_helpers/consumer.js';

describeConsumers({
  framework: 'Angular',
  scaffold: async (dir) => {
    // `ng new` creates the directory itself.
    await execa(
      'pnpm',
      [
        'dlx',
        `@angular/cli@${ANGULAR_CLI_VERSION}`,
        'new',
        'consumer',
        `--directory=${path.basename(dir)}`,
        '--defaults',
        '--interactive=false',
        '--skip-git',
        '--skip-install',
        '--skip-tests',
        '--style=css',
        '--ssr=false',
        '--ai-config=none',
        '--package-manager=pnpm',
      ],
      {
        cwd: path.dirname(dir),
        env: { ...process.env, NG_CLI_ANALYTICS: 'false' },
      }
    );
    // The project sits inside this repository, so pnpm would install it as
    // part of the repository's workspace: no `node_modules` and no
    // `pnpm-lock.yaml` of its own, after which `init` finds no lockfile and
    // runs npm. Its own workspace file makes it a standalone project, as a
    // user's would be.
    await fs.writeFile(path.join(dir, 'pnpm-workspace.yaml'), '');
    await execa('pnpm', ['install'], { cwd: dir });
  },
  initArgs: ['--framework=angular', '--theme=awesome', '--yes'],
  typecheck: ['ngc', '-p', 'tsconfig.app.json', '--noEmit'],
  templateFile: (name) => `${toKebabCase(name)}.component.ts`,
  strictOnlyError: {
    file: 'planted-consumer-error.ts',
    source: [
      "import { Component } from '@angular/core';",
      '',
      '@Component({',
      "  selector: 'app-planted-consumer-error',",
      "  template: '{{ take(null) }}',",
      '})',
      'export class PlantedConsumerError {',
      '  take(value: string): string {',
      '    return value;',
      '  }',
      '}',
      '',
    ].join('\n'),
  },
});
