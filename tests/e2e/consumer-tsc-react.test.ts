/**
 * Consumer tsc, React: Free (issue #73) and Pro (issue #79), each plus the
 * Next ambient declaration (issue #78).
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
 * And a third time against React 18's types: `@types/react@18` and
 * `@types/react-dom@18` swapped in, the same strict `tsc -b`, then React 19's
 * types restored. Kigumi supports React 18, and this is the only check that
 * holds the Templates to it. Types only: React 19 behaviour that shows at
 * runtime alone, such as a callback ref returning a cleanup that React 18
 * never calls, typechecks against both and is not covered here.
 *
 * Run with: pnpm test:e2e
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { readJSONWithComments } from '../../src/utils/json.js';
import { generateNextEnvDts } from '../../src/utils/regenerate.js';
import { CREATE_VITE_VERSION } from '../../src/constants.js';
import {
  SCAFFOLD_TIMEOUT_MS,
  TSC_TIMEOUT_MS,
  commandText,
  describeConsumers,
  type Consumer,
  type PlantedError,
} from './_helpers/consumer.js';

const NEXT_AMBIENT_DIR = 'next-ambient';
const NEXT_TSCONFIG = 'tsconfig.next.json';
const NEXT_TSC = ['tsc', '-b', NEXT_TSCONFIG];

/** Valid where `vite/client` is loaded, an error anywhere else. */
const VITE_ONLY_ERROR: PlantedError = {
  file: 'planted-vite-only.ts',
  source: 'export const dev: boolean = import.meta.env.DEV;\n',
  diagnostics: [
    'error TS2339',
    "Property 'env' does not exist on type 'ImportMeta'.",
  ],
  failsBecause: 'so vite/client is still in scope',
};

/**
 * The one declaration Next's own ambient types give these files, copied
 * verbatim from `next/types/global.d.ts` (Next 16.2.4), where it is declared
 * for `noUncheckedSideEffectImports`. TypeScript 6 checks side-effect
 * imports, so without it every Template's `import './X.css'` is TS2882,
 * which no Next project reports. Copied rather than installing `next`: this
 * pass is scoped to the declaration Kigumi writes, not to Next.
 */
const NEXT_CSS_DECLARATION = "declare module '*.css' {}\n";

/** The type packages the React 18 pass swaps, each to its React 18 major. */
const REACT_TYPE_PACKAGES = ['@types/react', '@types/react-dom'] as const;

/** Valid against React 19's types, an error against React 18's. */
const REACT_19_ONLY_ERROR: PlantedError = {
  file: 'planted-react-19-only.ts',
  source:
    "import { useActionState } from 'react';\n" +
    'export const action = useActionState;\n',
  diagnostics: ['error TS2305', "has no exported member 'useActionState'"],
  failsBecause: "so React 19's types are still the ones compiled",
};

/** A Web Awesome element given a value its own declared type rejects. */
const WA_ATTRIBUTE_ERROR: PlantedError = {
  file: 'planted-wa-attribute.tsx',
  source: 'export const button = <wa-button variant="not-a-variant" />;\n',
  diagnostics: ['error TS2322', `Type '"not-a-variant"' is not assignable`],
  failsBecause: 'so wa-* elements accept anything under these types',
};

/** The major of a package installed in the consumer, from its package.json. */
async function installedMajor(
  consumer: Consumer,
  name: string
): Promise<string> {
  const { version } = (await fs.readJSON(
    path.join(consumer.dir, 'node_modules', ...name.split('/'), 'package.json')
  )) as { version: string };
  return version.split('.')[0];
}

/** `pnpm add -D` in the consumer; a failed install fails the suite. */
async function addDevDependencies(
  consumer: Consumer,
  specs: string[]
): Promise<void> {
  const result = await execa('pnpm', ['add', '-D', ...specs], {
    cwd: consumer.dir,
    reject: false,
  });
  expect(
    result.exitCode,
    commandText({ ...result, exitCode: result.exitCode ?? 1 })
  ).toBe(0);
}

describeConsumers(
  {
    framework: 'React',
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
    strictOnlyError: {
      file: 'planted-consumer-error.tsx',
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
      const nextTsc = () => consumer.exec(NEXT_TSC);

      beforeAll(async () => {
        // The function `init` calls for a Next project. A Vite project never
        // reaches that branch, so this is the highest seam that writes it.
        await generateNextEnvDts(
          consumer.dir,
          NEXT_AMBIENT_DIR,
          consumer.packageName
        );
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
            include: [consumer.componentsDir(), NEXT_AMBIENT_DIR],
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
        'is strict: rejects the strict-only error beside the Templates',
        async () => {
          // Strictness is inherited from tsconfig.app.json, so show it holds.
          await consumer.withPlanted(consumer.strictOnlyError, async () => {
            consumer.expectRejected(
              await nextTsc(),
              NEXT_TSC.join(' '),
              consumer.strictOnlyError
            );
          });
        },
        TSC_TIMEOUT_MS
      );

      it(
        'rejects a vite/client-only API that the Vite pass accepts',
        async () => {
          await consumer.withPlanted(VITE_ONLY_ERROR, async () => {
            // The plant is valid where vite/client is loaded, so the Next
            // failure below comes from its absence and nothing else.
            const vite = await consumer.typecheck();
            expect(vite.exitCode, commandText(vite)).toBe(0);

            consumer.expectRejected(
              await nextTsc(),
              NEXT_TSC.join(' '),
              VITE_ONLY_ERROR
            );
          });
        },
        TSC_TIMEOUT_MS * 2
      );
    });

    describe('against React 18 types', () => {
      const majorsBefore: Record<string, string> = {};
      let restoreSpecs: string[] = [];

      beforeAll(async () => {
        const packageJson = (await fs.readJSON(
          path.join(consumer.dir, 'package.json')
        )) as { devDependencies?: Record<string, string> };

        for (const name of REACT_TYPE_PACKAGES) {
          majorsBefore[name] = await installedMajor(consumer, name);
        }
        restoreSpecs = REACT_TYPE_PACKAGES.map(
          (name) => `${name}@${packageJson.devDependencies?.[name]}`
        );

        // The plant must be valid under React 19's types, so its failure
        // below comes from the swap and nothing else.
        await consumer.withPlanted(REACT_19_ONLY_ERROR, async () => {
          const react19 = await consumer.typecheck();
          expect(react19.exitCode, commandText(react19)).toBe(0);
        });

        await addDevDependencies(
          consumer,
          REACT_TYPE_PACKAGES.map((name) => `${name}@18`)
        );
      }, SCAFFOLD_TIMEOUT_MS);

      afterAll(async () => {
        await addDevDependencies(consumer, restoreSpecs);
      }, SCAFFOLD_TIMEOUT_MS);

      it('swaps React 19 types for React 18 types', async () => {
        for (const name of REACT_TYPE_PACKAGES) {
          expect(majorsBefore[name], name).toBe('19');
          expect(await installedMajor(consumer, name), name).toBe('18');
        }
      });

      it(
        'typechecks the same add-output',
        async () => {
          const result = await consumer.typecheck();
          expect(result.exitCode, commandText(result)).toBe(0);
        },
        TSC_TIMEOUT_MS
      );

      it(
        'is strict: rejects the strict-only error beside the Templates',
        async () => {
          await consumer.withPlanted(consumer.strictOnlyError, async () => {
            consumer.expectRejected(
              await consumer.typecheck(),
              'tsc -b',
              consumer.strictOnlyError
            );
          });
        },
        TSC_TIMEOUT_MS
      );

      it(
        'types wa-* elements: rejects a value the element does not accept',
        async () => {
          await consumer.withPlanted(WA_ATTRIBUTE_ERROR, async () => {
            consumer.expectRejected(
              await consumer.typecheck(),
              'tsc -b',
              WA_ATTRIBUTE_ERROR
            );
          });
        },
        TSC_TIMEOUT_MS
      );

      it(
        'rejects a React 19-only API that the React 19 types accept',
        async () => {
          await consumer.withPlanted(REACT_19_ONLY_ERROR, async () => {
            consumer.expectRejected(
              await consumer.typecheck(),
              'tsc -b',
              REACT_19_ONLY_ERROR
            );
          });
        },
        TSC_TIMEOUT_MS
      );
    });
  }
);
