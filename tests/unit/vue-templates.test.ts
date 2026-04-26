/**
 * Vue Template Generator - Output Validation Tests
 *
 * Validates that emitted Vue wrappers strip both undefined AND false from
 * forwarded props, so Vue's boolean-prop coercion doesn't leak `false`
 * onto Web Awesome elements (where attribute presence is truthy).
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'vue');

describe('Vue template generator: boolean-prop filter', () => {
  it('every .vue and .js.vue template drops false in addition to undefined', () => {
    const components = fs.readdirSync(TEMPLATES_DIR).filter((entry) => {
      const stat = fs.statSync(path.join(TEMPLATES_DIR, entry));
      return stat.isDirectory();
    });

    let checked = 0;
    for (const comp of components) {
      for (const variant of [`${comp}.vue`, `${comp}.js.vue`]) {
        const file = path.join(TEMPLATES_DIR, comp, variant);
        if (!fs.existsSync(file)) continue;
        const src = fs.readFileSync(file, 'utf-8');
        if (!src.includes('definedProps')) continue;
        expect(
          src,
          `${variant} still uses old single-condition filter`
        ).toContain('value !== undefined && value !== false');
        expect(src, `${variant} kept naked undefined-only filter`).not.toMatch(
          /if \(value !== undefined\) result\[key\]/
        );
        checked++;
      }
    }
    expect(checked, 'no Vue templates were checked').toBeGreaterThan(0);
  });
});
