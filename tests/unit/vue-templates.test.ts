/**
 * Vue Template Generator - Output Validation Tests
 *
 * Validates the host-forwarding shape of every emitted Vue Template, both
 * `.vue` and `.js.vue`. The TypeScript variants are proven behaviourally by
 * the Vue function harness (issue #76); the JavaScript variants are not in
 * that harness, so this source check is what keeps them on the same fix:
 * - `false` never reaches <wa-*> (attribute presence is truthy in WA);
 * - declared props go back to kebab-case attribute names;
 * - listener cleanup runs in onBeforeUnmount, while the template ref is set.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'vue');

describe('Vue template generator: host forwarding', () => {
  it('every .vue and .js.vue template forwards through hostAttributes', () => {
    const components = fs.readdirSync(TEMPLATES_DIR).filter((entry) => {
      const stat = fs.statSync(path.join(TEMPLATES_DIR, entry));
      return stat.isDirectory();
    });

    let checked = 0;
    for (const comp of components) {
      for (const variant of [`${comp}.vue`, `${comp}.js.vue`]) {
        const file = path.join(TEMPLATES_DIR, comp, variant);
        expect(fs.existsSync(file), `${comp}/${variant} is missing`).toBe(true);
        const src = fs.readFileSync(file, 'utf-8');
        expect(src, `${variant} does not bind hostAttributes()`).toContain(
          'v-bind="hostAttributes()"'
        );
        expect(src, `${variant} lets false props through`).toContain(
          'if (value === undefined || value === false) continue;'
        );
        expect(src, `${variant} forwards camelized prop keys`).toContain(
          'result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;'
        );
        expect(
          src,
          `${variant} keeps Vue's default attribute fallthrough`
        ).toContain('defineOptions({ inheritAttrs: false });');
        expect(
          src,
          `${variant} removes listeners in onUnmounted, after Vue nulled the ref`
        ).not.toMatch(/onUnmounted\(/);
        checked++;
      }
    }
    expect(checked, 'no Vue templates were checked').toBeGreaterThan(0);
  });
});
