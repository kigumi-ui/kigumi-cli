/**
 * Vue Template Generator - Output Validation Tests
 *
 * Validates the host-forwarding shape of every emitted Vue Template, both
 * `.vue` and `.js.vue`. The TypeScript variants are proven behaviourally by
 * the Vue function harness (issue #76); the JavaScript variants are not in
 * that harness, so this source check is what keeps them on the same fix:
 * - `false` never reaches <wa-*> (attribute presence is truthy in WA);
 * - declared props go back to kebab-case attribute names, and a component
 *   with no registry props declares none (issue #136);
 * - listener cleanup runs in onBeforeUnmount, while the template ref is set.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllComponents } from '../../src/utils/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates', 'vue');

// From the registry, not from the Templates: a generator that dropped
// `defineProps` everywhere must not shrink the set it is checked against.
const PROPLESS = new Set(
  Object.values(getAllComponents())
    .filter((component) => component.props.length === 0)
    .map((component) => component.name)
);

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
        if (PROPLESS.has(comp)) {
          expect(src, `${variant} declares props it has none of`).not.toMatch(
            /defineProps|Object\.entries\(props/
          );
        } else {
          expect(src, `${variant} lets false props through`).toContain(
            'if (value === undefined || value === false) continue;'
          );
          expect(src, `${variant} forwards camelized prop keys`).toContain(
            'result[key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)] = value;'
          );
        }
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
    expect([...PROPLESS].sort()).toEqual(['CarouselItem', 'Spinner']);
  });
});
