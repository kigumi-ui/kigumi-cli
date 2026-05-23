/**
 * Protects: F-068 (PR #127)
 * Bug: Vue's runtime boolean-prop coercion materialises absent optional
 *      Boolean props as `false`, but Web Awesome elements read attribute
 *      presence as truthy. The original `definedProps` filter only stripped
 *      `undefined`, so `<Button variant="brand">` rendered as
 *      `<wa-button ... pill="" disabled="false" loading="" with-caret="false">`
 *      (pill-shaped, with a stuck loading spinner). Affected every Vue
 *      component with optional Boolean props.
 * Fix: fea2a079 (#127) — generate-vue-templates.ts emits a filter that drops
 *      both `undefined` and `false` before v-bind. The TS variant casts props
 *      to `Record<string, unknown>` at iteration so vue-tsc accepts the
 *      `value !== false` check on components without Boolean props.
 *
 * Verification target: the generated Vue templates checked into the repo
 * (templates/vue/<Component>/<Component>.vue). Reverting the generator alone
 * would not break the suite; what matters for shipped code is the output.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../');
const SAMPLE_TEMPLATES = ['Button', 'Switch', 'Checkbox'];

describe('F-068: Vue definedProps filter strips false', () => {
  it.each(SAMPLE_TEMPLATES)(
    '%s.vue stripping filter rejects false',
    (component) => {
      const file = path.join(
        REPO_ROOT,
        'templates/vue',
        component,
        `${component}.vue`
      );
      const source = fs.readFileSync(file, 'utf8');

      // The fix replaced `if (value !== undefined)` with a guard that ALSO
      // rejects false. Both invariants must hold; if a future refactor flips
      // either back to the pre-fix form this test should fail.
      expect(source).toContain('value !== false');
      expect(source).toContain('definedProps');
    }
  );

  it('Button.js.vue (untyped variant) also strips false', () => {
    const file = path.join(REPO_ROOT, 'templates/vue/Button/Button.js.vue');
    const source = fs.readFileSync(file, 'utf8');
    expect(source).toContain('value !== false');
  });
});
