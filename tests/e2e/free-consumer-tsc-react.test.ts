/**
 * Free consumer tsc, React (issue #73) plus the Next ambient declaration
 * (issue #78).
 *
 * An ephemeral Vite-React project created with the real CLI (`init`, then
 * `add --all`), typechecked with that project's own `tsc -b`. Vite's react-ts
 * template does not set `strict`, and `tsc -b` rejects a `--strict` flag, so
 * `prepare` turns `strict` on in the consumer tsconfig before that `tsc -b`.
 *
 * The same add-output is then typechecked a second time as a Next project
 * sees it: `web-awesome.d.ts` (what `init` writes for Next) in place of
 * `vite-env.d.ts`, and no `vite/client` types. There is no Next build and no
 * Next install. The Pages Router CSS strip is not covered here.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { readJSONWithComments } from '../../src/utils/json.js';
import { generateNextEnvDts } from '../../src/utils/regenerate.js';
import { CREATE_VITE_VERSION } from '../../src/constants.js';
import {
  FREE_PACKAGE,
  TSC_TIMEOUT_MS,
  commandText,
  describeFreeConsumer,
} from './_helpers/free-consumer.js';

const TEST_DIR = path.resolve(__dirname, '../.tmp-e2e-free-consumer-tsc-react');

const NEXT_AMBIENT_DIR = 'next-ambient';
const NEXT_TSCONFIG = 'tsconfig.next.json';
const VITE_ONLY_FILE = 'planted-vite-only.ts';

/**
 * Stand-in for the one declaration Next's own ambient types
 * (`next/types/global.d.ts`) give these files. TypeScript 6 checks
 * side-effect imports, so without it every Template's `import './X.css'` is
 * TS2882, which no Next project reports. Copied rather than installing
 * `next`: this pass is scoped to the declaration Kigumi writes, not to Next.
 */
const NEXT_CSS_DECLARATION = "declare module '*.css' {}\n";

describeFreeConsumer(
  {
    title: 'Free consumer tsc: React',
    dir: TEST_DIR,
    scaffold: async (dir) => {
      await fs.ensureDir(dir);
      await execa(
        'pnpm',
        [
          'create',
          `vite@${CREATE_VITE_VERSION}`,
          '.',
          '--template',
          'react-ts',
        ],
        { cwd: dir }
      );
    },
    initArgs: ['--framework=react', '--theme=awesome', '--typescript', '--yes'],
    prepare: async (dir) => {
      // The scaffold leaves `strict` unset. `tsc -b` rejects a `--strict`
      // flag, so enable it on the config that build reads. Vite ships this
      // file as JSONC; init may or may not have rewritten it.
      const tsconfigPath = path.join(dir, 'tsconfig.app.json');
      const tsconfig = (await readJSONWithComments(tsconfigPath)) as {
        compilerOptions?: { strict?: boolean };
      };
      expect(tsconfig.compilerOptions?.strict).not.toBe(false);
      tsconfig.compilerOptions = {
        ...tsconfig.compilerOptions,
        strict: true,
      };
      await fs.writeJSON(tsconfigPath, tsconfig, { spaces: 2 });
    },
    typecheck: ['tsc', '-b'],
    templateFile: (name) => `${name}.tsx`,
    planted: {
      file: 'src/planted-consumer-error.tsx',
      source: [
        'export function take(value: string): string {',
        '  return value;',
        '}',
        'export const result = take(null);',
        '',
      ].join('\n'),
    },
  },
  (consumer) => {
    describe('under the Next ambient declaration', () => {
      const dtsPath = path.join(
        consumer.dir,
        NEXT_AMBIENT_DIR,
        'web-awesome.d.ts'
      );
      let componentsDir = '';

      const nextTsc = () => consumer.exec(['tsc', '-b', NEXT_TSCONFIG]);

      beforeAll(async () => {
        componentsDir = await consumer.componentsDir();

        // The function `init` calls for a Next project. A Vite project never
        // reaches that branch, so this is the highest seam that writes it.
        await generateNextEnvDts(consumer.dir, NEXT_AMBIENT_DIR, FREE_PACKAGE);
        await fs.writeFile(
          path.join(consumer.dir, NEXT_AMBIENT_DIR, 'next-css.d.ts'),
          NEXT_CSS_DECLARATION
        );

        // Same compiler options as the Vite pass, so the only difference is
        // the ambient declaration. `types: []` drops `vite/client`, and
        // `include` is the add-output alone: the Vite scaffold's own App.tsx
        // imports an SVG, which only `vite/client` declares.
        await fs.writeJSON(
          path.join(consumer.dir, NEXT_TSCONFIG),
          {
            extends: './tsconfig.app.json',
            compilerOptions: {
              tsBuildInfoFile: './node_modules/.tmp/tsconfig.next.tsbuildinfo',
              types: [],
            },
            include: [componentsDir, NEXT_AMBIENT_DIR],
          },
          { spaces: 2 }
        );
      });

      it('writes the Next declaration without a vite/client reference', async () => {
        const dts = await fs.readFile(dtsPath, 'utf8');
        expect(dts).toContain(
          'interface IntrinsicElements extends CustomElements'
        );
        expect(dts).not.toContain('vite/client');
      });

      it(
        'typechecks the same add-output',
        async () => {
          const result = await nextTsc();
          expect(result.exitCode, commandText(result)).toBe(0);
        },
        TSC_TIMEOUT_MS
      );

      it(
        'rejects a vite/client-only API that the Vite pass accepts',
        async () => {
          const plantedPath = path.join(
            consumer.dir,
            componentsDir,
            VITE_ONLY_FILE
          );
          await fs.writeFile(
            plantedPath,
            'export const dev: boolean = import.meta.env.DEV;\n'
          );
          try {
            // The planted file is valid where vite/client is loaded, so the
            // Next failure below comes from its absence and nothing else.
            const vite = await consumer.typecheck();
            expect(vite.exitCode, commandText(vite)).toBe(0);

            const next = await nextTsc();
            const output = commandText(next);
            expect(
              next.exitCode,
              `the Next pass accepted import.meta.env in ${VITE_ONLY_FILE}, ` +
                `so vite/client is still in scope\n${output}`
            ).not.toBe(0);
            expect(output).toContain(VITE_ONLY_FILE);
            expect(output).toContain('error TS2339');
            expect(output).toContain(
              "Property 'env' does not exist on type 'ImportMeta'."
            );
          } finally {
            await fs.remove(plantedPath);
          }
        },
        TSC_TIMEOUT_MS * 2
      );
    });
  }
);
