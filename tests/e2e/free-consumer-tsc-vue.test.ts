/**
 * Free consumer tsc, Vue (issue #78).
 *
 * An ephemeral create-vite vue-ts project created with the real CLI (`init`,
 * then `add --all`), typechecked with that project's own `vue-tsc -b`, the
 * first half of its `build` script. The scaffold's tsconfig extends
 * `@vue/tsconfig`, which sets `strict`, so nothing is changed before the
 * typecheck; the planted error is what shows strict mode is on. It is a
 * `.vue` file, which plain `tsc` cannot read.
 *
 * Run with: pnpm test:e2e
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { CREATE_VITE_VERSION } from '../../src/constants.js';
import { describeFreeConsumer } from './_helpers/free-consumer.js';

describeFreeConsumer({
  title: 'Free consumer tsc: Vue',
  dir: path.resolve(__dirname, '../.tmp-e2e-free-consumer-tsc-vue'),
  scaffold: async (dir) => {
    await fs.ensureDir(dir);
    await execa(
      'pnpm',
      ['create', `vite@${CREATE_VITE_VERSION}`, '.', '--template', 'vue-ts'],
      { cwd: dir }
    );
  },
  initArgs: ['--framework=vue', '--theme=awesome', '--typescript', '--yes'],
  typecheck: ['vue-tsc', '-b'],
  templateFile: (name) => `${name}.vue`,
  strictOnlyError: {
    file: 'PlantedConsumerError.vue',
    source: [
      '<script setup lang="ts">',
      'function take(value: string): string {',
      '  return value;',
      '}',
      'const result = take(null);',
      '</script>',
      '',
      '<template>',
      '  <p>{{ result }}</p>',
      '</template>',
      '',
    ].join('\n'),
  },
});
